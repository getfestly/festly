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
