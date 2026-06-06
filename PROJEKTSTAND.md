# Festly — Projektstand 06.06.2026

B2C-Marktplatz für Eventdienstleistungen in Deutschland. Treuhand-Zahlungsmodell: Kundengeld liegt bei Festly (via Stripe), Auszahlung an Anbieter nach Event-Bestätigung oder automatisch nach 7 Tagen.

---

## 1. Seiten (app/)

### Öffentlich

| Route | Datei | Funktion |
|-------|-------|----------|
| `/` | `app/page.js` | Startseite — Server Component, lädt Featured Listings |
| `/marktplatz` | `app/marktplatz/page.js` | Angebots-Übersicht mit Filter (Kategorie, Region, Suche, Sortierung), Pagination |
| `/angebote/[id]` | `app/angebote/[id]/page.js` | Listing-Detailseite mit Preisrechner und Anfrage-Button |
| `/so-funktionierts` | `app/so-funktionierts/page.js` | Erklärseite — Ablauf für Kunden & Anbieter, FAQ-Akkordeon, CTA |
| `/login` | `app/login/page.js` | E-Mail/Passwort Login, `window.location.href` Redirect nach `/mein-bereich` |
| `/register` | `app/register/page.js` | Registrierung, legt Profil via `upsert` an, E-Mail-Verifikation falls nötig |
| `/auth/forgot-password` | `app/auth/forgot-password/page.js` | Passwort-Reset-E-Mail anfordern |
| `/auth/reset-password` | `app/auth/reset-password/page.js` | Neues Passwort setzen (nach E-Mail-Link) |
| `/auth/verify-email` | `app/auth/verify-email/page.js` | Hinweisseite nach Registrierung |
| `/agb` | `app/agb/page.js` | Allgemeine Geschäftsbedingungen (statisch) |
| `/datenschutz` | `app/datenschutz/page.js` | Datenschutzerklärung (statisch) |
| `/impressum` | `app/impressum/page.js` | Impressum (statisch) |
| `/widerruf` | `app/widerruf/page.js` | Widerrufsbelehrung (statisch) |
| `/faq` | `app/faq/page.js` | Häufige Fragen (statisch) |
| `/ueber-festly` | `app/ueber-festly/page.js` | Über uns (statisch) |

### SEO-Seiten (statisch generiert)

| Route | Datei | Funktion |
|-------|-------|----------|
| `/[kategorie]/[region]/[anlass]` | `app/[kategorie]/[region]/[anlass]/page.js` | Programmatische SEO-Seiten, ~80+ Kombinationen aus Kategorien × Regionen × Anlässen |
| `/huepfburg-mieten` | `app/huepfburg-mieten/page.js` | Kategorie-Landingpage |
| `/toilettenwagen-mieten` | `app/toilettenwagen-mieten/page.js` | Kategorie-Landingpage |
| `/festzelt-mieten` | `app/festzelt-mieten/page.js` | Kategorie-Landingpage |
| `/imbisswagen-mieten` | `app/imbisswagen-mieten/page.js` | Kategorie-Landingpage |
| `/fahrgeschaefte-mieten` | `app/fahrgeschaefte-mieten/page.js` | Kategorie-Landingpage |
| `/betriebsfest-planen` | `app/betriebsfest-planen/page.js` | Anlass-Landingpage |
| `/stadtfest-planen` | `app/stadtfest-planen/page.js` | Anlass-Landingpage |

### Eingeloggt (Auth-Gate via `layout.js`)

| Route | Datei | Funktion |
|-------|-------|----------|
| `/mein-bereich` | `app/mein-bereich/page.js` | Profil-Übersicht, Profildaten bearbeiten, eigene Buchungen |
| `/mein-bereich/anfragen` | `app/mein-bereich/anfragen/page.js` | Buchungsanfragen verwalten — annehmen, ablehnen, stornieren, abschließen |
| `/angebote/[id]/anfragen` | `app/angebote/[id]/anfragen/page.js` | Buchungsanfrage stellen inkl. Transportkosten-Rechner |
| `/angebote/[id]/bewerten` | `app/angebote/[id]/bewerten/page.js` | Bewertung nach abgeschlossener Buchung (1–5 Sterne + Kommentar) |
| `/buchungen/[id]/bezahlen` | `app/buchungen/[id]/bezahlen/page.js` | Stripe Payment Element — Zahlung durchführen |
| `/buchungen/[id]/bezahlen/danke` | `app/buchungen/[id]/bezahlen/danke/page.js` | Erfolgsseite nach Zahlung |

