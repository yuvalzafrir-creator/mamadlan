# B2B Marketplace Engagement — Design Spec

**Date:** 2026-06-08
**Status:** Approved framing, pending spec review
**Author:** brainstormed with Claude

## 1. Goal

The site stays a **regular consumer marketplace** (browse listings → pay online via Stripe → commission). On top of it we add a **B2B engagement layer** — a set of adjustments that let large organizations (companies, municipalities) procure shelters through a quote/negotiation flow instead of self-serve card checkout.

This follows the proven industry pattern (Amazon Business, Shopify B2B): *layer B2B capabilities onto the existing B2C marketplace rather than building a separate system.*

### Business model
- **Role:** matchmaker + commission. The platform brokers; the seller closes the deal.
- **Payment:** offline (PO / invoice / bank transfer). No Stripe for B2B.
- **Revenue:** commission recorded on the deal and invoiced offline.
- **Disintermediation protection:** buyer↔seller identities and contact details stay masked behind an admin-moderated, anonymized thread until the deal is locked.

## 2. Scope

### In scope
1. Business profile on existing accounts (`is_business` + org fields). Unlocks B2B UI. No new auth role.
2. "Request a quote / Order in bulk" entry point on listing pages.
3. Standalone sourcing form ("Tell us what you need") for needs no single listing fits.
4. RFQ pipeline (hybrid): admin qualifies → shortlists verified sellers → sellers submit structured quotes → buyer accepts / rejects / counter-offers.
5. Anonymized, admin-moderated message thread per request.
6. Offline closing: admin records deal value + commission on the request.
7. `/b2b` public landing page funneling procurement teams into the sourcing form.
8. Admin B2B console at `/admin/b2b`.
9. Seller "Quote requests" view in the seller dashboard.

### Out of scope (YAGNI — may add later)
- Tiered/automatic bulk price tables (negotiated quote is the mechanism instead).
- Multi-user business accounts with approver/budget workflows.
- Automated tax-exemption handling.
- Any change to the existing consumer Stripe flow.

## 3. Roles & access

| Actor | How identified | New capabilities |
|---|---|---|
| Business buyer | logged-in `users.is_business = true` | request quotes, sourcing form, B2B portal at `/b2b/requests`, anonymized thread |
| Seller | existing `role = 'seller'`, `verified = true` | "Quote requests" view; submit/edit quotes; anonymized thread |
| Admin | existing `role = 'admin'` | `/admin/b2b` console: qualify, shortlist sellers, approve quotes, moderate thread, record close + commission |

**Business self-declaration:** any logged-in user can toggle a business profile (fill org fields). No admin approval needed to *become* a business buyer — the friction/gatekeeping happens at the request-qualification step instead. (Confirmed acceptable in brainstorming framing.)

**Route protection** (middleware additions to existing matcher):
- `/b2b/requests/:path*` → requires login + `is_business`.
- `/admin/b2b/:path*` → requires `role = 'admin'`.
- Seller quote views live under existing `/seller/...` (already protected).
- `/b2b` (landing) and the sourcing form are public; submitting a request requires login (prompt to log in / create account, then auto-mark as business).

## 4. Data model

Raw SQL on Neon, matching `scripts/schema.sql` conventions. Added to `schema.sql` and applied via `scripts/migrate.mjs`.

### 4.1 `users` — additive columns
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_type TEXT;          -- 'company' | 'municipality' | 'other'
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_name TEXT;
-- business_name and business_id already exist on users.
```

### 4.2 `b2b_requests` — the RFQ
```sql
CREATE TABLE IF NOT EXISTS b2b_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),     -- nullable: set when started from a listing, null for sourcing form
  org_name TEXT,
  org_type TEXT,                                -- snapshot at request time
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  need_type TEXT[] DEFAULT '{}',               -- bulk | sourcing | po_deal | custom
  shelter_type TEXT,                           -- 'mamad' | 'migounit' | 'other' | 'any'
  quantity INTEGER,
  location TEXT,
  target_date DATE,
  budget_note TEXT,
  description TEXT,
  status TEXT DEFAULT 'new',                    -- see state machine §5
  deal_value INTEGER,                          -- set at close (agorot/shekels, match listings.price units)
  commission_amount INTEGER,                   -- set at close
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.3 `b2b_request_sellers` — admin's shortlist
```sql
CREATE TABLE IF NOT EXISTS b2b_request_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES b2b_requests(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'invited',               -- invited | declined | quoted
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id, seller_id)
);
```

