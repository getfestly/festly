-- ============================================================================
-- MIGRATION: Bewertungssystem erweitern (Etappe 9)
-- Ausführen in: Supabase Dashboard → SQL Editor
--
-- Fügt provider_id und listing_id zur reviews-Tabelle hinzu,
-- und setzt die UNIQUE-Constraint auf (booking_id) allein
-- (eine Bewertung pro Buchung, unabhängig vom Reviewer).
-- ============================================================================

ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS provider_id uuid references profiles(id) on delete cascade,
  ADD COLUMN IF NOT EXISTS listing_id  uuid references listings(id)  on delete cascade;

-- Alte Compound-Constraint entfernen, neue einfache ersetzen
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_booking_id_reviewer_id_key;

DO $$ BEGIN
  ALTER TABLE reviews ADD CONSTRAINT reviews_booking_id_key UNIQUE (booking_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Indizes für schnelle Rating-Abfragen
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_listing  ON reviews(listing_id);
