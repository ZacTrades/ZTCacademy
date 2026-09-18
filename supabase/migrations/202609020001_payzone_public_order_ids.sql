create unique index if not exists user_memberships_payzone_public_order_unique
on public.user_memberships (payment_provider, provider_subscription_id)
where payment_provider = 'payzone' and provider_subscription_id is not null;

create unique index if not exists user_live_trading_access_payzone_public_order_unique
on public.user_live_trading_access (payment_provider, provider_subscription_id)
where payment_provider = 'payzone' and provider_subscription_id is not null;

create unique index if not exists user_news_subscriptions_payzone_public_order_unique
on public.user_news_subscriptions (payment_provider, provider_subscription_id)
where payment_provider = 'payzone' and provider_subscription_id is not null;
