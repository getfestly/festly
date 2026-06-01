-- ============================================================================
-- MIGRATION: Rechtliche Pflichtseiten (Etappe 10)
-- Ausführen in: Supabase Dashboard → SQL Editor
--
-- Speichert den Zeitpunkt der AGB-Zustimmung bei der Registrierung.
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS accepted_terms_at timestamptz;
