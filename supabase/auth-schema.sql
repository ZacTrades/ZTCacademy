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
alter table public.user_memberships add column if not exists notes text;

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
  ('six_months', '6 months', '$200', '$33.33/mo', '$240', 'Discount', 3),
  ('twelve_months', '12 months', '$400', '$33.33/mo', '$480', 'Best value', 4)
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

drop trigger if exists premium_indicators_set_updated_at on public.premium_indicators;
create trigger premium_indicators_set_updated_at
before update on public.premium_indicators
for each row
execute function public.set_updated_at();

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
    'Zac Trend Pro',
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
  highlights text[] not null default '{}',
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

drop trigger if exists trading_tools_set_updated_at on public.trading_tools;
create trigger trading_tools_set_updated_at
before update on public.trading_tools
for each row
execute function public.set_updated_at();

insert into public.trading_tools (
  slug,
  name,
  category,
  description,
  promo_code,
  discount,
  url,
  highlights,
  display_order
)
values
  (
    'tradingview',
    'TradingView',
    'Charting',
    'My main charting workspace for multi-timeframe analysis, alerts, and watchlists.',
    'ZACTV10',
    '10% off',
    'https://www.tradingview.com',
    array['Advanced charts', 'Alerts', 'Watchlists'],
    1
  ),
  (
    'notion',
    'Notion',
    'Trading Journal',
    'A clean place to organize trade plans, journal notes, screenshots, and weekly reviews.',
    'ZACNOTION',
    'Free template',
    'https://www.notion.so',
    array['Trade journal', 'Review pages', 'Playbooks'],
    2
  ),
  (
    'forex_factory',
    'Forex Factory',
    'News Calendar',
    'Useful for checking high-impact economic events before entering a trade.',
    'ZACNEWS',
    'Member setup',
    'https://www.forexfactory.com/calendar',
    array['Economic news', 'Impact filters', 'Session planning'],
    3
  ),
  (
    'myfxbook',
    'Myfxbook',
    'Performance Tracking',
    'Track account performance, drawdown, win rate, and trading statistics.',
    'ZACTRACK',
    'Tracker setup',
    'https://www.myfxbook.com',
    array['Analytics', 'Drawdown', 'Account stats'],
    4
  ),
  (
    'edgewonk',
    'Edgewonk',
    'Deep Journaling',
    'A more advanced journal for tracking psychology, setups, mistakes, and improvement.',
    'ZACEDGE',
    '15% off',
    'https://edgewonk.com',
    array['Mistake tracking', 'Trade tags', 'Review dashboard'],
    5
  ),
  (
    'trendspider',
    'TrendSpider',
    'Market Scanning',
    'Helpful for scanning markets, automated trendlines, and technical alerts.',
    'ZACTREND',
    'Trial bonus',
    'https://trendspider.com',
    array['Scanners', 'Alerts', 'Technical research'],
    6
  )
on conflict (slug) do nothing;

create table if not exists public.prop_firms (
  slug text primary key,
  name text not null,
  description text not null,
  logo text not null,
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

alter table public.prop_firms enable row level security;

drop policy if exists "Anyone can read active prop firms" on public.prop_firms;
create policy "Anyone can read active prop firms"
on public.prop_firms
for select
using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert prop firms" on public.prop_firms;
create policy "Admins can insert prop firms"
on public.prop_firms
for insert
with check (public.is_admin());

drop policy if exists "Admins can update prop firms" on public.prop_firms;
create policy "Admins can update prop firms"
on public.prop_firms
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete prop firms" on public.prop_firms;
create policy "Admins can delete prop firms"
on public.prop_firms
for delete
using (public.is_admin());

drop trigger if exists prop_firms_set_updated_at on public.prop_firms;
create trigger prop_firms_set_updated_at
before update on public.prop_firms
for each row
execute function public.set_updated_at();

insert into public.prop_firms (
  slug,
  name,
  description,
  logo,
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
  display_order
)
values
  (
    'ftmo',
    'FTMO',
    'The industry leader in prop trading. Two-step evaluation with up to $400K accounts.',
    'FTMO',
    '10% OFF',
    'ZAC10',
    '#00d084',
    4.9,
    12400,
    '$400K',
    '90%',
    'Bi-weekly',
    array['Two-step evaluation', 'No time limit', 'Free retry', 'Mobile app'],
    'https://ftmo.com',
    true,
    1
  ),
  (
    'the5ers',
    'The5ers',
    'Instant funding available. Trade from day one with no evaluation period.',
    '5ERS',
    '20% OFF',
    'ZAC20',
    '#f59e0b',
    4.8,
    8900,
    '$250K',
    '80%',
    'Instant',
    array['Instant funding', 'Weekly payouts', 'Low spreads', 'News trading'],
    'https://the5ers.com',
    true,
    2
  ),
  (
    'myforexfunds',
    'MyForexFunds',
    'Flexible account sizes from $10K to $300K with rapid evaluation.',
    'MFF',
    '15% OFF',
    'ZAC15',
    '#6366f1',
    4.7,
    10200,
    '$300K',
    '85%',
    'Weekly',
    array['Rapid evaluation', 'Scaling plan', 'No minimum trading days', 'Crypto payouts'],
    'https://myforexfunds.com',
    false,
    3
  ),
  (
    'fundednext',
    'FundedNext',
    'Industry-first profit sharing from day one with the Stellar Challenge.',
    'FN',
    '10% OFF',
    'ZACFN10',
    '#ec4899',
    4.6,
    6700,
    '$200K',
    '95%',
    'Bi-weekly',
    array['Profit from challenge', 'Stellar 1-step', 'Express model', 'Free trial'],
    'https://fundednext.com',
    false,
    4
  ),
  (
    'true-forex-funds',
    'True Forex Funds',
    'Transparent pricing with no hidden fees. Beginner-friendly platform.',
    'TFF',
    '12% OFF',
    'ZACTFF',
    '#10b981',
    4.5,
    5400,
    '$200K',
    '80%',
    'Weekly',
    array['No activation fee', 'Raw spreads', 'MT5 platform', 'Fast support'],
    'https://trueforexfunds.com',
    false,
    5
  ),
  (
    'apex-trader-funding',
    'Apex Trader Funding',
    'The original futures prop firm. Trade NQ, ES, CL with generous rules.',
    'ATF',
    '50% OFF',
    'ZAC50',
    '#3b82f6',
    4.7,
    15600,
    '$300K',
    '100%',
    'Monthly',
    array['Futures only', 'No daily loss limit', 'Trailing threshold', 'Reset discount'],
    'https://apextraderfunding.com',
    true,
    6
  ),
  (
    'topstep',
    'Topstep',
    'The original prop firm since 2012. Futures and forex evaluations.',
    'TS',
    '20% OFF',
    'ZACTS20',
    '#ef4444',
    4.6,
    9200,
    '$150K',
    '90%',
    'Monthly',
    array['Founded 2012', 'Coaching included', 'Combine rules', 'Scaling to $2M'],
    'https://topstep.com',
    false,
    7
  ),
  (
    'surgetrader',
    'SurgeTrader',
    'One-step evaluation with no minimum trading days. Simple and fast.',
    'ST',
    '10% OFF',
    'ZACST10',
    '#f97316',
    4.4,
    4100,
    '$250K',
    '85%',
    'Bi-weekly',
    array['One-step eval', 'No minimum days', 'Add-ons available', 'EA allowed'],
    'https://surgetrader.com',
    false,
    8
  )
on conflict (slug) do nothing;

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
    'https://discord.com',
    'bull',
    4
  )
