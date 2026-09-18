-- Admin tool for pausing/extending active Live Trading access.

create table if not exists public.live_trading_access_adjustments (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.profiles (id) on delete set null,
  extra_days integer not null check (extra_days between 1 and 365),
  reason text,
  affected_user_ids uuid[] not null default '{}',
  affected_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.live_trading_access_adjustments enable row level security;

revoke all on public.live_trading_access_adjustments from anon, authenticated;
grant select on public.live_trading_access_adjustments to authenticated;

drop policy if exists "Staff can read live trading access adjustments" on public.live_trading_access_adjustments;
create policy "Staff can read live trading access adjustments"
on public.live_trading_access_adjustments
for select
using (public.is_staff());

create or replace function public.extend_active_live_trading_access(
  p_extra_days integer,
  p_reason text default null
)
returns setof public.user_live_trading_access
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_user_id uuid := auth.uid();
  v_reason text := nullif(trim(coalesce(p_reason, '')), '');
  v_user_ids uuid[];
  v_affected_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  if p_extra_days is null or p_extra_days < 1 or p_extra_days > 365 then
    raise exception 'Extra days must be between 1 and 365';
  end if;

  select coalesce(array_agg(user_id order by access_expires_at), '{}'::uuid[])
  into v_user_ids
  from public.user_live_trading_access
  where status = 'paid'
    and access_expires_at is not null
    and access_expires_at > now();

  v_affected_count := coalesce(array_length(v_user_ids, 1), 0);

  insert into public.live_trading_access_adjustments (
    admin_user_id,
    extra_days,
    reason,
    affected_user_ids,
    affected_count
  )
  values (
    v_admin_user_id,
    p_extra_days,
    v_reason,
    v_user_ids,
    v_affected_count
  );

  return query
  update public.user_live_trading_access
  set
    access_expires_at = access_expires_at + make_interval(days => p_extra_days),
    notes = concat_ws(
      E'\n',
      nullif(notes, ''),
      'Admin Live Trading extension: +' || p_extra_days || ' day' ||
        case when p_extra_days = 1 then '' else 's' end ||
        ' on ' || to_char(now(), 'YYYY-MM-DD') ||
        case when v_reason is null then '' else '. Reason: ' || v_reason end || '.'
    )
  where user_id = any(v_user_ids)
  returning *;
end;
$$;

revoke execute on function public.extend_active_live_trading_access(integer, text) from public, anon;
grant execute on function public.extend_active_live_trading_access(integer, text) to authenticated;
