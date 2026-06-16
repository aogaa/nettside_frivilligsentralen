// vafsquiz/js/questions.js
// De 10 spørsmålene med fasit. `correct` er 0-basert indeks til riktig svar i `options`.
// Alternativene vises i den rekkefølgen de står — ikke stokk om, riktig svar spores via `correct`.
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
      "Aktivmormor"
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
    correct: [1, 2, 3]
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
    q: "Hva besto masterutstillingen til Anitas datter Sarah av?",
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

// `correct` kan være ett tall ELLER en liste av tall (flere riktige alternativer).
// Disse hjelperne lar resten av koden behandle begge tilfeller likt.
export function riktigeIndekser(sporsmal) {
  return Array.isArray(sporsmal.correct) ? sporsmal.correct : [sporsmal.correct];
}
export function erRiktig(sporsmal, valg) {
  return riktigeIndekser(sporsmal).includes(Number(valg));
}
