-- ============================================================
-- Migration 003 — Availability & Booking columns
-- Datum: 2026-06-03
-- In Supabase SQL-Editor ausführen (als Service Role / Admin)
-- ============================================================


-- ── Migration 1: Fehlende Spalten in bookings ───────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS price_snapshot_cents integer,
  ADD COLUMN IF NOT EXISTS price_snapshot_model  text,
  ADD COLUMN IF NOT EXISTS price_snapshot_label  text,
  ADD COLUMN IF NOT EXISTS paid_at               timestamptz,
  ADD COLUMN IF NOT EXISTS event_date_end        date;


-- ── Migration 2: Aufbauzeit in listings ─────────────────────
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS setup_days integer NOT NULL DEFAULT 0;


-- ── Migration 3: listing_availability ───────────────────────
CREATE TABLE IF NOT EXISTS listing_availability (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id   uuid    NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  blocked_from date    NOT NULL,
  blocked_until date   NOT NULL,
  reason       text,          -- z.B. "gebucht", "urlaub", "wartung"
  created_at   timestamptz    DEFAULT now(),
  CONSTRAINT valid_range CHECK (blocked_until >= blocked_from)
);

ALTER TABLE listing_availability ENABLE ROW LEVEL SECURITY;

-- Anbieter darf nur seine eigenen Einträge lesen/schreiben
CREATE POLICY "Anbieter sieht eigene Verfügbarkeit" ON listing_availability
  FOR ALL USING (
    listing_id IN (
      SELECT id FROM listings WHERE provider_id = auth.uid()
    )
  );

-- Öffentlich lesbar (für Buchungsformular)
CREATE POLICY "Öffentlich lesbar" ON listing_availability
  FOR SELECT USING (true);

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_availability_listing_dates
  ON listing_availability(listing_id, blocked_from, blocked_until);
