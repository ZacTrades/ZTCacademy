do $$
begin
  if to_regclass('public.blog_posts') is not null then
    drop policy if exists "Anyone can read published blog posts" on public.blog_posts;
    drop policy if exists "Admins can insert blog posts" on public.blog_posts;
    drop policy if exists "Admins can update blog posts" on public.blog_posts;
    drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
  end if;
end $$;

drop table if exists public.blog_posts;

drop policy if exists "Anyone can read blog PDFs" on storage.objects;
drop policy if exists "Admins can upload blog PDFs" on storage.objects;
drop policy if exists "Admins can update blog PDFs" on storage.objects;
drop policy if exists "Admins can delete blog PDFs" on storage.objects;

update storage.buckets
set public = false
where id = 'blog-pdfs';
