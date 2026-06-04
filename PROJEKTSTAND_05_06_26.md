# Festly — Projektstand 05.06.2026

---

## 1. Seiten (app/)

| Route | Typ | Status | Anmerkung |
|---|---|---|---|
| `/` | Server Component | ✅ funktioniert | Listings serverseitig geladen, SearchBar als Client Component |
| `/login` | Client Component | ✅ funktioniert | router.push('/') direkt nach signIn |
| `/register` | Client Component | ⚠️ Audit-Bug | setLoading hängt wenn Analytics-Call wirft |
| `/auth/forgot-password` | Client Component | ✅ funktioniert | |
| `/auth/reset-password` | Client Component | ✅ funktioniert | |
| `/auth/verify-email` | Client Component | ✅ funktioniert | |
| `/angebote/[id]` | Client Component | ⚠️ Audit-Bug | `location_address` gespeichert aber nie angezeigt |
| `/angebote/[id]/anfragen` | Client Component | ⚠️ Audit-Bug | Promise.all ohne isoliertes try/catch — kann hängen |
| `/angebote/[id]/bewerten` | Client Component | ⚠️ Sicherheit | Jeder eingeloggte User kann Bewertung abgeben — kein completed-Buchungs-Check |
| `/anbieter/listings` | Client Component | ✅ funktioniert | |
| `/anbieter/listings/neu` | Client Component | ⚠️ Audit-Bug | router.push() vor setLoading(false) nach Submit |
| `/anbieter/listings/[id]/bearbeiten` | Client Component | ⚠️ Audit-Bug | router.push() vor setLoading(false) nach Submit |
| `/anbieter/listings/[id]/verfuegbarkeit` | Client Component | ⚠️ Audit-Bug | load() ohne try/catch → Seite hängt auf "Laden..." |
| `/mein-bereich` | Client Component | ✅ funktioniert | |
| `/mein-bereich/anfragen` | Client Component | ⚠️ Audit-Bug | Event-Adresse (PLZ + Stadt) in Buchungskarte fehlt |
| `/buchungen/[id]/bezahlen` | Client Component | ✅ funktioniert | Stripe Payment Intent |
| `/buchungen/[id]/bezahlen/danke` | Client Component | ⚠️ Audit-Low | Kein prominenter CTA nach Zahlung |
| `/dashboard/provider/stripe-refresh` | Server Component | ✅ funktioniert | |
| `/dashboard/provider/stripe-return` | Server Component | ✅ funktioniert | |
| `/admin` | Server Component | ✅ funktioniert | Guard in layout.js — serverseitig |
| `/admin/buchungen` | Server Component | ✅ funktioniert | |
| `/admin/listings` | Server Component | ✅ funktioniert | |
| `/admin/nutzer` | Server Component | ✅ funktioniert | |
| `/agb`, `/datenschutz`, `/impressum`, `/widerruf` | Static | ✅ funktioniert | |

---

## 2. API-Routen — Auth-Status

| Route | Methode | Auth-Check | Status |
|---|---|---|---|
| `/api/ai/describe` | POST | `getUser()` → 401 | ✅ gesichert (heute gefixt) |
| `/api/analytics/track` | POST | `getUser()` optional | ✅ OK — anon erlaubt, user_id nullable |
| `/api/bookings/[id]/cancel` | POST | `getUser()` → 401 | ✅ gesichert |
| `/api/bookings/[id]/complete` | POST | `getUser()` → 401 | ✅ gesichert |
| `/api/bookings/[id]/status` | POST | `getUser()` → 401 | ✅ gesichert |
| `/api/cron/auto-release` | POST | `Bearer CRON_SECRET` → 401 | ✅ gesichert |
| `/api/reviews` | POST | `getUser()` → 401 | ✅ gesichert |
| `/api/stripe/connect/onboard` | POST | `getUser()` → 401 | ✅ gesichert |
| `/api/stripe/payment/create-intent` | POST | `getUser()` → 401 | ✅ gesichert |
| `/api/stripe/webhook` | POST | Stripe Signature Header | ✅ gesichert |

---

