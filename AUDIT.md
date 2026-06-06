# Code-Audit 06.06.2026

## KRITISCH — behoben in Commit 21e18ee

### SICHERHEIT - app/api/bookings/[id]/cancel/route.js
Buchung wurde ohne user-spezifischen Filter geladen — fremde Buchungsdaten lesbar vor JS-seitiger Berechtigungsprüfung.
Fix: `.or('customer_id.eq.X,provider_id.eq.X')` als defense-in-depth neben RLS.

### SICHERHEIT - middleware.js fehlte (proxy.js war toter Code)
`proxy.js` enthielt Middleware-Logik (Supabase Session-Refresh, Admin-Schutz), war aber für Next.js unsichtbar — keine `middleware.js` im Root.
Fix: `middleware.js` erstellt, re-exportiert `proxy` als `middleware`.

### FEHLERHANDLING - mein-bereich/page.js (handleSaveProfile, toggleListing)
Kein Error-Check nach Supabase-Update — User sah "Gespeichert" auch bei DB-Fehler; UI und DB konnten divergieren.
Fix: try/catch/finally, Error-Check, UI-Update nur bei Erfolg.

### FEHLERHANDLING - mein-bereich/anfragen/page.js (handleStatus/Cancel/Complete)
Kein try/catch, kein `res.ok`-Check — Netzwerkfehler führten zu stiller UI-Inkonsistenz.
Fix: try/catch + `res.ok` in allen drei Funktionen; `setConfirmCancel(null)` in finally.

## WICHTIG — behoben in Commit 21e18ee

### LOADING - app/register/page.js
Rohe englische Supabase-Fehlermeldungen; Redirect nach `/` statt `/mein-bereich`.
Fix: Deutsche Fehlermappings, Redirect zu /mein-bereich.

### LOADING - app/angebote/[id]/anfragen/page.js (calcTransport)
`setTransportLoading(false)` in mehreren Early-Returns statt `finally` — bei unerwarteter Exception hätte Loading-State gehangen.
Fix: `finally`-Block.

### FEHLERHANDLING - app/anbieter/listings/neu/page.js
`role: 'provider'`-Update ohne Fehlerprüfung — Listing wurde trotzdem erstellt wenn Role-Update scheiterte.
Fix: Fehlercheck + abort vor listing insert.

### FEHLERHANDLING - app/anbieter/listings/[id]/bearbeiten/page.js
Storage-Löschung ohne Error-Handling — orphaned Files möglich.
Fix: Error loggen.

## HINWEISE — behoben in Commit 21e18ee

### SICHERHEIT - app/api/cron/auto-release/route.js
Bearer-Token-Vergleich mit `!==` statt `crypto.timingSafeEqual()`.
Fix: `timingSafeEqual`.

### ROBUSTHEIT - app/api/reviews/route.js
`request.json()` ohne try/catch — malformed JSON crashte die Route.
Fix: try/catch → 400.

---

# Code-Audit 04.06.2026

## HIGH

### AUTH - app/api/ai/describe/route.js
Kein Auth-Check. Jeder externe Aufrufer kann beliebig viele kostenpflichtige Claude-API-Requests auslösen.
Fix: createSupabaseServer() + getUser() + 401 wenn kein User.

### DATEN - mein-bereich/anfragen/page.js
Event-Adresse (street, house_number, zip, city) wird im Anfrage-Formular gespeichert aber in der Buchungsübersicht weder dem Kunden noch dem Anbieter angezeigt.
Fix: Event-Adresse in der Anbieter-Buchungskarte anzeigen (mindestens PLZ + Stadt).

## MEDIUM

### LOADING - app/register/page.js
Loading hängt wenn Analytics wirft (wie Login-Bug).
Fix: try/catch/finally Wrapper.

### LOADING - verfuegbarkeit/page.jsx
load() ohne try/catch → Seite hängt auf "Laden..."
Fix: try/catch/finally.

### DATEN - app/angebote/[id]/page.js
location_address gespeichert aber nie angezeigt.
Fix: Anbieter-Standort auf Detailseite anzeigen.

### LOADING - app/angebote/[id]/anfragen/page.js
Promise.all wirft + steckt, setLoading(false) nie erreicht.
Fix: try/catch/finally.

### LOADING - app/anbieter/listings/neu + bearbeiten/page.js
Nach erfolgreichem Insert/Update: router.push ohne vorher setLoading(false).
Fix: try/catch/finally in beiden.

## LOW

### NAV - bezahlen/danke/page.js
Kein prominenter CTA nach erfolgreicher Zahlung.
Fix: Button "Zu meinen Buchungen →" prominent im Success-Block.

### NAV - me
