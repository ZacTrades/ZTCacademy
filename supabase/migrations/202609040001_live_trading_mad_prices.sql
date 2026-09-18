-- Update Live Trading package prices so MAD display is 1,800 MAD and 3,480 MAD.
-- The app stores source prices in USD and converts to MAD at display/checkout time.

update public.live_trading_packages
set price = '$180',
    monthly_label = '$30/mo',
    updated_at = now()
where slug = 'six_months';

update public.live_trading_packages
set price = '$348',
    monthly_label = '$29/mo',
    updated_at = now()
where slug = 'twelve_months';
