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
