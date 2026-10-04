-- Discord roles are an access-delivery mechanism, not the source of truth for payment.
-- Restore rows that the former role audit expired before their purchased end date.

with false_live_expirations as (
  select
    access.user_id,
    coalesce(
      (
        select max(invoice.access_expires_at)
        from public.invoices as invoice
        where invoice.user_id = access.user_id
          and invoice.source_kind = 'live'
          and invoice.access_expires_at is not null
      ),
      coalesce(access.access_starts_at, access.paid_at, access.created_at, now())
        + case access.package_slug
            when 'three_months' then interval '3 months'
            when 'six_months' then interval '6 months'
            when 'twelve_months' then interval '12 months'
            else interval '1 month'
          end
    ) as correct_expires_at
  from public.user_live_trading_access as access
  where access.status = 'expired'
    and access.notes = 'Access expired because the matching Discord role was removed manually (live).'
),
restored_live as (
  update public.user_live_trading_access as access
  set
    status = case
      when false_expiration.correct_expires_at > now() then 'paid'
      else 'expired'
    end,
    access_expires_at = false_expiration.correct_expires_at,
    notes = case
      when false_expiration.correct_expires_at > now()
        then 'Paid access restored after Discord role audit false positive.'
      else 'Access expired automatically.'
    end
  from false_live_expirations as false_expiration
  where access.user_id = false_expiration.user_id
  returning access.user_id
)
select count(*) from restored_live;

with false_membership_expirations as (
  select
    membership.user_id,
    membership.plan_slug,
    coalesce(
      (
        select max(invoice.access_expires_at)
        from public.invoices as invoice
        where invoice.user_id = membership.user_id
          and invoice.source_kind = 'mentorship'
          and invoice.source_key = membership.plan_slug
          and invoice.access_expires_at is not null
      ),
      coalesce(membership.access_starts_at, membership.paid_at, membership.created_at, now())
        + case membership.plan_slug
            when 'one_to_one' then interval '1 year'
            else interval '4 months'
          end
    ) as correct_expires_at
  from public.user_memberships as membership
  where membership.status = 'expired'
    and membership.notes in (
      'Access expired because the matching Discord role was removed manually (one_to_one).',
      'Access expired because the matching Discord role was removed manually (group).'
    )
),
restored_memberships as (
  update public.user_memberships as membership
  set
    status = case
      when false_expiration.correct_expires_at > now() then 'paid'
      else 'expired'
    end,
    access_expires_at = false_expiration.correct_expires_at,
    notes = case
      when false_expiration.correct_expires_at > now()
        then 'Paid access restored after Discord role audit false positive.'
      else 'Access expired automatically.'
    end
  from false_membership_expirations as false_expiration
  where membership.user_id = false_expiration.user_id
    and membership.plan_slug = false_expiration.plan_slug
  returning membership.user_id
)
select count(*) from restored_memberships;

with false_news_expirations as (
  select
    subscription.user_id,
    coalesce(
      (
        select max(invoice.access_expires_at)
        from public.invoices as invoice
        where invoice.user_id = subscription.user_id
          and invoice.source_kind = 'news'
          and invoice.access_expires_at is not null
      ),
      coalesce(
        subscription.access_starts_at,
        subscription.paid_at,
        subscription.created_at,
        now()
      ) + interval '30 days'
    ) as correct_expires_at
  from public.user_news_subscriptions as subscription
  where subscription.status = 'expired'
    and subscription.notes =
      'Access expired because the matching Discord role was removed manually (news).'
),
restored_news as (
  update public.user_news_subscriptions as subscription
  set
    status = case
      when false_expiration.correct_expires_at > now() then 'paid'
      else 'expired'
    end,
    access_expires_at = false_expiration.correct_expires_at,
    notes = case
      when false_expiration.correct_expires_at > now()
        then 'Paid access restored after Discord role audit false positive.'
      else 'Access expired automatically.'
    end
  from false_news_expirations as false_expiration
  where subscription.user_id = false_expiration.user_id
  returning subscription.user_id
)
select count(*) from restored_news;
