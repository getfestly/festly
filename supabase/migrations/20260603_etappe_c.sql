-- ============================================================
-- Festly Etappe C — Migration
-- Datum: 2026-06-03
-- In Supabase SQL-Editor ausführen (als Service Role / Admin)
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1a) Tabelle "listings" — neue Spalten
-- ────────────────────────────────────────────────────────────

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS subcategory        text,
  ADD COLUMN IF NOT EXISTS vehicle_type       text,
  ADD COLUMN IF NOT EXISTS event_date_from    date,
  ADD COLUMN IF NOT EXISTS event_date_to      date,
  ADD COLUMN IF NOT EXISTS is_promoted        boolean default false,
  ADD COLUMN IF NOT EXISTS promoted_until     timestamptz;


-- ────────────────────────────────────────────────────────────
-- 1b) Neue Tabelle "events_public"
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events_public (
  id          uuid        primary key default gen_random_uuid(),
  title       text,
  city        text,
  region      text,
  event_date  date,
  source      text,
  created_at  timestamptz default now()
);

ALTER TABLE events_public ENABLE ROW LEVEL SECURITY;

-- Jeder darf lesen
CREATE POLICY "read_events_public" ON events_public
  FOR SELECT USING (true);


-- ────────────────────────────────────────────────────────────
-- 1c) Neue Tabelle "search_events"
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS search_events (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        references profiles(id) on delete set null,
  category         text,
  subcategory      text,
  region           text,
  event_date_from  date,
  event_date_to    date,
  results_count    integer,
  created_at       timestamptz default now()
);

ALTER TABLE search_events ENABLE ROW LEVEL SECURITY;

-- Jeder darf inserieren (anonym + eingeloggt), niemand darf lesen
-- (Auswertung nur via Service Role / Admin)
CREATE POLICY "insert_search_events" ON search_events
  FOR INSERT WITH CHECK (true);


-- ────────────────────────────────────────────────────────────
-- 1d) Neue Tabelle "subscriptions"
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subscriptions (
  id           uuid        primary key default gen_random_uuid(),
  provider_id  uuid        references profiles(id) on delete cascade,
  plan         text        check (plan in ('pro', 'insights')),
  status       text        check (status in ('active', 'cancelled')),
  started_at   timestamptz default now(),
  ends_at      timestamptz,
  amount_cents integer
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Anbieter sieht nur seine eigenen Abonnements
CREATE POLICY "own_subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = provider_id);
