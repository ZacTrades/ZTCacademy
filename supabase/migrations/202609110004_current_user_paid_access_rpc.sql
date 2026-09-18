create or replace function public.current_user_has_paid_access()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_paid_access(auth.uid());
$$;

grant execute on function public.current_user_has_paid_access() to authenticated;
