-- Profiles table: one row per auth user
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  free_runs_used integer default 0,
  paid_runs integer default 0,
  created_at timestamp with time zone default now()
);

-- Reports table: stores analysis results
create table reports (
  id text primary key,
  user_id uuid references profiles(id),
  listing_url text,
  result jsonb,
  created_at timestamp with time zone default now()
);

-- Row-level security
alter table profiles enable row level security;
alter table reports enable row level security;

create policy "Users can read own profile" on profiles
  for select using (auth.uid() = id);

create policy "Users can read own reports" on reports
  for select using (auth.uid() = user_id);

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