## 3. Offene Sicherheitsprobleme (aus AUDIT.md)

### HIGH
- ~~`/api/ai/describe` — kein Auth-Check~~ **✅ heute gefixt**

### MEDIUM
- **`/angebote/[id]/bewerten`** — Jeder eingeloggte Nutzer kann Bewertung abgeben, nicht nur Kunden mit `completed`-Buchung. Fix: RLS-Policy oder API-Routen-Check auf `bookings.status = 'completed'`.
- **`/register`** — setLoading hängt wenn Analytics-Call wirft. Fix: try/catch/finally in handleSubmit.
- **`/anbieter/listings/[id]/verfuegbarkeit`** — load() ohne try/catch, Seite hängt auf Ladefehler. Fix: try/catch/finally.
- **`/angebote/[id]/anfragen`** — Promise.all ohne eigenes catch für jeden Sub-Request. Fix: try/catch/finally.
- **`/anbieter/listings/neu` + `bearbeiten`** — router.push() läuft vor setLoading(false). Fix: setLoading(false) in finally vor push.

### LOW
- **`/buchungen/[id]/bezahlen/danke`** — Kein prominenter CTA nach Zahlung. Fix: Button "Zu meinen Buchungen →".
- **`next/image` + Supabase remotePatterns** — `<img>` ohne Domain-Whitelist in `next.config.mjs`.
- **Bewertungen RLS** — Fehlende DB-Policy: nur Käufer mit abgeschlossener Buchung dürfen bewerten.
- **Middleware-Schutz** — Anbieter-Routen nur client-seitig geprüft, kein Server-Guard via `middleware.js`.

---

## 4. Heute erledigt (04.–05.06.2026)

| Commit | Was |
|---|---|
| `b1284e2` | Startseite durch Marktplatz ersetzt — `/marktplatz`-Route entfernt, alle Links auf `/` umgestellt |
| `0f711b6` | Login-Fix: `router.push('/')` sofort nach signIn, Analytics danach fire-and-forget |
| `111bbb3` | 5 Fixes: Supabase-Foto-URLs in ListingCard, Grid 1→2→3→4 Spalten, Navbar aktive Kategorie unterstreichen, Suspense für NavClient, Auth-Guard für `/api/ai/describe` |
| `22c1ded` | `setLoading(true)` am Anfang von `load()` + `cancelled`-Flag als Cleanup in app/page.js |
| `03083bb` | Zentrale `lib/useFetch.js` Hook — `app/page.js` migriert |
| `004c294` | **Startseite als Server Component**: `'use client'` entfernt, Listings serverseitig geladen via `createSupabaseServer()`, `searchParams` als awaited Promise, kein Loading-State mehr nötig |

---

## 5. Morgen — nächste Schritte

### Priorität: Hoch
1. **Audit-Bugs fixen** (MEDIUM-Level, 4 Dateien):
   - `app/register/page.js` — try/catch/finally um Analytics
   - `app/anbieter/listings/[id]/verfuegbarkeit/page.jsx` — try/catch/finally in load()
   - `app/angebote/[id]/anfragen/page.js` — Promise.all absichern
   - `app/anbieter/listings/neu` + `bearbeiten` — setLoading(false) vor router.push()

2. **Fehlende Datenanzeige** (Daten sind da, werden nicht gezeigt):
   - `app/angebote/[id]/page.js` — `location_address` auf Detailseite
   - `app/mein-bereich/anfragen/page.js` — Event-Adresse (PLZ + Stadt) in Buchungskarte

### Priorität: Mittel
3. **Bewertungen absichern** — nur nach `completed`-Buchung erlauben (RLS + Route-Check)
4. **`/buchungen/[id]/bezahlen/danke`** — prominenter CTA "Zu meinen Buchungen →"
5. **`next/image` remotePatterns** — Supabase Storage URL in `next.config.mjs` eintragen

### Priorität: Niedrig
6. **Middleware-Schutz** — `middleware.js` für `/anbieter/*` und `/mein-bereich/*` Routes
7. **Server Components ausweiten** — `/angebote/[id]` und `/mein-bereich` könnten Server Components werden
