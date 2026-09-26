-- Phase 1 (career counselor): profiles, assessments, career goals.
-- Run once in Supabase: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------------------
-- profiles: one row per student (onboarding answers + "Know me" profile)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id             uuid primary key references auth.users on delete cascade,
  path                text check (path in ('know_goal', 'not_sure', 'need_plan')),
  college             text,
  course              text,
  year                text,
  interests           text[] not null default '{}',
  strengths_note      text,
  target_role         text,
  hours_per_week      text,
  resume              jsonb,
  know_me             jsonb,
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- assessments: every completed discovery run (latest one is shown)
-- ---------------------------------------------------------------------------
create table if not exists public.assessments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  answers     jsonb not null,
  work_style  jsonb not null default '{}',
  know_me     jsonb,
  scores      jsonb not null,
  code        text not null,
  matches     jsonb not null default '[]',
  source      text check (source in ('ai', 'rule')),
  created_at  timestamptz not null default now()
);
create index if not exists assessments_user_created on public.assessments (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- career_goals: the career a student confirms (used from step C5 onward)
-- ---------------------------------------------------------------------------
create table if not exists public.career_goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  career_title  text not null,
  field         text,
  reason        text,
  status        text not null default 'active' check (status in ('active', 'archived')),
  confirmed_at  timestamptz not null default now()
);
create unique index if not exists career_goals_one_active
  on public.career_goals (user_id) where status = 'active';

-- ---------------------------------------------------------------------------
-- keep profiles.updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: each student can only see and change their own rows
-- ---------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.assessments  enable row level security;
alter table public.career_goals enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own assessments" on public.assessments;
create policy "own assessments" on public.assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own goals" on public.career_goals;
create policy "own goals" on public.career_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
