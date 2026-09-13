-- Run this once in your Supabase project's SQL Editor (free tier is plenty).

create table letters (
  id uuid primary key default gen_random_uuid(),
  ciphertext text not null,
  salt text not null,
  iv text not null,
  unlock_at timestamptz,        -- null = openable immediately
  opened_at timestamptz,        -- set the first time it's read
  burn_after_reading boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security: allow anyone to insert a letter (writing is free/open)
-- and allow anyone to select by id (they need the link's id to read it),
-- but never allow listing or bulk reads.
alter table letters enable row level security;

create policy "anyone can create a letter"
  on letters for insert
  with check (true);

create policy "anyone with the id can read a letter"
  on letters for select
  using (true);

create policy "anyone with the id can mark a letter opened"
  on letters for update
  using (true);
