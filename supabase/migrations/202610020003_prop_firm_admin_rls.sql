-- Keep admin prop firm management working when RLS is enabled in production.
alter table public.prop_firms enable row level security;

grant select on public.prop_firms to anon, authenticated;
grant insert, update, delete on public.prop_firms to authenticated;

drop policy if exists "Anyone can read active prop firms" on public.prop_firms;
create policy "Anyone can read active prop firms"
on public.prop_firms
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert prop firms" on public.prop_firms;
create policy "Admins can insert prop firms"
on public.prop_firms
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update prop firms" on public.prop_firms;
create policy "Admins can update prop firms"
on public.prop_firms
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete prop firms" on public.prop_firms;
create policy "Admins can delete prop firms"
on public.prop_firms
for delete
to authenticated
using (public.is_admin());

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
to authenticated
with check (bucket_id = 'propfirm-logos' and public.is_admin());

drop policy if exists "Admins can update prop firm logos" on storage.objects;
create policy "Admins can update prop firm logos"
on storage.objects
for update
to authenticated
using (bucket_id = 'propfirm-logos' and public.is_admin())
with check (bucket_id = 'propfirm-logos' and public.is_admin());

drop policy if exists "Admins can delete prop firm logos" on storage.objects;
create policy "Admins can delete prop firm logos"
on storage.objects
for delete
to authenticated
using (bucket_id = 'propfirm-logos' and public.is_admin());
