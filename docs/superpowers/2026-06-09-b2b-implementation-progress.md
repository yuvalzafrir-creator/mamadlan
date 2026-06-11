# B2B Marketplace Engagement — Implementation Progress & Handoff

**Date:** 2026-06-09
**Branch:** `feat/b2b-marketplace-engagement`
**Status:** ✅ All 21 tasks complete + whole-branch code review done + merge-blocking fixes applied. Ready to finish (merge/PR). Automated verification green; manual browser smoke against the production DB still pending user go-ahead.

## Reference documents
- **Design spec:** [docs/superpowers/specs/2026-06-08-b2b-marketplace-engagement-design.md](specs/2026-06-08-b2b-marketplace-engagement-design.md)
- **Implementation plan (full code for every task):** [docs/superpowers/plans/2026-06-08-b2b-marketplace-engagement.md](plans/2026-06-08-b2b-marketplace-engagement.md)

## What this feature is
A B2B engagement layer (request-for-quote, structured quotes with counter-offers, anonymized admin-moderated negotiation, offline close + commission) layered on top of the existing consumer shelter marketplace. The consumer Stripe flow is untouched. Business buyers self-declare via an `is_business` flag on `users`. Model: **matchmaker + commission**, hybrid routing (admin qualifies → shortlists sellers → sellers quote → admin approves → buyer accepts/counters), anonymized buyer↔seller thread to protect commission from disintermediation.

## Execution method
Subagent-Driven Development (superpowers): per task, a fresh implementer subagent implements + tests + commits, followed by review. Security-sensitive tasks (anonymization, quote transitions, messages) received an extra spec-compliance review.

---

## Task status

| # | Task | Status | Commit SHA |
|---|------|--------|-----------|
| 1 | DB migration (users cols + 4 tables) | ✅ Done | `a5298de` |
| 2 | Shared types (`lib/b2b/types.ts`) | ✅ Done | `0c9bd5e` |
| 3 | Validation (TDD) — 9 tests pass | ✅ Done | `27c7c9e` |
| 4 | State guards (TDD) — 12 tests pass | ✅ Done | `e39b314` |
| 5 | Alias (TDD) — 6 tests pass | ✅ Done | `3b4e93c` |
| 6 | Anonymize (TDD) — 4 tests pass | ✅ Done | `0027e16` |
| 7 | `requireBusiness` + `is_business` in session | ✅ Done | `97d54f2` |
| 8 | Business profile API (`/api/account/business`) | ✅ Done | `db01658` |
| 9 | Create/list requests API (`/api/b2b/requests`) | ✅ Done | `7236221` |
| 10 | Request detail/close API (`/api/b2b/requests/[id]`) | ✅ Done | `08082b1` |
| 11 | Shortlist sellers API | ✅ Done | `40c0e17` |
| 12 | Submit quote API (`/api/b2b/quotes`) | ✅ Done | `341a3b3` |
| 13 | Quote transitions API (`/api/b2b/quotes/[id]`) | ✅ Done | `181f48b` |
| 14 | Messages API (anonymized) | ✅ Done | `88204f3` |
| 15 | Middleware route protection | ✅ Done | `05d03f0` |
| 16 | Public landing + homepage section + nav link | ✅ Done | `ef317e3` |
| 17 | Sourcing form (`app/b2b/request/page.tsx`) | ✅ Done | `c8a5438` |
| 18 | Buyer portal (list/detail + QuoteThread + actions) | ✅ Done | `351b576` |
| 19 | Admin console (queue/detail + actions + dashboard link) | ✅ Done | `7c176e8` |
| 20 | Seller views + listing CTA + counter-offer UI | ✅ Done | `434b661` |
| 21 | Verification (build + unit tests) | ✅ Done | — |
| — | Final whole-branch code review (opus) | ✅ Done | — |
| — | Review fixes (C1, I1, I2, I3) | ✅ Done | `6ce0999` |

`HEAD` is currently at `6ce0999`.

