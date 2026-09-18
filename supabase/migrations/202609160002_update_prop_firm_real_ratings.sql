update public.prop_firms
set rating = case slug
  when 'fundednext' then 4.3
  when 'alpha-capital-group' then 4.4
  when 'earn2trade' then 4.4
  when 'funding-pips' then 4.2
  when 'alpha-futures' then 4.4
  else rating
end
where slug in (
  'fundednext',
  'alpha-capital-group',
  'earn2trade',
  'funding-pips',
  'alpha-futures'
);
