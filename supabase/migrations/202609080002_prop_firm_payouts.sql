-- Keep Propfirms backend aligned with the public table design.
-- The frontend displays this field as the Payouts column.
alter table public.prop_firms
add column if not exists payout text not null default 'Bi-weekly';

update public.prop_firms
set
  payout = case slug
    when 'alpha-futures' then 'Bi-weekly'
    when 'earn2trade' then 'Monthly'
    when 'fundednext' then 'Bi-weekly'
    when 'alpha-capital-group' then 'Bi-weekly'
    when 'funding-pips' then 'Bi-weekly'
    else payout
  end,
  updated_at = now()
where slug in (
  'alpha-futures',
  'earn2trade',
  'fundednext',
  'alpha-capital-group',
  'funding-pips'
);
