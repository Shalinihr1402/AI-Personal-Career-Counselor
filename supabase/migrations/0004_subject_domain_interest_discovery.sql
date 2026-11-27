-- ---------------------------------------------------------------------------
-- 0004_subject_domain_interest_discovery.sql
-- Subject & Domain-Based Interest Discovery schema
-- Stores activity logs, voluntary exploration, and multi-category interest profiles
-- ---------------------------------------------------------------------------

-- 1. Activity Interaction Logs
create table if not exists public.interest_activity_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  domain_id         text not null,
  activity_id       text not null,
  status            text not null check (status in ('started', 'completed', 'skipped', 'replayed')),
  responses         jsonb not null default '{}'::jsonb,
  enjoyment_rating  text check (enjoyment_rating in ('loved', 'enjoyed', 'neutral', 'disliked')),
  feedback_note     text,
  education_level   text check (education_level in ('class_10', 'puc', 'diploma', 'undergraduate', 'graduate', 'other')),
  difficulty        text check (difficulty in ('foundational', 'intermediate', 'advanced')),
  replay_count      integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint interest_activity_logs_user_domain_activity_unique unique (user_id, domain_id, activity_id)
);

create index if not exists idx_interest_logs_user_domain 
  on public.interest_activity_logs (user_id, domain_id, created_at desc);

create index if not exists idx_interest_logs_activity 
  on public.interest_activity_logs (activity_id);

-- 2. Multi-Category Interest Profiles (Declared, Explored, Emerging, Confirmed)
create table if not exists public.student_interest_profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users on delete cascade unique,
  declared_interests   jsonb not null default '[]'::jsonb,
  explored_interests   jsonb not null default '[]'::jsonb,
  emerging_interests   jsonb not null default '[]'::jsonb,
  confirmed_interests  jsonb not null default '[]'::jsonb,
  counselor_summary    text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_student_interest_profiles_user 
  on public.student_interest_profiles (user_id);

-- Enable Row Level Security
alter table public.interest_activity_logs enable row level security;
alter table public.student_interest_profiles enable row level security;

-- RLS Policies: users manage only their own interest logs & profiles
create policy "Users can view their own activity logs"
  on public.interest_activity_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own activity logs"
  on public.interest_activity_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own activity logs"
  on public.interest_activity_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view their own interest profiles"
  on public.student_interest_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own interest profiles"
  on public.student_interest_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own interest profiles"
  on public.student_interest_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
