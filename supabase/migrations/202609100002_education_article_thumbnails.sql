alter table public.education_articles
add column if not exists cover_image_url text;

update public.education_articles
set cover_image_url = split_part(split_part(split_part(content, '[image:', 2), '|', 1), ']', 1)
where cover_image_url is null
  and content like '%[image:%';
