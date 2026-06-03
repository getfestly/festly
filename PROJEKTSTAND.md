# Festly — Projektübersicht (Stand: 2026-06-03)

Festly ist ein B2C-Marktplatz für Event-Dienstleistungen (Schausteller, Caterer, Musiker u. a.) mit Treuhand-Zahlungssystem via Stripe Connect. Provision: 15 % pro Buchung.

---

## 1. Seiten (`app/`)

| Route | Typ | Beschreibung |
|---|---|---|
| `/` | Server | Landing Page: Hero, „So funktioniert's", Kategorie-Grid, Anbieter-CTA |
| `/marktplatz` | Server | Marktplatz mit Filter (Kategorie, Region, Datum), Listing-Karten, Rahmen-Badges (Gold/Orange), Antwortzeit-Badges |
| `/angebote/[id]` | Client | Listing-Detailseite: Foto-Galerie, Preis, Reviews (Sterne), Anfrage-CTA |
| `/angebote/[id]/anfragen` | Client | Buchungsformular: Mini-Kalender (Range-Picker), Adressfelder, Fahrkosten-Berechnung (OSRM), Preisvorschau |
| `/angebote/[id]/bewerten` | Client | Bewertungsseite (nur für abgeschlossene Buchungen) |
| `/mein-bereich` | Client | Nutzer-Dashboard: Buchungs-Übersicht, Angebots-Zähler, Stripe-Onboarding-Status |
| `/mein-bereich/anfragen` | Client | Alle Buchungen als Kunde + als Anbieter; Chat-Widget (Realtime), Bewertungs-Modal, Stornierungsbestätigung |
| `/buchungen/[id]/bezahlen` | Client | Stripe-Zahlungsseite mit `PaymentElement` (Treuhand) |
| `/buchungen/[id]/bezahlen/danke` | Client | Erfolgsseite nach Zahlung |
| `/anbieter/listings` | Client | Angebotsverwaltung: Liste, Aktivieren/Deaktivieren |
| `/anbieter/listings/neu` | Client | Neues Angebot erstellen: Titel, Beschreibung (+ KI-Assistent, Spracheingabe), Kategorie/Subkat, Fahrzeugtyp, Preismodell, Fotos (bis 10) |
| `/anbieter/listings/[id]/bearbeiten` | Client | Bestehendes Angebot bearbeiten |
| `/anbieter/listings/[id]/verfuegbarkeit` | Client | Verfügbarkeitskalender (3 Monate, Drag-to-block, Aufbauzeit-Einstellung) |
| `/dashboard/provider/stripe-return` | Client | Rückkehr nach Stripe-Onboarding (Status wird geprüft und in DB gespeichert) |
| `/dashboard/provider/stripe-refresh` | Client | Refresh-URL bei abgebrochenem Stripe-Onboarding |
| `/admin` | Server | Admin-Dashboard: Nutzerzahlen, Buchungsstatus, Festly-Provision, Analytics (letzte 30 Tage), Top-Kategorien |
| `/admin/listings` | Server | Admin: Alle Listings mit Admin-Client (RLS-Bypass) |
| `/admin/buchungen` | Server | Admin: Alle Buchungen mit Beträgen |
| `/admin/nutzer` | Server | Admin: Alle Nutzer-Profile |
| `/login` | Client | E-Mail/Passwort-Login |
| `/register` | Client | Registrierung mit AGB-Zustimmung (Zeitstempel wird gespeichert) |
| `/auth/forgot-password` | Client | Passwort-zurücksetzen Anfrage |
| `/auth/verify-email` | Client | E-Mail-Bestätigung |
| `/auth/reset-password` | Client | Neues Passwort setzen (PASSWORD_RECOVERY-Flow) |
| `/impressum` | Server | Impressum (Pflichtseite) |
| `/datenschutz` | Server | Datenschutzerklärung |
| `/widerruf` | Server | Widerrufsbelehrung |
| `/agb` | Server | Allgemeine Geschäftsbedingungen |
| `/so-funktionierts` | Server | Detaillierte Erklärung für Kunden und Anbieter |

