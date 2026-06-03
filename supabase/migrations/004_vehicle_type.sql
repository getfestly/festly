-- Migration 004 — vehicle_type Spalte in listings
-- Datum: 2026-06-03
-- In Supabase SQL-Editor ausführen

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS vehicle_type text;
