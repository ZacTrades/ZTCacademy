-- Replace the old public prop firm discount wording with the ZacTrades Max Discount label.
update public.prop_firms
set
  discount = 'Max Discount',
  updated_at = now()
where slug in (
  'alpha-futures',
  'earn2trade',
  'fundednext',
  'alpha-capital-group',
  'funding-pips'
);