---

## 2. API-Routen (`app/api/`)

| Route | Methode | Funktion |
|---|---|---|
| `/api/stripe/connect/onboard` | POST | Erstellt Stripe-Express-Account (falls noch nicht vorhanden) und gibt Onboarding-Link zurück |
| `/api/stripe/payment/create-intent` | POST | Erstellt Stripe-PaymentIntent für eine akzeptierte Buchung (Idempotent: bestehenden PI wiederverwenden) |
| `/api/stripe/webhook` | POST | Stripe-Webhook-Handler: `payment_intent.succeeded` → Buchung auf `paid` setzen + E-Mails; `charge.refunded` → Payment-Status aktualisieren; `payment_intent.payment_failed` → Logging |
| `/api/bookings/[id]/status` | POST | Anbieter nimmt Buchung an (`accepted`) oder lehnt ab (`rejected`) + E-Mail an Kunden; setzt `provider_responded_at` |
| `/api/bookings/[id]/complete` | POST | Kunde bestätigt Event → `transferToProvider()` → Auszahlung via Stripe-Transfer + E-Mail an Anbieter; Status → `completed` |
| `/api/bookings/[id]/cancel` | POST | Stornierung (Kunde oder Anbieter) mit gestaffelter Rückerstattung via Stripe-Refund + E-Mail an Kunden |
| `/api/reviews` | POST | Bewertung einsenden (nur für `completed`-Buchungen, nur als Kunde, eine pro Buchung) |
| `/api/ai/describe` | POST | KI-Listing-Beschreibung via Claude Sonnet 4.6 (max 120 Wörter, Deutsch) |
| `/api/analytics/track` | POST | Event in eigene `events`-Tabelle schreiben (fire-and-forget) |
| `/api/cron/auto-release` | GET | Cron-Job (täglich 02:00 UTC): Bezahlte Buchungen mit Event > 7 Tage alt → automatische Auszahlung |

---

## 3. `lib/`-Dateien

| Datei | Inhalt |
|---|---|
| `lib/constants.js` | `KATEGORIEN` (5 Hauptkat. + 34 Subkat. mit Richtwertpreisen), `VEHICLE_TYPES` (PKW-Anhänger/LKW/LKW+Kran mit Km-Sätzen), `KATEGORIEN_FLAT`, `KATEGORIE_LABEL` (inkl. Legacy), `SUBKATEGORIE_LABEL`, `SUBSCRIPTION_PLANS`, `PROMOTED_LISTING_PRICE_CENTS`, `formatRegion()` |
| `lib/pricing.js` | `PRICING_MODELS` (flat/per_person/flat_plus/hourly/on_request), `formatPreis()` (Kurz-Label für Karten), `formatPreisDetail()` (Langtext für Detailseite) |
| `lib/payments.js` | Stripe-Connect-Workflow: `createStripeConnectAccount()`, `createOnboardingLink()`, `checkAccountStatus()`, `createPaymentIntent()`, `transferToProvider()`, `calcRefundCents()`, `cancelBooking()`; `PLATFORM_COMMISSION_RATE = 0.15` |
| `lib/email.js` | E-Mail-Templates via Resend: `sendNewBookingToProvider()`, `sendBookingAccepted()` (inkl. Fahrzeug-Hinweis), `sendBookingRejected()`, `sendPaymentConfirmed()`, `sendCancellationConfirmed()`, `sendPayoutConfirmed()` |
| `lib/analytics.js` | PostHog-Integration: `initPosthog()`, `trackEvent()` (PostHog + eigene DB), `identifyUser()`; Session-ID via sessionStorage |
| `lib/cancellation.js` | Storno-Staffel-Tabelle (`CANCELLATION_TIERS`) und `calculateCancellationFee()` — separates Modul, aktuell nicht direkt von API-Routen verwendet (Logik in `payments.js` dupliziert) |
| `lib/contentFilter.js` | `validateNoContact()` / `containsContact()` — erkennt Telefonnummern, E-Mails, URLs, Social-Media-Handles, verschleierte Kontaktdaten im Chat-/Buchungstext |
| `lib/admin.js` | `ADMIN_USER_ID` — Hard-kodierte UUID des Admin-Nutzers |
| `lib/supabase.js` | Client-seitiger Supabase-Client (Browser) |
| `lib/supabase-server.js` | Server-seitiger Supabase-Client mit Cookie-Handling (Next.js App Router) |
| `lib/supabase-admin.js` | Admin-Client mit Service-Role-Key (RLS-Bypass für Backend-Operationen) |

