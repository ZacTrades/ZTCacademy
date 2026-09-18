drop policy if exists "Admins can delete trading tools" on public.trading_tools;

create policy "Admins can delete trading tools"
on public.trading_tools
for delete
using (public.is_admin());
