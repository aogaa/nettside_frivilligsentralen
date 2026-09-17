# Bli frivillig

Landingsside som samler alle rekrutteringssidene på nettstedet, med tekst om
hva frivillighet gir den enkelte og nabolaget.

Siden ligger i toppmenyen på alle sider, rett etter «Om oss».

## Publisert side

`https://frivilligsentralen.org/bli-frivillig/`

## Lokal kjøring

Kjør fra roten av `nettside_frivilligsentralen`:

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

Åpne `http://127.0.0.1:8765/bli-frivillig/`.

---

## Legge til en ny aktivitet

Dette er hovedpoenget med oppsettet: en ny aktivitetsside skal ikke koste
nye CSS- eller JS-linjer. Seks steg.

### 1. Kopier malen

```powershell
Copy-Item -Recurse bli-frivillig-mal <slug>
```

Bruk ASCII i mappenavnet — små bokstaver og bindestrek, ingen æ, ø eller å.
`tid-til-aa-snakke` er eksempelet å følge.

### 2. Legg inn bilder

Lag `images/<slug>/` og legg inn:

| Fil | Mål | Brukes til |
|---|---|---|
| `hero.webp` | 1536 × 1024 (3:2) | Hero på undersiden og kortet på denne siden |
| `og-<slug>.jpg` | 1200 × 630 | Forhåndsvisning når siden deles på Facebook og LinkedIn |

3:2 er formatet kortgridet er bygget for. Andre formater beskjæres pent, men
3:2 gir det ryddigste resultatet.

### 3. Bytt ut innholdet

Alt som skal endres i `<slug>/index.html` er merket `BYTT` i en kommentar:
tittel, beskrivelse, canonical, OG-blokka, hero, tekstseksjoner og skjemaets
`data-subject` / `data-intro`.

Husk å slette `<meta name="robots" content="noindex, nofollow">` og
malkommentaren øverst.

**Ikke gi siden sin egen farge.** Alle rekrutteringssidene deler én palett, og
det er poenget. Fargene ligger som CSS-variabler i `.bf-page` øverst i
`css/bli-frivillig.css`. Skal noe endres, endres det der — for alle sidene
samtidig.

Brødtekst skal alltid være `var(--bf-body)`. Ikke skriv en fargekode direkte
i en regel; det var slik de fire ulike gråtonene oppsto.

### 4. Legg til kortet på denne siden

Ett `<li class="bf-card">` i `bli-frivillig/index.html`, i seksjonen med
`id="aktiviteter"`. Kopier et eksisterende kort og bytt lenke, bilde,
overskrift og ingress. Gridet ordner kolonnene selv — du trenger ikke justere
noe når antallet vokser.

### 5. Legg siden i sitemap

Én blokk i `sitemap.xml`:

```xml
<url>
  <loc>https://frivilligsentralen.org/SLUG/</loc>
  <lastmod>ÅÅÅÅ-MM-DD</lastmod>
</url>
```

Malen `bli-frivillig-mal/` skal **ikke** inn i sitemap.

### 6. Skal svarene til en annen enn Espen?

Se avsnittet om skjema under. Standardmottaker krever ingenting.

---

## Skjema

Alle skjemaene under `/bli-frivillig/` drives av `js/frivillig-form.js`.

### Feltene styres fra HTML

Du kan legge til og fjerne felt uten å røre JavaScript. Reglene leses fra
attributtene:

| Attributt | Virkning |
|---|---|
| `required` | Feltet må fylles ut |
| `data-bf-label="Navn"` | Hva feltet heter i feilmeldinger og i e-posten |
| `data-bf-error="…"` | Egen feilmelding i stedet for standardteksten |
| `data-bf-required-group="valg"` | På et `<fieldset>`: krev minst én avkrysning |
| `data-bf-skip` | Hold feltet utenfor e-posten |

Valideringen tilpasser seg felttypen av seg selv: `type="email"` sjekkes som
e-post, `type="tel"` krever minst seks sifre, avkrysningsbokser må hukes av.

Et `<fieldset>` med `data-bf-required-group` **må ha en `id`**, ellers blir
regelen hoppet over.

### Mottaker

