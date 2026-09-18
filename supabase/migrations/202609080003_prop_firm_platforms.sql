-- Store the public Propfirms platform chips in the backend.
-- The app uses prop_firms.features as the editable Platforms list.
update public.prop_firms
set
  features = case slug
    when 'alpha-futures' then array['TV', 'Web']
    when 'earn2trade' then array['TV', 'Web']
    when 'fundednext' then array['MT5', 'App', 'Web']
    when 'alpha-capital-group' then array['MT5', 'Web']
    when 'funding-pips' then array['MT5', 'Web']
    else features
  end,
  updated_at = now()
where slug in (
  'alpha-futures',
  'earn2trade',
  'fundednext',
  'alpha-capital-group',
  'funding-pips'
);
