# Manual for drift og videreutvikling av nettsiden

Denne manualen er laget for at en ny person skal kunne overta prosjektet uten muntlig overlevering.

## 1. Hva slags nettside dette er

Dette er en **statisk nettside**:
- Ingen database
- Ingen backend-server
- Ingen byggverktøy (ingen `npm build`, ingen framework)

Nettsiden består av vanlige:
- HTML-filer (`*.html`)
- CSS-filer (`css/style.css`)
- JavaScript-filer (`js/*.js`)
- Bilder og media (`images/`, `audio/`)

Publisering skjer via **GitHub + GitHub Pages**.

---

## 2. Programmer og verktøy vi bruker

Minimum:
- **VS Code** (redigering)
- **Git** (versjonskontroll)
- **GitHub-konto** (repo + publisering)
- **Nettleser** (Chrome/Edge/Firefox)

Nyttige tillegg:
- **GitHub Desktop** (hvis du vil slippe terminal)
- VS Code extension: **Live Server** (lokal forhåndsvisning)

---

## 3. Mappestruktur (viktig)

Rotmappe: `C:\Codex\nettside_frivilligsentralen`

- `index.html` = forsiden
- `aktiviteter/` = alle aktivitetssider
- `css/style.css` = hovedstil for hele nettstedet
- `js/site-nav.js` = mobil/hamburger-meny
- `js/site-footer.js` = felles kontaktboks nederst på alle sider
- `images/` = bilder
- `images/aktiviteter/` = aktivitetsspesifikke bilder

Merk:
- Alle sider laster **samme CSS**.
- Footer og mobilmeny settes inn via JavaScript-filer (gjenbruk).

---

## 4. Starte lokalt (test før publisering)

### Alternativ A: VS Code + Live Server
1. Åpne prosjektmappen i VS Code.
2. Høyreklikk `index.html` -> `Open with Live Server`.
3. Test desktop + mobilvisning (DevTools).

### Alternativ B: enkel lokal server via Python
Kjør i terminal i prosjektmappen:

```powershell
python -m http.server 8000
```

Åpne:

`http://localhost:8000`

---

## 5. Standard arbeidsflyt for endringer

1. Gjør endringer i HTML/CSS/JS.
2. Test lokalt:
   - Lenker
   - Mobilmeny
   - Responsivitet
   - At `æ/ø/å` vises riktig
3. Kjør Git-kommandoer:

```powershell
git status
git add .
git commit -m "Kort og presis beskrivelse av endringen"
git push
```

4. Vent på GitHub Pages-publisering (kan ta noen minutter).
5. Hard refresh i nettleser (`Ctrl+F5`) for å unngå cache.

---

## 6. Hvordan publisering fungerer (GitHub Pages)

### Sjekk dette i GitHub:
`Settings -> Pages`

Vanlig oppsett er:
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)` eller `/docs`

Hvis siden ikke oppdateres:
1. Sjekk at commit faktisk er pushed til riktig branch.
2. Sjekk `Actions`-fanen for deploy-feil.
3. Vent 2-5 min.
4. Test i inkognito/hard refresh.

---

## 7. Slik legger du til en ny aktivitetsside

1. Kopier filen:
`aktiviteter/aktivitet-mal.html`

2. Gi nytt filnavn med små bokstaver og bindestrek:
Eksempel: `aktiviteter/sproytegruppe.html` (unngå norske tegn i filnavn).

3. Oppdater i den nye siden:
- `<title>`
- `<h1>`
- Hero-bilde:
  - `background-image: url('../images/aktiviteter/DITT-BILDE.jpg')`
  - `--hero-focus: XX%` (juster utsnitt)
- Brødtekst
- Praktisk info
- Eventuelle bilder/video/kart

4. Legg til kort på forsiden i `index.html` under aktivitetsseksjonen:
- Bilde
- Tittel
- Kort tekst
- Lenke til ny side

---

## 8. Mobil og responsivitet (kritisk)

Dette må alltid testes før push:
- Åpne meny (hamburger)
- Sjekk at dropdown ikke dekker/ødelegger hero-tekst
- Lesbarhet på små skjermer (320px og opp)
- Bilder som ikke skal beskjæres må bruke `object-fit: contain`

CSS ligger i:
`css/style.css` (media queries nederst)

---

## 9. Tegnkoding (æ, ø, å)

Alle filer skal lagres som **UTF-8**.

Hvis du ser tekst som `Ã¥`, `Ã¸`, `Ã¦`:
- Filen er feilkodet
- Åpne filen i VS Code
- `Save with Encoding -> UTF-8`

---

## 10. Felles komponenter

### Footer (kontaktboks)
Legges inn automatisk via:
- `js/site-footer.js`

Vil du endre tekst/telefon/Facebook i footer:
- Endre kun denne filen
- Ikke lim inn manuelt footer i hver HTML-side

### Mobilmeny
Styres av:
- `js/site-nav.js`
- relevante regler i `css/style.css`

---

## 11. Kvalitetssjekk før publisering

Gå gjennom denne listen:
- [ ] Ingen døde lenker
- [ ] Mobilmeny fungerer
- [ ] Hero-tekst overlapper ikke
- [ ] Bilder vises i riktig utsnitt
- [ ] `æ/ø/å` vises riktig
- [ ] Footer vises nederst
- [ ] Siden er testet i mobilvisning

---

## 12. Når noe haster (rask rollback)

Hvis en feil havner i produksjon:
1. Finn siste fungerende commit på GitHub.
2. Reverter commit i GitHub eller lokalt.
3. Push revert.
4. Vent til Pages deployer igjen.

Eksempel lokalt:

```powershell
git log --oneline
git revert <commit-hash>
git push
```

---

## 13. Eierliste / overlevering

Ved personbytte bør denne infoen gis videre:
- GitHub-repo URL
- Hvem som har admin-tilgang
- Hvilken branch som publiserer
- Domenekobling (`CNAME`) hvis brukt
- Hvor bilder/video originalfiler lagres

---

## 14. Kort oppsummering

For å drifte denne nettsiden trenger du i praksis:
1. Redigere HTML/CSS/JS i VS Code
2. Teste lokalt (særlig mobil)
3. `git add`, `git commit`, `git push`
4. Verifisere GitHub Pages deploy

Det er hele løypa.
