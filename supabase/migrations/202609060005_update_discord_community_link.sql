update public.community_socials
set
  name = 'Discord',
  handle = 'ZacTrades Community',
  description = 'Join the private community for chat, questions, and trader support.',
  icon_key = 'message',
  url = 'https://discord.gg/sJ8jC3n2H3',
  tone_key = 'bull',
  is_active = true,
  display_order = 4,
  updated_at = now()
where slug = 'discord';

insert into public.community_socials (
  slug,
  name,
  handle,
  description,
  icon_key,
  url,
  tone_key,
  is_active,
  display_order
)
select
  'discord',
  'Discord',
  'ZacTrades Community',
  'Join the private community for chat, questions, and trader support.',
  'message',
  'https://discord.gg/sJ8jC3n2H3',
  'bull',
  true,
  4
where not exists (
  select 1 from public.community_socials where slug = 'discord'
);
