// vafsquiz/js/deltaker.js — logikk for deltakersiden (mobil).
import { questions, erRiktig } from "./questions.js";
import {
  db, ref, onValue, get, set, update, push,
  gameRef, playersRef, visConfigAdvarselHvisNodvendig
} from "./firebase-config.js";

visConfigAdvarselHvisNodvendig();

const views = {
  lobby: document.getElementById("view-lobby"),
  venter: document.getElementById("view-venter"),
  question: document.getElementById("view-question"),
  reveal: document.getElementById("view-reveal"),
  leaderboard: document.getElementById("view-leaderboard"),
  results: document.getElementById("view-results"),
};

function visView(navn) {
  Object.values(views).forEach(v => v.classList.add("skjult"));
  if (views[navn]) views[navn].classList.remove("skjult");
}

// ── Spillertilstand (huskes i localStorage ved refresh) ─────────────
let playerId = localStorage.getItem("vafsquiz_playerId");
let playerName = localStorage.getItem("vafsquiz_playerName") || "";
let valgtAlternativ = null;
let game = { state: "lobby", currentQuestion: 0 };
let antallSpillere = 0;

// ── Registrering ────────────────────────────────────────────────────
const navnFelt = document.getElementById("navn");
const bliMedKnapp = document.getElementById("bli-med");

bliMedKnapp.addEventListener("click", registrer);
navnFelt.addEventListener("keydown", e => { if (e.key === "Enter") registrer(); });

async function registrer() {
  const navn = navnFelt.value.trim();
  if (!navn) { navnFelt.focus(); return; }
  bliMedKnapp.disabled = true;
  const nyRef = push(playersRef());
  playerId = nyRef.key;
  playerName = navn;
  await set(nyRef, { name: navn, answers: {}, score: 0 });
  localStorage.setItem("vafsquiz_playerId", playerId);
  localStorage.setItem("vafsquiz_playerName", playerName);
  document.getElementById("venter-navn").textContent = "Hei, " + navn + "!";
  oppdaterView();
}

// Hvis vi allerede er registrert (refresh), vis navnet i venter-view.
if (playerName) document.getElementById("venter-navn").textContent = "Hei, " + playerName + "!";

// ── Lytt på spilltilstand ──────────────────────────────────────────
onValue(gameRef(), snap => {
  const g = snap.val() || {};
  game.state = g.state || "lobby";
  game.currentQuestion = g.currentQuestion || 0;
  oppdaterView();
});

// ── Lytt på antall spillere (teller) ───────────────────────────────
onValue(playersRef(), snap => {
  const spillere = snap.val() || {};
  antallSpillere = Object.keys(spillere).length;
  const t1 = document.getElementById("lobby-teller");
  const t2 = document.getElementById("venter-teller");
  const tekst = antallSpillere + (antallSpillere === 1 ? " registrert" : " registrert");
  t1.textContent = tekst;
  t2.textContent = tekst;
});

// ── Render riktig view ut fra state ────────────────────────────────
function oppdaterView() {
  // Ikke registrert ennå → alltid lobby (skriv navn).
  if (!playerId) { visView("lobby"); return; }

  switch (game.state) {
    case "lobby":       visView("venter"); break;
    case "question":    renderQuestion(); break;
    case "reveal":      renderReveal(); break;
    case "leaderboard": renderLeaderboard(); break;
    case "results":     renderResults(); break;
    default:            visView("venter");
  }
}

