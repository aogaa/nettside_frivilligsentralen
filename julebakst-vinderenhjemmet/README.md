# Julebakst på Vinderenhjemmet

Lokal rekrutteringsside for julebakst på Vinderenhjemmet i desember 2026.

## Lokal kjøring

Kjør fra roten av `nettside_frivilligsentralen`:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Åpne deretter:

`http://127.0.0.1:8765/julebakst-vinderenhjemmet/`

## Filer

- `julebakst-vinderenhjemmet/index.html` - siden.
- `css/julebakst-vinderenhjemmet.css` - kampanjens responsive juleprofil.
- `js/julebakst-vinderenhjemmet-form.js` - validering og innsending.
- `images/julebakst-vinderenhjemmet/hero.webp` - hovedmotiv.
- `images/julebakst-vinderenhjemmet/og-julebakst-vinderenhjemmet.png` - Open
  Graph-bilde.
- `images/julebakst-vinderenhjemmet/oslo-logo.svg` - partnerlogo.

## Påmeldingsskjema

Skjemaet sender til den allerede aktiverte FormSubmit-mottakeren for
`espen@vestreaker.frivilligsentral.no`. Det krever navn, telefon, e-post, minst
én dato og personvernsamtykke. Samtykke til informasjon om lignende aktiviteter
er valgfritt og separat.

## Kontrollert

- Desktop 1280 px og mobil 390 px.
- Ingen horisontal scrolling eller manglende bilder.
- Flerdatovalg og begge samtykkevalg.
- Tilgjengelig feiloppsummering og feltfeil.
- Ingen konsollfeil.

## Publisering

Siden publiseres via repositoryets eksisterende GitHub Pages-rutine etter
godkjenning. Offentlig adresse:
https://frivilligsentralen.org/julebakst-vinderenhjemmet/