---

## 4. Datenbanktabellen (aktueller Stand inkl. aller Migrationen)

### `profiles`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | Referenz auf `auth.users` |
| `role` | enum (provider/customer) | |
| `display_name` | text | |
| `bio` | text | |
| `region` | text | Freitext, z. B. „Bayern" |
| `postal_code` | text | |
| `avatar_url` | text | |
| `legal_name` | text | PStTG-Pflicht: vollständiger Name/Firma |
| `address` | text | |
| `tax_id` | text | Steuer-ID / USt-IdNr. |
| `stripe_account_id` | text | Stripe-Connect-Konto-ID |
| `stripe_onboarding_complete` | boolean | true = charges_enabled |
| `is_verified` | boolean | Manuelles Badge |
| `accepted_terms_at` | timestamptz | Zeitstempel AGB-Zustimmung (Migration: migration_legal.sql) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `listings`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `provider_id` | uuid FK → profiles | |
| `title` | text | |
| `description` | text | |
| `category` | listing_category enum | Legacy: food/ride/music/sanitation/tech/rental/other; neu: fahrgeschaefte/gastro/unterhaltung/ausstattung/sanitaer_service |
| `subcategory` | text | Subkategorie-ID (Migration: etappe_c.sql) |
| `price_cents` | integer | Betrag in Cent |
| `price_model` | price_model enum | flat/per_person/flat_plus/hourly/on_request |
| `price_unit_label` | text | Freitext, z. B. „Person", „Stunde" |
| `region` | text | |
| `photos` | text[] | Öffentliche URLs aus Supabase Storage |
| `is_active` | boolean | |
| `vehicle_type` | text | pkw_anhaenger/lkw_mittel/lkw_gross (Migration: 004) |
| `setup_days` | integer DEFAULT 0 | Aufbauzeit in Tagen vor Event (Migration: 003) |
| `event_date_from` | date | Geplante Event-Zeitspanne des Angebots (Migration: etappe_c) |
| `event_date_to` | date | (Migration: etappe_c) |
| `is_promoted` | boolean DEFAULT false | Promoted Listing (Migration: etappe_c) |
| `promoted_until` | timestamptz | (Migration: etappe_c) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `bookings`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `listing_id` | uuid FK → listings | |
| `customer_id` | uuid FK → profiles | |
| `provider_id` | uuid FK → profiles | |
| `event_date` | date | Startdatum des Events |
| `event_date_end` | date | Enddatum (Migration: 003) |
| `status` | booking_status enum | pending/accepted/paid/completed/cancelled/rejected |
| `quantity` | integer DEFAULT 1 | Personen/Stunden/Einheiten |
| `price_model` | text | Snapshot aus listings.price_model |
| `price_snapshot_cents` | integer | Snapshot des Preises zum Buchungszeitpunkt (Migration: 003) |
| `price_snapshot_model` | text | (Migration: 003) |
| `price_snapshot_label` | text | (Migration: 003) |
| `amount_cents` | integer | Gesamtpreis inkl. Fahrtkosten |
| `commission_cents` | integer | 15 % (per Trigger berechnet) |
| `provider_payout_cents` | integer | 85 % (per Trigger berechnet) |
| `cancelled_at` | timestamptz | |
| `cancelled_by` | user_role enum | customer/provider |
| `cancellation_fee_cents` | integer | Einbehaltener Betrag |
| `customer_confirmed_at` | timestamptz | Zeitstempel Kundenfreigabe |
| `auto_release_at` | timestamptz | Event + 7 Tage (per Trigger) |
| `paid_at` | timestamptz | Zeitstempel Zahlung (Migration: 005) |
| `provider_responded_at` | timestamptz | Zeitstempel Antwort Anbieter (Migration: response_time) |
| `event_title` | text | Name des Events |
| `event_description` | text | Beschreibung des Events |
| `event_street` | text | Veranstaltungsort-Adresse (Migration: 006) |
| `event_house_number` | text | (Migration: 006) |
| `event_zip` | text | (Migration: 006) |
| `event_city` | text | (Migration: 006) |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `payments`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `booking_id` | uuid FK → bookings | |
| `stripe_payment_intent_id` | text | |
| `stripe_transfer_id` | text | |
| `amount_cents` | integer | |
| `status` | payment_status enum | pending/held/released/refunded |
| `held_at` | timestamptz | |
| `released_at` | timestamptz | |
| `created_at` | timestamptz | |

