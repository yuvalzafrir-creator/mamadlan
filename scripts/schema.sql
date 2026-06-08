-- Users (replaces Supabase auth.users + profiles)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'buyer',
  name TEXT,
  phone TEXT,
  business_name TEXT,
  business_id TEXT,
  onboarding_step INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  stripe_account_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  description TEXT,
  price INTEGER NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  area INTEGER,
  floor INTEGER,
  length_m NUMERIC,
  width_m NUMERIC,
  height_m NUMERIC,
  quantity INTEGER DEFAULT 1,
  condition TEXT,
  shipping_option TEXT DEFAULT 'none',
  shipping_price INTEGER,
  images TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  commission_amount INTEGER DEFAULT 0,
  shipping_amount INTEGER DEFAULT 0,
  shipping_type TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending_payment',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform config
CREATE TABLE IF NOT EXISTS platform_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  commission_rate NUMERIC DEFAULT 0.05,
  platform_shipping_price INTEGER DEFAULT 0
);

INSERT INTO platform_config (id, commission_rate, platform_shipping_price)
VALUES (1, 0.05, 0)
ON CONFLICT (id) DO NOTHING;

-- Verification requests
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
