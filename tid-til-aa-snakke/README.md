# Tid til å snakke

Lokal rekrutteringsside for frivillige samtaleverter på Hovstua.

## Lokal forhåndsvisning

Kjør en enkel statisk webserver fra roten av
`C:\Codex\nettside_frivilligsentralen`, for eksempel:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Åpne deretter:

`http://127.0.0.1:8765/tid-til-aa-snakke/`

## Filer

- `index.html` - selve landingssiden.
- `../css/tid-til-aa-snakke.css` - sidens egne stiler.
- `../images/tid-til-aa-snakke/hero.webp` - komprimert hero-bilde.
- `../images/tid-til-aa-snakke/og-tid-til-aa-snakke.png` - delingsbilde.

## Publisering

Siden følger den eksisterende statiske strukturen og kan publiseres sammen med
resten av nettstedet. **Ikke publiser eller push endringene før Espen har
godkjent tekst, bilde og utforming.**