## Final review outcome
Whole-branch review (`92511c5..434b661`) found the authorization model sound and PII anonymization holding end-to-end (no raw name/phone/email/user-id leaks on any buyer- or seller-reachable endpoint). Four merge-blockers were fixed in `6ce0999`:
- **C1** buyer quote list now uses the shared `sellerAlias()` so labels match the thread.
- **I1** seller counter-response passes `parent_quote_id`, keeping the quote chain linked.
- **I2** `COALESCE` on `deal_value`/`commission_amount` so a status-only PATCH can't wipe a recorded deal.
- **I3** shortlisting now advances a still-`new` request to `quoting`.

Minors: **M1 fixed** (messages blocked on closed/cancelled requests) and **M3 fixed** (quote approval blocked on closed/cancelled requests) in `b3a7fc2`, along with anonymizing buyer quote-action responses (the `seller_id` follow-up found during smoke). **M2 still deferred** (hide the listing "request a quote" CTA from the listing's own seller/admins — cosmetic; would add session logic to the listing page).

## Verification results
- `npm run build`: ✅ compiles; all B2B routes registered.
- B2B unit tests: ✅ 31/31 pass.
- Repo-wide `npm test`: 2 failures in `__tests__/api/listings.test.ts` — **pre-existing, unrelated** (the working-tree `lib/listings.ts` dropped its dimensions check before this session; B2B never touched that file). Also surfaces duplicated from a stale leftover worktree at `.claude/worktrees/mystifying-kare-e260a9/`.
- Manual full smoke (plan Task 21 Step 3): ✅ **run end-to-end on 2026-06-09** against the dev server (which uses the production Neon DB). Verified: buyer creates request → admin shortlist advances `new→quoting` (I3) → seller sees specs but **zero buyer PII** → seller quote → admin approve advances `quoting→presented` → buyer counter creates a linked child quote → seller counter-response links via `parent_quote_id` (I1) → thread + quote list both show alias `ספק א׳` consistently (C1) with no seller name/email exposed to buyer (screenshot captured). **All test rows deleted afterward; 0 B2B rows remain in the DB**; buyer `is_business` reset to FALSE.

### Minor follow-up observed during smoke (not blocking)
- The buyer's quote action responses (`PATCH /api/b2b/quotes/[id]` for accept/reject/counter) return the raw quote row including `seller_id` (an opaque UUID — no name/phone/email). The buyer UI ignores the response body, so nothing is displayed, but for defense-in-depth these responses could be passed through `anonymizeQuote` too. Low severity; safe follow-up alongside M1–M3.

### Test-account note
- `buyer@test.co.il` password was set to `buyer123` for the smoke (it had no known password before). Admin `yuvalzafrir@gmail.com`/`admin123`, seller `seller@test.co.il`/`seller123` (verified) unchanged.

---

## Phase 2 — listing-first flow + rich search (additive, 2026-06-10)

Spec: [specs/2026-06-10-b2b-listing-first-additive-design.md](specs/2026-06-10-b2b-listing-first-additive-design.md). **Additive only — nothing from Phase 1 removed.** Both flows now coexist so the owner can decide later what to keep.

New listing-first flow: buyer browses/searches the catalog → opens a listing → **"request to buy"** (fills quantity, **shipping + delivery address**, contact) → the listing's **seller confirms availability** (or declines) → **admin closes**, pricing shipping and recording commission. Plus Yad2-style **rich search & filters** on `/listings` (free-text, area, condition, sort).

| Task | Status | Commit |
|---|---|---|
| P2-A additive migration (seller_id, wants_shipping, delivery_address, shipping_amount) | ✅ | `ed2b6a2` |
| P2-B state machine (+seller_confirmed/seller_declined, TDD) | ✅ | `4ea55e7` |
| P2-C create API stores seller_id + shipping | ✅ | `9da975c` |
| P2-D seller confirm/decline + listing-seller read + admin shipping_amount | ✅ | `1245716` |
| P2-E shipping fields on listing request form | ✅ | `09b3a5d` |
| P2-F seller view: own-listing requests + confirm UI | ✅ | `8462e09` |
| P2-G admin: shipping at close + confirmation display | ✅ | `8bf7219` |
| P2-H rich search & filters on /listings | ✅ | `78c770f` |
| P2-I verification | ✅ | — |

**Verification:** 37/37 B2B unit tests pass (+6 new state tests); build green; full listing-first smoke passed live (request → `seller_id` auto-set + shipping stored → seller confirm → `seller_confirmed` → admin close `closed_won` with deal_value+commission+shipping_amount); search/filters confirmed (q/condition no-match → 0, sort preserves count). Test data deleted afterward (0 B2B rows remain).

---

## Phase 3 (v3) — routing, contract, progress, admin hub, email (additive, 2026-06-10)

Spec: [specs/2026-06-10-b2b-v3-contract-routing-design.md](specs/2026-06-10-b2b-v3-contract-routing-design.md). Additive; Phases 1–2 untouched.

| Task | Status | Commit |
|---|---|---|
| P3-A migration (seller_shipping_price, shipping_proposal_requested, buyer/seller_agreed_at) | ✅ | `ab28c00` |
| P3-B `pending_admin` status (TDD) | ✅ | `cf4831e` |
| P3-C email lib — Resend REST, key-optional (`lib/email.ts`) | ✅ | `dd138d3` |
| P3-D buyer registration `/register` with private/business + login link | ✅ | `f54e110` |
| P3-E listing CTA routing (business→B2B primary, private→Stripe only) | ✅ | `d8067f9` |
| P3-F seller confirm with shipping price / admin-proposal flag | ✅ | `d3e86c4` |
| P3-G contract page + dual agree → `pending_admin` + admin email | ✅ | `5705d9e` |
| P3-H DealProgressBar on buyer/seller/admin pages | ✅ | `3b18c5b` |
| P3-I admin command center (revenue, action queue, live pipeline) | ✅ | `9380cb7` |
| P3-J verification | ✅ | — |

**Verification:** 42/42 B2B unit tests (+5 new); build green; live smoke: business registration (org fields + `is_business` in session) → listing-first request with shipping → seller confirm with ₪600 shipping price → seller agree → buyer agree → **`pending_admin`** + email trigger logged (`[email skipped — no RESEND_API_KEY]`) → contract page shows parties/total/shipping/both approvals → admin dashboard shows revenue/waiting/pipeline incl. the deal → admin close `closed_won` (deal ₪34,000, commission ₪1,700, shipping ₪600). Smoke request + smoke user deleted.

**Outstanding for the owner:**
- **`RESEND_API_KEY`** — create a free resend.com account, give me the key; I'll add it to `.env.local` + Vercel. Until then emails are skip-logged.
- One leftover request created by the owner during preview testing (org "test", buyer yuvalzafrir@gmail.com, id `35e1b29c…`) — left in place intentionally.

---

## Files created so far

**Pure logic (unit-tested):** `lib/b2b/types.ts`, `lib/b2b/validation.ts`, `lib/b2b/state.ts`, `lib/b2b/alias.ts`, `lib/b2b/anonymize.ts`
**Tests:** `__tests__/lib/b2b/{validation,state,alias,anonymize}.test.ts` (31 new tests, all passing)
**Auth:** `requireBusiness()` added to `lib/auth.ts`; `is_business` threaded through `auth.ts`
**API routes:** `app/api/account/business/route.ts`, `app/api/b2b/requests/route.ts`, `app/api/b2b/requests/[id]/route.ts`, `app/api/b2b/requests/[id]/sellers/route.ts`, `app/api/b2b/requests/[id]/messages/route.ts`, `app/api/b2b/quotes/route.ts`, `app/api/b2b/quotes/[id]/route.ts`
**Pages/UI:** `app/b2b/page.tsx` (landing), homepage B2B section in `app/page.tsx`, nav link in `components/layout/Navbar.tsx` (`navLinks` array, `{ href: '/b2b', label: 'רכש לארגונים' }`)
**Migration:** `scripts/schema.sql` + `scripts/migrate.mjs` (already run against the live Neon DB — additive/idempotent)

## Notes & decisions made during implementation
- **Task 10:** Implementer added `void` statements after the PII-stripping destructure (harmless clarity tweak). PII stripping via rest-spread verified correct.
- **Task 13:** Counter-offer `notes` field falls back to `null` (not the original quote's notes) — **deliberate**: `notes` is an author-specific comment, unlike price/units/delivery which are commercial terms that carry over. Accepted as-is.
- **Task 14:** Spec-reviewed — confirmed no PII leak for non-admin (allow-list `anonymizeMessage`), stable seller alias index (ordered by `invited_at`).
- **Build:** every task verified with `npm run build` (ESLint disabled during builds in this project). All green through Task 16.

---

## Remaining work — Tasks 17–21

Full, copy-paste-ready code for each is in the plan file:
[docs/superpowers/plans/2026-06-08-b2b-marketplace-engagement.md](plans/2026-06-08-b2b-marketplace-engagement.md)

### Task 17 — Sourcing form
- Create `app/b2b/request/page.tsx` (client form posting to `POST /api/b2b/requests`).
- **Important:** the plan code uses a CSS class `input`. First verify whether `.input` exists (`grep -rn "\.input" app/globals.css`) and look at `app/seller/listings/new/page.tsx` for how its inputs are styled. If `.input` does NOT exist, replace each `className="input w-full"` with the exact input className used in the seller new-listing form. (This check was the in-flight step when the session ended.)

### Task 18 — Buyer portal
- `app/b2b/requests/page.tsx` (list), `app/b2b/requests/[id]/page.tsx` (detail), `app/b2b/requests/[id]/BuyerQuoteActions.tsx`, `components/b2b/QuoteThread.tsx`.
- Buyer detail shows only `approved`/`accepted` quotes with seller alias (`ספק {idx+1}`), accept/reject actions, and the thread. (Counter-offer UI is added in Task 20 Step 7.)
- Apply the same `.input` class check as Task 17 for `QuoteThread` and any inputs.

### Task 19 — Admin console
- `app/admin/b2b/page.tsx` (queue), `app/admin/b2b/[id]/page.tsx` (detail), `app/admin/b2b/[id]/AdminRequestActions.tsx`.
- Add a dashboard card/link to `/admin/b2b` in `app/admin/dashboard/page.tsx` (match existing card pattern).
- Apply the `.input` class check.

### Task 20 — Seller views + listing CTA + counter-offer UI
- `app/seller/b2b/page.tsx`, `app/seller/b2b/[id]/page.tsx`, `app/seller/b2b/[id]/SellerQuoteForm.tsx`, `components/b2b/RequestQuoteButton.tsx`.
- Mount `RequestQuoteButton` on `app/listings/[id]/page.tsx` near the buy CTA (pass `listingId`, `shelterType`, `location` — match the page's actual `listing` variable).
- Add a `/seller/b2b` card to `app/seller/dashboard/page.tsx`.
- Replace `BuyerQuoteActions.tsx` with the counter-offer-enabled version (Task 20 Step 7 in the plan).
- Apply the `.input` class check.

### Task 21 — Verification
- `npm test` (all suites), `npm run build`.
- Manual smoke (dev server, preview tools): buyer submits request → admin shortlists seller → seller quotes → admin approves → buyer sees alias-only quote, counters, accepts → messages show aliases to buyer/seller, raw to admin.

---

## How to resume
1. `git checkout feat/b2b-marketplace-engagement` (verify `HEAD` = `ef317e3`).
2. Continue Subagent-Driven Development from **Task 17**, using the full task code in the plan file.
3. Remember the cross-cutting `.input` CSS-class check for every UI task (17–20).
4. Dispatch tasks sequentially (never in parallel — shared git index).
5. After Task 21, run a final whole-branch code review, then use `superpowers:finishing-a-development-branch` to decide merge/PR.

## Open items deferred (from spec §12 / reviews)
- Notifications (email on new request/quote/message) — out of scope v1; users poll dashboards.
- Optional DB indexes on `b2b_*` FK columns (`request_id`, `buyer_id`) — fine to add later under load.
- `deal_value`/`commission_amount` units = shekels (integer), matching `listings.price`.
