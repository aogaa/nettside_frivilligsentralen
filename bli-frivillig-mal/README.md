# Mal for nye aktivitetssider

Dette er en offentlig tilgjengelig, deaktivert skjemamal du kopierer når du skal
lage en ny side under «Bli frivillig».

Malen har `noindex, nofollow` og ligger ikke i `sitemap.xml`.

## Bruk

```powershell
Copy-Item -Recurse bli-frivillig-mal <slug>
```

Alt som skal endres i `index.html` er merket `BYTT` i en kommentar.

Den fullstendige oppskriften — bilder, kort på landingssiden, sitemap og
skjemamottaker — står i [`../bli-frivillig/README.md`](../bli-frivillig/README.md).

## Forhåndsvis malen

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Åpne `http://127.0.0.1:8765/bli-frivillig-mal/`.

Skjemaet er deaktivert med data-demo og inert, og malens ID er sperret i API-et.
Registrer en ny skjema-ID på serveren og last skjema-client.js før du aktiverer en kopi.