### 4.4 `b2b_quotes` — structured quotes with counter-offers
```sql
CREATE TABLE IF NOT EXISTS b2b_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES b2b_requests(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id),
  unit_price INTEGER NOT NULL,
  units INTEGER NOT NULL DEFAULT 1,
  delivery_terms TEXT,
  lead_time TEXT,
  notes TEXT,
  status TEXT DEFAULT 'submitted',             -- see quote states §5.2
  parent_quote_id UUID REFERENCES b2b_quotes(id), -- counter-offer chain
  countered_by TEXT,                           -- 'buyer' | 'seller' on counters
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5 `b2b_messages` — anonymized thread
```sql
CREATE TABLE IF NOT EXISTS b2b_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES b2b_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_role TEXT NOT NULL,                    -- 'buyer' | 'seller' | 'admin'
  alias TEXT NOT NULL,                          -- masked display name, e.g. 'קונה', 'ספק א׳', 'מתאם'
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Anonymization rule (enforced in queries, not just UI):** buyer- and seller-facing message queries select only `alias`, `sender_role`, `body`, `created_at`. Real names/contact info from `users`/`b2b_requests` are joined **only** in admin queries. Alias assignment: buyer = "קונה"; each shortlisted seller gets a stable alias ("ספק א׳", "ספק ב׳", …) per request; admin = "מתאם".

## 5. State machines

### 5.1 Request status
```
new → qualifying → sourcing → quoting → presented → closed_won
                                              ↘ closed_lost
   (any non-closed) → cancelled
```
- **new** — just submitted, unseen by admin.
- **qualifying** — admin reviewing/validating the request.
- **sourcing** — admin identifying/shortlisting sellers.
- **quoting** — sellers invited, quotes being collected.
- **presented** — at least one quote approved and visible to buyer; negotiation underway.
- **closed_won** — deal agreed; `deal_value` + `commission_amount` recorded.
- **closed_lost** — abandoned/no deal.
- **cancelled** — withdrawn by buyer or admin.

### 5.2 Quote status
```
submitted → approved → accepted
         ↘ rejected
approved → countered (creates child quote, countered_by = 'buyer')
countered → (seller) submitted again as child (countered_by = 'seller') ...
```
- **submitted** — seller sent it; not yet visible to buyer.
- **approved** — admin let it through; visible to buyer.
- **rejected** — admin (or buyer) declined it.
- **countered** — buyer or seller proposed different terms (new child quote row); admin re-approves child before it reaches the other side.
- **accepted** — buyer accepted; triggers move toward `closed_won`.

All counter-offers pass back through admin approval (preserves moderation + anonymization).

## 6. Screens & flows

### 6.1 Public `/b2b` landing
Hebrew/RTL, matches existing homepage style. Explains B2B procurement for companies/municipalities; primary CTA → sourcing form. Secondary CTA → browse catalog.

### 6.2 Sourcing form ("ביקוש B2B")
Fields: org name, org type, contact name/phone/email, need type (multi-select), shelter type, quantity, location, target date, budget note, free-text description. If not logged in → prompt to log in / register, then mark `is_business = true` and prefill org fields onto the user. On submit → create `b2b_requests` (status `new`, `listing_id = null`).

### 6.3 "Request a quote" on a listing
On `/listings/[id]`, for business buyers (or anyone — non-business prompted to add business profile), a button beside the Stripe "Buy" CTA opens a short form (quantity, target date, note). Creates a `b2b_requests` with `listing_id` set and `shelter_type`/`location` prefilled from the listing.

### 6.4 Buyer portal `/b2b/requests`
List of the buyer's requests with status. Detail page per request: summary, approved quotes (anonymized seller alias, price, units, delivery, lead time, notes), actions **accept / reject / counter** per quote, and the anonymized message thread.

### 6.5 Admin console `/admin/b2b`
- Queue of requests filterable by status; badge for `new`.
- Request detail: full buyer + contact info, advance status, shortlist verified sellers (search/pick → creates `b2b_request_sellers`, status `quoting`), see all seller quotes, **approve/reject** each (approve makes it buyer-visible), moderate the thread (sees real identities), and at close record `deal_value` + `commission_amount` → `closed_won`.