// ── QUESTION ───────────────────────────────────────────────────────
let questionRendret = -1;
async function renderQuestion() {
  visView("question");
  const qi = game.currentQuestion;
  const q = questions[qi];

  // Bygg alternativene på nytt kun når vi bytter spørsmål.
  if (questionRendret !== qi) {
    questionRendret = qi;
    valgtAlternativ = null;
    document.getElementById("q-merke").textContent = `Spørsmål ${qi + 1} av ${questions.length}`;
    document.getElementById("q-tekst").textContent = q.q;
    const cont = document.getElementById("q-alternativer");
    cont.innerHTML = "";
    q.options.forEach((opt, i) => {
      const b = document.createElement("button");
      b.className = "alt";
      b.dataset.i = i;
      b.textContent = opt;
      b.addEventListener("click", () => velgAlternativ(i));
      cont.appendChild(b);
    });
    document.getElementById("q-status").textContent = "";
    const sk = document.getElementById("svar-knapp");
    sk.disabled = true;
    sk.dataset.laast = "";   // viktig: lås opp for det nye spørsmålet
    sk.textContent = "Svar";
  }

  // Har vi allerede svart på dette spørsmålet (f.eks. etter refresh)? Lås da.
  const svarSnap = await get(ref(db, `players/${playerId}/answers/${qi}`));
  if (svarSnap.exists()) {
    laasEtterSvar(svarSnap.val());
  }
}

function velgAlternativ(i) {
  if (document.getElementById("svar-knapp").disabled === true &&
      document.getElementById("svar-knapp").dataset.laast === "1") return;
  valgtAlternativ = i;
  document.querySelectorAll("#q-alternativer .alt").forEach(b => {
    b.classList.toggle("valgt", Number(b.dataset.i) === i);
  });
  const sk = document.getElementById("svar-knapp");
  if (sk.dataset.laast !== "1") sk.disabled = false;
}

const svarKnapp = document.getElementById("svar-knapp");
svarKnapp.addEventListener("click", async () => {
  if (valgtAlternativ === null || svarKnapp.dataset.laast === "1") return;
  const qi = game.currentQuestion;
  await update(ref(db, `players/${playerId}/answers`), { [qi]: valgtAlternativ });
  laasEtterSvar(valgtAlternativ);
});

function laasEtterSvar(valgIndeks) {
  valgtAlternativ = valgIndeks;
  document.querySelectorAll("#q-alternativer .alt").forEach(b => {
    const i = Number(b.dataset.i);
    b.disabled = true;
    b.classList.toggle("valgt", i === valgIndeks);
    if (i !== valgIndeks) b.classList.add("dimmet");
  });
  const sk = document.getElementById("svar-knapp");
  sk.disabled = true;
  sk.dataset.laast = "1";
  sk.textContent = "Svar sendt ✓";
  document.getElementById("q-status").textContent = "Vent på de andre …";
}

// ── REVEAL ─────────────────────────────────────────────────────────
async function renderReveal() {
  visView("reveal");
  // Nullstill question-render slik at neste spørsmål bygges på nytt.
  questionRendret = -1;
  const qi = game.currentQuestion;
  const svarSnap = await get(ref(db, `players/${playerId}/answers/${qi}`));
  const fb = document.getElementById("reveal-feedback");
  if (!svarSnap.exists()) {
    fb.className = "feedback feil";
    fb.textContent = "Du svarte ikke 😅";
    return;
  }
  const riktig = erRiktig(questions[qi], svarSnap.val());
  fb.className = "feedback " + (riktig ? "riktig" : "feil");
  fb.textContent = riktig ? "Riktig! 🎉" : "Feil 😬";
}

// ── LEADERBOARD ────────────────────────────────────────────────────
// Deltakeren skal IKKE få vite egen plassering underveis (spenning bevares).
// Topp 5 vises kun på storskjermen.
function renderLeaderboard() {
  visView("leaderboard");
}

// ── RESULTS ────────────────────────────────────────────────────────
// Ingen plassering — kun antall rette (rangering forblir hemmelig til trekningen).
async function renderResults() {
  visView("results");
  const snap = await get(ref(db, `players/${playerId}/score`));
  const minScore = snap.val() || 0;
  document.getElementById("res-rette").textContent = `Du fikk ${minScore} rette.`;
  document.getElementById("res-poeng").textContent = `av ${questions.length} spørsmål`;
}
