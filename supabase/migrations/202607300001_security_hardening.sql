-- Security hardening for payment integrity and webhook idempotency.

create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text,
  payment_status text,
  provider_payment_id text,
  provider_invoice_id text,
  provider_order_id text,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

alter table public.payment_webhook_events enable row level security;

revoke all on public.payment_webhook_events from anon, authenticated;

drop policy if exists "Staff can read payment webhook events" on public.payment_webhook_events;
create policy "Staff can read payment webhook events"
on public.payment_webhook_events
for select
using (public.is_staff());

create unique index if not exists user_memberships_provider_checkout_unique
on public.user_memberships (payment_provider, provider_checkout_id)
where provider_checkout_id is not null;

create unique index if not exists user_live_trading_access_provider_checkout_unique
on public.user_live_trading_access (payment_provider, provider_checkout_id)
where provider_checkout_id is not null;

create unique index if not exists user_news_subscriptions_provider_checkout_unique
on public.user_news_subscriptions (payment_provider, provider_checkout_id)
where provider_checkout_id is not null;

revoke execute on function public.confirm_local_mentorship_payment(text, text, text) from public, anon, authenticated;
revoke execute on function public.confirm_local_live_trading_payment(text, text, text, text) from public, anon, authenticated;
revoke execute on function public.confirm_local_news_subscription(text, text) from public, anon, authenticated;
