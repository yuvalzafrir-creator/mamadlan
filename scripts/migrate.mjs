import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')] })
)

const sql = neon(env.DATABASE_URL)

await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS length_m NUMERIC`
await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS width_m NUMERIC`
await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS height_m NUMERIC`
await sql`ALTER TABLE listings ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1`
await sql`ALTER TABLE listings ALTER COLUMN title DROP NOT NULL`

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_business BOOLEAN DEFAULT FALSE`
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS org_type TEXT`
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_name TEXT`

await sql`CREATE TABLE IF NOT EXISTS b2b_requests (
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
)`

await sql`CREATE TABLE IF NOT EXISTS b2b_request_sellers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES b2b_requests(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'invited',
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (request_id, seller_id)
)`

await sql`CREATE TABLE IF NOT EXISTS b2b_quotes (
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
)`

await sql`CREATE TABLE IF NOT EXISTS b2b_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES b2b_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id),
  sender_role TEXT NOT NULL,
  alias TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)`

console.log('Migration complete')
