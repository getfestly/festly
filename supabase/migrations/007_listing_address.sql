-- Migration: Standort-/Adressfeld für Listings
-- Datum: 2026-06-04
-- In Supabase SQL Editor ausführen (Service Role)

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS location_address text;
