# B2B Marketplace Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a B2B engagement layer (request-for-quote, structured quotes with counter-offers, anonymized admin-moderated negotiation, offline close + commission) on top of the existing consumer shelter marketplace, without touching the consumer Stripe flow.

**Architecture:** B2B is a layer, not a separate system. Business buyers self-declare via an `is_business` flag on the existing `users` table. All testable logic (validation, state-transition guards, alias assignment, PII anonymization) lives in pure functions under `lib/b2b/` with Jest unit tests. API routes under `app/api/b2b/` use raw Neon SQL and the existing `getSessionUser`/`requireRole` auth. Pages are Next.js App Router server/client components in Hebrew/RTL matching existing styling.

**Tech Stack:** Next.js 14 (App Router), TypeScript, NextAuth v5 (JWT/credentials), Neon Postgres (`@neondatabase/serverless` raw SQL), Jest + ts-jest, Tailwind. Spec: [docs/superpowers/specs/2026-06-08-b2b-marketplace-engagement-design.md](../specs/2026-06-08-b2b-marketplace-engagement-design.md).

**Conventions observed:**
- Unit tests live in `__tests__/lib/...` and test pure functions only. Do NOT write Jest tests for routes/pages/DB (codebase doesn't).
- Money is stored as integers in the same unit as `listings.price` (shekels — see `listings.price INTEGER`).
- API auth pattern: `const user = await getSessionUser(); if (!user || (user as any).role !== 'x') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })`.
- Run a single test: `npx jest <path> -t "<name>"`. Run all: `npm test`. Build check: `npm run build`.

---

## File Structure

**New — pure logic (unit-tested):**
- `lib/b2b/types.ts` — shared TS types.
- `lib/b2b/validation.ts` — `validateRequestInput`, `validateQuoteInput`.
- `lib/b2b/state.ts` — `canTransitionRequest`, `canTransitionQuote`.
- `lib/b2b/alias.ts` — `sellerAlias`, `aliasFor`.
- `lib/b2b/anonymize.ts` — `anonymizeMessage`, `anonymizeQuote`.

**New — tests:**
- `__tests__/lib/b2b/validation.test.ts`
- `__tests__/lib/b2b/state.test.ts`
- `__tests__/lib/b2b/alias.test.ts`
- `__tests__/lib/b2b/anonymize.test.ts`

**New — auth helper:**
- `lib/auth.ts` — add `requireBusiness()` (modify existing file).

**New — API routes:**
- `app/api/account/business/route.ts` — PATCH set business profile.
- `app/api/b2b/requests/route.ts` — POST create, GET list.
- `app/api/b2b/requests/[id]/route.ts` — GET detail (scoped/anonymized), PATCH (admin status/close).
- `app/api/b2b/requests/[id]/sellers/route.ts` — POST admin shortlist.
- `app/api/b2b/requests/[id]/messages/route.ts` — GET/POST thread.
- `app/api/b2b/quotes/route.ts` — POST seller submit.
- `app/api/b2b/quotes/[id]/route.ts` — PATCH approve/reject/accept/counter.

**New — pages:**
- `app/b2b/page.tsx` — public landing.
- `app/b2b/request/page.tsx` — sourcing form (client).
- `app/b2b/requests/page.tsx` — buyer portal list.
- `app/b2b/requests/[id]/page.tsx` — buyer portal detail.
- `app/admin/b2b/page.tsx` — admin queue.
- `app/admin/b2b/[id]/page.tsx` — admin request console.
- `app/seller/b2b/page.tsx` — seller quote-requests list.
- `app/seller/b2b/[id]/page.tsx` — seller quote detail/submit.

**New — components:**
- `components/b2b/QuoteThread.tsx` — anonymized message thread (client).
- `components/b2b/RequestQuoteButton.tsx` — listing-page CTA (client).

**Modified:**
- `scripts/schema.sql` — add columns + 4 tables.
- `scripts/migrate.mjs` — idempotent migration statements.
- `middleware.ts` — protect `/b2b/requests`, `/admin/b2b`, `/seller/b2b`.
- `app/listings/[id]/page.tsx` — mount `RequestQuoteButton`.
- `app/page.tsx` — add B2B homepage section.
- `components/layout/Header` (or equivalent nav) — add B2B link. (Find actual nav file during Task 16.)

---

## Task 1: Database migration

**Files:**
- Modify: `scripts/schema.sql`
- Modify: `scripts/migrate.mjs`

- [ ] **Step 1: Append schema to `scripts/schema.sql`**

Add at end of file:

```sql
-- B2B: business profile columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_type TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- B2B requests (RFQ)
CREATE TABLE IF NOT EXISTS b2b_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID NOT NULL REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  org_name TEXT,
  org_type TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  need_type TEXT[] DEFAULT '{}',
  shelter_type TEXT,
  quantity INTEGER,
  location TEXT,
  target_date DATE,
  budget_note TEXT,
  description TEXT,
  status TEXT DEFAULT 'new',
  deal_value INTEGER,
  commission_amount INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B2B shortlisted sellers per request
CREATE TABLE IF NOT EXISTS b2b_request_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES b2b_requests(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'invited',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id, seller_id)
);

-- B2B quotes (with counter-offer chain)
CREATE TABLE IF NOT EXISTS b2b_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES b2b_requests(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id),
  unit_price INTEGER NOT NULL,
  units INTEGER NOT NULL DEFAULT 1,
  delivery_terms TEXT,
  lead_time TEXT,
  notes TEXT,
  status TEXT DEFAULT 'submitted',
  parent_quote_id UUID REFERENCES b2b_quotes(id),
  countered_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B2B anonymized messages
CREATE TABLE IF NOT EXISTS b2b_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES b2b_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_role TEXT NOT NULL,
  alias TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

- [ ] **Step 2: Append the same statements to `scripts/migrate.mjs`**

After the existing `await sql\`...\`` lines and before `console.log('Migration complete')`, add each statement as its own `await sql\`...\`` call (the migrate script runs raw statements, one per call). Copy each `ALTER`/`CREATE` statement above into its own `await sql\`<statement>\`` line.

- [ ] **Step 3: Run the migration**

Run: `node scripts/migrate.mjs`
Expected: prints `Migration complete` with no error.

- [ ] **Step 4: Commit**

```bash
git add scripts/schema.sql scripts/migrate.mjs
git commit -m "feat(b2b): add B2B schema (requests, quotes, messages, business profile)"
```

---

## Task 2: Shared types

**Files:**
- Create: `lib/b2b/types.ts`

- [ ] **Step 1: Write `lib/b2b/types.ts`**

```typescript
export type OrgType = 'company' | 'municipality' | 'other'
export type NeedType = 'bulk' | 'sourcing' | 'po_deal' | 'custom'
export type ShelterType = 'mamad' | 'migounit' | 'other' | 'any'

export type RequestStatus =
  | 'new' | 'qualifying' | 'sourcing' | 'quoting'
  | 'presented' | 'closed_won' | 'closed_lost' | 'cancelled'

export type QuoteStatus =
  | 'submitted' | 'approved' | 'rejected' | 'countered' | 'accepted'

export type SenderRole = 'buyer' | 'seller' | 'admin'

export type RequestInput = {
  listing_id?: string | null
  org_name?: string
  org_type?: OrgType
  contact_name?: string
  contact_phone?: string
  contact_email?: string
  need_type?: NeedType[]
  shelter_type?: ShelterType
  quantity?: number
  location?: string
  target_date?: string | null
  budget_note?: string
  description?: string
}

export type QuoteInput = {
  request_id: string
  unit_price: number
  units: number
  delivery_terms?: string
  lead_time?: string
  notes?: string
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/b2b/types.ts
git commit -m "feat(b2b): shared types"
```

---

## Task 3: Request & quote validation (TDD)

**Files:**
- Test: `__tests__/lib/b2b/validation.test.ts`
- Create: `lib/b2b/validation.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { validateRequestInput, validateQuoteInput } from '@/lib/b2b/validation'

const validRequest = {
  org_name: 'עיריית חיפה',
  contact_name: 'דנה',
  contact_phone: '050-0000000',
  need_type: ['bulk' as const],
  shelter_type: 'migounit' as const,
}

describe('validateRequestInput', () => {
  it('passes for a valid request', () => {
    expect(() => validateRequestInput(validRequest)).not.toThrow()
  })
  it('throws when org_name missing', () => {
    expect(() => validateRequestInput({ ...validRequest, org_name: '' }))
      .toThrow('org_name is required')
  })
  it('throws when contact_name missing', () => {
    expect(() => validateRequestInput({ ...validRequest, contact_name: '' }))
      .toThrow('contact_name is required')
  })
  it('throws when need_type empty', () => {
    expect(() => validateRequestInput({ ...validRequest, need_type: [] }))
      .toThrow('need_type is required')
  })
  it('throws when shelter_type missing', () => {
    expect(() => validateRequestInput({ ...validRequest, shelter_type: undefined as any }))
      .toThrow('shelter_type is required')
  })
})

const validQuote = { request_id: 'r1', unit_price: 5000000, units: 3 }

describe('validateQuoteInput', () => {
  it('passes for a valid quote', () => {
    expect(() => validateQuoteInput(validQuote)).not.toThrow()
  })
  it('throws when unit_price <= 0', () => {
    expect(() => validateQuoteInput({ ...validQuote, unit_price: 0 }))
      .toThrow('unit_price must be positive')
  })
  it('throws when units < 1', () => {
    expect(() => validateQuoteInput({ ...validQuote, units: 0 }))
      .toThrow('units must be at least 1')
  })
  it('throws when request_id missing', () => {
    expect(() => validateQuoteInput({ ...validQuote, request_id: '' }))
      .toThrow('request_id is required')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/b2b/validation.test.ts`
Expected: FAIL — cannot find module `@/lib/b2b/validation`.

- [ ] **Step 3: Write `lib/b2b/validation.ts`**

```typescript
import type { RequestInput, QuoteInput } from './types'

export function validateRequestInput(input: RequestInput) {
  if (!input.org_name) throw new Error('org_name is required')
  if (!input.contact_name) throw new Error('contact_name is required')
  if (!input.need_type || input.need_type.length === 0) throw new Error('need_type is required')
  if (!input.shelter_type) throw new Error('shelter_type is required')
}

export function validateQuoteInput(input: QuoteInput) {
  if (!input.request_id) throw new Error('request_id is required')
  if (input.unit_price == null || input.unit_price <= 0) throw new Error('unit_price must be positive')
  if (input.units == null || input.units < 1) throw new Error('units must be at least 1')
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/b2b/validation.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/b2b/validation.ts __tests__/lib/b2b/validation.test.ts
git commit -m "feat(b2b): request and quote validation"
```

---

## Task 4: State-transition guards (TDD)

**Files:**
- Test: `__tests__/lib/b2b/state.test.ts`
- Create: `lib/b2b/state.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { canTransitionRequest, canTransitionQuote } from '@/lib/b2b/state'

describe('canTransitionRequest', () => {
  it('allows new -> qualifying', () => {
    expect(canTransitionRequest('new', 'qualifying')).toBe(true)
  })
  it('allows quoting -> presented', () => {
    expect(canTransitionRequest('quoting', 'presented')).toBe(true)
  })
  it('allows presented -> closed_won', () => {
    expect(canTransitionRequest('presented', 'closed_won')).toBe(true)
  })
  it('allows any non-closed -> cancelled', () => {
    expect(canTransitionRequest('quoting', 'cancelled')).toBe(true)
  })
  it('forbids closed_won -> quoting', () => {
    expect(canTransitionRequest('closed_won', 'quoting')).toBe(false)
  })
  it('forbids new -> closed_won (skipping)', () => {
    expect(canTransitionRequest('new', 'closed_won')).toBe(false)
  })
})

describe('canTransitionQuote', () => {
  it('allows submitted -> approved', () => {
    expect(canTransitionQuote('submitted', 'approved')).toBe(true)
  })
  it('allows submitted -> rejected', () => {
    expect(canTransitionQuote('submitted', 'rejected')).toBe(true)
  })
  it('allows approved -> accepted', () => {
    expect(canTransitionQuote('approved', 'accepted')).toBe(true)
  })
  it('allows approved -> countered', () => {
    expect(canTransitionQuote('approved', 'countered')).toBe(true)
  })
  it('forbids rejected -> accepted', () => {
    expect(canTransitionQuote('rejected', 'accepted')).toBe(false)
  })
  it('forbids accepted -> rejected', () => {
    expect(canTransitionQuote('accepted', 'rejected')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/b2b/state.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `lib/b2b/state.ts`**

```typescript
import type { RequestStatus, QuoteStatus } from './types'

const REQUEST_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  new: ['qualifying', 'cancelled'],
  qualifying: ['sourcing', 'cancelled'],
  sourcing: ['quoting', 'cancelled'],
  quoting: ['presented', 'cancelled'],
  presented: ['closed_won', 'closed_lost', 'cancelled'],
  closed_won: [],
  closed_lost: [],
  cancelled: [],
}

