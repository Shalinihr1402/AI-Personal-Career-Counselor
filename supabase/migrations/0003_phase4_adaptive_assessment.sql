-- Phase 4.3: Adaptive Assessment Persistence schema
-- Safe to re-run: every statement is idempotent and non-destructive.
-- Preserves all existing profiles, assessments, and career_goals.

-- ---------------------------------------------------------------------------
-- 1. Add adaptive_evidence column to public.assessments
-- Stores canonical demonstrated competencies, evidence breakdown,
-- statutory eligibility, and calibrated stage.
-- ---------------------------------------------------------------------------
alter table public.assessments
  add column if not exists adaptive_evidence jsonb default null;

-- ---------------------------------------------------------------------------
-- 2. Index for querying competencies or statutory pathways in JSONB
-- ---------------------------------------------------------------------------
create index if not exists idx_assessments_adaptive_evidence_gin
  on public.assessments using gin (adaptive_evidence);