Standardmottaker er `espen@vestreaker.frivilligsentral.no`. Den ligger som
konstant i `js/frivillig-form.js` og vises aldri i HTML-kilden.

Skal en side gå til noen andre, legg `data-formsubmit` på `<form>`:

```html
<form data-frivillig-form data-formsubmit="6f98aaab672470053b3da65ff34dc4fc" …>
```

**Bruk et FormSubmit-alias, ikke en e-postadresse.** Verdien står i HTML-kilden
på en side som er laget for å få trafikk, og adresser som ligger åpent der blir
høstet av spamroboter. Et alias lager du ved å sende ett skjema til adressen én
gang; FormSubmit svarer med et alias du kan bruke i stedet. Samme grep brukes
allerede i `js/beredskap-form.js`.

Skriv en kommentar rett over skjemaet om hvilken innboks aliaset går til, og
før det opp her:

| Alias | Går til | Brukes på |
|---|---|---|
| *(ingen — standard)* | espen@vestreaker.frivilligsentral.no | `/bli-frivillig/` |

### Ny mottaker må aktiveres fra produksjon

FormSubmit aktiverer en mottaker ved første innsending, og bindingen skjer mot
det domenet innsendingen kom fra. **En test fra `127.0.0.1` aktiverer ingenting.**

Publiser først, åpne så den ferdige siden på `frivilligsentralen.org`, og send
en test derfra. Er mottakeren ny, kommer det en bekreftelses-e-post fra
FormSubmit som må klikkes én gang. Deretter går skjemaet av seg selv.

---

## Filer

| Fil | Rolle |
|---|---|
| `bli-frivillig/index.html` | Denne landingssiden |
| `bli-frivillig-mal/` | Mal for nye aktivitetssider |
| `css/bli-frivillig.css` | Delt stilark for landingssiden og alle undersidene |
| `js/frivillig-form.js` | Delt skjema for landingssiden og alle undersidene |

Footeren skrives ikke i HTML — den bygges av `js/site-footer.js`.

## Sidene som er lenket i dag

Alle ni deler `css/bli-frivillig.css` og `js/frivillig-form.js`:

| Side | Rolle |
|---|---|
| `sprakvert/` | Språkvert på språkkafeen, Røa bibliotek |
| `leksehjelper/` | Leksehjelper, Hovstua og Hovseter skole |
| `frivilligbussen/` | Sjåfør på Frivilligbussen |
| `kafevert/` | Kafévert på Møteplass Vinderen |
| `gode-stunder-vinderenhjemmet/` | Løpende oppdrag på Vinderenhjemmet |
| `student-vinderenhjemmet/` | Studentvariant av samme |
| `julebakst-vinderenhjemmet/` | Julebakst, fem datoer i desember |
| `tid-til-aa-snakke/` | Samtalevert på Hovstua, torsdager |
| `60-timer-som-betyr-noe/` | VID-praksis, 60 timer |

De fem nederste ble migrert i september 2026. Stilarkene og skjema-JS-en de
hadde hver for seg er slettet.

**Ett bevisst avvik:** `60-timer-som-betyr-noe/` beholder nettstedets
hovedmeny der de åtte andre har en kort ankermeny. Siden deles på flyer til
VID-studenter som ikke nødvendigvis kjenner nettstedet fra før. Det står som
kommentar i fila.

Nye sider lages fra malen.

### Faktagrunnlag som bør holdes oppdatert

Tidene og kravene på de fire nye sidene er hentet fra aktivitetssidene under
`aktiviteter/`. Endrer en aktivitet tid, sted eller krav, må begge stedene
rettes:

| Rekrutteringsside | Aktivitetsside |
|---|---|
| `sprakvert/` | `aktiviteter/sprakkafe.html` |
| `leksehjelper/` | `aktiviteter/leksehjelp.html` |
| `frivilligbussen/` | `aktiviteter/frivilligbussen.html` |
| `kafevert/` | `aktiviteter/moteplass-vinderen-kafe.html` |

To opplysninger står **bare** på rekrutteringssidene og er bekreftet av Espen:
sjåfør på Frivilligbussen krever kun førerkort klasse B, og leksehjelp krever
politiattest (frivilligsentralen hjelper til med søknaden).
