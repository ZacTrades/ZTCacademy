-- Ensure mentorship/coaching checkout rows can be upserted per user and plan.
-- Older databases may have the user_memberships table without this unique rule.

-- If duplicates exist, keep the most important/newest row and remove duplicate rows
-- for the same user + plan so the unique constraint can be created safely.
with ranked_memberships as (
  select
    id,
    row_number() over (
      partition by user_id, plan_slug
      order by
        case status
          when 'paid' then 1
          when 'pending' then 2
          when 'unpaid' then 3
          when 'expired' then 4
          when 'cancelled' then 5
          else 6
        end,
        updated_at desc nulls last,
        created_at desc nulls last
    ) as keep_rank
  from public.user_memberships
)
delete from public.user_memberships memberships
using ranked_memberships ranked
where memberships.id = ranked.id
  and ranked.keep_rank > 1;

-- Add the unique constraint required by upsert(... onConflict: "user_id,plan_slug").
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_memberships_user_id_plan_slug_key'
      and conrelid = 'public.user_memberships'::regclass
  ) then
    alter table public.user_memberships
    add constraint user_memberships_user_id_plan_slug_key unique (user_id, plan_slug);
  end if;
end;
$$;

-- Make sure existing users have the two baseline membership rows.
insert into public.user_memberships (user_id, plan_slug, status)
select profiles.id, plan.slug, 'unpaid'
from public.profiles
cross join (values ('one_to_one'), ('group')) as plan(slug)
on conflict (user_id, plan_slug) do nothing;
