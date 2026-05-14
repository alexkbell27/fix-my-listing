alter table profiles add column if not exists subscription_tier text default 'free';
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;

create table if not exists purchased_reports (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  listing_url_hash text not null,
  listing_url text not null,
  runs_used integer default 0,
  max_runs integer default 3,
  purchased_at timestamp with time zone default now()
);

alter table purchased_reports enable row level security;
create policy "Users can read own purchased reports"
  on purchased_reports for select using (auth.uid() = user_id);
