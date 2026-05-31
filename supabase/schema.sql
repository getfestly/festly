-- ============================================================================
-- FESTLY — Datenbank-Schema (PostgreSQL / Supabase)
-- B2C-Marktplatz für Event-Dienstleistungen mit Treuhand-Zahlung
-- ============================================================================
-- Dieses Schema setzt die fünf Kern-Entscheidungen um:
--   1. Provision: 15 % pro Buchung
--   2. Auszahlung: Kunde bestätigt ODER Frist (7 Tage) läuft ab
--   3. Storno: gestaffelt nach Vorlauf
--   4. Region: ganz Deutschland
--   5. Verifizierung: rechnungs-/steuerrelevante Daten (Stripe-KYC + PStTG)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ENUM-Typen (feste Auswahllisten)
-- ---------------------------------------------------------------------------
create type user_role as enum ('provider', 'customer');

create type listing_category as enum (
  'food',            -- Caterer, Foodtrucks, Imbiss
  'ride',            -- Fahrgeschäfte, Karussell
  'music',           -- DJs, Bands, Musiker
  'sanitation',      -- Toilettenwagen
  'tech',            -- Eventtechnik, Licht, Ton
  'rental',          -- Zelte, Mobiliar, Geschirr
  'other'
);

create type booking_status as enum (
  'pending',         -- Anfrage gesendet, Anbieter hat noch nicht reagiert
  'accepted',        -- Anbieter hat angenommen, Zahlung ausstehend
  'paid',            -- Kunde hat gezahlt, Geld im Treuhand (Escrow)
  'completed',       -- Event vorbei, Geld freigegeben/ausgezahlt
  'cancelled',       -- Storniert (siehe cancellation_* Felder)
  'rejected'         -- Anbieter hat abgelehnt
);

create type payment_status as enum (
  'pending',         -- Zahlung initiiert
  'held',            -- Geld im Treuhand bei Stripe
  'released',        -- An Anbieter ausgezahlt
  'refunded'         -- An Kunde zurückerstattet
);

-- ---------------------------------------------------------------------------
-- KONSTANTEN als Kommentar (im Code/ENV hinterlegen, hier zur Doku)
--   PLATTFORM-PROVISION = 0.15  (15 %)
--   AUTO-RELEASE-FRIST  = 7 Tage nach Event ohne Kundenbestätigung
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- PROFILES — erweitert Supabase auth.users
-- (Supabase legt Konten in auth.users an; hier kommen die Festly-Daten dazu)
-- ---------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  role          user_role not null,
  display_name  text not null,
  bio           text,
  region        text,                    -- z.B. "Niedersachsen", "Berlin"
  postal_code   text,
  avatar_url    text,

  -- Rechnungs-/Steuerdaten (PStTG-Pflicht für Anbieter, die Geld empfangen)
  legal_name    text,                    -- vollständiger Name oder Firma
  address       text,
  tax_id        text,                    -- Steuer-ID / USt-IdNr.
  stripe_account_id text,                -- Stripe-Connect-Konto (KYC via Stripe)
  is_verified   boolean default false,   -- optionales "Verifiziert"-Badge

  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- LISTINGS — angebotene Leistungen
