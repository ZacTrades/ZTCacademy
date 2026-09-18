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
