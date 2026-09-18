-- Harden public storage buckets against renamed HTML/SVG uploads.

create or replace function public.storage_object_has_extension(
  p_name text,
  p_extensions text[]
)
returns boolean
language sql
immutable
set search_path = public, storage
as $$
  select lower(coalesce(p_name, '')) ~ ('\.(' || array_to_string(p_extensions, '|') || ')$');
$$;

create or replace function public.storage_object_has_mime(
  p_metadata jsonb,
  p_mime_types text[]
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select lower(coalesce(p_metadata ->> 'mimetype', '')) = any(p_mime_types);
$$;

create or replace function public.storage_object_size_between(
  p_metadata jsonb,
  p_min_bytes bigint,
  p_max_bytes bigint
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    coalesce(p_metadata ->> 'size', '') ~ '^\d+$'
    and (p_metadata ->> 'size')::bigint between p_min_bytes and p_max_bytes;
$$;

drop policy if exists "Admins can upload prop firm logos" on storage.objects;
create policy "Admins can upload prop firm logos"
on storage.objects
for insert
with check (
  bucket_id = 'propfirm-logos'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp'])
  and public.storage_object_has_mime(metadata, array['image/png', 'image/jpeg', 'image/webp'])
  and public.storage_object_size_between(metadata, 1, 2097152)
);

drop policy if exists "Admins can update prop firm logos" on storage.objects;
create policy "Admins can update prop firm logos"
on storage.objects
for update
using (bucket_id = 'propfirm-logos' and public.is_admin())
with check (
  bucket_id = 'propfirm-logos'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp'])
  and public.storage_object_has_mime(metadata, array['image/png', 'image/jpeg', 'image/webp'])
  and public.storage_object_size_between(metadata, 1, 2097152)
);

drop policy if exists "Admins can upload trading tool logos" on storage.objects;
create policy "Admins can upload trading tool logos"
on storage.objects
for insert
with check (
  bucket_id = 'trading-tool-logos'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp'])
  and public.storage_object_has_mime(metadata, array['image/png', 'image/jpeg', 'image/webp'])
  and public.storage_object_size_between(metadata, 1, 2097152)
);

drop policy if exists "Admins can update trading tool logos" on storage.objects;
create policy "Admins can update trading tool logos"
on storage.objects
for update
using (bucket_id = 'trading-tool-logos' and public.is_admin())
with check (
  bucket_id = 'trading-tool-logos'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp'])
  and public.storage_object_has_mime(metadata, array['image/png', 'image/jpeg', 'image/webp'])
  and public.storage_object_size_between(metadata, 1, 2097152)
);

drop policy if exists "Admins can upload education images" on storage.objects;
create policy "Admins can upload education images"
on storage.objects
for insert
with check (
  bucket_id = 'education-images'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp', 'gif'])
  and public.storage_object_has_mime(
    metadata,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  )
  and public.storage_object_size_between(metadata, 1, 4194304)
);

drop policy if exists "Admins can update education images" on storage.objects;
create policy "Admins can update education images"
on storage.objects
for update
using (bucket_id = 'education-images' and public.is_admin())
with check (
  bucket_id = 'education-images'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp', 'gif'])
  and public.storage_object_has_mime(
    metadata,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  )
  and public.storage_object_size_between(metadata, 1, 4194304)
);

drop policy if exists "Paid members can upload own review images" on storage.objects;
create policy "Paid members can upload own review images"
on storage.objects
for insert
with check (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and public.has_paid_access(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp', 'gif'])
  and public.storage_object_has_mime(
    metadata,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  )
  and public.storage_object_size_between(metadata, 1, 4194304)
);

drop policy if exists "Members can update own review images" on storage.objects;
create policy "Members can update own review images"
on storage.objects
for update
using (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp', 'gif'])
  and public.storage_object_has_mime(
    metadata,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  )
  and public.storage_object_size_between(metadata, 1, 4194304)
);
