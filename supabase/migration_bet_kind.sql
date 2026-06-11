-- ============================================================================
-- Migration: two bet types (exact score vs. winner-only).
-- Run once in Supabase → SQL Editor after schema.sql.
-- ============================================================================

alter table public.bets
  add column if not exists kind text not null default 'score',
  add column if not exists pick text;

-- Integrity guards so the rules can't be broken via the API:
--   • kind must be one of the two allowed values
--   • a winner bet must carry a valid pick (H/D/A); a score bet must not
alter table public.bets drop constraint if exists bets_kind_chk;
alter table public.bets add constraint bets_kind_chk
  check (kind in ('score', 'winner'));

alter table public.bets drop constraint if exists bets_pick_chk;
alter table public.bets add constraint bets_pick_chk check (
  (kind = 'winner' and pick in ('H', 'D', 'A')) or
  (kind = 'score'  and pick is null)
);