### 6.6 Seller "Quote requests" (under `/seller/dashboard`)
List of requests the seller was invited to (anonymized buyer; shows specs/quantity/location/target date). Submit a structured quote; edit while `submitted`; respond to buyer counters (new child quote). Participate in the anonymized thread.

## 7. API routes (Next.js App Router, matching existing `app/api/...` style)

```
POST   /api/b2b/requests                 create request (sourcing form or listing)
GET    /api/b2b/requests                 buyer: own requests
GET    /api/b2b/requests/[id]            buyer/seller/admin (scoped, anonymized for non-admin)
PATCH  /api/b2b/requests/[id]            admin: status; admin: close (deal_value, commission)
POST   /api/b2b/requests/[id]/sellers    admin: shortlist sellers
POST   /api/b2b/quotes                   seller: submit quote
PATCH  /api/b2b/quotes/[id]              admin approve/reject; buyer accept/reject/counter; seller counter
GET    /api/b2b/requests/[id]/messages   thread (anonymized per viewer)
POST   /api/b2b/requests/[id]/messages   post message (alias resolved server-side)
PATCH  /api/account/business             set is_business + org fields on current user
```

All routes authorize via existing `getSessionUser` / `requireRole`; new helper `requireBusiness()` for buyer B2B routes. Anonymization applied server-side in the GET handlers.

## 8. Navigation & surfacing

- Header: a "B2B / רכש לארגונים" link → `/b2b`.
- Homepage: a B2B section (like the existing shelters-guide section) → `/b2b`.
- Listing page: "Request a quote / הזמנה בכמות" button.
- Seller dashboard: "בקשות הצעת מחיר" tab/card.
- Admin dashboard: "B2B / בקשות רכש" card with `new` count.

## 9. Error handling & edge cases

- **Non-business user requests a quote** → inline prompt to complete business profile; on save, continue.
- **Seller submits quote after request closed/cancelled** → rejected with clear message; quote form hidden once request is closed.
- **Buyer accepts one quote** → other approved quotes auto-marked `rejected`; request → `closed_won` path (admin confirms + records commission). Only one accepted quote per request.
- **Anonymization leak guard** → server never sends counterparty name/contact to buyer/seller endpoints; aliases assigned deterministically; tests assert no PII in non-admin payloads.
- **Counter-offer loop** → each counter creates a child quote; admin must approve before it crosses sides; thread records the exchange.
- **Seller declines invitation** → `b2b_request_sellers.status = 'declined'`; removed from quoting UI.
- **Request with `listing_id` whose listing is later deleted/deactivated** → request persists (listing_id may dangle to inactive); detail shows "listing no longer available" but the RFQ continues.
- **Validation**: required fields on request (org_name, contact, need_type, shelter_type); quote requires unit_price > 0 and units ≥ 1.

## 10. Testing strategy

Following existing project conventions (add tests where the project supports them):
- **Unit:** alias assignment is stable & deterministic per request; anonymized serializer strips PII; request/quote state-transition validators reject illegal transitions.
- **Integration (API):** create request (both entry points); admin shortlist; seller quote; admin approve; buyer accept/reject/counter; messages return anonymized payloads for buyer/seller and full payloads for admin; authorization (business gate, admin gate, seller-must-be-invited).
- **Edge:** quote after close rejected; accepting one quote rejects others; non-business blocked from B2B routes.

## 11. Build order (single plan, implemented together)

1. DB migration (users columns + 4 tables) in `schema.sql` + `migrate.mjs`.
2. Business profile API + account toggle UI.
3. `b2b_requests` create (both entry points) + buyer portal list/detail.
4. Admin console: queue, qualify, shortlist.
5. Seller quote view + submit/edit.
6. Admin approve/reject; buyer accept/reject/counter; quote state machine.
7. Anonymized messaging thread + serializer.
8. Close + commission recording.
9. `/b2b` landing + navigation/homepage surfacing.
10. Tests across the above.

## 12. Open questions (resolve during planning if needed)
- Notifications (email on new request / new quote / new message) — assume **out of scope v1**; admin/seller/buyer poll their dashboards. Revisit if needed.
- Whether `deal_value`/`commission_amount` units are agorot or shekels — match whatever `listings.price` uses (confirm in code during implementation).
