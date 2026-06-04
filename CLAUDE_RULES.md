# Claude Code Regeln — Festly

## SCHRITT 0 (Pflicht bei JEDEM Auftrag)
Bevor neue Features gebaut werden:
1. `grep -r "setLoading" app/ --include="*.js" --include="*.jsx" -l`
2. Jede gefundene Datei prüfen: setLoading(false) muss im finally-Block stehen
3. Muster das IMMER verwendet werden muss:

```javascript
useEffect(() => {
  async function load() {
    try {
      // Daten laden
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false) // IMMER hier
    }
  }
  load()
}, [])
```

## Weitere Pflichtregeln
- Nach jedem Arbeitsblock: git commit UND git push (nicht nur commit)
- Nie router.push() ohne vorheriges setLoading(false) im finally-Block
- Neue API-Routen immer mit Auth-Check: createSupabaseServer() + getUser() + 401
- SQL-Migrationen immer separat ausgeben, nie direkt ausführen
- Nach jeder Änderung: Build-Check mit `npm run build`
