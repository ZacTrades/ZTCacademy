create unique index if not exists profiles_email_unique_lower
on public.profiles (lower(email))
where email is not null;
