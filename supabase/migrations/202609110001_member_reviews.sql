create table if not exists public.member_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  display_name text not null,
  email text,
  message text not null,
  rating integer not null default 5,
  status text not null default 'pending',
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_reviews_rating_check check (rating between 1 and 5),
  constraint member_reviews_status_check check (status in ('pending', 'approved', 'hidden')),
  constraint member_reviews_message_length_check check (
    char_length(trim(message)) between 10 and 2000
  )
);

alter table public.member_reviews enable row level security;

drop policy if exists "Anyone can read approved member reviews" on public.member_reviews;
create policy "Anyone can read approved member reviews"
on public.member_reviews
for select
using (status = 'approved' or auth.uid() = user_id or public.is_staff());

drop policy if exists "Members can submit their own pending reviews" on public.member_reviews;
create policy "Members can submit their own pending reviews"
on public.member_reviews
for insert
with check (
  auth.uid() = user_id
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Members can update their own pending reviews" on public.member_reviews;
create policy "Members can update their own pending reviews"
on public.member_reviews
for update
using (auth.uid() = user_id and status = 'pending')
with check (
  auth.uid() = user_id
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

drop policy if exists "Admins can moderate member reviews" on public.member_reviews;
create policy "Admins can moderate member reviews"
on public.member_reviews
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete member reviews" on public.member_reviews;
create policy "Admins can delete member reviews"
on public.member_reviews
for delete
using (public.is_admin());

drop trigger if exists member_reviews_set_updated_at on public.member_reviews;
create trigger member_reviews_set_updated_at
before update on public.member_reviews
for each row
execute function public.set_updated_at();