### `reviews`
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `booking_id` | uuid FK → bookings | UNIQUE (eine Bewertung pro Buchung) |
| `reviewer_id` | uuid FK → profiles | |
| `provider_id` | uuid FK → profiles | (Migration: migration_reviews.sql) |
| `listing_id` | uuid FK → listings | (Migration: migration_reviews.sql) |
| `rating` | integer | 1–5 |
| `comment` | text | |
| `created_at` | timestamptz | |

### `events` (Analytics)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `event_name` | text | z. B. `listing_detail_viewed`, `booking_submitted` |
| `user_id` | uuid FK → profiles | nullable |
| `session_id` | text | |
| `properties` | jsonb | |
| `created_at` | timestamptz | |

### `listing_availability` (Migration: 003)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `listing_id` | uuid FK → listings | |
| `blocked_from` | date | |
| `blocked_until` | date | |
| `reason` | text | z. B. „manuell", „gebucht", „urlaub" |
| `created_at` | timestamptz | |

### `messages` (BookingChat — Tabelle in DB, kein Migration-File im Repo)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `booking_id` | uuid FK → bookings | |
| `sender_id` | uuid FK → profiles | |
| `content` | text | |
| `created_at` | timestamptz | |

### `events_public` (Migration: etappe_c.sql)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `title` | text | |
| `city` | text | |
| `region` | text | |
| `event_date` | date | |
| `source` | text | |
| `created_at` | timestamptz | |

### `search_events` (Migration: etappe_c.sql)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK → profiles | nullable |
| `category` | text | |
| `subcategory` | text | |
| `region` | text | |
| `event_date_from` | date | |
| `event_date_to` | date | |
| `results_count` | integer | |
| `created_at` | timestamptz | |

### `subscriptions` (Migration: etappe_c.sql)
| Spalte | Typ | Beschreibung |
|---|---|---|
| `id` | uuid PK | |
| `provider_id` | uuid FK → profiles | |
| `plan` | text | pro/insights |
| `status` | text | active/cancelled |
| `started_at` | timestamptz | |
| `ends_at` | timestamptz | |
| `amount_cents` | integer | |

---

## 5. npm-Pakete

### dependencies
| Paket | Version | Verwendung |
|---|---|---|
| `next` | 16.2.6 | Framework |
| `react` | 19.2.4 | |
| `react-dom` | 19.2.4 | |
| `@supabase/supabase-js` | ^2.106.2 | Datenbank, Auth, Realtime |
| `@supabase/ssr` | ^0.10.3 | Server-seitige Supabase-Clients |
| `stripe` | ^22.2.0 | Stripe-API (Server) |
| `@stripe/stripe-js` | ^9.7.0 | Stripe.js (Browser) |
| `@stripe/react-stripe-js` | ^6.5.0 | PaymentElement-Komponente |
| `resend` | ^6.12.4 | E-Mail-Versand |
| `@anthropic-ai/sdk` | ^0.100.1 | KI-Beschreibungsgenerator |
| `posthog-js` | ^1.379.0 | Analytics (Browser) |
| `posthog-node` | ^5.21.2 | Analytics (Server) |
| `@sentry/nextjs` | ^10.55.0 | Error-Monitoring |

