# CLAUDE.md — Festquiz: "Hvor mye vet du om oss?"

Dette dokumentet er instruksjonen til Claude Code for å bygge en sanntids quiz til
en fest for frivillige ved Vestre Aker Frivilligsentral. Følg spesifikasjonen
nøyaktig. All UI-tekst skal være på **norsk**.

---

## 1. Hva vi bygger

En vert-styrt (Kahoot-lignende) sanntidsquiz med 10 spørsmål, 4 alternativer hver.
Verten (admin) styrer tempoet manuelt. Det kjøres på storskjerm/projektor samtidig
som deltakerne svarer på sine egne mobiler.

Tittel som vises til deltakerne: **"Hvor mye vet du om oss?"**

### Tre visninger (tre URL-er)
- `/vafsquiz/` — **deltaker** (mobil): skriver navn, ser spørsmål, trykker svar, ser egen plassering
- `/vafsquiz/skjerm/` — **storskjerm** (projektor): spørsmål stort, fasit m/søyler, topp 5, vinner
- `/vafsquiz/admin/` — **vert** (Espen): Start / Vis fasit / Ledertavle / Neste / Trekk vinner

Ingen passord. Admin og skjerm beskyttes kun av at URL-ene ikke deles offentlig.

---

## 2. Teknisk stack

- **Statisk HTML/CSS/JavaScript** — ingen byggsteg, ingen rammeverk nødvendig (vanilla JS)
- **Firebase Realtime Database** — sanntidstilstand som alle klienter lytter på
- **GitHub Pages** — hosting, som undermappe `vafsquiz` i det eksisterende repoet for
  frivilligsentralen.org
- **canvas-confetti** — konfetti ved vinner (lastes via CDN `<script>`, gratis, ingen konto)

Bruk Firebase via CDN-modulen (compat eller modular v9+). Ikke npm-installer noe;
holdes som rene statiske filer så det kan ligge rett i GitHub Pages-repoet og
overtas av frivillige senere.

> **Miljø:** Espen bruker kun **Windows**. Alle kommandoer skal gis for
> **PowerShell**, ikke Mac/Linux.

---

## 3. Mappestruktur som skal opprettes

Claude Code skal opprette følgende struktur inne i mappen **`vafsquiz`** (som Espen
allerede har laget) i det eksisterende GitHub Pages-repoet:

```
vafsquiz/
├── index.html              # Deltakerside (mobil)
├── skjerm/
│   └── index.html          # Storskjerm
├── admin/
│   └── index.html          # Vertens styringsside
├── css/
│   └── style.css           # Felles stil for alle tre visninger
├── js/
│   ├── firebase-config.js  # Firebase-init + db-referanse (DELES av alle sider)
│   ├── questions.js        # De 10 spørsmålene med fasit (se seksjon 7)
│   ├── deltaker.js         # Logikk for deltakersiden
│   ├── skjerm.js           # Logikk for storskjermen
│   └── admin.js            # Logikk for adminsiden
├── img/
│   └── felles.jpg          # ← Espen legger inn selv (felles bilde av Mons, Anita og Espen)
└── lyd/
    └── drum.mp3            # ← Espen legger inn selv (drumroll, ~3 sek)
```

**VIKTIG — fortell Espen tydelig i terminalen etter at strukturen er laget:**
- Bildet skal legges i `vafsquiz/img/` med filnavnet `felles.jpg`
- Lydfil skal legges i `vafsquiz/lyd/` med filnavnet `drum.mp3`
- Koden refererer til disse filnavnene, så de må stemme nøyaktig.

---

## 4. Datamodell (Firebase Realtime Database)

```
/game
  state: "lobby" | "question" | "reveal" | "leaderboard" | "results"
  currentQuestion: 0–9          // hvilket spørsmål som er aktivt

/players
  /{playerId}                    // Firebase push()-id, lagres i deltakerens localStorage
    name: "Espen"
    answers:                     // spørsmålsindeks → valgt alternativ-indeks (0–3)
      0: 2
      1: 0
      ...
    score: 7                     // antall riktige, oppdateres løpende
```

- Spørsmål/fasit ligger i `questions.js` (statisk), **ikke** i databasen — deltakerne
  ser aldri fasiten i nettverkstrafikken før den avsløres på skjermen.
- Hver deltaker får en `playerId` via `push()` ved registrering, lagret i `localStorage`
  slik at en utilsiktet refresh ikke mister navn/svar.

---

## 5. Spillflyt og tilstander

Verten styrer alt fra admin. Alle klienter lytter på `/game/state` og
`/game/currentQuestion` og rendrer riktig skjerm automatisk.

