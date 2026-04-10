create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) not null,
  buyer_id uuid references public.profiles(id) not null,
  seller_id uuid references public.profiles(id) not null,
  amount integer not null,
  commission_amount integer not null,
  shipping_amount integer not null default 0,
  shipping_type text not null check (shipping_type in ('seller', 'platform', 'pickup')),
  status text not null check (status in ('pending_payment','paid','shipped','delivered','cancelled')) default 'pending_payment',
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
create policy "Buyers can read own orders" on public.orders
  for select using (auth.uid() = buyer_id);
create policy "Sellers can read orders for their listings" on public.orders
  for select using (auth.uid() = seller_id);
