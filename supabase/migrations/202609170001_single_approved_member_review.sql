create or replace function public.approve_member_review(p_review_id uuid)
returns public.member_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review public.member_reviews;
  v_reviewed_at timestamptz := now();
begin
  if not public.is_staff() then
    raise exception 'Only staff can approve member reviews.' using errcode = '42501';
  end if;

  select *
  into v_review
  from public.member_reviews
  where id = p_review_id
  for update;

  if not found then
    raise exception 'Member review not found.' using errcode = 'P0002';
  end if;

  delete from public.member_reviews
  where user_id = v_review.user_id
    and status = 'approved'
    and id <> v_review.id;

  update public.member_reviews
  set
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = v_reviewed_at
  where id = p_review_id
  returning * into v_review;

  return v_review;
end;
$$;

grant execute on function public.approve_member_review(uuid) to authenticated;

with ranked_reviews as (
  select
    id,
    row_number() over (
      partition by user_id
      order by coalesce(reviewed_at, updated_at, created_at) desc, created_at desc, id desc
    ) as review_rank
  from public.member_reviews
  where status = 'approved'
)
delete from public.member_reviews reviews
using ranked_reviews
where reviews.id = ranked_reviews.id
  and ranked_reviews.review_rank > 1;

create unique index if not exists member_reviews_one_approved_per_user
on public.member_reviews (user_id)
where status = 'approved';
