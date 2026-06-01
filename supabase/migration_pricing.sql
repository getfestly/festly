-- ============================================================================
-- MIGRATION: Flexible Preismodelle für listings
-- STATUS: bereits ausgeführt in Supabase
-- ============================================================================

-- Enum-Typ für Preismodelle
CREATE TYPE price_model AS ENUM (
  'flat',        -- Pauschale/Tag
  'per_person',  -- pro Person
  'flat_plus',   -- Pauschale + je Einheit (z.B. Pauschale + pro Toilettenwagen)
  'hourly',      -- Stundensatz
  'on_request'   -- auf Anfrage
);

-- Spalten zur listings-Tabelle hinzufügen
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS price_model price_model NOT NULL DEFAULT 'flat',
  ADD COLUMN IF NOT EXISTS price_unit_label TEXT;
  -- Freitext-Label für die Einheit, z.B. "Person", "Stunde", "Wagen"
  -- NULL erlaubt (bei flat und on_request nicht benötigt)

-- Hinweis: price_cents bleibt der zentrale Preisbetrag (Betrag pro Tag / Person / Stunde).
