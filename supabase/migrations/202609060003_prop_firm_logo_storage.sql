insert into storage.buckets (id, name, public)
values ('propfirm-logos', 'propfirm-logos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read prop firm logos" on storage.objects;
create policy "Anyone can read prop firm logos"
on storage.objects
for select
using (bucket_id = 'propfirm-logos');

drop policy if exists "Admins can upload prop firm logos" on storage.objects;
create policy "Admins can upload prop firm logos"
on storage.objects
for insert
with check (bucket_id = 'propfirm-logos' and public.is_admin());

drop policy if exists "Admins can update prop firm logos" on storage.objects;
create policy "Admins can update prop firm logos"
on storage.objects
for update
using (bucket_id = 'propfirm-logos' and public.is_admin())
with check (bucket_id = 'propfirm-logos' and public.is_admin());

drop policy if exists "Admins can delete prop firm logos" on storage.objects;
create policy "Admins can delete prop firm logos"
on storage.objects
for delete
using (bucket_id = 'propfirm-logos' and public.is_admin());
