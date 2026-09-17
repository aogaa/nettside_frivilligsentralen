Viktig: Se MANUAL-OVERLEVERING.md for full drifts- og overtakelsesguide (programmer, GitHub-publisering, rutiner og feilsøking).

README: Nettside for Vestre Aker Frivilligsentral
Dette prosjektet er en moderne gjenoppbygging av nettsiden til Vestre Aker Frivilligsentral. Målet er å skape en side som er visuelt slående, enkel å navigere, og som har rom for interaktive elementer (spill).

🚀 Prosjektets status
Vi har lagt det tekniske fundamentet med HTML5 og CSS3. Vi har valgt en "flat" filstruktur i starten for å holde oversikten enkel mens vi bygger.

📝 Språkstandard
Synlig norsk tekst skal skrives med norske tegn: æ, ø og å. Ikke bruk `ae`, `oe` eller `aa` som erstatning i brødtekst, titler, knapper, alt-tekster eller metadata. Tekniske URL-er, filnavn, eksterne lenker og kode-identifikatorer kan fortsatt bruke ASCII for stabile lenker og kompatibilitet.

🎨 Designvalg og drøftinger
Vi har tatt noen bevisste valg som skiller denne siden fra en standard mal:

Navigasjons-øya (The Overlap): Vi har laget en bilde- og knapperad som ligger oppå det store Hero-bildet.

Problemstilling: Hvordan bryte den stive linjen mellom topp og bunn?

Løsning: Bruk av negativ margin (margin-top: -80px) for å løfte elementet opp. Dette krever at vi passer på "z-index" slik at knappene ikke havner bak bildet.

Skalering: Vi har drøftet at denne øya må være stor nok til å matche det massive Hero-bildet for å skape visuell balanse.

URL-struktur og Mapper:

Problemstilling: Skal hver side ha sin egen mappe?

Beslutning: Nei. Vi beholder om-oss.html og blogg.html i rotmappen. Dette gjør filbaner til bilder og CSS mye enklere å håndtere for en nybegynner. Vi kan "pynte" på nettadressen senere via serveren (Uniweb).

🤝 Bli frivillig: felles oppsett for rekrutteringssider

Sidene under /bli-frivillig/ deler ett stilark og ett skjema, slik at en ny aktivitetsside ikke koster nye CSS- eller JS-linjer:

bli-frivillig/index.html: landingssiden med alle aktivitetskortene. Ligger i toppmenyen.

bli-frivillig-mal/: kopier hele denne mappa når du skal lage en ny aktivitetsside. Alt som skal endres er merket BYTT.

css/bli-frivillig.css: delt stilark (prefiks .bf-). Farge per side styres med en bf-theme-klasse på <body>, ikke med en ny fil.

js/frivillig-form.js: delt skjema. Feltene og valideringsreglene leses fra HTML, så du kan legge til og fjerne felt uten å røre JavaScript.

Full oppskrift står i bli-frivillig/README.md.

De fem eldste rekrutteringssidene (gode-stunder-vinderenhjemmet, student-vinderenhjemmet, julebakst-vinderenhjemmet, tid-til-aa-snakke, 60-timer-som-betyr-noe) har sine egne stilark og er bevisst ikke migrert. Nye sider lages fra malen.

🛠 Teknisk Oppbygging
Prosjektet er organisert slik at det er lett å utvide:

index.html: Forsiden med den store velkomsten.

om-oss.html: En underside som skal inneholde informasjon og et fremtidig spill.

css/style.css: Hovedstilen som sørger for at farger, fonter og layout er lik på alle sider.

images/: Her ligger alle grafiske elementer.

🎮 Planer for fremtiden (Viktig for neste utvikler!)
Vi har planlagt å legge til funksjonalitet som går utover vanlig tekst og bilder:

Interaktive Spill: Det skal bygges et spill på "Om oss"-siden ved hjelp av JavaScript.

Modulær oppbygging: Spillet skal ha sin egen CSS (css/spill.css) og JS (js/spill-logikk.js) for å ikke rote til hovedkoden.

Aktivitets-sirkler: På forsiden skal det legges til tre store sirkler som representerer kjerneaktiviteter (Møteplass, Språkkafé, Middag).

💻 Hvordan fortsette arbeidet på en ny maskin?
Installer Git.

Kjør git clone https://github.com/aogaa/nettside_frivilligsentralen.git.

Åpne mappen i din foretrukne kode-editor (f.eks. VS Code).

Husk å alltid kjøre git pull før du starter, og git push når du er ferdig for dagen.


