-- Allow premium indicator cards to display uploaded MP4 previews from Supabase Storage.
alter table public.premium_indicators
add column if not exists video_url text;
