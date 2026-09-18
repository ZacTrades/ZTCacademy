create or replace function public.has_paid_access(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_memberships membership
    where membership.user_id = p_user_id
      and membership.status = 'paid'
      and (
        membership.access_expires_at is null
        or membership.access_expires_at > now()
      )
  )
  or exists (
    select 1
    from public.user_live_trading_access access
    where access.user_id = p_user_id
      and access.status = 'paid'
      and (
        access.access_expires_at is null
        or access.access_expires_at > now()
      )
  )
  or exists (
    select 1
    from public.user_news_subscriptions subscription
    where subscription.user_id = p_user_id
      and subscription.status = 'paid'
      and (
        subscription.access_expires_at is null
        or subscription.access_expires_at > now()
      )
  );
$$;

grant execute on function public.has_paid_access(uuid) to authenticated;

drop policy if exists "Members can submit their own pending reviews" on public.member_reviews;
drop policy if exists "Paid members can submit their own pending reviews" on public.member_reviews;
create policy "Paid members can submit their own pending reviews"
on public.member_reviews
for insert
with check (
  auth.uid() = user_id
  and public.has_paid_access(auth.uid())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Members can update their own pending reviews" on public.member_reviews;
drop policy if exists "Paid members can update their own pending reviews" on public.member_reviews;
create policy "Paid members can update their own pending reviews"
on public.member_reviews
for update
using (
  auth.uid() = user_id
  and status = 'pending'
  and public.has_paid_access(auth.uid())
)
with check (
  auth.uid() = user_id
  and public.has_paid_access(auth.uid())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);
