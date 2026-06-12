# Migunit-Only Marketplace — Remove ממ"ד as a Sellable Product

**Date:** 2026-06-12 · **Status:** Approved · **Branch:** `feat/migunit-only`

## Why
A ממ"ד is a structural reinforced room poured into the building — it physically cannot be dismantled and resold. Only a מיגונית (mobile shelter) is transferable second-hand. The marketplace must stop offering ממ"ד as a product type.

## Decisions (owner)
1. **Brand:** keep ממ"דלן name/logo for now (renaming is a separate future decision).
2. **Education:** keep ממ"ד explainer content (homepage types section, shelters guide) but reframe — ממ"ד is structural and **cannot be resold**, which is why the marketplace sells מיגוניות.
3. **Data/types:** delete existing `type='mamad'` test listings (deactivate any referenced by orders); remove ממ"ד from every form/filter/label; server-side validation rejects `'mamad'`.

## Scope
**Type system + validation (TDD):**
- `lib/listings.ts`: `type: 'migounit' | 'other'`; `validateListing` rejects `'mamad'` with "mamad cannot be resold".
- `lib/b2b/types.ts`: `ShelterType = 'migounit' | 'other' | 'any'`; `lib/b2b/validation.ts` rejects `shelter_type === 'mamad'`.
- Tests updated: `__tests__/api/listings.test.ts` (valid listing becomes migounit; new reject-mamad case; dimensions expectation aligned with current `validateListing` behavior), `__tests__/lib/b2b/validation.test.ts` (+ reject-mamad case).

**UI surfaces — remove ממ"ד as product:** homepage (hero badge/h1, quick chip, empty-state, seller CTA), `/listings` (title, type filter), `ListingForm` (type options + default), `ListingCard`/listing detail/checkout/orders/seller dashboard label maps, `/how-it-works` texts, B2B landing text, B2B sourcing form option, `layout.tsx` metadata description.

**UI surfaces — education reframed (kept):** homepage shelter-types section (ממ"ד card gets "לא ניתן למכירה משומשת" tag), shelters guide (ממ"ד section keeps facts + cannot-resell note; bottom CTA stops linking to `?type=mamad`), about page text corrected.

**Brand mentions kept unchanged:** ממ"דלן in Navbar/Footer/login/register/titles.

**DB cleanup:** `DELETE FROM listings WHERE type='mamad'` (fallback `status='inactive'` for rows referenced by orders/b2b_requests).

## Out of scope
Site rename; DB CHECK constraints; the user's unrelated uncommitted edits (some files overlap — their pending edits in touched files will be committed together, disclosed).

## Verification
Unit tests green; build green; live smoke: catalog/forms show no ממ"ד option, POST listing with type 'mamad' → 400, B2B request with shelter_type 'mamad' → 400, guide/homepage show reframed education. Deploy to production + verify.