### Anbieter (Auth-Gate, Rolle `provider`)

| Route | Datei | Funktion |
|-------|-------|----------|
| `/anbieter/listings` | `app/anbieter/listings/page.js` | Eigene Angebote verwalten (Übersicht, aktivieren/deaktivieren) |
| `/anbieter/listings/neu` | `app/anbieter/listings/neu/page.js` | Neues Angebot erstellen, Fotos hochladen, Stripe-Onboarding triggern |
| `/anbieter/listings/[id]/bearbeiten` | `app/anbieter/listings/[id]/bearbeiten/page.js` | Angebot bearbeiten, Fotos verwalten |
| `/anbieter/listings/[id]/verfuegbarkeit` | `app/anbieter/listings/[id]/verfuegbarkeit/page.jsx` | Verfügbarkeitskalender |
| `/dashboard/provider/stripe-return` | `app/dashboard/provider/stripe-return/page.js` | Rückkehr nach Stripe-Onboarding — prüft `charges_enabled` |
| `/dashboard/provider/stripe-refresh` | `app/dashboard/provider/stripe-refresh/page.js` | Erneuter Onboarding-Link falls abgelaufen |

### Admin (Auth-Gate via `proxy.js`, nur `ADMIN_USER_ID`)

| Route | Datei | Funktion |
|-------|-------|----------|
| `/admin` | `app/admin/page.js` | Admin-Dashboard |
| `/admin/buchungen` | `app/admin/buchungen/page.js` | Alle Buchungen einsehen |
| `/admin/listings` | `app/admin/listings/page.js` | Alle Listings moderieren |
| `/admin/nutzer` | `app/admin/nutzer/page.js` | Nutzerverwaltung |

---

## 2. API-Routen (app/api/)

| Route | Methode | Funktion |
|-------|---------|----------|
| `/api/bookings/[id]/status` | `POST` | Buchungsstatus ändern (annehmen/ablehnen), E-Mail-Versand |
| `/api/bookings/[id]/cancel` | `POST` | Buchung stornieren, gestaffelte Rückerstattung via Stripe, Storno-E-Mail |
| `/api/bookings/[id]/complete` | `POST` | Event abschließen — triggert `transferToProvider()` |
| `/api/stripe/payment/create-intent` | `POST` | Stripe Payment Intent erstellen, `payments`-Eintrag anlegen |
| `/api/stripe/connect/onboard` | `POST` | Stripe-Connect-Account anlegen + Onboarding-Link generieren |
| `/api/stripe/webhook` | `POST` | Stripe-Webhooks: `payment_intent.succeeded`, `charge.refunded`, `transfer.created` |
| `/api/reviews` | `POST` | Bewertung speichern (nur nach abgeschlossener Buchung, je Buchung/Person einmalig) |
| `/api/ai/describe` | `POST` | KI-generierte Listing-Beschreibung via Anthropic API |
| `/api/analytics/track` | `POST` | Custom-Event-Tracking (erfordert Auth), schreibt in `events`-Tabelle |
| `/api/cron/auto-release` | `GET` | Vercel Cron 02:00 UTC täglich — gibt Buchungen automatisch frei nach 7 Tagen, `timingSafeEqual`-Auth |

---

## 3. lib/-Dateien

| Datei | Inhalt |
|-------|--------|
| `supabase.js` | `createBrowserClient` — Client-seitiger Supabase-Client (Singleton) |
| `supabase-server.js` | `createSupabaseServer()` — Server-seitiger Client, liest Cookies via Next.js `cookies()` |
| `supabase-admin.js` | `createAdminClient()` — Service-Role-Client, bypassed RLS (nur in API-Routen) |
| `payments.js` | Stripe Connect-Flow: `createStripeConnectAccount`, `createOnboardingLink`, `checkAccountStatus`, `createPaymentIntent`, `transferToProvider`, `cancelBooking` |
| `cancellation.js` | Storno-Staffel-Logik: `calculateCancellationFee(amountCents, eventDate)` |
| `email.js` | Resend-E-Mails: neue Anfrage, Bestätigung, Ablehnung, Zahlung, Storno, Auszahlung |
| `analytics.js` | PostHog-Wrapper: `trackEvent()`, `identifyUser()` |
| `admin.js` | `ADMIN_USER_ID` aus `process.env.ADMIN_USER_ID` |
| `constants.js` | `KATEGORIEN` (5 Hauptkategorien, ~35 Subkategorien), `REGION_NAMES` (16 Bundesländer), `VEHICLE_TYPES`, `KATEGORIE_LABEL`, `SUBKATEGORIE_LABEL` |
| `pricing.js` | Preisberechnungs-Hilfsfunktionen |
| `seo-config.js` | SEO-Kombinationen für programmatische Seiten (Kategorien × Regionen × Anlässe) |
| `contentFilter.js` | Inhaltsfilter für Listings |
| `useFetch.js` | Custom Hook für datenladende Client-Komponenten |

