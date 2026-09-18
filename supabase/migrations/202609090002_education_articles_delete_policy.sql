drop policy if exists "Admins can delete education articles" on public.education_articles;
create policy "Admins can delete education articles"
on public.education_articles
for delete
using (public.is_admin());
