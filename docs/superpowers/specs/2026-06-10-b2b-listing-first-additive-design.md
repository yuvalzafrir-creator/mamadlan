# B2B Listing-First Flow + Rich Search — Additive Design

**Date:** 2026-06-10
**Status:** Approved direction ("finish it"), additive-only
**Branch:** `feat/b2b-marketplace-engagement` (continues PR #1)
**Builds on:** [2026-06-08-b2b-marketplace-engagement-design.md](2026-06-08-b2b-marketplace-engagement-design.md)

## Guiding constraint
**Additive only — remove nothing.** Everything in PR #1 (sourcing form, multi-seller shortlist, structured quotes, counter-offers, anonymized thread, buyer/admin/seller portals) stays untouched and functional. We layer a second, simpler flow next to it so the owner can see both end-to-end and decide later what to retire.

## New flow: listing-first "request to buy"
The marketplace works like Yad2/Amazon: buyers browse/search the catalog, open a listing, and request to buy it for B2B.

1. **Browse & search** (`/listings`) — rich search + filters (see below).
2. **Request to buy** — on a listing, the buyer fills **everything**: quantity, **wants shipping? + delivery address**, target date, org + contact, notes. The request is tied to the chosen listing **and its seller**. Price = `listing.price × quantity`.
3. **Seller confirms** — the listing's seller sees the request and **Confirms availability** or **Declines**. No quoting, no price change, no negotiation. (Runs alongside the existing quote option; does not replace it.)
4. **Admin closes** — once confirmed, the admin has all details (buyer contact, listing, quantity, shipping request + address, seller confirmation). Admin **prices shipping**, records **commission**, and closes the deal (won/lost). Payment offline.

The existing **open sourcing request** stays as the secondary "can't find it? tell us what you need" path (no listing/seller → admin handles offline → close).

## Monetization
At close the admin records: **deal value** (listing price × qty), **commission**, and **shipping/services revenue** (`shipping_amount`). *Ads* are a separate site-placement feature — explicitly **out of scope** here (future project).

## Data model — additive only
Extend `b2b_requests` (no tables dropped, no columns removed):
```sql
ALTER TABLE b2b_requests ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES users(id);
ALTER TABLE b2b_requests ADD COLUMN IF NOT EXISTS wants_shipping BOOLEAN DEFAULT FALSE;
ALTER TABLE b2b_requests ADD COLUMN IF NOT EXISTS delivery_address TEXT;
ALTER TABLE b2b_requests ADD COLUMN IF NOT EXISTS shipping_amount INTEGER;
```
- `seller_id`: the listing's seller for listing-first requests; `NULL` for sourcing requests.
- Status vocabulary gains `seller_confirmed` and `seller_declined` (TEXT column — no schema change, just new allowed values + transition rules).

## State machine — additive transitions
Extend `lib/b2b/state.ts` `RequestStatus` and `REQUEST_TRANSITIONS` (keep all existing entries):
- `new → seller_confirmed`, `new → seller_declined` (plus existing `new → qualifying/sourcing/quoting/cancelled`).
- `seller_confirmed → closed_won | closed_lost | cancelled`.
- `seller_declined → closed_lost | cancelled`.
Quote state machine unchanged.

## API changes (additive)
- `POST /api/b2b/requests`: when `listing_id` is present, look up the listing's `seller_id` and store it; store `wants_shipping`, `delivery_address`. (Sourcing requests unaffected.)
- `PATCH /api/b2b/requests/[id]`: add a **seller path** — if the caller is the request's `seller_id` and `action` is `confirm`/`decline`, guard `new → seller_confirmed`/`seller_declined` and update. Admin path additionally accepts `shipping_amount` (COALESCE, like deal_value/commission).
- `GET /api/b2b/requests/[id]`: allow the listing seller (`reqRow.seller_id === user.id`) to read it (buyer PII stripped, same as invited sellers).
- `RequestInput` type gains `wants_shipping?`, `delivery_address?`.

## Screens
- **`/listings`** — extend the existing filter form: add a **text search** (`q` across title/description/location), **area** min/max, **condition** select, and a **sort** dropdown (newest / price asc / price desc). Extend the page's SQL accordingly. (Existing filters stay.)
- **Listing detail `RequestQuoteButton`** — add a **"כולל משלוח"** checkbox + **delivery address** field to the request form; include in the POST payload.
- **Seller `/seller/b2b`** — list now also includes requests where `seller_id = me` (union with shortlisted). Detail shows **Confirm / Decline** for a listing-first request in status `new` (new `SellerConfirmActions` client component).
- **Admin `/admin/b2b/[id]`** — show the buyer's shipping request + delivery address + seller-confirmation status; add a **shipping price** input at close; send `shipping_amount` in the close PATCH.

## Error handling & edge cases
- Listing-first request requires `listing_id`, `quantity ≥ 1`; if `wants_shipping`, `delivery_address` required (client-side).
- Seller confirm/decline only allowed by the request's own `seller_id`, only from status `new` (guarded).
- A listing deleted/deactivated after a request: request persists; admin/seller see "listing no longer available" but the request continues (same as PR #1).
- Sourcing requests (`listing_id` null, `seller_id` null) keep the existing admin-handled path; no seller-confirm shown.

## Testing
- Extend `__tests__/lib/b2b/state.test.ts` with the new transition cases (allow `new→seller_confirmed`, `seller_confirmed→closed_won`; forbid `seller_declined→seller_confirmed`, `closed_won→seller_confirmed`).
- Build verification per task.
- Targeted browser smoke (writes to prod DB, cleaned up): search/filter the catalog; listing-first request with shipping → seller confirms → admin closes with shipping_amount + commission.

## Build order
1. DB migration (additive columns).
2. State machine + types (TDD).
3. Create API: store seller_id + shipping fields.
4. Request detail/PATCH: seller confirm/decline + GET access for listing seller + admin shipping_amount.
5. Listing-first form: shipping fields (`RequestQuoteButton`).
6. Seller view: include own-listing requests + confirm/decline UI.
7. Admin console: show shipping/confirmation + shipping price at close.
8. Rich search & filters on `/listings`.
9. Verify (build, tests, smoke, cleanup).
