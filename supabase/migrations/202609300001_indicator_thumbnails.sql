alter table public.premium_indicators
add column if not exists thumbnail_url text;

insert into storage.buckets (id, name, public)
values ('indicator-thumbnails', 'indicator-thumbnails', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Anyone can read indicator thumbnails" on storage.objects;
create policy "Anyone can read indicator thumbnails"
on storage.objects
for select
using (bucket_id = 'indicator-thumbnails');

drop policy if exists "Admins can upload indicator thumbnails" on storage.objects;
create policy "Admins can upload indicator thumbnails"
on storage.objects
for insert
with check (
  bucket_id = 'indicator-thumbnails'
  and public.is_admin()
  and lower(name) ~ '\.(png|jpg|jpeg|webp)$'
);

drop policy if exists "Admins can update indicator thumbnails" on storage.objects;
create policy "Admins can update indicator thumbnails"
on storage.objects
for update
using (bucket_id = 'indicator-thumbnails' and public.is_admin())
with check (
  bucket_id = 'indicator-thumbnails'
  and public.is_admin()
  and lower(name) ~ '\.(png|jpg|jpeg|webp)$'
);

drop policy if exists "Admins can delete indicator thumbnails" on storage.objects;
create policy "Admins can delete indicator thumbnails"
on storage.objects
for delete
using (bucket_id = 'indicator-thumbnails' and public.is_admin());