const QUOTE_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  submitted: ['approved', 'rejected'],
  approved: ['accepted', 'rejected', 'countered'],
  rejected: [],
  countered: [],
  accepted: [],
}

export function canTransitionRequest(from: RequestStatus, to: RequestStatus): boolean {
  return REQUEST_TRANSITIONS[from]?.includes(to) ?? false
}

export function canTransitionQuote(from: QuoteStatus, to: QuoteStatus): boolean {
  return QUOTE_TRANSITIONS[from]?.includes(to) ?? false
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/b2b/state.test.ts`
Expected: PASS (12 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/b2b/state.ts __tests__/lib/b2b/state.test.ts
git commit -m "feat(b2b): request and quote state-transition guards"
```

---

## Task 5: Alias assignment (TDD)

**Files:**
- Test: `__tests__/lib/b2b/alias.test.ts`
- Create: `lib/b2b/alias.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { sellerAlias, aliasFor } from '@/lib/b2b/alias'

describe('sellerAlias', () => {
  it('maps index 0 to ספק א׳', () => {
    expect(sellerAlias(0)).toBe('ספק א׳')
  })
  it('maps index 1 to ספק ב׳', () => {
    expect(sellerAlias(1)).toBe('ספק ב׳')
  })
  it('falls back to numbered alias beyond the alphabet', () => {
    expect(sellerAlias(30)).toBe('ספק 31')
  })
})

describe('aliasFor', () => {
  it('returns קונה for buyer', () => {
    expect(aliasFor('buyer', 0)).toBe('קונה')
  })
  it('returns מתאם for admin', () => {
    expect(aliasFor('admin', 0)).toBe('מתאם')
  })
  it('returns indexed seller alias for seller', () => {
    expect(aliasFor('seller', 1)).toBe('ספק ב׳')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/b2b/alias.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `lib/b2b/alias.ts`**

```typescript
import type { SenderRole } from './types'

const HEBREW_ORDINALS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳', 'ט׳', 'י׳']

export function sellerAlias(index: number): string {
  if (index < HEBREW_ORDINALS.length) return `ספק ${HEBREW_ORDINALS[index]}`
  return `ספק ${index + 1}`
}

export function aliasFor(role: SenderRole, sellerIndex: number): string {
  if (role === 'buyer') return 'קונה'
  if (role === 'admin') return 'מתאם'
  return sellerAlias(sellerIndex)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/b2b/alias.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/b2b/alias.ts __tests__/lib/b2b/alias.test.ts
git commit -m "feat(b2b): deterministic alias assignment"
```

---

## Task 6: PII anonymization serializers (TDD)

**Files:**
- Test: `__tests__/lib/b2b/anonymize.test.ts`
- Create: `lib/b2b/anonymize.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { anonymizeMessage, anonymizeQuote } from '@/lib/b2b/anonymize'

const rawMessage = {
  id: 'm1', request_id: 'r1', sender_id: 'u1', sender_role: 'seller',
  alias: 'ספק א׳', body: 'שלום', created_at: '2026-06-08',
  sender_name: 'חברת מיגון בע"מ', sender_phone: '050-1234567',
}

describe('anonymizeMessage', () => {
  it('keeps alias, role, body, timestamp', () => {
    const out = anonymizeMessage(rawMessage)
    expect(out.alias).toBe('ספק א׳')
    expect(out.sender_role).toBe('seller')
    expect(out.body).toBe('שלום')
  })
  it('strips sender_id and all PII fields', () => {
    const out = anonymizeMessage(rawMessage) as any
    expect(out.sender_id).toBeUndefined()
    expect(out.sender_name).toBeUndefined()
    expect(out.sender_phone).toBeUndefined()
  })
})

const rawQuote = {
  id: 'q1', request_id: 'r1', seller_id: 'u1', unit_price: 5000000, units: 3,
  delivery_terms: 'עד הבית', lead_time: '30 ימים', notes: '', status: 'approved',
  parent_quote_id: null, countered_by: null, created_at: '2026-06-08',
  seller_name: 'חברת מיגון בע"מ', seller_phone: '050-1234567',
  alias: 'ספק א׳',
}

describe('anonymizeQuote', () => {
  it('keeps commercial terms and alias', () => {
    const out = anonymizeQuote(rawQuote)
    expect(out.unit_price).toBe(5000000)
    expect(out.units).toBe(3)
    expect(out.alias).toBe('ספק א׳')
    expect(out.status).toBe('approved')
  })
  it('strips seller_id and seller PII', () => {
    const out = anonymizeQuote(rawQuote) as any
    expect(out.seller_id).toBeUndefined()
    expect(out.seller_name).toBeUndefined()
    expect(out.seller_phone).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/b2b/anonymize.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `lib/b2b/anonymize.ts`**

```typescript
export function anonymizeMessage(row: any) {
  return {
    id: row.id,
    request_id: row.request_id,
    sender_role: row.sender_role,
    alias: row.alias,
    body: row.body,
    created_at: row.created_at,
  }
}

export function anonymizeQuote(row: any) {
  return {
    id: row.id,
    request_id: row.request_id,
    alias: row.alias,
    unit_price: row.unit_price,
    units: row.units,
    delivery_terms: row.delivery_terms,
    lead_time: row.lead_time,
    notes: row.notes,
    status: row.status,
    parent_quote_id: row.parent_quote_id,
    countered_by: row.countered_by,
    created_at: row.created_at,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/b2b/anonymize.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/b2b/anonymize.ts __tests__/lib/b2b/anonymize.test.ts
git commit -m "feat(b2b): PII anonymization serializers"
```

---

## Task 7: `requireBusiness` auth helper

**Files:**
- Modify: `lib/auth.ts`

- [ ] **Step 1: Add helper to `lib/auth.ts`**

Append after `requireRole`:

```typescript
export async function requireBusiness() {
  const user = await getSessionUser()
  if (!user || !(user as any).is_business) {
    throw new Error('Unauthorized')
  }
  return user
}
```

- [ ] **Step 2: Expose `is_business` in the session**

In `auth.ts`, add `is_business` to the `authorize` return, the `jwt` callback, and the `session` callback, mirroring how `verified` is handled:
- `authorize` return object: add `is_business: user.is_business,`
- `jwt` callback `if (user) {...}`: add `token.is_business = (user as any).is_business`
- `session` callback `if (session.user) {...}`: add `;(session.user as any).is_business = token.is_business`

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds (type-checks).

- [ ] **Step 4: Commit**

```bash
git add lib/auth.ts auth.ts
git commit -m "feat(b2b): requireBusiness helper + is_business in session"
```

---

## Task 8: Business profile API

**Files:**
- Create: `app/api/account/business/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import sql from '@/lib/db'

export async function PATCH(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const rows = await sql`
    UPDATE users SET
      is_business = TRUE,
      business_name = ${body.org_name ?? null},
      org_type = ${body.org_type ?? null},
      contact_name = ${body.contact_name ?? null},
      phone = ${body.contact_phone ?? null}
    WHERE id = ${user.id!}
    RETURNING id, is_business, business_name, org_type, contact_name, phone
  `
  return NextResponse.json(rows[0])
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/api/account/business/route.ts
git commit -m "feat(b2b): business profile API"
```

---

## Task 9: Create & list requests API

**Files:**
- Create: `app/api/b2b/requests/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { validateRequestInput } from '@/lib/b2b/validation'
import type { RequestInput } from '@/lib/b2b/types'
import sql from '@/lib/db'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body: RequestInput = await request.json()
  try {
    validateRequestInput(body)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
  // Ensure the user is flagged as a business buyer.
  await sql`UPDATE users SET is_business = TRUE WHERE id = ${user.id!} AND is_business = FALSE`
  const rows = await sql`
    INSERT INTO b2b_requests (
      buyer_id, listing_id, org_name, org_type, contact_name, contact_phone,
      contact_email, need_type, shelter_type, quantity, location, target_date,
      budget_note, description, status
    ) VALUES (
      ${user.id!},
      ${body.listing_id ?? null},
      ${body.org_name ?? null},
      ${body.org_type ?? null},
      ${body.contact_name ?? null},
      ${body.contact_phone ?? null},
      ${body.contact_email ?? user.email ?? null},
      ${body.need_type ?? []},
      ${body.shelter_type ?? null},
      ${body.quantity ?? null},
      ${body.location ?? null},
      ${body.target_date ?? null},
      ${body.budget_note ?? null},
      ${body.description ?? null},
      'new'
    ) RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}

export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const rows = await sql`
    SELECT * FROM b2b_requests
    WHERE buyer_id = ${user.id!}
    ORDER BY created_at DESC
  `
  return NextResponse.json(rows)
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/api/b2b/requests/route.ts
git commit -m "feat(b2b): create and list requests API"
```

---

## Task 10: Request detail + admin status/close API

**Files:**
- Create: `app/api/b2b/requests/[id]/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { canTransitionRequest } from '@/lib/b2b/state'
import type { RequestStatus } from '@/lib/b2b/types'
import sql from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const rows = await sql`SELECT * FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  const reqRow = rows[0]
  if (!reqRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (role === 'admin') return NextResponse.json(reqRow)
  if (reqRow.buyer_id === user.id) return NextResponse.json(reqRow)
  // sellers: only if invited
  const invited = await sql`
    SELECT 1 FROM b2b_request_sellers
    WHERE request_id = ${params.id} AND seller_id = ${user.id!} LIMIT 1
  `
  if (role === 'seller' && invited.length > 0) {
    // strip buyer PII for sellers
    const { contact_name, contact_phone, contact_email, org_name, ...safe } = reqRow
    return NextResponse.json(safe)
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user || (user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const rows = await sql`SELECT status FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.status) {
    const from = rows[0].status as RequestStatus
    const to = body.status as RequestStatus
    if (!canTransitionRequest(from, to)) {
      return NextResponse.json({ error: `Illegal transition ${from} -> ${to}` }, { status: 400 })
    }
  }
  const updated = await sql`
    UPDATE b2b_requests SET
      status = ${body.status ?? rows[0].status},
      deal_value = ${body.deal_value ?? null},
      commission_amount = ${body.commission_amount ?? null},
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `
  return NextResponse.json(updated[0])
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add "app/api/b2b/requests/[id]/route.ts"
git commit -m "feat(b2b): request detail + admin status/close API"
```

---

## Task 11: Shortlist sellers API

**Files:**
- Create: `app/api/b2b/requests/[id]/sellers/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import sql from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user || (user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json() as { seller_ids: string[] }
  for (const sellerId of body.seller_ids ?? []) {
    await sql`
      INSERT INTO b2b_request_sellers (request_id, seller_id, status)
      VALUES (${params.id}, ${sellerId}, 'invited')
      ON CONFLICT (request_id, seller_id) DO NOTHING
    `
  }
  // advance request to quoting if still earlier
  await sql`
    UPDATE b2b_requests SET status = 'quoting', updated_at = NOW()
    WHERE id = ${params.id} AND status IN ('sourcing', 'qualifying')
  `
  const rows = await sql`
    SELECT rs.*, u.business_name, u.name
    FROM b2b_request_sellers rs JOIN users u ON u.id = rs.seller_id
    WHERE rs.request_id = ${params.id}
  `
  return NextResponse.json(rows)
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add "app/api/b2b/requests/[id]/sellers/route.ts"
git commit -m "feat(b2b): admin shortlist sellers API"
```

---

## Task 12: Submit quote API

**Files:**
- Create: `app/api/b2b/quotes/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { validateQuoteInput } from '@/lib/b2b/validation'
import type { QuoteInput } from '@/lib/b2b/types'
import sql from '@/lib/db'

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user || (user as any).role !== 'seller') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body: QuoteInput & { parent_quote_id?: string } = await request.json()
  try {
    validateQuoteInput(body)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
  // Seller must be invited and request must be open.
  const invited = await sql`
    SELECT 1 FROM b2b_request_sellers
    WHERE request_id = ${body.request_id} AND seller_id = ${user.id!} LIMIT 1
  `
  if (invited.length === 0) {
    return NextResponse.json({ error: 'Not invited to this request' }, { status: 403 })
  }
  const reqRows = await sql`SELECT status FROM b2b_requests WHERE id = ${body.request_id} LIMIT 1`
  if (!reqRows[0] || ['closed_won', 'closed_lost', 'cancelled'].includes(reqRows[0].status)) {
    return NextResponse.json({ error: 'Request is closed' }, { status: 400 })
  }
  const rows = await sql`
    INSERT INTO b2b_quotes (
      request_id, seller_id, unit_price, units, delivery_terms, lead_time, notes,
      status, parent_quote_id, countered_by
    ) VALUES (
      ${body.request_id}, ${user.id!}, ${body.unit_price}, ${body.units},
      ${body.delivery_terms ?? null}, ${body.lead_time ?? null}, ${body.notes ?? null},
      'submitted', ${body.parent_quote_id ?? null},
      ${body.parent_quote_id ? 'seller' : null}
    ) RETURNING *
  `
  await sql`
    UPDATE b2b_request_sellers SET status = 'quoted'
    WHERE request_id = ${body.request_id} AND seller_id = ${user.id!}
  `
  return NextResponse.json(rows[0], { status: 201 })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/api/b2b/quotes/route.ts
git commit -m "feat(b2b): seller submit quote API"
```

---

## Task 13: Quote transitions API (approve/reject/accept/counter)

**Files:**
- Create: `app/api/b2b/quotes/[id]/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { canTransitionQuote } from '@/lib/b2b/state'
import type { QuoteStatus } from '@/lib/b2b/types'
import sql from '@/lib/db'

// action: 'approve' | 'reject' (admin); 'accept' | 'reject' | 'counter' (buyer)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const body = await req.json() as { action: string; counter?: any }

  const rows = await sql`SELECT * FROM b2b_quotes WHERE id = ${params.id} LIMIT 1`
  const quote = rows[0]
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const from = quote.status as QuoteStatus

  // Admin: approve / reject submitted quotes
  if (role === 'admin' && (body.action === 'approve' || body.action === 'reject')) {
    const to: QuoteStatus = body.action === 'approve' ? 'approved' : 'rejected'
    if (!canTransitionQuote(from, to)) {
      return NextResponse.json({ error: `Illegal transition ${from} -> ${to}` }, { status: 400 })
    }
    const upd = await sql`UPDATE b2b_quotes SET status = ${to}, updated_at = NOW() WHERE id = ${params.id} RETURNING *`
    if (to === 'approved') {
      await sql`UPDATE b2b_requests SET status = 'presented', updated_at = NOW() WHERE id = ${quote.request_id} AND status = 'quoting'`
    }
    return NextResponse.json(upd[0])
  }

  // Buyer must own the request behind this quote
  const reqRows = await sql`SELECT buyer_id FROM b2b_requests WHERE id = ${quote.request_id} LIMIT 1`
  const isBuyer = role !== 'admin' && reqRows[0]?.buyer_id === user.id

  if (isBuyer && body.action === 'reject') {
    if (!canTransitionQuote(from, 'rejected')) {
      return NextResponse.json({ error: 'Illegal transition' }, { status: 400 })
    }
    const upd = await sql`UPDATE b2b_quotes SET status = 'rejected', updated_at = NOW() WHERE id = ${params.id} RETURNING *`
    return NextResponse.json(upd[0])
  }

  if (isBuyer && body.action === 'accept') {
    if (!canTransitionQuote(from, 'accepted')) {
      return NextResponse.json({ error: 'Illegal transition' }, { status: 400 })
    }
    const upd = await sql`UPDATE b2b_quotes SET status = 'accepted', updated_at = NOW() WHERE id = ${params.id} RETURNING *`
    // reject all other approved quotes on this request
    await sql`
      UPDATE b2b_quotes SET status = 'rejected', updated_at = NOW()
      WHERE request_id = ${quote.request_id} AND id <> ${params.id} AND status = 'approved'
    `
    return NextResponse.json(upd[0])
  }

  if (isBuyer && body.action === 'counter') {
    if (!canTransitionQuote(from, 'countered')) {
      return NextResponse.json({ error: 'Illegal transition' }, { status: 400 })
    }
    await sql`UPDATE b2b_quotes SET status = 'countered', updated_at = NOW() WHERE id = ${params.id}`
    const child = await sql`
      INSERT INTO b2b_quotes (
        request_id, seller_id, unit_price, units, delivery_terms, lead_time, notes,
        status, parent_quote_id, countered_by
      ) VALUES (
        ${quote.request_id}, ${quote.seller_id},
        ${body.counter?.unit_price ?? quote.unit_price},
        ${body.counter?.units ?? quote.units},
        ${body.counter?.delivery_terms ?? quote.delivery_terms},
        ${body.counter?.lead_time ?? quote.lead_time},
        ${body.counter?.notes ?? null},
        'submitted', ${params.id}, 'buyer'
      ) RETURNING *
    `
    return NextResponse.json(child[0], { status: 201 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add "app/api/b2b/quotes/[id]/route.ts"
git commit -m "feat(b2b): quote approve/reject/accept/counter API"
```

---

## Task 14: Messages API (anonymized)

**Files:**
- Create: `app/api/b2b/requests/[id]/messages/route.ts`

- [ ] **Step 1: Write the route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { aliasFor } from '@/lib/b2b/alias'
import { anonymizeMessage } from '@/lib/b2b/anonymize'
import type { SenderRole } from '@/lib/b2b/types'
import sql from '@/lib/db'

// Resolve this user's role + stable seller index for the request.
async function resolveSender(requestId: string, userId: string, role: string) {
  if (role === 'admin') return { senderRole: 'admin' as SenderRole, index: 0 }
  const reqRows = await sql`SELECT buyer_id FROM b2b_requests WHERE id = ${requestId} LIMIT 1`
  if (reqRows[0]?.buyer_id === userId) return { senderRole: 'buyer' as SenderRole, index: 0 }
  // seller index = position in invited-order
  const sellers = await sql`
    SELECT seller_id FROM b2b_request_sellers
    WHERE request_id = ${requestId} ORDER BY invited_at ASC
  `
  const idx = sellers.findIndex((s: any) => s.seller_id === userId)
  if (idx >= 0) return { senderRole: 'seller' as SenderRole, index: idx }
  return null
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const sender = await resolveSender(params.id, user.id!, role)
  if (!sender) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const rows = await sql`
    SELECT * FROM b2b_messages WHERE request_id = ${params.id} ORDER BY created_at ASC
  `
  if (role === 'admin') return NextResponse.json(rows) // admin sees raw rows
  return NextResponse.json(rows.map(anonymizeMessage))
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (user as any).role
  const sender = await resolveSender(params.id, user.id!, role)
  if (!sender) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json() as { body: string }
  if (!body.body?.trim()) return NextResponse.json({ error: 'body is required' }, { status: 400 })

  const alias = aliasFor(sender.senderRole, sender.index)
  const rows = await sql`
    INSERT INTO b2b_messages (request_id, sender_id, sender_role, alias, body)
    VALUES (${params.id}, ${user.id!}, ${sender.senderRole}, ${alias}, ${body.body})
    RETURNING *
  `
  return NextResponse.json(anonymizeMessage(rows[0]), { status: 201 })
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add "app/api/b2b/requests/[id]/messages/route.ts"
git commit -m "feat(b2b): anonymized messages API"
```

---

## Task 15: Middleware route protection

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 1: Add B2B guards**

In the middleware function body, after the existing `/seller` check, add:

```typescript
  if (pathname.startsWith('/b2b/requests') && !(req.auth?.user as any)?.is_business) {
    return NextResponse.redirect(new URL('/b2b', req.url))
  }
```

The `/admin/b2b` path is already covered by the existing `pathname.startsWith('/admin')` check. The `/seller/b2b` path is already covered by the existing `/seller` check — but extend the matcher.

- [ ] **Step 2: Extend the matcher**

Replace the `matcher` array to add the new protected paths:

```typescript
export const config = {
  matcher: [
    '/seller/dashboard/:path*', '/seller/listings/:path*', '/seller/onboarding/:path*',
    '/seller/verify/:path*', '/seller/b2b/:path*',
    '/admin/:path*', '/orders/:path*', '/checkout/:path*',
    '/b2b/requests/:path*',
  ],
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 4: Commit**

```bash
git add middleware.ts
git commit -m "feat(b2b): route protection for B2B portal, admin, seller views"
```

---

## Task 16: Public B2B landing page + navigation

**Files:**
- Create: `app/b2b/page.tsx`
- Modify: `app/page.tsx` (homepage B2B section)
- Modify: nav/header component (locate via grep for the existing header)

- [ ] **Step 1: Write `app/b2b/page.tsx`**

```tsx
import Link from 'next/link'

export default function B2BLandingPage() {
  return (
    <main dir="rtl" className="max-w-5xl mx-auto px-6 py-16">
      <section className="text-center mb-12">
        <p className="text-sm font-semibold text-brand-600 mb-2">רכש לארגונים</p>
        <h1 className="text-4xl font-black text-navy-900 mb-4">פתרונות מיגון לחברות ולרשויות</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          צריכים כמות גדולה של ממ&quot;דים או מיגוניות? נהל תהליך רכש מסודר: שלחו בקשה, קבלו הצעות מחיר ממוכרים מאומתים, ונהלו משא ומתן — הכל במקום אחד.
        </p>
        <Link href="/b2b/request" className="btn-primary mt-8 inline-flex">שלחו בקשת רכש ←</Link>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        {[
          { icon: '📝', title: 'שלחו בקשה', body: 'תארו את הצורך — כמות, אזור, מועד אספקה.' },
          { icon: '💬', title: 'קבלו הצעות', body: 'אנחנו מתאימים מוכרים מאומתים ואוספים הצעות מחיר.' },
          { icon: '🤝', title: 'סגרו עסקה', body: 'נהלו משא ומתן וסגרו ישירות מול הספק, עם ליווי שלנו.' },
        ].map(c => (
          <div key={c.title} className="card p-6 text-center">
            <div className="text-4xl mb-3">{c.icon}</div>
            <h3 className="font-bold text-lg mb-2 text-navy-900">{c.title}</h3>
            <p className="text-sm text-gray-500">{c.body}</p>
          </div>
        ))}
      </section>

      <section className="text-center">
        <Link href="/listings" className="btn-secondary">או עיינו בקטלוג ←</Link>
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Add a B2B section to the homepage**

In `app/page.tsx`, before the "Seller CTA" section (`{/* ── Seller CTA ── */}`), insert:

```tsx
      {/* ── B2B section ── */}
      <section className="bg-white py-16 px-6 border-t border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-brand-600 mb-2">לחברות ולרשויות</p>
          <h2 className="section-title mb-4">צריכים לרכוש בכמות גדולה?</h2>
          <p className="text-gray-600 mb-8 max-w-xl mx-auto">
            עיריות, מועצות וחברות — נהלו תהליך רכש מסודר עם הצעות מחיר ממוכרים מאומתים.
          </p>
          <Link href="/b2b" className="btn-primary inline-flex">למסלול הרכש לארגונים ←</Link>
        </div>
      </section>
```

- [ ] **Step 3: Add a nav link**

Run `grep -rl "how-it-works" app components` to find the header/nav component. In that component's links list, add an entry: `{ href: '/b2b', label: 'רכש לארגונים' }` (match the existing link object shape in that file).

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 5: Commit**

```bash
git add app/b2b/page.tsx app/page.tsx
git add -A
git commit -m "feat(b2b): public landing page + homepage section + nav link"
```

---

## Task 17: Sourcing form page

**Files:**
- Create: `app/b2b/request/page.tsx`

- [ ] **Step 1: Write the client form**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const NEED_TYPES = [
  { value: 'bulk', label: 'כמות גדולה' },
  { value: 'sourcing', label: 'איתור / מקור אספקה' },
  { value: 'po_deal', label: 'רכש מול הזמנת רכש' },
  { value: 'custom', label: 'התאמה אישית' },
]

export default function SourcingFormPage() {
  const router = useRouter()
  const [needTypes, setNeedTypes] = useState<string[]>([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true); setError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      org_name: fd.get('org_name'),
      org_type: fd.get('org_type'),
      contact_name: fd.get('contact_name'),
      contact_phone: fd.get('contact_phone'),
      contact_email: fd.get('contact_email'),
      need_type: needTypes,
      shelter_type: fd.get('shelter_type'),
      quantity: fd.get('quantity') ? Number(fd.get('quantity')) : null,
      location: fd.get('location'),
      target_date: fd.get('target_date') || null,
      budget_note: fd.get('budget_note'),
      description: fd.get('description'),
    }
    const res = await fetch('/api/b2b/requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSubmitting(false)
    if (res.status === 401) { router.push('/login?next=/b2b/request'); return }
    if (!res.ok) { const j = await res.json(); setError(j.error || 'שגיאה'); return }
    router.push('/b2b/requests')
  }

  function toggle(v: string) {
    setNeedTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  return (
    <main dir="rtl" className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black text-navy-900 mb-6">בקשת רכש לארגונים</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="org_name" required placeholder="שם הארגון" className="input w-full" />
        <select name="org_type" className="input w-full" defaultValue="company">
          <option value="company">חברה</option>
          <option value="municipality">רשות / עירייה</option>
          <option value="other">אחר</option>
        </select>
        <input name="contact_name" required placeholder="איש קשר" className="input w-full" />
        <input name="contact_phone" placeholder="טלפון" className="input w-full" />
        <input name="contact_email" type="email" placeholder="אימייל" className="input w-full" />

        <div>
          <p className="text-sm font-semibold mb-2">סוג הצורך</p>
          <div className="flex flex-wrap gap-2">
            {NEED_TYPES.map(nt => (
              <button type="button" key={nt.value} onClick={() => toggle(nt.value)}
                className={`px-3 py-1.5 rounded-full border text-sm ${needTypes.includes(nt.value) ? 'bg-brand-600 text-white border-brand-600' : 'border-gray-300'}`}>
                {nt.label}
              </button>
            ))}
          </div>
        </div>

        <select name="shelter_type" className="input w-full" defaultValue="any">
          <option value="any">כל סוג</option>
          <option value="mamad">ממ&quot;ד</option>
          <option value="migounit">מיגונית</option>
          <option value="other">אחר</option>
        </select>
        <input name="quantity" type="number" min="1" placeholder="כמות" className="input w-full" />
        <input name="location" placeholder="אזור / עיר" className="input w-full" />
        <input name="target_date" type="date" className="input w-full" />
        <input name="budget_note" placeholder="הערת תקציב (אופציונלי)" className="input w-full" />
        <textarea name="description" placeholder="פירוט הצורך" className="input w-full" rows={4} />

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'שולח...' : 'שליחת בקשה'}
        </button>
      </form>
    </main>
  )
}
```

Note: if the project has no `.input` utility class, use the same className used by other forms (check `app/seller/listings/new/page.tsx` for the exact input styling and reuse it).

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add app/b2b/request/page.tsx
git commit -m "feat(b2b): sourcing request form"
```

---

## Task 18: Buyer portal — list & detail

**Files:**
- Create: `app/b2b/requests/page.tsx`
- Create: `app/b2b/requests/[id]/page.tsx`
- Create: `components/b2b/QuoteThread.tsx`

- [ ] **Step 1: Write `app/b2b/requests/page.tsx`**

```tsx
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  new: 'התקבלה', qualifying: 'בבדיקה', sourcing: 'באיתור ספקים',
  quoting: 'באיסוף הצעות', presented: 'הצעות זמינות',
  closed_won: 'נסגרה', closed_lost: 'בוטלה', cancelled: 'בוטלה',
}

export default async function BuyerRequestsPage() {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>
  const rows = await sql`
    SELECT * FROM b2b_requests WHERE buyer_id = ${user.id!} ORDER BY created_at DESC
  `
  return (
    <main dir="rtl" className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black text-navy-900 mb-6">בקשות הרכש שלי</h1>
      {rows.length === 0 ? (
        <p className="text-gray-500">אין בקשות עדיין. <Link href="/b2b/request" className="text-brand-600">שלחו בקשה</Link></p>
      ) : (
        <div className="space-y-3">
          {rows.map((r: any) => (
            <Link key={r.id} href={`/b2b/requests/${r.id}`} className="card p-4 flex justify-between items-center hover:shadow-card-hover">
              <div>
                <p className="font-bold text-navy-900">{r.org_name} — {r.shelter_type}</p>
                <p className="text-sm text-gray-500">כמות: {r.quantity ?? '—'} · {r.location ?? ''}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700">
                {STATUS_LABELS[r.status] ?? r.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Write `components/b2b/QuoteThread.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'

type Msg = { id: string; sender_role: string; alias: string; body: string; created_at: string }

export function QuoteThread({ requestId }: { requestId: string }) {
  const [messages, setMessages] = useState<Msg[]>([])
  const [text, setText] = useState('')

  async function load() {
    const res = await fetch(`/api/b2b/requests/${requestId}/messages`)
    if (res.ok) setMessages(await res.json())
  }
  useEffect(() => { load() }, [requestId])

  async function send() {
    if (!text.trim()) return
    const res = await fetch(`/api/b2b/requests/${requestId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    if (res.ok) { setText(''); load() }
  }

  return (
    <div className="card p-4">
      <h3 className="font-bold mb-3 text-navy-900">שיחה</h3>
      <div className="space-y-2 max-h-80 overflow-y-auto mb-3">
        {messages.map(m => (
          <div key={m.id} className="text-sm">
            <span className="font-bold text-brand-700">{m.alias}: </span>
            <span className="text-gray-700">{m.body}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="text-gray-400 text-sm">אין הודעות עדיין</p>}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)} className="input flex-1" placeholder="כתוב הודעה..." />
        <button onClick={send} className="btn-primary">שלח</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `app/b2b/requests/[id]/page.tsx`**

```tsx
import { getSessionUser } from '@/lib/auth'
import { anonymizeQuote } from '@/lib/b2b/anonymize'
import { QuoteThread } from '@/components/b2b/QuoteThread'
import { BuyerQuoteActions } from './BuyerQuoteActions'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function BuyerRequestDetail({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>
  const reqRows = await sql`SELECT * FROM b2b_requests WHERE id = ${params.id} AND buyer_id = ${user.id!} LIMIT 1`
  const request = reqRows[0]
  if (!request) return <main dir="rtl" className="p-12">בקשה לא נמצאה</main>

  // Only approved/accepted quotes are visible to the buyer, with seller alias.
  const quoteRows = await sql`
    SELECT q.*, rs_idx.idx FROM b2b_quotes q
    JOIN (
      SELECT seller_id, ROW_NUMBER() OVER (ORDER BY invited_at ASC) - 1 AS idx
      FROM b2b_request_sellers WHERE request_id = ${params.id}
    ) rs_idx ON rs_idx.seller_id = q.seller_id
    WHERE q.request_id = ${params.id} AND q.status IN ('approved', 'accepted')
    ORDER BY q.created_at DESC
  `
  const quotes = quoteRows.map((q: any) => ({
    ...anonymizeQuote({ ...q, alias: `ספק ${q.idx + 1}` }),
  }))

  return (
    <main dir="rtl" className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-navy-900">{request.org_name} — {request.shelter_type}</h1>
        <p className="text-gray-500">כמות: {request.quantity ?? '—'} · {request.location ?? ''}</p>
      </div>

      <section>
        <h2 className="section-title mb-3">הצעות מחיר</h2>
        {quotes.length === 0 ? <p className="text-gray-400">אין הצעות זמינות עדיין</p> : (
          <div className="space-y-3">
            {quotes.map((q: any) => (
              <div key={q.id} className="card p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold">{q.alias}</p>
                    <p className="text-sm text-gray-600">מחיר ליחידה: ₪{q.unit_price.toLocaleString()} · יחידות: {q.units}</p>
                    {q.delivery_terms && <p className="text-sm text-gray-500">אספקה: {q.delivery_terms}</p>}
                    {q.lead_time && <p className="text-sm text-gray-500">זמן אספקה: {q.lead_time}</p>}
                  </div>
                  {q.status === 'accepted'
                    ? <span className="text-green-700 font-bold text-sm">התקבלה ✓</span>
                    : <BuyerQuoteActions quoteId={q.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <QuoteThread requestId={params.id} />
    </main>
  )
}
```

- [ ] **Step 4: Write `app/b2b/requests/[id]/BuyerQuoteActions.tsx`**

```tsx
'use client'
import { useRouter } from 'next/navigation'

export function BuyerQuoteActions({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  async function act(action: string) {
    const res = await fetch(`/api/b2b/quotes/${quoteId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) router.refresh()
  }
  return (
    <div className="flex gap-2">
      <button onClick={() => act('accept')} className="btn-primary text-sm">קבל</button>
      <button onClick={() => act('reject')} className="btn-secondary text-sm">דחה</button>
    </div>
  )
}
```

(Counter-offer UI is added in Task 20 once admin/seller flows exist; accept/reject ship here.)

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add app/b2b/requests components/b2b/QuoteThread.tsx
git commit -m "feat(b2b): buyer portal list, detail, quote actions, thread"
```

---

## Task 19: Admin console — queue & request detail

**Files:**
- Create: `app/admin/b2b/page.tsx`
- Create: `app/admin/b2b/[id]/page.tsx`
- Create: `app/admin/b2b/[id]/AdminRequestActions.tsx`

- [ ] **Step 1: Write `app/admin/b2b/page.tsx`**

```tsx
import Link from 'next/link'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminB2BQueue() {
  const rows = await sql`
    SELECT r.*, (SELECT COUNT(*) FROM b2b_quotes q WHERE q.request_id = r.id) AS quote_count
    FROM b2b_requests r ORDER BY r.created_at DESC
  `
  return (
    <main dir="rtl" className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black text-navy-900 mb-6">בקשות רכש B2B</h1>
      <div className="space-y-3">
        {rows.map((r: any) => (
          <Link key={r.id} href={`/admin/b2b/${r.id}`} className="card p-4 flex justify-between hover:shadow-card-hover">
            <div>
              <p className="font-bold">{r.org_name} — {r.shelter_type}</p>
              <p className="text-sm text-gray-500">{r.contact_name} · {r.contact_phone} · כמות {r.quantity ?? '—'}</p>
            </div>
            <div className="text-left">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700">{r.status}</span>
              <p className="text-xs text-gray-400 mt-1">{r.quote_count} הצעות</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Write `app/admin/b2b/[id]/page.tsx`**

```tsx
import { QuoteThread } from '@/components/b2b/QuoteThread'
import { AdminRequestActions } from './AdminRequestActions'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminB2BDetail({ params }: { params: { id: string } }) {
  const reqRows = await sql`SELECT * FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  const request = reqRows[0]
  if (!request) return <main dir="rtl" className="p-12">לא נמצא</main>

  const quotes = await sql`
    SELECT q.*, u.business_name, u.name FROM b2b_quotes q
    JOIN users u ON u.id = q.seller_id
    WHERE q.request_id = ${params.id} ORDER BY q.created_at DESC
  `
  const verifiedSellers = await sql`
    SELECT id, business_name, name FROM users WHERE role = 'seller' AND verified = TRUE
  `
  const shortlisted = await sql`SELECT seller_id FROM b2b_request_sellers WHERE request_id = ${params.id}`

  return (
    <main dir="rtl" className="max-w-4xl mx-auto px-6 py-12 space-y-6">
      <div className="card p-4">
        <h1 className="text-2xl font-black">{request.org_name}</h1>
        <p className="text-gray-600">{request.contact_name} · {request.contact_phone} · {request.contact_email}</p>
        <p className="text-gray-600">סוג: {request.shelter_type} · כמות: {request.quantity ?? '—'} · אזור: {request.location ?? '—'}</p>
        <p className="text-gray-600">צורך: {(request.need_type ?? []).join(', ')}</p>
        {request.description && <p className="text-gray-700 mt-2">{request.description}</p>}
      </div>

      <AdminRequestActions
        requestId={request.id}
        status={request.status}
        sellers={verifiedSellers as any}
        shortlisted={(shortlisted as any).map((s: any) => s.seller_id)}
        quotes={quotes as any}
      />

      <QuoteThread requestId={params.id} />
    </main>
  )
}
```

- [ ] **Step 3: Write `app/admin/b2b/[id]/AdminRequestActions.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Seller = { id: string; business_name: string | null; name: string | null }
type Quote = { id: string; business_name: string | null; unit_price: number; units: number; status: string; delivery_terms: string | null }

export function AdminRequestActions({ requestId, status, sellers, shortlisted, quotes }: {
  requestId: string; status: string; sellers: Seller[]; shortlisted: string[]; quotes: Quote[]
}) {
  const router = useRouter()
  const [picked, setPicked] = useState<string[]>([])
  const [dealValue, setDealValue] = useState('')
  const [commission, setCommission] = useState('')

  async function patchStatus(newStatus: string) {
    const res = await fetch(`/api/b2b/requests/${requestId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) router.refresh()
  }
  async function shortlist() {
    const res = await fetch(`/api/b2b/requests/${requestId}/sellers`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seller_ids: picked }),
    })
    if (res.ok) { setPicked([]); router.refresh() }
  }
  async function quoteAction(quoteId: string, action: string) {
    const res = await fetch(`/api/b2b/quotes/${quoteId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) router.refresh()
  }
  async function close(won: boolean) {
    const res = await fetch(`/api/b2b/requests/${requestId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: won ? 'closed_won' : 'closed_lost',
        deal_value: won ? Number(dealValue) : null,
        commission_amount: won ? Number(commission) : null,
      }),
    })
    if (res.ok) router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="card p-4">
        <p className="font-bold mb-2">סטטוס: {status}</p>
        <div className="flex flex-wrap gap-2">
          {['qualifying', 'sourcing', 'quoting', 'presented'].map(s => (
            <button key={s} onClick={() => patchStatus(s)} className="btn-secondary text-sm">{s}</button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <p className="font-bold mb-2">בחירת ספקים מאומתים</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {sellers.map(s => {
            const already = shortlisted.includes(s.id)
            return (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" disabled={already}
                  checked={already || picked.includes(s.id)}
                  onChange={e => setPicked(p => e.target.checked ? [...p, s.id] : p.filter(x => x !== s.id))} />
                {s.business_name || s.name} {already && <span className="text-green-600 text-xs">(הוזמן)</span>}
              </label>
            )
          })}
        </div>
        <button onClick={shortlist} disabled={picked.length === 0} className="btn-primary text-sm mt-3">הזמן להצעה</button>
      </div>

      <div className="card p-4">
        <p className="font-bold mb-2">הצעות מחיר</p>
        {quotes.length === 0 ? <p className="text-gray-400 text-sm">אין הצעות</p> : quotes.map(q => (
          <div key={q.id} className="flex justify-between items-center border-b py-2 text-sm">
            <span>{q.business_name} — ₪{q.unit_price.toLocaleString()} × {q.units} ({q.status})</span>
            {q.status === 'submitted' && (
              <span className="flex gap-2">
                <button onClick={() => quoteAction(q.id, 'approve')} className="text-green-700">אשר</button>
                <button onClick={() => quoteAction(q.id, 'reject')} className="text-red-600">דחה</button>
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="card p-4">
        <p className="font-bold mb-2">סגירת עסקה</p>
        <input value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="שווי עסקה ₪" className="input w-full mb-2" />
        <input value={commission} onChange={e => setCommission(e.target.value)} placeholder="עמלה ₪" className="input w-full mb-2" />
        <div className="flex gap-2">
          <button onClick={() => close(true)} className="btn-primary text-sm">סגור כעסקה (won)</button>
          <button onClick={() => close(false)} className="btn-secondary text-sm">סגור ללא עסקה</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add admin dashboard link**

In `app/admin/dashboard/page.tsx`, add a card/link to `/admin/b2b` matching the existing dashboard card pattern (label "בקשות רכש B2B").

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 6: Commit**

```bash
git add app/admin/b2b app/admin/dashboard/page.tsx
git commit -m "feat(b2b): admin console queue, request detail, actions"
```

---

## Task 20: Seller quote views + listing CTA + counter-offer UI

**Files:**
- Create: `app/seller/b2b/page.tsx`
- Create: `app/seller/b2b/[id]/page.tsx`
- Create: `app/seller/b2b/[id]/SellerQuoteForm.tsx`
- Create: `components/b2b/RequestQuoteButton.tsx`
- Modify: `app/listings/[id]/page.tsx`
- Modify: `app/seller/dashboard/page.tsx`
- Modify: `app/b2b/requests/[id]/BuyerQuoteActions.tsx` (add counter)

- [ ] **Step 1: Write `app/seller/b2b/page.tsx`**

```tsx
import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function SellerB2BList() {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>
  const rows = await sql`
    SELECT r.id, r.shelter_type, r.quantity, r.location, r.target_date, r.status, rs.status AS invite_status
    FROM b2b_request_sellers rs JOIN b2b_requests r ON r.id = rs.request_id
    WHERE rs.seller_id = ${user.id!} ORDER BY rs.invited_at DESC
  `
  return (
    <main dir="rtl" className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-black text-navy-900 mb-6">בקשות הצעת מחיר</h1>
      {rows.length === 0 ? <p className="text-gray-500">אין בקשות כרגע</p> : (
        <div className="space-y-3">
          {rows.map((r: any) => (
            <Link key={r.id} href={`/seller/b2b/${r.id}`} className="card p-4 flex justify-between hover:shadow-card-hover">
              <div>
                <p className="font-bold">{r.shelter_type} · כמות {r.quantity ?? '—'}</p>
                <p className="text-sm text-gray-500">{r.location ?? ''} {r.target_date ? `· עד ${r.target_date}` : ''}</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-100 text-brand-700">{r.invite_status}</span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Write `app/seller/b2b/[id]/page.tsx`**

```tsx
import { getSessionUser } from '@/lib/auth'
import { QuoteThread } from '@/components/b2b/QuoteThread'
import { SellerQuoteForm } from './SellerQuoteForm'
import sql from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function SellerB2BDetail({ params }: { params: { id: string } }) {
  const user = await getSessionUser()
  if (!user) return <main dir="rtl" className="p-12">יש להתחבר</main>
  const invited = await sql`SELECT 1 FROM b2b_request_sellers WHERE request_id = ${params.id} AND seller_id = ${user.id!} LIMIT 1`
  if (invited.length === 0) return <main dir="rtl" className="p-12">אין גישה</main>

  const reqRows = await sql`SELECT id, shelter_type, quantity, location, target_date, description, status FROM b2b_requests WHERE id = ${params.id} LIMIT 1`
  const request = reqRows[0]
  const myQuotes = await sql`
    SELECT * FROM b2b_quotes WHERE request_id = ${params.id} AND seller_id = ${user.id!} ORDER BY created_at DESC
  `
  const closed = ['closed_won', 'closed_lost', 'cancelled'].includes(request.status)

  return (
    <main dir="rtl" className="max-w-3xl mx-auto px-6 py-12 space-y-6">
      <div className="card p-4">
        <h1 className="text-2xl font-black">בקשה: {request.shelter_type}</h1>
        <p className="text-gray-600">כמות: {request.quantity ?? '—'} · אזור: {request.location ?? '—'}</p>
        {request.description && <p className="text-gray-700 mt-2">{request.description}</p>}
      </div>

      <section>
        <h2 className="section-title mb-3">ההצעות שלי</h2>
        {myQuotes.map((q: any) => (
          <div key={q.id} className="card p-3 mb-2 text-sm">
            ₪{q.unit_price.toLocaleString()} × {q.units} — {q.status}
            {q.countered_by === 'buyer' && q.status === 'submitted' && <span className="text-amber-600"> (הצעה נגדית מהקונה — נדרש מענה)</span>}
          </div>
        ))}
        {!closed && <SellerQuoteForm requestId={params.id} />}
        {closed && <p className="text-gray-400">הבקשה נסגרה</p>}
      </section>

      <QuoteThread requestId={params.id} />
    </main>
  )
}
```

- [ ] **Step 3: Write `app/seller/b2b/[id]/SellerQuoteForm.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SellerQuoteForm({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [error, setError] = useState('')
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/b2b/quotes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_id: requestId,
        unit_price: Number(fd.get('unit_price')),
        units: Number(fd.get('units')),
        delivery_terms: fd.get('delivery_terms'),
        lead_time: fd.get('lead_time'),
        notes: fd.get('notes'),
      }),
    })
    if (!res.ok) { const j = await res.json(); setError(j.error || 'שגיאה'); return }
    ;(e.target as HTMLFormElement).reset()
    router.refresh()
  }
  return (
    <form onSubmit={onSubmit} className="card p-4 space-y-3">
      <p className="font-bold">הגשת הצעת מחיר</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input name="unit_price" type="number" required placeholder="מחיר ליחידה ₪" className="input w-full" />
      <input name="units" type="number" required defaultValue={1} placeholder="יחידות" className="input w-full" />
      <input name="delivery_terms" placeholder="תנאי אספקה" className="input w-full" />
      <input name="lead_time" placeholder="זמן אספקה" className="input w-full" />
      <textarea name="notes" placeholder="הערות" className="input w-full" rows={2} />
      <button type="submit" className="btn-primary w-full">שלח הצעה</button>
    </form>
  )
}
```

- [ ] **Step 4: Write `components/b2b/RequestQuoteButton.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function RequestQuoteButton({ listingId, shelterType, location }: {
  listingId: string; shelterType: string; location: string | null
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/b2b/requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: listingId,
        org_name: fd.get('org_name'),
        contact_name: fd.get('contact_name'),
        contact_phone: fd.get('contact_phone'),
        need_type: ['bulk'],
        shelter_type: shelterType,
        location,
        quantity: Number(fd.get('quantity')),
        target_date: fd.get('target_date') || null,
        description: fd.get('description'),
      }),
    })
    if (res.status === 401) { router.push(`/login?next=/listings/${listingId}`); return }
    if (!res.ok) { const j = await res.json(); setError(j.error || 'שגיאה'); return }
    router.push('/b2b/requests')
  }

  if (!open) {
    return <button onClick={() => setOpen(true)} className="btn-secondary w-full">בקשת הצעת מחיר / הזמנה בכמות</button>
  }
  return (
    <form onSubmit={onSubmit} className="card p-4 space-y-3 mt-3">
      <p className="font-bold">בקשת הצעה לכמות</p>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input name="org_name" required placeholder="שם הארגון" className="input w-full" />
      <input name="contact_name" required placeholder="איש קשר" className="input w-full" />
      <input name="contact_phone" placeholder="טלפון" className="input w-full" />
      <input name="quantity" type="number" min="1" required placeholder="כמות" className="input w-full" />
      <input name="target_date" type="date" className="input w-full" />
      <textarea name="description" placeholder="פירוט" className="input w-full" rows={2} />
      <button type="submit" className="btn-primary w-full">שליחה</button>
    </form>
  )
}
```

- [ ] **Step 5: Mount the CTA on the listing page**

In `app/listings/[id]/page.tsx`, import the component (`import { RequestQuoteButton } from '@/components/b2b/RequestQuoteButton'`) and render it near the existing buy/checkout CTA, passing `listingId={listing.id}`, `shelterType={listing.type}`, `location={listing.location}`. (Match prop names to the page's actual `listing` variable.)

- [ ] **Step 6: Add seller dashboard link**

In `app/seller/dashboard/page.tsx`, add a card/link to `/seller/b2b` labelled "בקשות הצעת מחיר", matching the existing dashboard card pattern.

- [ ] **Step 7: Add counter-offer to buyer actions**

Replace `app/b2b/requests/[id]/BuyerQuoteActions.tsx` with a version that adds a counter button + minimal inline form:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BuyerQuoteActions({ quoteId }: { quoteId: string }) {
  const router = useRouter()
  const [countering, setCountering] = useState(false)

  async function act(action: string, counter?: any) {
    const res = await fetch(`/api/b2b/quotes/${quoteId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, counter }),
    })
    if (res.ok) router.refresh()
  }

  if (countering) {
    return (
      <form onSubmit={e => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        act('counter', { unit_price: Number(fd.get('unit_price')), units: Number(fd.get('units')) })
      }} className="flex flex-col gap-2">
        <input name="unit_price" type="number" required placeholder="מחיר נגדי ₪" className="input" />
        <input name="units" type="number" required defaultValue={1} placeholder="יחידות" className="input" />
        <div className="flex gap-2">
          <button type="submit" className="btn-primary text-sm">שלח הצעה נגדית</button>
          <button type="button" onClick={() => setCountering(false)} className="btn-secondary text-sm">ביטול</button>
        </div>
      </form>
    )
  }
  return (
    <div className="flex gap-2">
      <button onClick={() => act('accept')} className="btn-primary text-sm">קבל</button>
      <button onClick={() => setCountering(true)} className="btn-secondary text-sm">הצעה נגדית</button>
      <button onClick={() => act('reject')} className="btn-secondary text-sm">דחה</button>
    </div>
  )
}
```

- [ ] **Step 8: Verify build**

Run: `npm run build`
Expected: success.

- [ ] **Step 9: Commit**

```bash
git add app/seller/b2b components/b2b/RequestQuoteButton.tsx app/listings app/seller/dashboard/page.tsx app/b2b/requests
git commit -m "feat(b2b): seller quote views, listing CTA, counter-offers"
```

---

## Task 21: Full test run + manual smoke

**Files:** none (verification)

- [ ] **Step 1: Run all unit tests**

Run: `npm test`
Expected: all suites pass (existing + new b2b validation/state/alias/anonymize).

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: success, no type errors.

- [ ] **Step 3: Manual smoke (dev server)**

Run `npm run dev` and verify end-to-end with the preview tools:
1. As a buyer, submit `/b2b/request` → appears in `/b2b/requests`.
2. As admin, `/admin/b2b` → open request → shortlist a verified seller.
3. As that seller, `/seller/b2b` → open request → submit a quote.
4. As admin, approve the quote.
5. As buyer, see the approved quote (alias only, no seller name) → counter → accept.
6. Post a message from each role; confirm buyer/seller see only aliases, admin sees raw.

- [ ] **Step 4: Commit (if any fixups)**

```bash
git add -A
git commit -m "test(b2b): verification fixups"
```

---

## Self-Review notes (for the implementer)

- **Spec coverage:** business profile (T7–8), entry points listing + sourcing (T17, T20), RFQ pipeline qualify/shortlist/quote/approve (T11–13, T19), counter/accept/reject (T13, T18, T20), anonymized thread (T14, T18), offline close + commission (T10, T19), landing + nav (T16), middleware (T15). All §-sections of the spec map to a task.
- **Anonymization** is enforced server-side in T10 (seller-scoped strip), T14 (messages), and the buyer detail query in T18 selects no seller PII (alias derived from invite order). Tests in T6 assert the serializers strip PII.
- **Money units:** integers in shekels, matching `listings.price`. Display uses `toLocaleString()`.
- **Counter chain:** buyer counter sets parent to `countered`, inserts a child `submitted` quote `countered_by='buyer'`; admin re-approves the child before the seller sees it (re-uses T13 approve path); seller responds via a new quote with `parent_quote_id` (T12).
- **Type consistency:** `RequestStatus`/`QuoteStatus`/`NeedType`/`ShelterType` from `lib/b2b/types.ts` used across validation, state, and routes.
