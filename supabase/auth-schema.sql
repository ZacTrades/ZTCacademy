create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  phone_number text,
  discord_username text,
  discord_user_id text,
  discord_avatar_url text,
  discord_connected_at timestamptz,
  discord_guild_joined_at timestamptz,
  discord_last_role_sync_at timestamptz,
  discord_role_sync_status text,
  discord_role_sync_error text,
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists discord_username text;
alter table public.profiles add column if not exists discord_user_id text;
alter table public.profiles add column if not exists discord_avatar_url text;
alter table public.profiles add column if not exists discord_connected_at timestamptz;
alter table public.profiles add column if not exists discord_guild_joined_at timestamptz;
alter table public.profiles add column if not exists discord_last_role_sync_at timestamptz;
alter table public.profiles add column if not exists discord_role_sync_status text;
alter table public.profiles add column if not exists discord_role_sync_error text;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
add constraint profiles_role_check check (role in ('member', 'moderator', 'admin'));

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id and role = 'member');

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'moderator')
  );
$$;

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Staff can read all profiles" on public.profiles;
create policy "Staff can read all profiles"
on public.profiles
for select
using (public.is_staff());

drop policy if exists "Admins can update profiles" on public.profiles;
create policy "Admins can update profiles"
on public.profiles
for update
using (public.is_admin())
with check (public.is_admin());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create table if not exists public.discord_connections (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  discord_user_id text not null unique,
  discord_username text not null,
  discord_global_name text,
  discord_avatar_url text,
  access_token text not null,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.discord_connections enable row level security;

drop policy if exists "Admins can read discord connections" on public.discord_connections;
drop policy if exists "Staff can read discord connections" on public.discord_connections;
create policy "Staff can read discord connections"
on public.discord_connections
for select
using (public.is_staff());

drop policy if exists "Admins can update discord connections" on public.discord_connections;
create policy "Admins can update discord connections"
on public.discord_connections
for update
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists discord_connections_set_updated_at on public.discord_connections;
create trigger discord_connections_set_updated_at
before update on public.discord_connections
for each row
execute function public.set_updated_at();

create table if not exists public.discord_oauth_states (
  state text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  redirect_uri text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.discord_oauth_states enable row level security;

create table if not exists public.user_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan_slug text not null check (plan_slug in ('one_to_one', 'group')),
  status text not null default 'unpaid' check (status in ('unpaid', 'pending', 'paid', 'expired', 'cancelled')),
  payment_provider text,
  provider_customer_id text,
  provider_checkout_id text,
  provider_subscription_id text,
  amount_label text,
  paid_at timestamptz,
  access_starts_at timestamptz,
  access_expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_slug)
);

alter table public.user_memberships add column if not exists status text not null default 'unpaid';
alter table public.user_memberships add column if not exists payment_provider text;
alter table public.user_memberships add column if not exists provider_customer_id text;
alter table public.user_memberships add column if not exists provider_checkout_id text;
alter table public.user_memberships add column if not exists provider_subscription_id text;
alter table public.user_memberships add column if not exists amount_label text;
alter table public.user_memberships add column if not exists paid_at timestamptz;
alter table public.user_memberships add column if not exists access_starts_at timestamptz;
alter table public.user_memberships add column if not exists access_expires_at timestamptz;
alter table public.user_memberships add column if not exists discord_role_synced_at timestamptz;
alter table public.user_memberships add column if not exists notes text;