---

## 4. Datenbankschema (Supabase/PostgreSQL)

### Tabellen

#### `profiles`
Erweitert `auth.users`. RLS aktiv.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `uuid` PK | Referenz auf `auth.users.id` |
| `role` | `user_role` | `provider` oder `customer` |
| `display_name` | `text` | Anzeigename |
| `bio` | `text` | Profilbeschreibung |
| `region` | `text` | Einsatzgebiet / Bundesland |
| `postal_code` | `text` | PLZ |
| `avatar_url` | `text` | Profilbild-URL |
| `legal_name` | `text` | Vollständiger Name/Firma (PStTG) |
| `tax_id` | `text` | Steuer-ID / USt-IdNr. |
| `stripe_account_id` | `text` | Stripe-Connect-Account-ID |
| `stripe_onboarding_complete` | `boolean` | `true` wenn `charges_enabled` |
| `is_verified` | `boolean` | Verifiziert-Badge |
| `accepted_terms_at` | `timestamptz` | AGB-Akzeptanz-Zeitstempel |

#### `listings`
RLS aktiv (aktive Listings öffentlich, Anbieter verwaltet eigene).

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `uuid` PK | |
| `provider_id` | `uuid` FK | → `profiles.id` |
| `title` | `text` | Angebots-Titel |
| `description` | `text` | Beschreibung |
| `category` | `listing_category` | Enum: `food`, `ride`, `music`, `sanitation`, `tech`, `rental`, `other` |
| `price_cents` | `integer` | Preis in Cent |
| `price_model` | `price_model` | `flat`, `per_person`, `flat_plus`, `hourly`, `on_request` |
| `price_unit_label` | `text` | Freitext-Label (z.B. "Person") |
| `region` | `text` | Einsatzgebiet |
| `photos` | `text[]` | Foto-URLs (Supabase Storage) |
| `is_active` | `boolean` | Sichtbarkeit |

#### `bookings`
RLS aktiv (nur beteiligte Parteien). DB-Trigger berechnet Beträge automatisch.

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `uuid` PK | |
| `listing_id` | `uuid` FK | |
| `customer_id` | `uuid` FK | |
| `provider_id` | `uuid` FK | |
| `event_date` | `date` | |
| `status` | `booking_status` | `pending` → `accepted` → `paid` → `completed` / `cancelled` / `rejected` |
| `quantity` | `integer` | Anzahl Personen/Stunden/Einheiten |
| `amount_cents` | `integer` | Gesamtpreis (Kunde zahlt) |
| `commission_cents` | `integer` | 15 % Festly-Provision (via Trigger) |
| `provider_payout_cents` | `integer` | 85 % Auszahlung (via Trigger) |
| `auto_release_at` | `timestamptz` | Event-Datum + 7 Tage (via Trigger) |
| `cancelled_at` | `timestamptz` | |
| `cancelled_by` | `user_role` | |
| `cancellation_fee_cents` | `integer` | Einbehaltener Storno-Betrag |
| `customer_confirmed_at` | `timestamptz` | Manuelle Freigabe durch Kunden |
| `paid_at` | `timestamptz` | Zeitpunkt der Zahlung (migration 005) |

#### `payments`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `uuid` PK | |
| `booking_id` | `uuid` FK | |
| `stripe_payment_intent_id` | `text` | |
| `stripe_transfer_id` | `text` | |
| `status` | `payment_status` | `pending` → `held` → `released` / `refunded` |
| `held_at` | `timestamptz` | Zeitpunkt Treuhand |
| `released_at` | `timestamptz` | Zeitpunkt Auszahlung |

#### `reviews`

