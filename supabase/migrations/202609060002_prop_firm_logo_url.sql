alter table public.prop_firms
add column if not exists logo_url text;

update public.prop_firms
set logo_url = null
where slug in (
  'alpha-futures',
  'earn2trade',
  'fundednext',
  'alpha-capital-group',
  'funding-pips'
)
and logo_url is null;
