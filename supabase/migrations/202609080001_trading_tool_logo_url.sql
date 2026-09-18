alter table public.trading_tools
add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('trading-tool-logos', 'trading-tool-logos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read trading tool logos" on storage.objects;
create policy "Anyone can read trading tool logos"
on storage.objects
for select
using (bucket_id = 'trading-tool-logos');

drop policy if exists "Admins can upload trading tool logos" on storage.objects;
create policy "Admins can upload trading tool logos"
on storage.objects
for insert
with check (bucket_id = 'trading-tool-logos' and public.is_admin());

drop policy if exists "Admins can update trading tool logos" on storage.objects;
create policy "Admins can update trading tool logos"
on storage.objects
for update
using (bucket_id = 'trading-tool-logos' and public.is_admin())
with check (bucket_id = 'trading-tool-logos' and public.is_admin());

drop policy if exists "Admins can delete trading tool logos" on storage.objects;
create policy "Admins can delete trading tool logos"
on storage.objects
for delete
using (bucket_id = 'trading-tool-logos' and public.is_admin());