| Feld | Typ | Beschreibung |
|------|-----|--------------|
| `id` | `uuid` PK | |
| `booking_id` | `uuid` FK | |
| `reviewer_id` | `uuid` FK | |
| `rating` | `integer` | 1–5 |
| `comment` | `text` | |
| Unique-Constraint | | je Buchung + Reviewer genau eine Bewertung |

### Storno-Staffel (`lib/cancellation.js`)

| Vorlauf | Gebühr |
|---------|--------|
| 30+ Tage | 0 % (kostenlos) |
| 15–29 Tage | 25 % |
| 7–14 Tage | 50 % |
| 0–6 Tage | 75 % |

Bei Storno durch Anbieter: volle Rückerstattung unabhängig vom Vorlauf.

### DB-Trigger
`trg_calc_amounts` (BEFORE INSERT on bookings): berechnet `commission_cents = round(amount * 0.15)`, `provider_payout_cents = amount - commission`, `auto_release_at = event_date + 7 days`.

---

## 5. Middleware & Auth-Architektur

### `proxy.js` (Next.js Middleware)
- Matched alle Routen außer `_next/static`, `_next/image`, Favicon, Bilddateien
- **Coming-Soon-Gate**: `COMING_SOON=true` → alle Routen außer `/impressum` + `/datenschutz` mit HTML-Splash blockieren
- **Session-Refresh**: `supabase.auth.getUser()` bei jedem Request — erneuert abgelaufene Tokens in Response-Cookies. Ohne diesen Call sehen Server Components keine Session.
- **Admin-Schutz**: `/admin/*` nur für `ADMIN_USER_ID`, sonst `redirect('/login?error=unauthorized')`

### Server-seitige Auth-Gates (`layout.js`)
Folgende Routen haben ein `layout.js` mit `createSupabaseServer()` + `getUser()` + `redirect('/login')`:
- `app/mein-bereich/layout.js`
- `app/anbieter/layout.js`
- `app/buchungen/layout.js`
- `app/dashboard/layout.js`

### Supabase-Client-Hierarchie
- **Browser**: `createBrowserClient` — Singleton in `lib/supabase.js`, liest aus Cookie/LocalStorage
- **Server**: `createSupabaseServer()` — liest Cookies via Next.js `cookies()`, schreibt erneuerte Tokens zurück
- **Admin**: `createAdminClient()` — Service-Role-Key, bypassed RLS, nur in API-Routen

---

## 6. Komponenten (components/)

| Datei | Funktion |
|-------|----------|
| `Nav.js` | Suspense-Wrapper um `NavClient` |
| `NavClient.js` | Sticky Navbar: Logo, "So funktioniert's"-Link (→ `/so-funktionierts`), Login/Profil-Dropdown. Dropdown zeigt "Meine Angebote" (→ `/anbieter/listings`) nur für `role=provider`. |
| `Footer.js` | Globaler Footer |
| `ListingCard.js` | Angebots-Karte für Marktplatz und Startseite |
| `HomeListings.js` | Featured-Listings-Grid für Startseite |
| `SearchBar.js` | Suchleiste mit Kategorie/Region-Filter |
| `BookingChat.js` | Buchungs-Kommunikations-Komponente (noch nicht im Flow integriert) |
| `PosthogProvider.js` | PostHog Analytics Provider |

---

## 7. Umgebungsvariablen (.env.local / Vercel)

| Variable | Zweck | Status Vercel Production |
|----------|-------|--------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-Projekt-URL | ✅ plain, 40 Zeichen |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | ✅ plain, 46 Zeichen |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin-Client | ✅ sensitive |
| `STRIPE_SECRET_KEY` | Stripe Secret Key | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Webhook-Signatur | ✅ |
| `RESEND_API_KEY` | E-Mail via Resend | ✅ |
| `ADMIN_USER_ID` | Admin-UUID | ✅ |
| `CRON_SECRET` | Bearer-Token für Cron | ✅ |
| `EMAIL_FROM` | Absender-Adresse | ✅ |
| `NEXT_PUBLIC_APP_URL` | Basis-URL für E-Mail-Links | ✅ |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog Key | ✅ |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog Host | ✅ |
| `ANTHROPIC_API_KEY` | KI-Beschreibungsgenerator | ✅ |
| `COMING_SOON` | Coming-Soon-Gate (`true`/`false`) | — |

### Cron-Job (`vercel.json`)
`/api/cron/auto-release` täglich um 02:00 UTC.

