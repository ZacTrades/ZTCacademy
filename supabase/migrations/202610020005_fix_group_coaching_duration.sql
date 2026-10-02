create or replace function public.confirm_local_mentorship_payment(
  p_plan_slug text,
  p_amount_label text,
  p_card_last4 text
)
returns public.user_memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_checkout_id text := 'local_' || gen_random_uuid()::text;
  v_membership public.user_memberships;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_plan_slug not in ('one_to_one', 'group') then
    raise exception 'Invalid mentorship plan';
  end if;

  insert into public.user_memberships (
    user_id,
    plan_slug,
    status,
    payment_provider,
    provider_checkout_id,
    amount_label,
    paid_at,
    access_starts_at,
    access_expires_at,
    notes
  )
  values (
    v_user_id,
    p_plan_slug,
    'paid',
    'local_checkout',
    v_checkout_id,
    p_amount_label,
    now(),
    now(),
    case
      when p_plan_slug = 'one_to_one' then now() + interval '1 year'
      when p_plan_slug = 'group' then now() + interval '4 months'
      else now() + interval '4 months'
    end,
    'Temporary local checkout confirmation. Payment reference: ' || p_card_last4 || '. Replace with payment gateway webhook before production.'
  )
  on conflict (user_id, plan_slug) do update
  set
    status = excluded.status,
    payment_provider = excluded.payment_provider,
    provider_checkout_id = excluded.provider_checkout_id,
    amount_label = excluded.amount_label,
    paid_at = excluded.paid_at,
    access_starts_at = excluded.access_starts_at,
    access_expires_at = excluded.access_expires_at,
    notes = excluded.notes
  returning * into v_membership;

  return v_membership;
end;
$$;

revoke execute on function public.confirm_local_mentorship_payment(text, text, text) from public, anon, authenticated;
