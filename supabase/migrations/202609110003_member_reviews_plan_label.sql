alter table public.member_reviews
add column if not exists plan_label text;

create or replace function public.paid_access_label(p_user_id uuid default auth.uid())
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  labels text[] := array[]::text[];
begin
  if exists (
    select 1
    from public.user_memberships membership
    where membership.user_id = p_user_id
      and membership.plan_slug = 'one_to_one'
      and membership.status = 'paid'
      and (
        membership.access_expires_at is null
        or membership.access_expires_at > now()
      )
  ) then
    labels := array_append(labels, '1-to-1 Coaching');
  end if;

  if exists (
    select 1
    from public.user_memberships membership
    where membership.user_id = p_user_id
      and membership.plan_slug = 'group'
      and membership.status = 'paid'
      and (
        membership.access_expires_at is null
        or membership.access_expires_at > now()
      )
  ) then
    labels := array_append(labels, 'Training Group Coaching');
  end if;

  if exists (
    select 1
    from public.user_live_trading_access access
    where access.user_id = p_user_id
      and access.status = 'paid'
      and (
        access.access_expires_at is null
        or access.access_expires_at > now()
      )
  ) then
    labels := array_append(labels, 'Live Trading');
  end if;

  if exists (
    select 1
    from public.user_news_subscriptions subscription
    where subscription.user_id = p_user_id
      and subscription.status = 'paid'
      and (
        subscription.access_expires_at is null
        or subscription.access_expires_at > now()
      )
  ) then
    labels := array_append(labels, 'News Subscription');
  end if;

  if cardinality(labels) = 0 then
    return 'Paid member';
  end if;

  return array_to_string(labels, ' + ');
end;
$$;

grant execute on function public.paid_access_label(uuid) to authenticated;

create or replace function public.set_member_review_plan_label()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.plan_label := public.paid_access_label(new.user_id);
  return new;
end;
$$;

drop trigger if exists member_reviews_set_plan_label on public.member_reviews;
create trigger member_reviews_set_plan_label
before insert on public.member_reviews
for each row
execute function public.set_member_review_plan_label();

update public.member_reviews
set plan_label = public.paid_access_label(user_id)
where plan_label is null
   or trim(plan_label) = '';
