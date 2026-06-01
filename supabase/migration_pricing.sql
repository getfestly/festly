-- ============================================================================
-- MIGRATION: Flexible Preismodelle für listings
-- Ausführen in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- 1. Enum-Typ für Preismodelle anlegen
create type pricing_model as enum (
  'flat_day',            -- Tagespauschale
  'per_person',          -- Preis pro Person
  'base_plus_quantity',  -- Grundpreis + inkludierte Menge + Preis je Einheit
  'hourly',              -- Stundensatz (opt. Grundpreis + inkl. Stunden)
  'on_request'           -- Preis auf Anfrage
);

-- 2. Neue Spalten zur listings-Tabelle hinzufügen (alle nullable für Rückwärtskompatibilität)
alter table listings
  add column pricing_model        pricing_model,
  add column base_price_cents     integer,       -- Grund-/Tagespreis
  add column included_quantity    integer,       -- inkludierte Stunden/Mengen-Einheiten
  add column price_per_unit_cents integer,       -- Preis je weitere Stunde/Person/Einheit
  add column min_quantity         integer,       -- Mindestmenge/-personen
  add column unit_label           text;          -- z.B. "Person", "Stück", "Stunde"

-- Hinweis: price_cents bleibt erhalten und wird beim Speichern als Sortierfeld
-- automatisch aus dem gewählten Preismodell befüllt (siehe App-Code).
