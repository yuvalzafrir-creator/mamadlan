create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('mamad', 'migounit', 'other')),
  length_m numeric not null,
  width_m numeric not null,
  height_m numeric not null,
  price integer not null,
  condition text check (condition in ('new', 'used', 'refurbished')),
  location text,
  quantity integer default 1,
  description text,
  photos text[] default '{}',
  shipping_option text not null check (shipping_option in ('seller_ships', 'platform_ships', 'pickup_only')),
  shipping_price integer,
  status text not null check (status in ('active', 'sold', 'paused')) default 'active',
  created_at timestamptz not null default now()
);
alter table public.listings enable row level security;
create policy "Anyone can read active listings" on public.listings
  for select using (status = 'active');
create policy "Sellers can manage own listings" on public.listings
  for all using (auth.uid() = seller_id);
