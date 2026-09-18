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
check (applies_to in ('all', 'live', 'mentorship', 'news'));

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