---

## 8. Was heute (06.06.2026) gemacht wurde

### Audit & Sicherheits-Fixes
- Alle 15 `setLoading`-Dateien geprüft — `setLoading(false)` überall in `finally`
- `cancel/route.js`: `.or()`-Filter gegen Data-Leak (Buchung ohne User-Filter geladen)
- `auto-release/route.js`: `crypto.timingSafeEqual` statt String-Vergleich für Cron-Auth
- `analytics/track/route.js`: Auth-Pflicht eingeführt (war anonym aufrufbar)
- `lib/admin.js`: `ADMIN_USER_ID` aus Env-Var statt hardcoded UUID
- `register/page.js`: `insert` → `upsert` mit `ignoreDuplicates: true` gegen Race-Condition
- Server-seitige Auth-Gates als `layout.js` für `/mein-bereich`, `/anbieter`, `/buchungen`, `/dashboard`

### Middleware-Fix
- `middleware.js` gelöscht — diese Next.js-Version nutzt `proxy.js` als Middleware-Datei
- Build-Fehler „Both middleware.js and proxy.js detected" behoben

### Login-Bug-Fix
- `email_confirmed_at`-Prüfung entfernt (schickte alle User fälschlich auf `/auth/verify-email`)
- `router.push('/mein-bereich')` → `window.location.href = '/mein-bereich'` (harter Reload für korrekte Cookie-Übertragung)
- `trackEvent`/`identifyUser` vor den Redirect verschoben (feuerten vorher nie weil Seite vorher weglud)
- "Email not confirmed"-Fehlerfall ebenfalls auf `window.location.href` umgestellt
- `useRouter`-Import und `const router` entfernt (nicht mehr gebraucht)

### Supabase-Variablen-Fix (Root Cause Login)
- `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` waren in Vercel Production als `sensitive`-Typ mit leerem Wert gespeichert
- Alte Einträge via REST API gelöscht, neu als `plain`-Typ mit korrekten Werten gesetzt (Production + Preview)
- Redeployment durchgeführt damit Vars in den Build-Bundle übernommen werden

### Neue Seite `/so-funktionierts`
- Statische Erklärseite: Hero mit Pink→Purple Gradient, zweispaltiger Kunden/Anbieter-Bereich
- Storno-Tabelle, FAQ-Akkordeon (`<details>`/`<summary>`, kein JS, kein `'use client'`)
- CTA-Bereich mit Gradient-Card und Buttons zu `/marktplatz` + `/register`
- Texte fokussieren auf Treuhand-Sicherheit als USP

### Navbar-Updates
- Navbar-Button "Anbieter werden" ersetzt durch "So funktioniert's" → `/so-funktionierts`
- Profilmenü: "Meine Angebote" → `/anbieter/listings` hinzugefügt, nur sichtbar wenn `profile.role === 'provider'`

---

## 9. Offene bekannte Issues

1. **Login-Redirect (Production)** — `window.location.href` und Supabase-Vars sind korrekt gesetzt. Falls Login noch hängt: `app/mein-bereich/layout.js` könnte die Session server-seitig nicht lesen (Cookie-Timing zwischen Client-Set und erstem Server-Request). Nächster Schritt: Supabase-Session-Cookie im Browser-DevTools nach Login prüfen.

2. **Storno-Staffel-Diskrepanz** — `lib/cancellation.js` nutzt `minDaysBefore: 15` (= 15–29 Tage → 25 %), die UI in `so-funktionierts` zeigt "14–29 Tage". Geringfügige Abweichung um 1 Tag, sollte vereinheitlicht werden.

3. **`events`-Tabelle fehlt im Schema** — `api/analytics/track/route.js` schreibt in `events`, die in `supabase/schema.sql` nicht definiert ist. Muss in Supabase manuell existieren oder als Migration angelegt werden.

4. **`vehicle_type` in E-Mails** — `sendBookingAccepted` erwartet `vehicle_type`, das nicht als Feld in `bookings` existiert. Muss aus dem Anfrage-Flow korrekt übergeben werden.

5. **Keine Pagination in Admin-Seiten** — Admin-Buchungen/-Listings/-Nutzer laden alle Datensätze auf einmal. Skaliert nicht.

6. **`BookingChat.js`** — Komponente existiert, ist aber noch nirgendwo im sichtbaren Flow eingebunden.