| state         | Deltaker (mobil)                          | Storskjerm                                              | Admin-knapp som fører videre |
|---------------|-------------------------------------------|---------------------------------------------------------|------------------------------|
| `lobby`       | Skriv navn + "antall registrert"          | Tittel, felles bilde av Mons/Anita/Espen, live teller   | **Start**                    |
| `question`    | Spørsmålstekst + 4 svarknapper, "Svar"    | Spørsmål + 4 alternativer stort, teller svart/ikke svart| **Vis fasit**                |
| `reveal`      | "Du svarte riktig/feil" (enkelt)          | Søyler animeres opp → riktig blir grønt (se 6.1)        | **Ledertavle**               |
| `leaderboard` | "Du er nr. X av Y"                         | Topp 5, animert                                         | **Neste spørsmål**           |
| `results`     | Egen sluttplassering                      | Målside: full fasit-oppsummering + vinnertrekning       | **Trekk vinner**             |

**Flyt-detaljer:**
- Fra `lobby`: admin klikker **Start** → `state="question"`, `currentQuestion=0`.
- I `question`: deltaker velger ett alternativ og klikker **Svar** → skrives til
  `/players/{id}/answers/{currentQuestion}`. Knappene låses etter svar.
- Admin ser i `question` hvor mange som har svart ("8 av 12 har svart").
- Admin klikker **Vis fasit** → `state="reveal"`. Poeng beregnes nå løpende:
  hvis svaret matcher fasit, oppdateres spillerens `score`.
- Admin klikker **Ledertavle** → `state="leaderboard"`.
- Admin klikker **Neste spørsmål**:
  - hvis `currentQuestion < 9` → `currentQuestion++`, `state="question"`
  - hvis `currentQuestion === 9` → `state="results"`
- I `results`: admin klikker **Trekk vinner** → drumroll-animasjon (se 6.2).

---

## 6. Spesielle animasjoner

### 6.1 Fasit med søyler (storskjerm, `reveal`)
- Vis fire horisontale søyler, én per alternativ, med antall svar per alternativ.
- **Animer søylene opp først** (vokser fra 0 til sin verdi), **deretter** lyser det
  riktige alternativet grønt med en liten ✓-effekt. Litt drama før avsløringen.
- Tell antall svar per alternativ ved å lese `/players/*/answers/{currentQuestion}`.

### 6.2 Vinnertrekning (storskjerm, `results`)
Sekvens når admin klikker **Trekk vinner**:
1. Vis topplista (de med flest riktig) først.
2. **Drumroll ~3 sekunder:** navnene blant de kvalifiserte flimrer raskt forbi i
   midten (lykkehjul-effekt som bremser ned).
3. Spill `lyd/drum.mp3` samtidig. Lyd er **valgfri/robust**: forsøk avspilling, men
   la animasjonen fungere visuelt uavhengig av om lyden spiller (admin-klikket er en
   brukerinteraksjon, så avspilling skal normalt være tillatt).
4. Vinneren låses, navnet spretter stort fram, og `canvas-confetti` skyter konfetti.

**Vinnerlogikk:** finn høyeste `score` som faktisk forekommer blant spillerne,
filtrer alle spillere med den scoren, trekk én tilfeldig blant dem. Dette gjør at
trekningen automatisk faller fra 10 → 9 → 8 riktige uten ekstra logikk.

### 6.3 Ledertavle (storskjerm, `leaderboard`)
- Vis **topp 5** sortert på `score` (synkende), animert (de som klatret beveger seg opp).
- På deltakerens mobil: vis kun **"Du er nr. X av Y"** (ikke hele lista, så alle føler seg med).

---

## 7. Spørsmål og fasit (questions.js)

10 spørsmål. `correct` er indeksen (0-basert) til det riktige alternativet i
`options`-arrayet. Det riktige svaret er bevisst plassert på **varierte posisjoner**
(ikke alltid først) — `options` står i den rekkefølgen de skal vises, og `correct`
peker på riktig svar. Behold rekkefølge og `correct`-verdier nøyaktig som angitt.

