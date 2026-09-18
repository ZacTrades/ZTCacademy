insert into storage.buckets (id, name, public)
values ('education-images', 'education-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read education images" on storage.objects;
create policy "Anyone can read education images"
on storage.objects
for select
using (bucket_id = 'education-images');

drop policy if exists "Admins can upload education images" on storage.objects;
create policy "Admins can upload education images"
on storage.objects
for insert
with check (bucket_id = 'education-images' and public.is_admin());

drop policy if exists "Admins can update education images" on storage.objects;
create policy "Admins can update education images"
on storage.objects
for update
using (bucket_id = 'education-images' and public.is_admin())
with check (bucket_id = 'education-images' and public.is_admin());

drop policy if exists "Admins can delete education images" on storage.objects;
create policy "Admins can delete education images"
on storage.objects
for delete
using (bucket_id = 'education-images' and public.is_admin());
