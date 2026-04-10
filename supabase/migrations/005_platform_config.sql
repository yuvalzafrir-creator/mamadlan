create table public.platform_config (
  id integer primary key default 1 check (id = 1),
  commission_rate numeric not null default 10,
  platform_shipping_price integer not null default 50000
);
insert into public.platform_config (commission_rate, platform_shipping_price) values (10, 50000);
alter table public.platform_config enable row level security;
create policy "Anyone can read config" on public.platform_config for select using (true);