with ranked_memberships as (
  select
    id,
    row_number() over (
      partition by user_id, plan_slug
      order by
        case status
          when 'paid' then 1
          when 'pending' then 2
          when 'unpaid' then 3
          when 'expired' then 4
          when 'cancelled' then 5
          else 6
        end,
        updated_at desc nulls last,
        created_at desc nulls last
    ) as keep_rank
  from public.user_memberships
)
delete from public.user_memberships memberships
using ranked_memberships ranked
where memberships.id = ranked.id
  and ranked.keep_rank > 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_memberships_user_id_plan_slug_key'
      and conrelid = 'public.user_memberships'::regclass
  ) then
    alter table public.user_memberships
    add constraint user_memberships_user_id_plan_slug_key unique (user_id, plan_slug);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_memberships_plan_slug_check'
  ) then
    alter table public.user_memberships
    add constraint user_memberships_plan_slug_check check (plan_slug in ('one_to_one', 'group'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_memberships_status_check'
  ) then
    alter table public.user_memberships
    add constraint user_memberships_status_check check (status in ('unpaid', 'pending', 'paid', 'expired', 'cancelled'));
  end if;
end;
$$;

alter table public.user_memberships enable row level security;

drop policy if exists "Users can read their own memberships" on public.user_memberships;
create policy "Users can read their own memberships"
on public.user_memberships
for select
using (auth.uid() = user_id);

drop policy if exists "Admins can read all memberships" on public.user_memberships;
drop policy if exists "Staff can read all memberships" on public.user_memberships;
create policy "Staff can read all memberships"
on public.user_memberships
for select
using (public.is_staff());

drop policy if exists "Admins can insert memberships" on public.user_memberships;
create policy "Admins can insert memberships"
on public.user_memberships
for insert
with check (public.is_admin());

drop policy if exists "Admins can update memberships" on public.user_memberships;
create policy "Admins can update memberships"
on public.user_memberships
for update
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists user_memberships_set_updated_at on public.user_memberships;
create trigger user_memberships_set_updated_at
before update on public.user_memberships
for each row
execute function public.set_updated_at();

insert into public.user_memberships (user_id, plan_slug, status)
select profiles.id, plan.slug, 'unpaid'
from public.profiles
cross join (values ('one_to_one'), ('group')) as plan(slug)
on conflict (user_id, plan_slug) do nothing;

create or replace function public.confirm_local_mentorship_payment(
  p_plan_slug text,
  p_amount_label text,
  p_card_last4 text
)
returns public.user_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_checkout_id text := 'local_' || gen_random_uuid()::text;
  v_membership public.user_memberships;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_plan_slug not in ('one_to_one', 'group') then
    raise exception 'Invalid mentorship plan';
  end if;

  insert into public.user_memberships (
    user_id,
    plan_slug,
    status,
    payment_provider,
    provider_checkout_id,
    amount_label,
    paid_at,
    access_starts_at,
    access_expires_at,
    notes
  )
  values (
    v_user_id,
    p_plan_slug,
    'paid',
    'local_checkout',
    v_checkout_id,
    p_amount_label,
    now(),
    now(),
    case
      when p_plan_slug = 'one_to_one' then now() + interval '1 year'
      when p_plan_slug = 'group' then now() + interval '28 days'
      else now() + interval '28 days'
    end,
    'Temporary local checkout confirmation. Payment reference: ' || p_card_last4 || '. Replace with payment gateway webhook before production.'
  )
  on conflict (user_id, plan_slug) do update
  set
    status = excluded.status,
    payment_provider = excluded.payment_provider,
    provider_checkout_id = excluded.provider_checkout_id,
    amount_label = excluded.amount_label,
    paid_at = excluded.paid_at,
    access_starts_at = excluded.access_starts_at,
    access_expires_at = excluded.access_expires_at,
    notes = excluded.notes
  returning * into v_membership;

  return v_membership;
end;
$$;

grant execute on function public.confirm_local_mentorship_payment(text, text, text) to authenticated;

create table if not exists public.user_live_trading_access (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  package_slug text check (
    package_slug is null
    or package_slug in ('one_month', 'three_months', 'six_months', 'twelve_months')
  ),
  duration_label text,
  status text not null default 'unpaid' check (status in ('unpaid', 'pending', 'paid', 'expired', 'cancelled')),
  payment_provider text,
  provider_customer_id text,
  provider_checkout_id text,
  provider_subscription_id text,
  amount_label text,
  paid_at timestamptz,
  access_starts_at timestamptz,
  access_expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_live_trading_access add column if not exists package_slug text;
alter table public.user_live_trading_access add column if not exists duration_label text;
alter table public.user_live_trading_access add column if not exists status text not null default 'unpaid';
alter table public.user_live_trading_access add column if not exists payment_provider text;
alter table public.user_live_trading_access add column if not exists provider_customer_id text;
alter table public.user_live_trading_access add column if not exists provider_checkout_id text;
alter table public.user_live_trading_access add column if not exists provider_subscription_id text;
alter table public.user_live_trading_access add column if not exists amount_label text;
alter table public.user_live_trading_access add column if not exists paid_at timestamptz;
alter table public.user_live_trading_access add column if not exists access_starts_at timestamptz;
alter table public.user_live_trading_access add column if not exists access_expires_at timestamptz;
alter table public.user_live_trading_access add column if not exists discord_role_synced_at timestamptz;
alter table public.user_live_trading_access add column if not exists notes text;

alter table public.user_live_trading_access drop constraint if exists user_live_trading_access_package_slug_check;
alter table public.user_live_trading_access
add constraint user_live_trading_access_package_slug_check check (
  package_slug is null
  or package_slug in ('one_month', 'three_months', 'six_months', 'twelve_months')
);

alter table public.user_live_trading_access drop constraint if exists user_live_trading_access_status_check;
alter table public.user_live_trading_access
add constraint user_live_trading_access_status_check check (status in ('unpaid', 'pending', 'paid', 'expired', 'cancelled'));

alter table public.user_live_trading_access enable row level security;

drop policy if exists "Users can read their own live trading access" on public.user_live_trading_access;
create policy "Users can read their own live trading access"
on public.user_live_trading_access
for select
using (auth.uid() = user_id);

drop policy if exists "Staff can read all live trading access" on public.user_live_trading_access;
create policy "Staff can read all live trading access"
on public.user_live_trading_access
for select
using (public.is_staff());

drop policy if exists "Admins can insert live trading access" on public.user_live_trading_access;
create policy "Admins can insert live trading access"
on public.user_live_trading_access
for insert
with check (public.is_admin());

drop policy if exists "Admins can update live trading access" on public.user_live_trading_access;
create policy "Admins can update live trading access"
on public.user_live_trading_access
for update
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists user_live_trading_access_set_updated_at on public.user_live_trading_access;
create trigger user_live_trading_access_set_updated_at
before update on public.user_live_trading_access
for each row
execute function public.set_updated_at();

insert into public.user_live_trading_access (user_id, status)
select profiles.id, 'unpaid'
from public.profiles
on conflict (user_id) do nothing;

create or replace function public.confirm_local_live_trading_payment(
  p_package_slug text,
  p_duration_label text,
  p_amount_label text,
  p_card_last4 text
)
returns public.user_live_trading_access
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_checkout_id text := 'local_live_' || gen_random_uuid()::text;
  v_access public.user_live_trading_access;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_package_slug not in ('one_month', 'three_months', 'six_months', 'twelve_months') then
    raise exception 'Invalid live trading package';
  end if;

  insert into public.user_live_trading_access (
    user_id,
    package_slug,
    duration_label,
    status,
    payment_provider,
    provider_checkout_id,
    amount_label,
    paid_at,
    access_starts_at,
    access_expires_at,
    notes
  )
  values (
    v_user_id,
    p_package_slug,
    p_duration_label,
    'paid',
    'local_checkout',
    v_checkout_id,
    p_amount_label,
    now(),
    now(),
    case
      when p_package_slug = 'one_month' then now() + interval '1 month'
      when p_package_slug = 'three_months' then now() + interval '3 months'
      when p_package_slug = 'six_months' then now() + interval '6 months'
      when p_package_slug = 'twelve_months' then now() + interval '12 months'
      else now() + interval '1 month'
    end,
    'Temporary local live trading confirmation. Payment reference: ' || p_card_last4 || '. Replace with payment gateway webhook before production.'
  )
  on conflict (user_id) do update
  set
    package_slug = excluded.package_slug,
    duration_label = excluded.duration_label,
    status = excluded.status,
    payment_provider = excluded.payment_provider,
    provider_checkout_id = excluded.provider_checkout_id,
    amount_label = excluded.amount_label,
    paid_at = excluded.paid_at,
    access_starts_at = excluded.access_starts_at,
    access_expires_at = excluded.access_expires_at,
    notes = excluded.notes
  returning * into v_access;

  return v_access;
end;
$$;

grant execute on function public.confirm_local_live_trading_payment(text, text, text, text) to authenticated;

create table if not exists public.user_news_subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  status text not null default 'unpaid' check (status in ('unpaid', 'pending', 'paid', 'expired', 'cancelled')),
  payment_provider text,
  provider_customer_id text,
  provider_checkout_id text,
  provider_subscription_id text,
  amount_label text,
  paid_at timestamptz,
  access_starts_at timestamptz,
  access_expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_news_subscriptions add column if not exists status text not null default 'unpaid';
alter table public.user_news_subscriptions add column if not exists payment_provider text;
alter table public.user_news_subscriptions add column if not exists provider_customer_id text;
alter table public.user_news_subscriptions add column if not exists provider_checkout_id text;
alter table public.user_news_subscriptions add column if not exists provider_subscription_id text;
alter table public.user_news_subscriptions add column if not exists amount_label text;
alter table public.user_news_subscriptions add column if not exists paid_at timestamptz;
alter table public.user_news_subscriptions add column if not exists access_starts_at timestamptz;
alter table public.user_news_subscriptions add column if not exists access_expires_at timestamptz;
alter table public.user_news_subscriptions add column if not exists discord_role_synced_at timestamptz;
alter table public.user_news_subscriptions add column if not exists notes text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_news_subscriptions_status_check'
  ) then
    alter table public.user_news_subscriptions
    add constraint user_news_subscriptions_status_check check (status in ('unpaid', 'pending', 'paid', 'expired', 'cancelled'));
  end if;
end;
$$;

alter table public.user_news_subscriptions enable row level security;

drop policy if exists "Users can read their own news subscription" on public.user_news_subscriptions;
create policy "Users can read their own news subscription"
on public.user_news_subscriptions
for select
using (auth.uid() = user_id);

drop policy if exists "Admins can read all news subscriptions" on public.user_news_subscriptions;
drop policy if exists "Staff can read all news subscriptions" on public.user_news_subscriptions;
create policy "Staff can read all news subscriptions"
on public.user_news_subscriptions
for select
using (public.is_staff());

drop policy if exists "Admins can insert news subscriptions" on public.user_news_subscriptions;
create policy "Admins can insert news subscriptions"
on public.user_news_subscriptions
for insert
with check (public.is_admin());

drop policy if exists "Admins can update news subscriptions" on public.user_news_subscriptions;
create policy "Admins can update news subscriptions"
on public.user_news_subscriptions
for update
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists user_news_subscriptions_set_updated_at on public.user_news_subscriptions;
create trigger user_news_subscriptions_set_updated_at
before update on public.user_news_subscriptions
for each row
execute function public.set_updated_at();

insert into public.user_news_subscriptions (user_id, status)
select profiles.id, 'unpaid'
from public.profiles
on conflict (user_id) do nothing;

create or replace function public.confirm_local_news_subscription(
  p_amount_label text,
  p_card_last4 text
)
returns public.user_news_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_checkout_id text := 'local_news_' || gen_random_uuid()::text;
  v_subscription public.user_news_subscriptions;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  insert into public.user_news_subscriptions (
    user_id,
    status,
    payment_provider,
    provider_checkout_id,
    amount_label,
    paid_at,
    access_starts_at,
    access_expires_at,
    notes
  )
  values (
    v_user_id,
    'paid',
    'local_checkout',
    v_checkout_id,
    p_amount_label,
    now(),
    now(),
    now() + interval '30 days',
    'Temporary local news subscription confirmation. Payment reference: ' || p_card_last4 || '. Replace with payment gateway webhook before production.'
  )
  on conflict (user_id) do update
  set
    status = excluded.status,
    payment_provider = excluded.payment_provider,
    provider_checkout_id = excluded.provider_checkout_id,
    amount_label = excluded.amount_label,
    paid_at = excluded.paid_at,
    access_starts_at = excluded.access_starts_at,
    access_expires_at = excluded.access_expires_at,
    notes = excluded.notes
  returning * into v_subscription;

  return v_subscription;
end;
$$;

grant execute on function public.confirm_local_news_subscription(text, text) to authenticated;

create table if not exists public.coaching_plans (
  slug text primary key check (slug in ('one_to_one', 'group')),
  title text not null,
  description text not null,
  display_price text not null,
  promotion_enabled boolean not null default false,
  promotion_label text,
  promotion_original_price text,
  promotion_note text,
  promotion_ends_at text,
  duration text not null,
  checkout_price text not null,
  checkout_monthly_label text not null,
  features text[] not null default '{}',
  cta_label text not null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coaching_plans add column if not exists promotion_enabled boolean not null default false;
alter table public.coaching_plans add column if not exists promotion_label text;
alter table public.coaching_plans add column if not exists promotion_original_price text;
alter table public.coaching_plans add column if not exists promotion_note text;
alter table public.coaching_plans add column if not exists promotion_ends_at text;

alter table public.coaching_plans enable row level security;

drop policy if exists "Anyone can read active coaching plans" on public.coaching_plans;
create policy "Anyone can read active coaching plans"
on public.coaching_plans
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert coaching plans" on public.coaching_plans;
create policy "Admins can insert coaching plans"
on public.coaching_plans
for insert
with check (public.is_admin());

drop policy if exists "Admins can update coaching plans" on public.coaching_plans;
create policy "Admins can update coaching plans"
on public.coaching_plans
for update
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists coaching_plans_set_updated_at on public.coaching_plans;
create trigger coaching_plans_set_updated_at
before update on public.coaching_plans
for each row
execute function public.set_updated_at();

insert into public.coaching_plans (
  slug,
  title,
  description,
  display_price,
  duration,
  checkout_price,
  checkout_monthly_label,
  features,
  cta_label,
  is_featured,
  display_order
)
values
  (
    'one_to_one',
    '1-to-1 Coaching',
    'The elite private coaching experience, tailored to you with live sessions, a personal trading framework, mindset work, and prop-firm accountability.',
    '$980.99',
    'Private 1-to-1 coaching journey',
    '$980.99',
    '$980.99',
    array[
      'Private live sessions with Zac',
      'Personal trading framework built for you',
      'Mindset and performance coaching',
      'Prop-firm and account mastery',
      'No deadlines, just focused results',
      'Clarity, control, and confidence'
    ],
    'Start Your 1-to-1 Journey',
    true,
    1
  ),
  (
    'group',
    'Formation Group Mentoring',
    'A 4-month structured A-to-Z path from beginner to independent trader with live sessions, strategy, risk management, and validation roadmap.',
    '$429.99',
    '4-month structured journey',
    '$429.99',
    '$429.99',
    array[
      '2 live sessions per week with Zac',
      'Proven strategy: understand, execute, repeat',
      'Trading basics: read the market like a pro',
      'Daily and weekly market analysis',
      'Risk and money management',
      'Challenge validation roadmap'
    ],
    'Join the Formation',
    false,
    2
  )
on conflict (slug) do update
set
  title = excluded.title,
  description = excluded.description,
  display_price = excluded.display_price,
  duration = excluded.duration,
  checkout_price = excluded.checkout_price,
  checkout_monthly_label = excluded.checkout_monthly_label,
  features = excluded.features,
  cta_label = excluded.cta_label,
  is_featured = excluded.is_featured,
  display_order = excluded.display_order;

create table if not exists public.live_trading_packages (
  slug text primary key,
  duration text not null,
  price text not null,
  monthly_label text not null,
  original_price text,
  badge text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.live_trading_packages add column if not exists original_price text;

alter table public.live_trading_packages enable row level security;

drop policy if exists "Anyone can read active live trading packages" on public.live_trading_packages;
create policy "Anyone can read active live trading packages"
on public.live_trading_packages
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert live trading packages" on public.live_trading_packages;
create policy "Admins can insert live trading packages"
on public.live_trading_packages
for insert
with check (public.is_admin());

drop policy if exists "Admins can update live trading packages" on public.live_trading_packages;
create policy "Admins can update live trading packages"
on public.live_trading_packages
for update
using (public.is_admin())
with check (public.is_admin());

drop trigger if exists live_trading_packages_set_updated_at on public.live_trading_packages;
create trigger live_trading_packages_set_updated_at
before update on public.live_trading_packages
for each row
execute function public.set_updated_at();

insert into public.live_trading_packages (
  slug,
  duration,
  price,
  monthly_label,
  original_price,
  badge,
  display_order
)
values
  ('one_month', '1 month', '$39.99', '$39.99/mo', null, null, 1),
  ('three_months', '3 months', '$100', '$33.33/mo', '$120', 'Discount', 2),
  ('six_months', '6 months', '$180', '$30/mo', '$240', 'Discount', 3),
  ('twelve_months', '12 months', '$348', '$29/mo', '$480', 'Best value', 4)
on conflict (slug) do update
set
  duration = excluded.duration,
  price = excluded.price,
  monthly_label = excluded.monthly_label,
  original_price = excluded.original_price,
  badge = excluded.badge,
  display_order = excluded.display_order,
  is_active = true;

create table if not exists public.premium_indicators (
  slug text primary key,
  name text not null,
  description text not null,
  tag text not null,
  stats_label text not null,
  tradingview_url text not null,
  thumbnail_url text,
  video_url text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.premium_indicators enable row level security;

drop policy if exists "Anyone can read active premium indicators" on public.premium_indicators;
create policy "Anyone can read active premium indicators"
on public.premium_indicators
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert premium indicators" on public.premium_indicators;
create policy "Admins can insert premium indicators"
on public.premium_indicators
for insert
with check (public.is_admin());

drop policy if exists "Admins can update premium indicators" on public.premium_indicators;
create policy "Admins can update premium indicators"
on public.premium_indicators
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete premium indicators" on public.premium_indicators;
create policy "Admins can delete premium indicators"
on public.premium_indicators
for delete
using (public.is_admin());

drop trigger if exists premium_indicators_set_updated_at on public.premium_indicators;
create trigger premium_indicators_set_updated_at
before update on public.premium_indicators
for each row
execute function public.set_updated_at();

alter table public.premium_indicators
add column if not exists thumbnail_url text;

insert into public.premium_indicators (
  slug,
  name,
  description,
  tag,
  stats_label,
  tradingview_url,
  display_order
)
values
  (
    'zac_trend_pro',
    'ZTC SESSION',
    'Multi-timeframe trend confirmation with smart filter.',
    'Most Popular',
    'Win 72% · 1.8R avg',
    'https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD&interval=60&studies=STD%3BEMA%2CSTD%3BVWAP',
    1
  ),
  (
    'liquidity_sweep',
    'Liquidity Sweep',
    'Detects institutional stop hunts before reversals.',
    'New',
    'Win 72% · 1.8R avg',
    'https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD&interval=60&studies=STD%3BVolume%2CSTD%3BVWAP',
    2
  ),
  (
    'smart_entry_ai',
    'Smart Entry AI',
    'AI-scored entries with risk/reward auto-calc.',
    'Pro',
    'Win 72% · 1.8R avg',
    'https://www.tradingview.com/chart/?symbol=OANDA%3AXAUUSD&interval=60&studies=STD%3BMACD%2CSTD%3BRSI',
    3
  )
on conflict (slug) do nothing;

create table if not exists public.trading_tools (
  slug text primary key,
  name text not null,
  category text not null,
  description text not null,
  promo_code text not null,
  discount text not null,
  url text not null,
  logo_url text,
  highlights text[] not null default '{}',
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.trading_tools add column if not exists logo_url text;

alter table public.trading_tools enable row level security;

drop policy if exists "Anyone can read active trading tools" on public.trading_tools;
create policy "Anyone can read active trading tools"
on public.trading_tools
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert trading tools" on public.trading_tools;
create policy "Admins can insert trading tools"
on public.trading_tools
for insert
with check (public.is_admin());

drop policy if exists "Admins can update trading tools" on public.trading_tools;
create policy "Admins can update trading tools"
on public.trading_tools
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete trading tools" on public.trading_tools;
create policy "Admins can delete trading tools"
on public.trading_tools
for delete
using (public.is_admin());

drop trigger if exists trading_tools_set_updated_at on public.trading_tools;
create trigger trading_tools_set_updated_at
before update on public.trading_tools
for each row
execute function public.set_updated_at();

-- Keep the backend trading tools catalog limited to the approved ZacTrades tools.
delete from public.trading_tools
where slug not in (
  'fxreplay',
  'tradesyncer',
  'tradingview'
);

insert into public.trading_tools (
  slug,
  name,
  category,
  description,
  promo_code,
  discount,
  url,
  highlights,
  is_active,
  display_order
)
values
  (
    'fxreplay',
    'FX Replay',
    'Backtesting',
    'Replay market sessions, test setups, and build confidence before trading live.',
    'ZACTRADES',
    'Partner link',
    'https://fxreplay.com/?via=ZACTRADES',
    array['Market replay', 'Backtesting', 'Strategy practice'],
    true,
    1
  ),
  (
    'tradesyncer',
    'TradeSyncer',
    'Trading Journal',
    'Sync trades, review performance, and understand your execution with clean analytics.',
    'TS2537E28A',
    'Referral access',
    'https://app.tradesyncer.com/?ref=TS2537E28A',
    array['Trade journal', 'Performance analytics', 'Execution review'],
    true,
    2
  ),
  (
    'tradingview',
    'TradingView',
    'Charting',
    'Professional charting, alerts, watchlists, and multi-timeframe market analysis.',
    'Zac_Hr',
    'Official pricing',
    'https://www.tradingview.com/pricing/?share_your_love=Zac_Hr',
    array['Advanced charts', 'Alerts', 'Watchlists'],
    true,
    3
  )
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  promo_code = excluded.promo_code,
  discount = excluded.discount,
  url = excluded.url,
  highlights = excluded.highlights,
  is_active = excluded.is_active,
  display_order = excluded.display_order,
  updated_at = now();

create table if not exists public.prop_firms (
  slug text primary key,
  name text not null,
  description text not null,
  logo text not null,
  logo_url text,
  discount text not null,
  promo_code text not null,
  color text not null,
  rating numeric not null default 0,
  reviews integer not null default 0,
  max_capital text not null,
  profit_split text not null,
  payout text not null,
  features text[] not null default '{}',
  url text not null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.prop_firms
add column if not exists logo_url text;

alter table public.prop_firms enable row level security;

grant select on public.prop_firms to anon, authenticated;
grant insert, update, delete on public.prop_firms to authenticated;

drop policy if exists "Anyone can read active prop firms" on public.prop_firms;
create policy "Anyone can read active prop firms"
on public.prop_firms
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert prop firms" on public.prop_firms;
create policy "Admins can insert prop firms"
on public.prop_firms
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update prop firms" on public.prop_firms;
create policy "Admins can update prop firms"
on public.prop_firms
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete prop firms" on public.prop_firms;
create policy "Admins can delete prop firms"
on public.prop_firms
for delete
to authenticated
using (public.is_admin());

drop trigger if exists prop_firms_set_updated_at on public.prop_firms;
create trigger prop_firms_set_updated_at
before update on public.prop_firms
for each row
execute function public.set_updated_at();

-- Keep the backend prop firm catalog limited to the approved ZacTrades partners.
delete from public.prop_firms
where slug not in (
  'alpha-futures',
  'earn2trade',
  'fundednext',
  'alpha-capital-group',
  'funding-pips'
);

insert into public.prop_firms (
  slug,
  name,
  description,
  logo,
  logo_url,
  discount,
  promo_code,
  color,
  rating,
  reviews,
  max_capital,
  profit_split,
  payout,
  features,
  url,
  is_featured,
  is_active,
  display_order
)
values
  (
    'alpha-futures',
    'Alpha Futures',
    'Futures funding platform for traders who want structured evaluation access.',
    'AF',
    null,
    'Max Discount',
    'ZACTRADES',
    '#22c55e',
    4.4,
    3200,
    '$150K',
    '90%',
    'Bi-weekly',
    array['TV', 'Web'],
    'https://app.alpha-futures.com',
    true,
    true,
    1
  ),
  (
    'earn2trade',
    'Earn2Trade',
    'Education-first futures evaluation platform with structured trader development.',
    'E2T',
    null,
    'Max Discount',
    'ZACTRADES',
    '#38bdf8',
    4.4,
    4100,
    '$200K',
    '80%',
    'Monthly',
    array['TV', 'Web'],
    'https://www.earn2trade.com',
    true,
    true,
    2
  ),
  (
    'fundednext',
    'FundedNext',
    'Multi-asset prop firm with flexible challenges and a modern trader dashboard.',
    'FN',
    null,
    'Max Discount',
    'ZACTRADES',
    '#ec4899',
    4.3,
    6700,
    '$200K',
    '95%',
    'Bi-weekly',
    array['MT5', 'App', 'Web'],
    'https://app.fundednext.com',
    true,
    true,
    3
  ),
  (
    'alpha-capital-group',
    'Alpha Capital Group',
    'Professional prop trading firm with challenge accounts and scaling opportunities.',
    'ACG',
    null,
    'Max Discount',
    'ZACTRADES',
    '#a855f7',
    4.4,
    2800,
    '$200K',
    '80%',
    'Bi-weekly',
    array['MT5', 'Web'],
    'https://app.alphacapitalgroup.uk',
    false,
    true,
    4
  ),
  (
    'funding-pips',
    'Funding Pips',
    'Popular prop firm for forex traders with flexible rules and fast account access.',
    'FP',
    null,
    'Max Discount',
    'ZACTRADES',
    '#f59e0b',
    4.2,
    5200,
    '$100K',
    '80%',
    'Bi-weekly',
    array['MT5', 'Web'],
    'https://app.fundingpips.com',
    false,
    true,
    5
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  logo = excluded.logo,
  logo_url = excluded.logo_url,
  discount = excluded.discount,
  promo_code = excluded.promo_code,
  color = excluded.color,
  rating = excluded.rating,
  reviews = excluded.reviews,
  max_capital = excluded.max_capital,
  profit_split = excluded.profit_split,
  payout = excluded.payout,
  features = excluded.features,
  url = excluded.url,
  is_featured = excluded.is_featured,
  is_active = excluded.is_active,
  display_order = excluded.display_order,
  updated_at = now();

create table if not exists public.community_socials (
  slug text primary key,
  name text not null,
  handle text not null,
  description text not null,
  icon_key text not null default 'message',
  url text not null,
  tone_key text not null default 'primary',
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_socials enable row level security;

drop policy if exists "Anyone can read active community socials" on public.community_socials;
create policy "Anyone can read active community socials"
on public.community_socials
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert community socials" on public.community_socials;
create policy "Admins can insert community socials"
on public.community_socials
for insert
with check (public.is_admin());

drop policy if exists "Admins can update community socials" on public.community_socials;
create policy "Admins can update community socials"
on public.community_socials
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete community socials" on public.community_socials;
create policy "Admins can delete community socials"
on public.community_socials
for delete
using (public.is_admin());

drop trigger if exists community_socials_set_updated_at on public.community_socials;
create trigger community_socials_set_updated_at
before update on public.community_socials
for each row
execute function public.set_updated_at();

insert into public.community_socials (
  slug,
  name,
  handle,
  description,
  icon_key,
  url,
  tone_key,
  display_order
)
values
  (
    'youtube',
    'YouTube',
    '@ZacTrades',
    'Watch market breakdowns, trading lessons, and live-room recaps.',
    'youtube',
    'https://www.youtube.com',
    'bear',
    1
  ),
  (
    'instagram',
    'Instagram',
    '@apextraders',
    'Follow trade ideas, member wins, and behind-the-scenes updates.',
    'instagram',
    'https://www.instagram.com',
    'gold',
    2
  ),
  (
    'tiktok',
    'TikTok',
    '@apextraders',
    'Short trading tips, quick lessons, and psychology reminders.',
    'music',
    'https://www.tiktok.com',
    'primary',
    3
  ),
  (
    'discord',
    'Discord',
    'ZacTrades Community',
    'Join the private community for chat, questions, and trader support.',
    'message',
    'https://discord.gg/sJ8jC3n2H3',
    'bull',
    4
  )
on conflict (slug) do update set
  name = excluded.name,
  handle = excluded.handle,
  description = excluded.description,
  icon_key = excluded.icon_key,
  url = excluded.url,
  tone_key = excluded.tone_key,
  display_order = excluded.display_order,
  updated_at = now();

insert into storage.buckets (id, name, public)
values ('propfirm-logos', 'propfirm-logos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read prop firm logos" on storage.objects;
create policy "Anyone can read prop firm logos"
on storage.objects
for select
using (bucket_id = 'propfirm-logos');

drop policy if exists "Admins can upload prop firm logos" on storage.objects;
create policy "Admins can upload prop firm logos"
on storage.objects
for insert
with check (bucket_id = 'propfirm-logos' and public.is_admin());

drop policy if exists "Admins can update prop firm logos" on storage.objects;
create policy "Admins can update prop firm logos"
on storage.objects
for update
using (bucket_id = 'propfirm-logos' and public.is_admin())
with check (bucket_id = 'propfirm-logos' and public.is_admin());

drop policy if exists "Admins can delete prop firm logos" on storage.objects;
create policy "Admins can delete prop firm logos"
on storage.objects
for delete
using (bucket_id = 'propfirm-logos' and public.is_admin());


insert into storage.buckets (id, name, public)
values ('trading-tool-logos', 'trading-tool-logos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read trading tool logos" on storage.objects;
create policy "Anyone can read trading tool logos"
on storage.objects
for select
using (bucket_id = 'trading-tool-logos');

drop policy if exists "Admins can upload trading tool logos" on storage.objects;
create policy "Admins can upload trading tool logos"
on storage.objects
for insert
with check (bucket_id = 'trading-tool-logos' and public.is_admin());

drop policy if exists "Admins can update trading tool logos" on storage.objects;
create policy "Admins can update trading tool logos"
on storage.objects
for update
using (bucket_id = 'trading-tool-logos' and public.is_admin())
with check (bucket_id = 'trading-tool-logos' and public.is_admin());

drop policy if exists "Admins can delete trading tool logos" on storage.objects;
create policy "Admins can delete trading tool logos"
on storage.objects
for delete
using (bucket_id = 'trading-tool-logos' and public.is_admin());

insert into storage.buckets (id, name, public)
values ('indicator-thumbnails', 'indicator-thumbnails', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read indicator thumbnails" on storage.objects;
create policy "Anyone can read indicator thumbnails"
on storage.objects
for select
using (bucket_id = 'indicator-thumbnails');

drop policy if exists "Admins can upload indicator thumbnails" on storage.objects;
create policy "Admins can upload indicator thumbnails"
on storage.objects
for insert
with check (
  bucket_id = 'indicator-thumbnails'
  and public.is_admin()
  and lower(name) ~ '\.(png|jpg|jpeg|webp)$'
);

drop policy if exists "Admins can update indicator thumbnails" on storage.objects;
create policy "Admins can update indicator thumbnails"
on storage.objects
for update
using (bucket_id = 'indicator-thumbnails' and public.is_admin())
with check (
  bucket_id = 'indicator-thumbnails'
  and public.is_admin()
  and lower(name) ~ '\.(png|jpg|jpeg|webp)$'
);

drop policy if exists "Admins can delete indicator thumbnails" on storage.objects;
create policy "Admins can delete indicator thumbnails"
on storage.objects
for delete
using (bucket_id = 'indicator-thumbnails' and public.is_admin());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone_number, discord_username)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'phone_number',
    new.raw_user_meta_data ->> 'discord_username'
  )
  on conflict (id) do update
  set
    full_name = excluded.full_name,
    email = excluded.email,
    phone_number = excluded.phone_number,
    discord_username = excluded.discord_username;

  insert into public.user_memberships (user_id, plan_slug, status)
  values
    (new.id, 'one_to_one', 'unpaid'),
    (new.id, 'group', 'unpaid')
  on conflict (user_id, plan_slug) do nothing;

  insert into public.user_news_subscriptions (user_id, status)
  values (new.id, 'unpaid')
  on conflict (user_id) do nothing;

  insert into public.user_live_trading_access (user_id, status)
  values (new.id, 'unpaid')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Security hardening: payment webhook idempotency and local-payment RPC lockdown.
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

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  user_id uuid not null references public.profiles (id) on delete cascade,
  source_kind text not null check (source_kind in ('live', 'mentorship', 'news')),
  source_key text not null default 'default',
  product_name text not null,
  product_description text,
  access_type text,
  amount_label text,
  gross_amount_label text,
  currency text not null default 'MAD',
  payment_provider text,
  provider_customer_id text,
  provider_checkout_id text,
  provider_transaction_id text,
  customer_name text,
  customer_email text,
  customer_phone text,
  paid_at timestamptz not null default now(),
  access_starts_at timestamptz,
  access_expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invoices add column if not exists invoice_number text;
alter table public.invoices add column if not exists user_id uuid references public.profiles (id) on delete cascade;
alter table public.invoices add column if not exists source_kind text;
alter table public.invoices add column if not exists source_key text not null default 'default';
alter table public.invoices add column if not exists product_name text;
alter table public.invoices add column if not exists product_description text;
alter table public.invoices add column if not exists access_type text;
alter table public.invoices add column if not exists amount_label text;
alter table public.invoices add column if not exists gross_amount_label text;
alter table public.invoices add column if not exists currency text not null default 'MAD';
alter table public.invoices add column if not exists payment_provider text;
alter table public.invoices add column if not exists provider_customer_id text;
alter table public.invoices add column if not exists provider_checkout_id text;
alter table public.invoices add column if not exists provider_transaction_id text;
alter table public.invoices add column if not exists customer_name text;
alter table public.invoices add column if not exists customer_email text;
alter table public.invoices add column if not exists customer_phone text;
alter table public.invoices add column if not exists paid_at timestamptz not null default now();
alter table public.invoices add column if not exists access_starts_at timestamptz;
alter table public.invoices add column if not exists access_expires_at timestamptz;
alter table public.invoices add column if not exists created_at timestamptz not null default now();

create sequence if not exists public.invoice_number_seq;

do $$
declare
  base_value integer;
begin
  select coalesce(max((regexp_match(invoice_number, '^ZTC-([0-9]+)$'))[1]::integer), 0)
  into base_value
  from public.invoices
  where invoice_number ~ '^ZTC-[0-9]+$';

  with old_invoice_numbers as (
    select
      id,
      base_value + row_number() over (order by created_at, id) as next_number
    from public.invoices
    where invoice_number is null
      or invoice_number !~ '^ZTC-[0-9]{6}$'
  )
  update public.invoices
  set invoice_number = 'ZTC-' || lpad(old_invoice_numbers.next_number::text, 6, '0')
  from old_invoice_numbers
  where public.invoices.id = old_invoice_numbers.id;

  perform setval(
    'public.invoice_number_seq',
    greatest(
      1,
      (
        select coalesce(max((regexp_match(invoice_number, '^ZTC-([0-9]+)$'))[1]::integer), 0)
        from public.invoices
        where invoice_number ~ '^ZTC-[0-9]+$'
      )
    ),
    (
      select exists (
        select 1
        from public.invoices
        where invoice_number ~ '^ZTC-[0-9]+$'
      )
    )
  );
end $$;

create or replace function public.next_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  next_value bigint;
begin
  next_value := nextval('public.invoice_number_seq');
  return 'ZTC-' || lpad(next_value::text, 6, '0');
end;
$$;

alter table public.invoices alter column invoice_number set default public.next_invoice_number();

create unique index if not exists invoices_provider_transaction_unique
on public.invoices (payment_provider, provider_transaction_id)
where provider_transaction_id is not null;

create unique index if not exists invoices_provider_checkout_source_unique
on public.invoices (payment_provider, provider_checkout_id, source_kind, source_key)
where provider_checkout_id is not null;

create index if not exists invoices_user_created_idx
on public.invoices (user_id, created_at desc);

alter table public.invoices enable row level security;

drop policy if exists "Users can read their own invoices" on public.invoices;
create policy "Users can read their own invoices"
on public.invoices
for select
using (auth.uid() = user_id);

drop policy if exists "Staff can read all invoices" on public.invoices;
create policy "Staff can read all invoices"
on public.invoices
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
create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  discount_type text not null default 'percent',
  discount_value numeric(10, 2) not null,
  applies_to text not null default 'all',
  is_active boolean not null default true,
  max_redemptions integer,
  redeemed_count integer not null default 0,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.discount_codes add column if not exists description text;
alter table public.discount_codes add column if not exists discount_type text not null default 'percent';
alter table public.discount_codes add column if not exists discount_value numeric(10, 2) not null default 0;
alter table public.discount_codes add column if not exists applies_to text not null default 'all';
alter table public.discount_codes add column if not exists is_active boolean not null default true;
alter table public.discount_codes add column if not exists max_redemptions integer;
alter table public.discount_codes add column if not exists redeemed_count integer not null default 0;
alter table public.discount_codes add column if not exists starts_at timestamptz;
alter table public.discount_codes add column if not exists expires_at timestamptz;
alter table public.discount_codes add column if not exists created_at timestamptz not null default now();
alter table public.discount_codes add column if not exists updated_at timestamptz not null default now();

create unique index if not exists discount_codes_code_unique on public.discount_codes (code);

alter table public.discount_codes drop constraint if exists discount_codes_code_format_check;
alter table public.discount_codes add constraint discount_codes_code_format_check
check (code = upper(code) and code ~ '^[A-Z0-9_-]{2,50}$');

alter table public.discount_codes drop constraint if exists discount_codes_discount_type_check;
alter table public.discount_codes add constraint discount_codes_discount_type_check
check (discount_type in ('percent', 'fixed'));

alter table public.discount_codes drop constraint if exists discount_codes_discount_value_check;
alter table public.discount_codes add constraint discount_codes_discount_value_check
check (discount_value > 0 and (discount_type <> 'percent' or discount_value <= 100));

alter table public.discount_codes drop constraint if exists discount_codes_applies_to_check;
alter table public.discount_codes add constraint discount_codes_applies_to_check
check (
  applies_to = 'all'
  or applies_to ~ '^(live|mentorship|mentorship_one_to_one|mentorship_group|news)(,(live|mentorship|mentorship_one_to_one|mentorship_group|news))*$'
);

alter table public.discount_codes drop constraint if exists discount_codes_redemptions_check;
alter table public.discount_codes add constraint discount_codes_redemptions_check
check ((max_redemptions is null or max_redemptions > 0) and redeemed_count >= 0);

alter table public.discount_codes enable row level security;

revoke all on public.discount_codes from anon, authenticated;
grant select, insert, update, delete on public.discount_codes to authenticated;

drop policy if exists "Staff can read discount codes" on public.discount_codes;
create policy "Staff can read discount codes"
on public.discount_codes
for select
using (public.is_staff());

drop policy if exists "Admins can insert discount codes" on public.discount_codes;
create policy "Admins can insert discount codes"
on public.discount_codes
for insert
with check (public.is_admin());

drop policy if exists "Admins can update discount codes" on public.discount_codes;
create policy "Admins can update discount codes"
on public.discount_codes
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete discount codes" on public.discount_codes;
create policy "Admins can delete discount codes"
on public.discount_codes
for delete
using (public.is_admin());

drop trigger if exists discount_codes_set_updated_at on public.discount_codes;
create trigger discount_codes_set_updated_at
before update on public.discount_codes
for each row
execute function public.set_updated_at();

create or replace function public.increment_discount_code_redemption(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.discount_codes
  set redeemed_count = redeemed_count + 1
  where code = upper(regexp_replace(trim(p_code), '\s+', '', 'g'));
end;
$$;

revoke execute on function public.increment_discount_code_redemption(text) from public, anon, authenticated;
grant execute on function public.increment_discount_code_redemption(text) to service_role;

create unique index if not exists user_memberships_payzone_public_order_unique
on public.user_memberships (payment_provider, provider_subscription_id)
where payment_provider = 'payzone' and provider_subscription_id is not null;

create unique index if not exists user_live_trading_access_payzone_public_order_unique
on public.user_live_trading_access (payment_provider, provider_subscription_id)
where payment_provider = 'payzone' and provider_subscription_id is not null;

create unique index if not exists user_news_subscriptions_payzone_public_order_unique
on public.user_news_subscriptions (payment_provider, provider_subscription_id)
where payment_provider = 'payzone' and provider_subscription_id is not null;

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

create table if not exists public.education_articles (
  slug text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('study', 'psychology', 'risk', 'premium')),
  level text not null,
  read_time text not null,
  access text not null default 'Free' check (access in ('Free', 'Members')),
  published_date text not null,
  cover_title text not null,
  cover_subtitle text not null,
  cover_image_url text,
  content text not null,
  is_published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.education_articles enable row level security;

drop policy if exists "Anyone can read published education articles" on public.education_articles;
create policy "Anyone can read published education articles"
on public.education_articles
for select
using (is_published = true or public.is_admin());

drop policy if exists "Admins can insert education articles" on public.education_articles;
create policy "Admins can insert education articles"
on public.education_articles
for insert
with check (public.is_admin());

drop policy if exists "Admins can update education articles" on public.education_articles;
create policy "Admins can update education articles"
on public.education_articles
for update
using (public.is_admin())
with check (public.is_admin());



drop policy if exists "Admins can delete education articles" on public.education_articles;
create policy "Admins can delete education articles"
on public.education_articles
for delete
using (public.is_admin());

drop trigger if exists education_articles_set_updated_at on public.education_articles;
create trigger education_articles_set_updated_at
before update on public.education_articles
for each row
execute function public.set_updated_at();

insert into storage.buckets (id, name, public)
values ('education-images', 'education-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read education images" on storage.objects;
create policy "Anyone can read education images"
on storage.objects
for select
using (bucket_id = 'education-images');

drop policy if exists "Admins can upload education images" on storage.objects;
create policy "Admins can upload education images"
on storage.objects
for insert
with check (bucket_id = 'education-images' and public.is_admin());

drop policy if exists "Admins can update education images" on storage.objects;
create policy "Admins can update education images"
on storage.objects
for update
using (bucket_id = 'education-images' and public.is_admin())
with check (bucket_id = 'education-images' and public.is_admin());

drop policy if exists "Admins can delete education images" on storage.objects;
create policy "Admins can delete education images"
on storage.objects
for delete
using (bucket_id = 'education-images' and public.is_admin());


alter table public.education_articles
add column if not exists cover_image_url text;

create table if not exists public.member_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  email text,
  message text not null,
  rating integer not null default 5,
  status text not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_reviews_rating_check check (rating between 1 and 5),
  constraint member_reviews_status_check check (status in ('pending', 'approved', 'hidden')),
  constraint member_reviews_message_length_check check (
    char_length(trim(message)) between 10 and 2000
  )
);

alter table public.member_reviews enable row level security;

drop policy if exists "Anyone can read approved member reviews" on public.member_reviews;
create policy "Anyone can read approved member reviews"
on public.member_reviews
for select
using (status = 'approved' or auth.uid() = user_id or public.is_staff());

drop policy if exists "Members can submit their own pending reviews" on public.member_reviews;
create policy "Members can submit their own pending reviews"
on public.member_reviews
for insert
with check (
  auth.uid() = user_id
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Members can update their own pending reviews" on public.member_reviews;
create policy "Members can update their own pending reviews"
on public.member_reviews
for update
using (auth.uid() = user_id and status = 'pending')
with check (
  auth.uid() = user_id
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Admins can moderate member reviews" on public.member_reviews;
create policy "Admins can moderate member reviews"
on public.member_reviews
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete member reviews" on public.member_reviews;
create policy "Admins can delete member reviews"
on public.member_reviews
for delete
using (public.is_admin());

drop trigger if exists member_reviews_set_updated_at on public.member_reviews;
create trigger member_reviews_set_updated_at
before update on public.member_reviews
for each row
execute function public.set_updated_at();
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

create or replace function public.approve_member_review(p_review_id uuid)
returns public.member_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.member_reviews;
  v_reviewed_at timestamptz := now();
begin
  if not public.is_staff() then
    raise exception 'Only staff can approve member reviews.' using errcode = '42501';
  end if;

  select *
  into v_review
  from public.member_reviews
  where id = p_review_id
  for update;

  if not found then
    raise exception 'Member review not found.' using errcode = 'P0002';
  end if;

  delete from public.member_reviews
  where user_id = v_review.user_id
    and status = 'approved'
    and id <> v_review.id;

  update public.member_reviews
  set
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = v_reviewed_at
  where id = p_review_id
  returning * into v_review;

  return v_review;
end;
$$;

grant execute on function public.approve_member_review(uuid) to authenticated;

with ranked_reviews as (
  select
    id,
    row_number() over (
      partition by user_id
      order by coalesce(reviewed_at, updated_at, created_at) desc, created_at desc, id desc
    ) as review_rank
  from public.member_reviews
  where status = 'approved'
)
delete from public.member_reviews reviews
using ranked_reviews
where reviews.id = ranked_reviews.id
  and ranked_reviews.review_rank > 1;

create unique index if not exists member_reviews_one_approved_per_user
on public.member_reviews (user_id)
where status = 'approved';

create or replace function public.current_user_has_paid_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_paid_access(auth.uid());
$$;

grant execute on function public.current_user_has_paid_access() to authenticated;

-- Member review image uploads: up to 2 public images per approved/pending review.
alter table public.member_reviews
add column if not exists image_urls text[] not null default '{}'::text[];

alter table public.member_reviews
drop constraint if exists member_reviews_image_urls_max_two_check;

alter table public.member_reviews
add constraint member_reviews_image_urls_max_two_check
check (coalesce(array_length(image_urls, 1), 0) <= 2);

insert into storage.buckets (id, name, public)
values ('member-review-images', 'member-review-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read member review images" on storage.objects;
create policy "Anyone can read member review images"
on storage.objects
for select
using (bucket_id = 'member-review-images');

drop policy if exists "Paid members can upload own review images" on storage.objects;
create policy "Paid members can upload own review images"
on storage.objects
for insert
with check (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and public.has_paid_access(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Members can update own review images" on storage.objects;
create policy "Members can update own review images"
on storage.objects
for update
using (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Members can delete own review images" on storage.objects;
create policy "Members can delete own review images"
on storage.objects
for delete
using (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create or replace function public.storage_object_has_extension(
  p_name text,
  p_extensions text[]
)
returns boolean
language sql
immutable
set search_path = public, storage
as $$
  select lower(coalesce(p_name, '')) ~ ('\.(' || array_to_string(p_extensions, '|') || ')$');
$$;

create or replace function public.storage_object_has_mime(
  p_metadata jsonb,
  p_mime_types text[]
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select lower(coalesce(p_metadata ->> 'mimetype', '')) = any(p_mime_types);
$$;

create or replace function public.storage_object_size_between(
  p_metadata jsonb,
  p_min_bytes bigint,
  p_max_bytes bigint
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select
    coalesce(p_metadata ->> 'size', '') ~ '^\d+$'
    and (p_metadata ->> 'size')::bigint between p_min_bytes and p_max_bytes;
$$;

drop policy if exists "Admins can upload prop firm logos" on storage.objects;
create policy "Admins can upload prop firm logos"
on storage.objects
for insert
with check (
  bucket_id = 'propfirm-logos'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp'])
  and public.storage_object_has_mime(metadata, array['image/png', 'image/jpeg', 'image/webp'])
  and public.storage_object_size_between(metadata, 1, 2097152)
);

drop policy if exists "Admins can update prop firm logos" on storage.objects;
create policy "Admins can update prop firm logos"
on storage.objects
for update
using (bucket_id = 'propfirm-logos' and public.is_admin())
with check (
  bucket_id = 'propfirm-logos'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp'])
  and public.storage_object_has_mime(metadata, array['image/png', 'image/jpeg', 'image/webp'])
  and public.storage_object_size_between(metadata, 1, 2097152)
);

drop policy if exists "Admins can upload trading tool logos" on storage.objects;
create policy "Admins can upload trading tool logos"
on storage.objects
for insert
with check (
  bucket_id = 'trading-tool-logos'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp'])
  and public.storage_object_has_mime(metadata, array['image/png', 'image/jpeg', 'image/webp'])
  and public.storage_object_size_between(metadata, 1, 2097152)
);

drop policy if exists "Admins can update trading tool logos" on storage.objects;
create policy "Admins can update trading tool logos"
on storage.objects
for update
using (bucket_id = 'trading-tool-logos' and public.is_admin())
with check (
  bucket_id = 'trading-tool-logos'
  and public.is_admin()
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp'])
  and public.storage_object_has_mime(metadata, array['image/png', 'image/jpeg', 'image/webp'])
  and public.storage_object_size_between(metadata, 1, 2097152)
);

drop policy if exists "Admins can upload education images" on storage.objects;
create policy "Admins can upload education images"
on storage.objects
for insert
with check (
  bucket_id = 'education-images'
  and public.is_admin()
  and lower(name) ~ '\.(png|jpg|jpeg|webp|gif)$'
);

drop policy if exists "Admins can update education images" on storage.objects;
create policy "Admins can update education images"
on storage.objects
for update
using (bucket_id = 'education-images' and public.is_admin())
with check (
  bucket_id = 'education-images'
  and public.is_admin()
  and lower(name) ~ '\.(png|jpg|jpeg|webp|gif)$'
);

drop policy if exists "Paid members can upload own review images" on storage.objects;
create policy "Paid members can upload own review images"
on storage.objects
for insert
with check (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and public.has_paid_access(auth.uid())
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp', 'gif'])
  and public.storage_object_has_mime(
    metadata,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  )
  and public.storage_object_size_between(metadata, 1, 4194304)
);

drop policy if exists "Members can update own review images" on storage.objects;
create policy "Members can update own review images"
on storage.objects
for update
using (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'member-review-images'
  and auth.role() = 'authenticated'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.storage_object_has_extension(name, array['png', 'jpg', 'jpeg', 'webp', 'gif'])
  and public.storage_object_has_mime(
    metadata,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
  )
  and public.storage_object_size_between(metadata, 1, 4194304)
);
