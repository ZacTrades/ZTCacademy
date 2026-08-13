-- Allow admins to delete homepage community/social cards.

drop policy if exists "Admins can delete community socials" on public.community_socials;
create policy "Admins can delete community socials"
on public.community_socials
for delete
using (public.is_admin());
