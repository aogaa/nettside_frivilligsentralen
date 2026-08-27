# Manual: Leksehjelp-telling (skjult side med Firebase-lagring)

Denne manualen forklarer hvordan den skjulte registreringssiden for leksehjelpen
fungerer, logger hele Firebase-oppsettet, og gir konkrete oppskrifter for vanlige
endringer. Målgruppen er den som skal drifte eller videreutvikle løsningen senere.

> Resten av nettstedet er en ren statisk side (se `MANUAL-OVERLEVERING.md`).
> **Leksehjelp-tellingen er unntaket** – den bruker en liten backend (Firebase).

---

## 1. Hva løsningen gjør

- En **skjult** side der frivillige registrerer antall deltakere på leksehjelpen.
- URL: **https://frivilligsentralen.org/leksehjelp-telling/**
- Siden er **ikke** lenket fra menyen eller `sitemap.xml`, og har
  `<meta name="robots" content="noindex, nofollow">`. Den finnes kun for dem som
  har lenken. (Dette er «skjult adresse», ikke passord – alle med lenken kommer inn.)
- To tabeller: **Mandager** (felt: Antall barn, Voksenopplæring, Frivillige) og
  **Onsdager** (felt: Elever, Frivillige). Høst 2026-datoer er lagt inn; høstferie
  (28/9 og 30/9) vises som «Høstferie (stengt)».
- Når en frivillig trykker **Lagre** på en rad:
  1. Tallene **lagres** sentralt (Firebase Firestore) og vises i tabellen for alle
     med lenken.
  2. Tallene (+ eventuell melding) **sendes på e-post** til Espen via FormSubmit.
- Meldingsfeltet er valgfritt og **lagres ikke** – det blir bare med i e-posten.

---

## 2. Arkitektur (hvordan det henger sammen)

```
Nettleser (leksehjelp-telling/)
  ├─ GET  →  Cloud Function "leksehjelp"  →  Firestore   (henter alle tall → fyller tabellen)
  ├─ POST →  Cloud Function "leksehjelp"  →  Firestore   (lagrer én dato)
  └─ POST →  FormSubmit                                  (sender tallene på e-post til Espen)
```

- Nettleseren snakker **aldri** direkte med databasen. All databasetilgang går gjennom
  Cloud Function-en (som kjører med admin-rettigheter). Firestore-reglene er derfor
  helt låst.
- E-post går via **FormSubmit** (samme tjeneste som beredskaps- og nyhetsbrevskjema
  bruker), ikke via funksjonen.

---

## 3. Filer i prosjektet

| Fil | Rolle |
| --- | --- |
| `leksehjelp-telling/index.html` | Selve siden (skjult, noindex). Tabellene bygges av JS. |
| `js/leksehjelp.js` | All logikk i nettleseren: datoer, bygge tabeller, hente/lagre tall, sende e-post. |
| `functions/index.js` | Cloud Function `leksehjelp` (GET henter, POST lagrer) + validering. Samme fil har også `newsletterSignup`. |
| `firestore.rules` | Firestore-regler – låst (`allow read, write: if false`). |
| `firestore.indexes.json` | Indeksdefinisjoner (tom). |
| `firebase.json` | Firebase-konfig (functions + firestore). |
| `.firebaserc` | Peker på Firebase-prosjektet `frivilligsentralen-org`. |

---

## 4. Firebase-oppsett (logg)

Alt dette er allerede satt opp. Notert her for drift/feilsøking.

- **Firebase-prosjekt:** `frivilligsentralen-org`
- **Plan:** Blaze (kreves for Cloud Functions + Firestore)
- **Region (functions):** `europe-west1`
- **Firestore:** opprettet i **Native mode**, lokasjon `europe-west1`
- **Samling (collection):** `leksehjelp`
  - **Dokument-id** = datoen på ISO-form, f.eks. `2026-08-31`
  - **Felt (mandag):** `barn`, `voksenopplaering`, `frivillige`
  - **Felt (onsdag):** `elever`, `frivillige`
  - Pluss `dato`, `ukedag`, og `oppdatert` (server-tidsstempel)
