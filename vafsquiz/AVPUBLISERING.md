# Avpublisering av festquizen

Quizen er publisert som den isolerte undermappen `vafsquiz/` i nettside-repoet.
Ingen andre filer på nettsiden er endret, så den fjernes fullstendig med én operasjon.

## Slik fjerner du quizen fra nettsiden

Kjør i PowerShell fra nettside-repoet (`C:\Codex\nettside_frivilligsentralen`):

```powershell
git rm -r vafsquiz
git commit -m "Fjern festquiz etter arrangementet"
git push
```

Etter at GitHub Pages har deployet (2–5 min) gir `https://frivilligsentralen.org/vafsquiz/`
en 404, og resten av nettsiden er nøyaktig som før.

Filene finnes fortsatt i:
- Git-historikken (kan hentes tilbake), og
- backup-mappen `C:\Codex\vafsquiz`

så quizen kan kjøres igjen senere om ønskelig.

## Husk også: Firebase

Stram inn eller slå av Realtime Database-reglene samtidig (de var åpne for festen).
I Firebase-konsollen → Realtime Database → Rules, sett begge til `false`:

```json
{
  "rules": {
    "game":    { ".read": false, ".write": false },
    "players": { ".read": false, ".write": false }
  }
}
```

## Enklest av alt

Si til Claude Code: **«avpubliser quizen»** — så utføres stegene over automatisk,
med påminnelse om Firebase-reglene.
