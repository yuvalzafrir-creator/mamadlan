create table public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles(id) on delete cascade not null,
  submitted_at timestamptz not null default now(),
  status text not null check (status in ('pending','approved','rejected')) default 'pending',
  reviewed_by uuid references public.profiles(id)
);
alter table public.verification_requests enable row level security;
create policy "Sellers can read own verification" on public.verification_requests
  for select using (auth.uid() = seller_id);
create policy "Sellers can insert own verification" on public.verification_requests
  for insert with check (auth.uid() = seller_id);
