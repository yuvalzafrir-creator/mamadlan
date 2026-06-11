# B2B v3 — Buyer Routing, Seller Shipping, Contract, Progress, Admin Hub, Email

**Date:** 2026-06-10 · **Status:** Approved · **Branch:** `feat/b2b-marketplace-engagement` (continues PR #1)
**Builds on:** Phase 1 (RFQ) + Phase 2 (listing-first). **Additive — nothing removed.**

## 1. Business/private at registration
- New buyer registration page `/register`: name, email, password, phone + required account-type choice **לקוח פרטי / עסק או רשות**. Business reveals org fields (org name, org type 'company'|'municipality'|'other', contact name) and sets `is_business = true` at signup. Extend `POST /api/buyer/register` to accept `{ is_business, org_name, org_type, contact_name }` (org saved to `business_name`, `org_type`, `contact_name`).
- Login page gains "אין לך חשבון? הרשמה" link to `/register`.
- **Listing page routing:** logged-out → both CTAs (as today). Private buyer (logged in, not business) → Stripe button only. Business buyer → B2B request button as primary + Stripe below. Own seller/admin → no B2B CTA (existing M2 logic preserved).

## 2. Seller shipping price or admin proposal
When confirming a request with `wants_shipping`, the seller either enters a **shipping price** or ticks **"בקש הצעת משלוח מהמנהל"**.
- Columns: `seller_shipping_price INTEGER`, `shipping_proposal_requested BOOLEAN DEFAULT FALSE` on `b2b_requests`.
- Seller PATCH path (`action: 'confirm'`) also accepts `seller_shipping_price` / `shipping_proposal_requested` and stores them.
- Admin sees the seller's price (may override) or the proposal flag; final `shipping_amount` still set by admin at close.

## 3. Generated contract + dual agreement
- Contract page `/b2b/requests/[id]/contract` (buyer = request owner; seller = `seller_id`; admin). Renders generated terms from the deal: parties (buyer org/contact ↔ seller business name — real identities, they are transacting), listing title/type, quantity, unit price (listing price), total = price × qty, shipping (requested? address, seller price or "תיקבע על ידי המנהל"), target date, generation date. No stored document — rendered from request+listing fields; agreements recorded as timestamps.
- Columns: `buyer_agreed_at TIMESTAMPTZ`, `seller_agreed_at TIMESTAMPTZ`.
- Each party clicks **"אני מאשר את תנאי העסקה"** → PATCH `action: 'agree'` (allowed only in status `seller_confirmed`; buyer sets `buyer_agreed_at`, seller sets `seller_agreed_at`).
- When **both** timestamps are set → status auto-moves to **`pending_admin`** and the admin email fires. Only then does the deal reach admin review.

## 4. State machine (additive, TDD)
New status `pending_admin`. New transitions: `seller_confirmed → pending_admin`; `pending_admin → closed_won | closed_lost | cancelled`. All existing statuses/transitions unchanged.

## 5. Deal progress bar
`components/b2b/DealProgressBar.tsx` — steps: **הוגשה → אישור מוכר → חוזה → בדיקת מנהל → נסגרה**. Mapping: `new`=0 active; `qualifying/sourcing`=1; `quoting/presented`=2 (legacy RFQ deals); `seller_confirmed`=2 (contract stage); `pending_admin`=3; `closed_won`=4 (green); `seller_declined/closed_lost/cancelled` = terminal red at the phase reached. Mounted on buyer detail, seller detail, and admin detail pages.

## 6. Admin command center
Redesign `/admin/dashboard` into an ops hub (existing admin pages unchanged):
- **Revenue stats:** Σ`commission_amount`, Σ`shipping_amount` on `closed_won`, count of won deals.
- **"ממתין לך" action cards** with live counts → links: deals in `pending_admin` (→/admin/b2b), new B2B requests, quotes awaiting approval (`submitted`), pending verification requests (→/admin/sellers).
- **Active-deals pipeline:** non-closed `b2b_requests` with org, phase, and `DealProgressBar`, linking to detail.
- Keep existing header quick-links.

## 7. Email — Resend
`lib/email.ts`: `sendAdminEmail(subject, html)` calling Resend REST (`https://api.resend.com/emails`) via `fetch` — no new dependency. From `Mamadlan <onboarding@resend.dev>`, to `yuvalzafrir@gmail.com`. If `RESEND_API_KEY` is missing → log and return (no failure). Wrapped in try/catch; fire-and-forget from the agree handler when a deal enters `pending_admin` ("עסקה ממתינה לאישור מנהל" + org, total, link). **Owner must supply `RESEND_API_KEY`** (then add to `.env.local` + Vercel).

## Build order
A migration → B state machine (TDD) → C email lib → D registration+login link → E listing routing → F seller confirm shipping → G contract page+agree+email trigger → H progress bar (3 mounts) → I admin command center → J verify (tests/build/smoke/cleanup).

## Edge cases
- `agree` rejected if not in `seller_confirmed`, or caller is neither buyer nor seller of the request; double-agree is idempotent (timestamp set once).
- Contract page 404/forbidden for outsiders; legacy RFQ deals (no seller_id) have no contract page — buyer accept of a quote continues to work as before.
- Sourcing requests (no listing) skip contract; admin handles as today.
- Email failures never block the transition (logged only).

## Out of scope
Ads; PDF/download of contract; e-signature beyond in-app click; multi-admin routing.
