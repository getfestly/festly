-- Migration 005 — paid_at Spalte in bookings
-- Datum: 2026-06-03
-- In Supabase SQL-Editor ausführen

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;
