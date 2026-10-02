alter table public.user_memberships
add column if not exists discord_role_synced_at timestamptz;

alter table public.user_live_trading_access
add column if not exists discord_role_synced_at timestamptz;

alter table public.user_news_subscriptions
add column if not exists discord_role_synced_at timestamptz;