-- ---------------------------------------------------------------------------
create table listings (
  id            uuid primary key default gen_random_uuid(),
  provider_id   uuid not null references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  category      listing_category not null,
  price_cents   integer not null,        -- Preis in Cent (z.B. 25000 = 250,00 €)
  region        text,                    -- Einsatzgebiet
  photos        text[] default '{}',     -- URLs aus Supabase Storage
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- BOOKINGS — Buchungen / Anfragen
-- ---------------------------------------------------------------------------
create table bookings (
  id              uuid primary key default gen_random_uuid(),
  listing_id      uuid not null references listings(id) on delete restrict,
  customer_id     uuid not null references profiles(id) on delete restrict,
  provider_id     uuid not null references profiles(id) on delete restrict,

  event_date      date not null,
  status          booking_status not null default 'pending',

  -- Beträge (in Cent), bei Annahme fixiert
  amount_cents          integer not null,      -- Gesamtpreis an Kunde
  commission_cents      integer not null,      -- 15 % Festly-Provision
  provider_payout_cents integer not null,      -- Auszahlung an Anbieter (85 %)

  -- Storno-Felder (gestaffelt nach Vorlauf)
  cancelled_at          timestamptz,
  cancelled_by          user_role,
  cancellation_fee_cents integer,              -- einbehaltener Betrag bei Storno

  -- Auszahlungs-Trigger: Kunde bestätigt ODER Frist läuft ab
  customer_confirmed_at timestamptz,           -- Kunde hat Leistung bestätigt
  auto_release_at       timestamptz,           -- Event-Datum + 7 Tage

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- PAYMENTS — Zahlungs- & Auszahlungsstatus (Spiegel zu Stripe)
-- ---------------------------------------------------------------------------
create table payments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null references bookings(id) on delete cascade,
  stripe_payment_intent_id text,         -- Referenz auf Stripe
  stripe_transfer_id  text,              -- Referenz auf Auszahlung an Anbieter
  amount_cents        integer not null,
  status              payment_status not null default 'pending',
  held_at             timestamptz,       -- Zeitpunkt Treuhand
  released_at         timestamptz,       -- Zeitpunkt Auszahlung
  created_at          timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- REVIEWS — Bewertungen nach abgeschlossener Buchung
-- ---------------------------------------------------------------------------
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references bookings(id) on delete cascade,
  reviewer_id   uuid not null references profiles(id) on delete cascade,
  rating        integer not null check (rating between 1 and 5),
  comment       text,
  created_at    timestamptz default now(),
  unique (booking_id, reviewer_id)       -- eine Bewertung pro Buchung & Person
);

-- ---------------------------------------------------------------------------
-- INDIZES für schnelle Suche
-- ---------------------------------------------------------------------------
create index idx_listings_category on listings(category);
create index idx_listings_region   on listings(region);
create index idx_listings_provider on listings(provider_id);
create index idx_bookings_customer on bookings(customer_id);
create index idx_bookings_provider on bookings(provider_id);
create index idx_bookings_status   on bookings(status);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) — Datenschutz auf Zeilenebene
-- Stellt sicher, dass jeder nur sieht/ändert, was er darf.
-- ============================================================================
alter table profiles enable row level security;
alter table listings enable row level security;
alter table bookings enable row level security;
alter table payments enable row level security;
alter table reviews  enable row level security;

-- PROFILES: jeder darf öffentliche Profile lesen, nur sich selbst ändern
create policy "Profile öffentlich lesbar"
  on profiles for select using (true);
create policy "Eigenes Profil bearbeiten"
  on profiles for update using (auth.uid() = id);
create policy "Eigenes Profil anlegen"
  on profiles for insert with check (auth.uid() = id);

-- LISTINGS: aktive Angebote für alle sichtbar; nur Anbieter ändert seine
create policy "Aktive Listings lesbar"
  on listings for select using (is_active = true or auth.uid() = provider_id);
create policy "Anbieter verwaltet eigene Listings"
  on listings for all using (auth.uid() = provider_id);

-- BOOKINGS: nur beteiligte Parteien (Kunde oder Anbieter) sehen die Buchung
create policy "Beteiligte sehen Buchung"
  on bookings for select
  using (auth.uid() = customer_id or auth.uid() = provider_id);
create policy "Kunde erstellt Buchung"
  on bookings for insert with check (auth.uid() = customer_id);
create policy "Beteiligte aktualisieren Buchung"
  on bookings for update
  using (auth.uid() = customer_id or auth.uid() = provider_id);

-- PAYMENTS: nur lesbar für Beteiligte der zugehörigen Buchung
create policy "Beteiligte sehen Zahlung"
  on payments for select using (
    exists (
      select 1 from bookings b
      where b.id = payments.booking_id
        and (auth.uid() = b.customer_id or auth.uid() = b.provider_id)
    )
  );

-- REVIEWS: für alle lesbar, nur Beteiligte schreiben
create policy "Bewertungen lesbar"
  on reviews for select using (true);
create policy "Beteiligte bewerten"
  on reviews for insert with check (auth.uid() = reviewer_id);

-- ============================================================================
-- TRIGGER — automatische Berechnung der Beträge bei Buchung
-- 15 % Provision, 85 % Auszahlung; auto_release_at = event_date + 7 Tage
-- ============================================================================
create or replace function calc_booking_amounts()
returns trigger as $$
begin
  -- Provision = 15 % des Gesamtbetrags, kaufmännisch gerundet
  new.commission_cents := round(new.amount_cents * 0.15);
  new.provider_payout_cents := new.amount_cents - new.commission_cents;
  -- Auszahlungsfrist: 7 Tage nach Event ohne Kundenbestätigung
  new.auto_release_at := (new.event_date + interval '7 days');
  return new;
end;
$$ language plpgsql;

create trigger trg_calc_amounts
  before insert on bookings
  for each row execute function calc_booking_amounts();
