# Festly — Fortschritt

## Legende
- ✅ Fertig und committed
- 🔧 Manuell erforderlich (du musst ran)
- ⚠️ Annahme getroffen

---

## Feature 1 — Listings anlegen/verwalten
**Status:** ✅ Fertig

**Dateien:**
- `lib/constants.js` — Kategorien-Labels (KATEGORIEN, KATEGORIE_LABEL), in allen Features genutzt
- `app/anbieter/listings/page.js` — Liste eigener Angebote mit Deaktivieren/Reaktivieren
- `app/anbieter/listings/neu/page.js` — Formular: Titel, Beschreibung, Kategorie, Preis, Region, Foto
- `app/anbieter/listings/[id]/bearbeiten/page.js` — Bearbeiten-Formular, lädt vorhandene Daten
- `app/mein-bereich/page.js` — Link zu "Meine Angebote" für Anbieter ergänzt

**Manuell erforderlich:**

🔧 **Supabase Storage — Bucket anlegen**
1. Supabase Dashboard → Storage → "New bucket"
2. Name: `listing-photos`, Public: **ja** (Haken setzen)
3. Danach im SQL-Editor diese Policies ausführen:

```sql
-- Öffentlich lesbar
create policy "Public read listing photos"
  on storage.objects for select
  using (bucket_id = 'listing-photos');

-- Eingeloggte Nutzer dürfen hochladen
create policy "Authenticated upload listing photos"
  on storage.objects for insert
  with check (bucket_id = 'listing-photos' and auth.role() = 'authenticated');

-- Anbieter dürfen eigene Fotos löschen
create policy "Providers delete own listing photos"
  on storage.objects for delete
  using (
    bucket_id = 'listing-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
```

**Annahmen:**
- ⚠️ Foto-Upload ist optional; ohne Bucket schlägt Upload mit einer roten Fehlermeldung fehl — Listing wird trotzdem angelegt, nur ohne Foto
- ⚠️ Fotos werden als öffentliche URLs gespeichert (kein signed URL / Ablaufdatum)
- ⚠️ `<img>` statt `next/image` verwendet (ESLint-disable gesetzt) — für Production empfohlen: `remotePatterns` in `next.config.mjs` für die Supabase Storage URL konfigurieren
- ⚠️ Zugriffsschutz: Anbieter-Seiten prüfen die Rolle per DB-Abfrage; kein Middleware-Redirect

---

## Feature 2 — Marktplatz / Suche
**Status:** ✅ Fertig

**Dateien:**
- `app/marktplatz/page.js` — öffentliche Übersichtsseite mit Kategorie-Filter, Region-Suche, Preis-Sortierung

**Annahmen:**
- ⚠️ Region-Filter ist ein einfaches Textsuchfeld (ILIKE), kein PLZ-Umkreis
- ⚠️ Fotos: Erstes Foto des Listings wird als Karten-Bild gezeigt; ohne Foto graue Platzhalter-Box

---

## Feature 3 — Listing-Detailseite
**Status:** ✅ Fertig

**Dateien:**
- `app/angebote/[id]/page.js` — alle Infos, Anbieter-Name, "Anfragen"-Button für eingeloggte Kunden

**Annahmen:**
- ⚠️ "Anfragen"-Button ist nur für Kunden sichtbar (Rolle = customer); Anbieter sehen eine Info stattdessen
- ⚠️ Nicht eingeloggte Nutzer sehen den Button ebenfalls nicht (Login-Hinweis)

---

## Feature 4 — Buchungsanfrage (ohne Zahlung)
**Status:** ✅ Fertig

**Dateien:**
- `app/angebote/[id]/anfragen/page.js` — Datumswahl + Buchung erstellen
- `app/mein-bereich/page.js` — Anfragen-Übersicht für Anbieter und Kunden ergänzt
- `app/mein-bereich/anfragen/page.js` — detaillierte Anfragenliste

**Manuell erforderlich:**
🔧 Keine — alles läuft über das bestehende Schema und die DB-Trigger (commission_cents, provider_payout_cents, auto_release_at werden automatisch berechnet)

**Annahmen:**
- ⚠️ `amount_cents` = `price_cents` des Listings (kein Mengenfeld oder Rabatt)
- ⚠️ Kein Echtzeit-Update der Buchungsliste; Seite neu laden zeigt aktuellen Stand

---

## Feature 5 — Bewertungen (Struktur)
**Status:** ✅ Fertig

**Dateien:**
- `app/angebote/[id]/page.js` — Bewertungen werden unter dem Listing angezeigt
- `app/angebote/[id]/bewerten/page.js` — Bewertungsformular (1–5 Sterne + Kommentar)

**Annahmen:**
- ⚠️ Bewertungsformular ist erreichbar, auch wenn keine `completed`-Buchung existiert (der DB-Check fehlt noch — RLS-Policy erlaubt Insert für jeden, der `reviewer_id = auth.uid()` setzt). Für Production: Zusätzliche Prüfung in der RLS-Policy oder API-Route einbauen, dass eine abgeschlossene Buchung für das Listing existiert.
- ⚠️ Derzeit kann jeder eingeloggte Nutzer eine Bewertung abgeben — nicht nur Kunden mit `completed`-Buchung

---

## Nächste Schritte (für morgen)

| Thema | Priorität |
|---|---|
| Stripe-Anbindung (Feature: Zahlung) | Hoch — benötigt echte Stripe-Keys |
| Storage-Bucket "listing-photos" anlegen | Mittel — Fotos funktionieren erst danach |
| E-Mail-Benachrichtigungen (Buchung angenommen/abgelehnt) | Mittel |
| Middleware-Schutz für Routen (statt client-side Check) | Niedrig |
| RLS für Bewertungen: nur nach `completed`-Buchung | Niedrig |
| `next/image` mit Supabase `remotePatterns` konfigurieren | Niedrig |
