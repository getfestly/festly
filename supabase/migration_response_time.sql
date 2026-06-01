-- ============================================================================
-- MIGRATION: Antwortzeit-Tracking (Etappe X)
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS provider_responded_at timestamptz;
