alter table public.member_reviews
add column if not exists image_urls text[] not null default '{}'::text[];

alter table public.member_reviews
drop constraint if exists member_reviews_image_urls_max_two_check;

alter table public.member_reviews
add constraint member_reviews_image_urls_max_two_check
check (coalesce(array_length(image_urls, 1), 0) <= 2);

insert into storage.buckets (id, name, public)
values ('member-review-images', 'member-review-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read member review images" on storage.objects;
create policy "Anyone can read member review images"
on storage.objects
for select
using (bucket_id = 'member-review-images');

drop policy if exists "Paid members can upload own review images" on storage.objects;
create policy "Paid members can upload own review images"
on storage.objects
for insert
with check (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and public.has_paid_access(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
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
);

drop policy if exists "Members can delete own review images" on storage.objects;
create policy "Members can delete own review images"
on storage.objects
for delete
using (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);
