-- Phase 4.2: Evidence-Based Career Knowledge Base schema
-- Safe to re-run: every statement is idempotent and non-destructive.
-- Preserves all existing profiles, assessments, and career_goals.

-- ---------------------------------------------------------------------------
-- 1. career_knowledge table: Stores canonical, evidence-based career intelligence
-- ---------------------------------------------------------------------------
create table if not exists public.career_knowledge (
  id              text primary key,
  slug            text not null unique,
  soc_code        text,
  nco_code        text,
  canonical_title text not null,
  category        text not null default 'General',
  industry        text not null default 'General',
  domain          text not null default 'other_specialized',
  description     text,
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Indexes for high-speed search, domain filtering, and JSONB queries
-- ---------------------------------------------------------------------------
create index if not exists idx_career_knowledge_slug on public.career_knowledge (slug);
create index if not exists idx_career_knowledge_domain on public.career_knowledge (domain);
create index if not exists idx_career_knowledge_soc on public.career_knowledge (soc_code);
create index if not exists idx_career_knowledge_data_gin on public.career_knowledge using gin (data);

-- ---------------------------------------------------------------------------
-- 3. Automatic touch trigger for updated_at
-- ---------------------------------------------------------------------------
drop trigger if exists career_knowledge_touch on public.career_knowledge;
create trigger career_knowledge_touch before update on public.career_knowledge
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Row Level Security (RLS)
-- Career reference intelligence is publicly readable by all students and guests.
-- Writes are restricted to administrative / service role.
-- ---------------------------------------------------------------------------
alter table public.career_knowledge enable row level security;

drop policy if exists "public read career knowledge" on public.career_knowledge;
create policy "public read career knowledge" on public.career_knowledge
  for select using (true);