- **Cloud Function:** `leksehjelp`
  - URL: `https://europe-west1-frivilligsentralen-org.cloudfunctions.net/leksehjelp`
  - `GET` → `{ "entries": [ ... ] }` (alle lagrede rader)
  - `POST` (JSON `{dato, ukedag, <felt>...}`) → lagrer én rad. Validerer at datoen
    finnes i en hardkodet liste og at tallene er heltall 0–999. Har honeypot mot bots.
- **Kjøre-konto (viktig!):** funksjonen kjører som prosjektets standard compute-konto
  `159640389363-compute@developer.gserviceaccount.com`. Den ble gitt IAM-rollen
  **`Cloud Datastore User` (`roles/datastore.user`)** manuelt for å få tilgang til
  Firestore. Uten denne rollen svarer funksjonen `7 PERMISSION_DENIED`.
- **E-post (FormSubmit):** mottaker `espen@vestreaker.frivilligsentral.no` (aktivert).
  Endepunkt settes i `js/leksehjelp.js` (`FORMSUBMIT_URL`).

**Konsoll-lenker:**
- Firestore-data: https://console.firebase.google.com/project/frivilligsentralen-org/firestore
- Functions: https://console.firebase.google.com/project/frivilligsentralen-org/functions
- IAM (roller): https://console.cloud.google.com/iam-admin/iam?project=frivilligsentralen-org

---

## 5. Verktøy og innlogging (Firebase CLI)

Endringer i funksjonen/reglene krever **Firebase CLI**.

Installere (én gang):
```powershell
npm install -g firebase-tools
```

Logge inn (åpner nettleser – bruk kontoen som eier `frivilligsentralen-org`):
```powershell
firebase login
```

- Hvis `firebase` ikke gjenkjennes i terminalen: bruk full sti
  `& "$env:APPDATA\npm\firebase.cmd"` i stedet for `firebase`.
- Hvis du får **«credentials are no longer valid»** (innlogging utløpt):
  ```powershell
  firebase login --reauth
  ```

---

## 6. Deploye endringer i funksjon/regler

Etter endringer i `functions/index.js`, `firestore.rules` eller `firestore.indexes.json`:

```powershell
cd C:\Codex\nettside_frivilligsentralen
firebase deploy --only functions,firestore:rules --project frivilligsentralen-org
```

- Endrer du **bare** frontend (`js/leksehjelp.js`, HTML, CSS) trenger du **ikke** deploye
  til Firebase – da holder det med `git push` (GitHub Pages), se punkt 7.

---

## 7. VIKTIG: cache-busting ved JS-endringer

Nettlesere og GitHub Pages sin CDN cacher `js/leksehjelp.js` hardt. `Ctrl+F5` var
**ikke** nok under utviklingen. Derfor lastes scriptet med et versjonsnummer:

```html
<script src="../js/leksehjelp.js?v=2" defer></script>
```

**Hver gang du endrer `js/leksehjelp.js`: øk tallet** (`?v=2` → `?v=3` …) i
`leksehjelp-telling/index.html`, og push begge filene. Da tvinges nettlesere til å
hente den nye versjonen.

---

## 8. Oppskrifter for vanlige endringer

### 8a. Nytt semester / nye datoer
Datoene er hardkodet **to steder** og må oppdateres begge:

1. `js/leksehjelp.js` – arrayene `MANDAGER` og `ONSDAGER`
   (stengte datoer skrives som `{ dato: "2026-09-28", stengt: true }`).
2. `functions/index.js` – settene i `LEKSEHJELP_DATOER` (her tas **kun åpne** datoer
   med – stengte datoer skal IKKE stå her, ellers kan man registrere på dem).

Deretter:
- Deploy funksjonen (punkt 6) – ellers avvises POST for nye datoer med «Invalid dato».
- Øk `?v=`-tallet i HTML-en (punkt 7) og `git push`.

> Glemmer du å oppdatere `functions/index.js`, vil siden vise de nye datoene, men
> lagring feiler (400 «Invalid dato»).