### devDependencies
| Paket | Version | Verwendung |
|---|---|---|
| `tailwindcss` | ^4 | CSS-Framework |
| `@tailwindcss/postcss` | ^4 | PostCSS-Plugin für Tailwind v4 |
| `eslint` | ^9 | Linter |
| `eslint-config-next` | 16.2.6 | Next.js ESLint-Regeln |

---

## 6. Was noch fehlt / nicht funktioniert

### Bekannte Lücken
- **`messages`-Tabelle fehlt im Migration-Tracking**: Der `BookingChat` verwendet eine `messages`-Tabelle mit Realtime-Subscription, aber es existiert kein SQL-Migration-File dafür im Repo. Die Tabelle muss manuell in Supabase angelegt sein.
- **Duplizierte Storno-Logik**: `lib/cancellation.js` definiert eine Storno-Staffel (0/10/30/50/75 %), die von `lib/payments.js` **nicht** verwendet wird. `payments.js` hat eine eigene, abweichende Staffel (100/50/25/0 %). Es gibt zwei verschiedene Berechnungen im gleichen Projekt.
- **`events_public` und `search_events` ohne UI**: Beide Tabellen (Migration: etappe_c.sql) haben noch keine zugehörige Seite oder Befüllungslogik.
- **`subscriptions`-Tabelle ohne UI**: Tabelle existiert in DB, kein Stripe-Subscription-Flow und keine Verwaltungsseite implementiert.
- **Promoted Listings ohne Buchungsflow**: `is_promoted` / `promoted_until` in listings vorhanden, aber weder ein Zahlungsweg noch eine visuelle Hervorhebung auf dem Marktplatz ist implementiert.
- **Admin-Zugriff nur per Hard-kodierter UUID**: `ADMIN_USER_ID` in `lib/admin.js` — keine rollenbasierte Überprüfung, keine Middleware-Absicherung für `/admin/`-Routen.
- **Cron-Job nur für Vercel**: Der Auto-Release-Cron läuft ausschließlich auf Vercel (via `vercel.json`). Lokal muss er manuell per GET-Request mit korrektem `CRON_SECRET`-Header getriggert werden.
- **Sentry ohne DSN-Prüfung**: Sentry-Konfigurationsdateien vorhanden (`sentry.client.config.js` etc.), aber `NEXT_PUBLIC_SENTRY_DSN` muss in `.env.local` gesetzt sein — ohne ihn läuft Sentry leer.
- **Keine Stripe Webhook-Registrierung lokal**: Für lokale Entwicklung muss `stripe listen --forward-to localhost:3000/api/stripe/webhook` separat gestartet werden.
- **Verfügbarkeitskalender nur für 3 Monate**: Der Anbieter kann Verfügbarkeit nur 3 Monate im Voraus setzen, kein Blättern möglich.
- **Keine Paginierung auf dem Marktplatz**: Alle aktiven Listings werden auf einmal geladen — skaliert nicht bei wachsender Listing-Zahl.
- **`/angebote/[id]/bewerten`-Route**: Seite ist in der Dateiliste, aber die Bewertung wird bereits inline in `/mein-bereich/anfragen` als Modal angeboten. Ggf. Redundanz.

### Fehlende Umgebungsvariablen (ohne die nichts läuft)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
ANTHROPIC_API_KEY
CRON_SECRET
# Optional:
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_APP_URL
EMAIL_FROM
```

---

## 7. Letzter Commit

```
Hash:    9a4a05c32bf988642fb5dcb46e4d156e8b726d48
Datum:   2026-06-03 17:50:40 +0200
Autor:   Henry Hempen
Message: feat: Navbar bereinigt — Anbieten-Link entfernt, aktiver Link lila hervorgehoben
```
