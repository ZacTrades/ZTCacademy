create table if not exists public.offer_headlines (
  slug text primary key,
  eyebrow text not null default 'Limited offer',
  headline text not null,
  subheadline text not null default '',
  cta_label text not null default 'View offer',
  cta_url text not null default '/',
  tone text not null default 'gold',
  is_active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  display_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.offer_headlines add column if not exists eyebrow text not null default 'Limited offer';
alter table public.offer_headlines add column if not exists headline text not null default '';
alter table public.offer_headlines add column if not exists subheadline text not null default '';
alter table public.offer_headlines add column if not exists cta_label text not null default 'View offer';
alter table public.offer_headlines add column if not exists cta_url text not null default '/';
alter table public.offer_headlines add column if not exists tone text not null default 'gold';
alter table public.offer_headlines add column if not exists is_active boolean not null default true;
alter table public.offer_headlines add column if not exists starts_at timestamptz;
alter table public.offer_headlines add column if not exists expires_at timestamptz;
alter table public.offer_headlines add column if not exists display_order integer not null default 1;
alter table public.offer_headlines add column if not exists created_at timestamptz not null default now();
alter table public.offer_headlines add column if not exists updated_at timestamptz not null default now();

alter table public.offer_headlines drop constraint if exists offer_headlines_slug_check;
alter table public.offer_headlines add constraint offer_headlines_slug_check
check (slug ~ '^[a-z0-9][a-z0-9-]{1,80}$');

alter table public.offer_headlines drop constraint if exists offer_headlines_tone_check;
alter table public.offer_headlines add constraint offer_headlines_tone_check
check (tone in ('gold', 'electric', 'bull', 'violet'));

alter table public.offer_headlines drop constraint if exists offer_headlines_order_check;
alter table public.offer_headlines add constraint offer_headlines_order_check
check (display_order >= 0);

create index if not exists offer_headlines_public_idx
on public.offer_headlines (is_active, display_order, starts_at, expires_at);

alter table public.offer_headlines enable row level security;

revoke all on public.offer_headlines from anon, authenticated;
grant select on public.offer_headlines to anon, authenticated;
grant insert, update, delete on public.offer_headlines to authenticated;

drop policy if exists "Anyone can read active offer headlines" on public.offer_headlines;
create policy "Anyone can read active offer headlines"
on public.offer_headlines
for select
using (
  is_active
  and (starts_at is null or starts_at <= now())
  and (expires_at is null or expires_at > now())
);

drop policy if exists "Staff can read all offer headlines" on public.offer_headlines;
create policy "Staff can read all offer headlines"
on public.offer_headlines
for select
to authenticated
using (public.is_staff());

drop policy if exists "Admins can insert offer headlines" on public.offer_headlines;
create policy "Admins can insert offer headlines"
on public.offer_headlines
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update offer headlines" on public.offer_headlines;
create policy "Admins can update offer headlines"
on public.offer_headlines
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete offer headlines" on public.offer_headlines;
create policy "Admins can delete offer headlines"
on public.offer_headlines
for delete
to authenticated
using (public.is_admin());

drop trigger if exists offer_headlines_set_updated_at on public.offer_headlines;
create trigger offer_headlines_set_updated_at
before update on public.offer_headlines
for each row
execute function public.set_updated_at();

insert into public.offer_headlines (
  slug,
  eyebrow,
  headline,
  subheadline,
  cta_label,
  cta_url,
  tone,
  is_active,
  display_order
)
values (
  'live-room-launch',
  'Live Trading Access',
  'Join the next live room cycle before seats reset.',
  'Premium access, Discord role, and structured live-market sessions.',
  'Get access',
  '/live-trading',
  'gold',
  true,
  1
)
on conflict (slug) do nothing;