### 8b. Endre hvilke felt som telles
1. `js/leksehjelp.js` – objektet `FELTER` (nøkkel `key` + synlig `label`).
2. `functions/index.js` – objektet `LEKSEHJELP_FELTER` (nøklene må være **like** `key`).
3. Deploy funksjon + cache-bust JS.

### 8c. Endre mottaker-e-post
1. Endre `FORMSUBMIT_URL` i `js/leksehjelp.js`.
2. Ny adresse må **aktiveres** i FormSubmit én gang: åpne siden, skriv en test-melding,
   trykk Lagre (første gang «feiler» e-posten – forventet), klikk **Activate** i
   bekreftelses-e-posten til den nye adressen.
3. Cache-bust JS + `git push`.

### 8d. Nullstille tabellen (slette alle tall)
Krever innlogget CLI (punkt 5). Slett dokument for dokument:
```powershell
firebase firestore:delete "leksehjelp/2026-08-31" --force --project frivilligsentralen-org
```
Gjenta for hver dato som har data. (Rekursiv sletting av hele samlingen var upålitelig.)
Alternativt: slett dokumentene i Firestore-konsollen (lenke i punkt 4).

### 8e. Se tallene
- Enkelt: åpne selve siden – alle lagrede tall vises i tabellene.
- Rådata: Firestore-konsollen, samlingen `leksehjelp`.

---

## 9. E-postformat

Alt samles i **ett** felt («Melding») fordi FormSubmit viste bare ett felt da vi sendte
flere separate felt. E-posten ser slik ut i «Value»-kolonnen:

```
Mandag 31. aug  •  Antall barn: 5  •  Voksenopplæring: 2  •  Frivillige: 3  •  Beskjed: ...
```

Datoen står også i emnefeltet: «Leksehjelp Mandag 31. aug».
Vil du hindre spam-innhøsting av adressen, kan `FORMSUBMIT_URL` byttes fra rå e-post til
et FormSubmit-**alias** (tilfeldig kode fra FormSubmit), på formen
`https://formsubmit.co/ajax/<alias>`.

---

## 10. Feilsøking

| Symptom | Årsak / løsning |
| --- | --- |
| Tabellen viser «Kunne ikke hente lagrede tall» | Testet lokalt (localhost er ikke i funksjonens CORS-liste) eller funksjonen er nede. På `frivilligsentralen.org` skal det virke. |
| Lagring feiler, funksjon svarer `PERMISSION_DENIED` | Compute-kontoen mangler `roles/datastore.user` (punkt 4). Gi rollen i IAM. |
| CLI: «credentials are no longer valid» | Kjør `firebase login --reauth` (punkt 5). |
| Endring i JS «slår ikke inn» i nettleser | Cache. Øk `?v=`-tallet (punkt 7). Test i inkognitovindu. |
| Lagring gir 400 «Invalid dato» | Datoen mangler i `LEKSEHJELP_DATOER` i `functions/index.js` – legg til og deploy. |
| E-post kommer ikke frem | FormSubmit-adressen er ikke aktivert, eller `FORMSUBMIT_URL` er feil. |

---

## 11. Sikkerhet / personvern

- Siden samler kun **antall** – ingen personopplysninger om deltakerne.
- Tilgang er «skjult adresse» (ingen passord). Ønskes ekte sperre må det legges til
  passord/innlogging senere.
- Firestore er låst for direkte tilgang; alt går via funksjonen med validering + honeypot.
- CORS på funksjonen er begrenset til `frivilligsentralen.org` (og `www`). Skal siden
  testes fra localhost, må origin legges til midlertidig i `allowedOrigins` i
  `functions/index.js`.

---

## 12. Kort oppsummering

- Frontend-endring (tekst, datoer i visning, felt): rediger `js/leksehjelp.js` /
  `index.html`, **øk `?v=`**, `git push`.
- Backend-endring (validering, lagring, nye datoer/felt): rediger `functions/index.js`,
  `firebase deploy --only functions,firestore:rules`.
- Ny mottaker-e-post: endre `FORMSUBMIT_URL` + aktiver i FormSubmit.
- Nullstille: `firebase firestore:delete "leksehjelp/<dato>" --force` per dato.