```javascript
// vafsquiz/js/questions.js
export const questions = [
  {
    q: "Hva er Mons sitt virkelige navn?",
    options: [
      "Mons-Birger (han nekter å bekrefte det)",
      "Johan",
      "Magnus",
      "Han heter faktisk Mons — foreldrene var optimister"
    ],
    correct: 1
  },
  {
    q: "Hva sier Espen stolt når du spør han om hans yrkesbakgrunn?",
    options: [
      "Jeg er kokk",
      "Jeg er servitør",
      "Jeg er hotellmann",
      "Jeg er selger"
    ],
    correct: 2
  },
  {
    q: "Hva heter Anitas eget firma?",
    options: [
      "Mormors Hjelpende Hånd",
      "Sprek Senior",
      "Bestemor på Farten",
      "Aktiv Bestemor"
    ],
    correct: 3
  },
  {
    q: "Hva bruker Anita helgene sine på?",
    options: [
      "Sykle langtur (alltid med matpakke i sekken)",
      "Løpe rundt (hun elsker parkrun)",
      "Gå på fjelltur (jo høyere, jo bedre)",
      "Svømme i sjøen (uansett årstid)"
    ],
    correct: 1
  },
  {
    q: "Hva er Mons sin hobby?",
    options: [
      "Samler på frimerker",
      "Samler på mynter",
      "Samler på OL-memorabilia",
      "Samler på vinetiketter"
    ],
    correct: 2
  },
  {
    q: "Hva besto masterutstillingen til Anitas datter Sara av?",
    options: ["Hender", "Øyne", "Stemmer", "Neser"],
    correct: 3
  },
  {
    q: "Hvem lærte Espen å kjøre bil?",
    options: [
      "Ingen — han er helt selvlært",
      "Faren, på en gårdsvei",
      "En dyr kjøreskole i byen",
      "En tålmodig kompis"
    ],
    correct: 0
  },
  {
    q: "Hva lovet Espen datteren Tirill hvis hun sa ja til å ta spansk på ungdomsskolen?",
    options: [
      "At hun skulle få sin egen mobil",
      "At han skulle lære seg spansk selv",
      "At de skulle reise til Spania",
      "At hun slapp å vaske rommet et helt år"
    ],
    correct: 1
  },
  {
    q: "Hva kaller Anita bilen sin?",
    options: ["Kula", "Lynet", "PropELa", "Blåmann"],
    correct: 2
  },
  {
    q: "Hva kalles familiehytta til Espen?",
    options: ["Solbakken", "Fjellro", "Faulty Towers", "Utsikten"],
    correct: 2
  }
];
```

> Merk: det riktige svaret er allerede plassert på varierte posisjoner (a/b/c/d om
> hverandre) i `options`-arrayene over, og `correct` peker på rett indeks. Claude Code
> skal vise alternativene i den rekkefølgen de står og spore riktig svar via `correct`,
> ikke via posisjon. Ikke stokk på nytt — fordelingen er allerede variert.

---

## 8. Firebase-oppsett (Espen gjør i Firebase-konsollen)

Claude Code skal lage `firebase-config.js` med plassholdere og **be Espen** fylle inn:
- Opprett et Firebase-prosjekt (eller gjenbruk eksisterende).
- Aktiver **Realtime Database**.
- Lim inn web-app-konfigurasjonen (apiKey, databaseURL, osv.) i `firebase-config.js`.

For et engangsarrangement kan databasereglene være åpne for lesing/skriving en
begrenset periode. Anbefalt minimum: tillat skriving kun til `/players` og
`/game` (sistnevnte styres reelt sett kun fra admin). Claude Code skal foreslå
et enkelt regelsett og minne Espen på å **slå av/stramme reglene etter festen**.

---

## 9. Designprinsipper

- **Stort og lesbart** på storskjerm — tenk projektor sett fra bakerste rad.
- Festig, varm og leken stil. Gjerne lekne farger, men hold god kontrast.
- Mobilgrensesnittet skal være enkelt: store touch-vennlige svarknapper.
- Lobby-siden viser det felles bildet (`felles.jpg`) av Mons (styreleder), Anita
  (kjøkkensjef) og Espen, med en kort tekst som presenterer dem.
- Hold alt selvforklarende — systemet skal kunne overtas/gjenbrukes av frivillige.

---

## 10. Deploy (GitHub Pages, Windows/PowerShell)

`vafsquiz` ligger som undermappe i det eksisterende GitHub Pages-repoet. Deploy skjer
ved vanlig commit + push. Eksempel (PowerShell):

```powershell
git add vafsquiz
git commit -m "Legg til festquiz"
git push
```

Siden blir tilgjengelig på `https://frivilligsentralen.org/vafsquiz/` (deltaker),
`.../vafsquiz/skjerm/` (storskjerm) og `.../vafsquiz/admin/` (vert).

Test alle tre URL-ene før festen, og kjør en full generalprøve med et par mobiler
+ projektor.

---

## 11. Oppgaveliste for Claude Code

1. Opprett mappestrukturen i seksjon 3 (inkl. tomme `img/` og `lyd/` med en kort
   `LESMEG.txt` som forklarer hvilke filer Espen skal legge der).
2. Skriv `questions.js` (seksjon 7).
3. Skriv `firebase-config.js` med plassholdere + instruks til Espen.
4. Bygg de tre HTML-sidene + tilhørende JS (deltaker, skjerm, admin) etter flyten i
   seksjon 5.
5. Implementer animasjonene i seksjon 6 (søyler, drumroll + konfetti, ledertavle).
6. Skriv `style.css` etter prinsippene i seksjon 9.
7. Skriv ut en tydelig oppsummering i terminalen til Espen: hvor bilder/lyd skal
   ligge, hva han må gjøre i Firebase, og hvordan han deployer.
