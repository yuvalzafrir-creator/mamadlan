create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  role text not null check (role in ('buyer', 'seller', 'admin')) default 'buyer',
  name text,
  phone text,
  business_name text,
  business_id text,
  verified boolean not null default false,
  stripe_account_id text,
  onboarding_step integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
