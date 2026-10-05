alter table public.discount_codes drop constraint if exists discount_codes_applies_to_check;

alter table public.discount_codes add constraint discount_codes_applies_to_check
check (
  applies_to = 'all'
  or applies_to ~ '^(live|live_one_month|live_three_months|live_six_months|live_twelve_months|mentorship|mentorship_one_to_one|mentorship_group|news)(,(live|live_one_month|live_three_months|live_six_months|live_twelve_months|mentorship|mentorship_one_to_one|mentorship_group|news))*$'
);