on conflict (slug) do nothing;

create table if not exists public.blog_posts (
  slug text primary key,
  title text not null,
  category text not null,
  published_date text not null,
  read_time text not null,
  excerpt text not null,
  content text not null,
  pdf_url text,
  is_featured boolean not null default false,
  is_published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blog_posts
add column if not exists pdf_url text;

alter table public.blog_posts enable row level security;

drop policy if exists "Anyone can read published blog posts" on public.blog_posts;
create policy "Anyone can read published blog posts"
on public.blog_posts
for select
using (is_published = true or public.is_admin());

drop policy if exists "Admins can insert blog posts" on public.blog_posts;
create policy "Admins can insert blog posts"
on public.blog_posts
for insert
with check (public.is_admin());

drop policy if exists "Admins can update blog posts" on public.blog_posts;
create policy "Admins can update blog posts"
on public.blog_posts
for update
using (public.is_admin())
with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('blog-pdfs', 'blog-pdfs', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Anyone can read blog PDFs" on storage.objects;
create policy "Anyone can read blog PDFs"
on storage.objects
for select
using (bucket_id = 'blog-pdfs');

drop policy if exists "Admins can upload blog PDFs" on storage.objects;
create policy "Admins can upload blog PDFs"
on storage.objects
for insert
with check (bucket_id = 'blog-pdfs' and public.is_admin());

drop policy if exists "Admins can update blog PDFs" on storage.objects;
create policy "Admins can update blog PDFs"
on storage.objects
for update
using (bucket_id = 'blog-pdfs' and public.is_admin())
with check (bucket_id = 'blog-pdfs' and public.is_admin());

drop policy if exists "Admins can delete blog PDFs" on storage.objects;
create policy "Admins can delete blog PDFs"
on storage.objects
for delete
using (bucket_id = 'blog-pdfs' and public.is_admin());

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row
execute function public.set_updated_at();

insert into public.blog_posts (
  slug,
  title,
  category,
  published_date,
  read_time,
  excerpt,
  content,
  is_featured,
  display_order
)
values
  (
    'build-trading-plan-before-market-open',
    'How to build a trading plan before the market opens',
    'Trading Process',
    'May 27, 2026',
    '6 min read',
    'A practical pre-market routine for defining bias, levels, invalidation, risk, and the one or two setups worth waiting for.',
    'Start with higher-timeframe context, mark the key levels that would change your bias, define risk before entry, and write down exactly what would make you skip the session.',
    true,
    1
  ),
  (
    'risk-rules-every-beginner-should-write-down',
    'The risk rules every beginner should write down',
    'Risk Management',
    'May 20, 2026',
    '5 min read',
    'Simple limits for daily loss, position sizing, and max trades so one bad session does not become a damaged account.',
    'Risk rules should be visible before the first trade. Define max daily loss, risk per trade, max trades, and the exact point where the session ends.',
    false,
    2
  ),
  (
    'journaling-beats-hunting-for-another-indicator',
    'Why journaling beats hunting for another indicator',
    'Study',
    'May 13, 2026',
    '4 min read',
    'The fastest way to identify recurring mistakes is to review screenshots, emotions, timing, and execution quality.',
    'A journal turns vague frustration into evidence. Track setup quality, execution, emotion, and whether the trade matched your plan.',
    false,
    3
  ),
  (
    'reading-market-structure-without-forcing-trades',
    'Reading market structure without forcing trades',
    'Market Notes',
    'May 6, 2026',
    '7 min read',
    'A cleaner way to mark highs, lows, liquidity, and trend context before deciding whether a setup is actually present.',
    'Market structure is useful only when it reduces decisions. Mark clear swing points, identify liquidity, then wait for confirmation instead of inventing a trade.',
    false,
    4
  )
on conflict (slug) do nothing;

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
