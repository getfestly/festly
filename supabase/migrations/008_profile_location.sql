-- Migration: Standort-Adresse für Profile
-- Datum: 2026-06-04
-- In Supabase SQL Editor ausführen (Service Role)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS location_address text;
