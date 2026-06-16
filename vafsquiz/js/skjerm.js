// vafsquiz/js/skjerm.js — logikk for storskjermen (projektor).
import { questions, riktigeIndekser } from "./questions.js";
import {
  db, ref, onValue, get,
  gameRef, playersRef, visConfigAdvarselHvisNodvendig
} from "./firebase-config.js";

visConfigAdvarselHvisNodvendig();

const BOKSTAVER = ["A", "B", "C", "D"];

const views = {
  lobby: document.getElementById("view-lobby"),
  question: document.getElementById("view-question"),
  reveal: document.getElementById("view-reveal"),
  leaderboard: document.getElementById("view-leaderboard"),
  results: document.getElementById("view-results"),
};
function visView(navn) {
  Object.values(views).forEach(v => v.classList.add("skjult"));
  if (views[navn]) views[navn].classList.remove("skjult");
}

let game = { state: "lobby", currentQuestion: 0, winnerId: null, drawNonce: null };
let spillere = {};            // siste kjente /players-snapshot
let sisteState = null;
let sisteQ = -1;
let trekningKjort = false;    // har vi allerede animert gjeldende trekning?
let trekningForNonce = null;

// ── Lytt på spillere (oppdaterer tellere live) ─────────────────────
onValue(playersRef(), snap => {
  spillere = snap.val() || {};
  if (game.state === "question") oppdaterSvartTeller();
});

// ── Lytt på spilltilstand ──────────────────────────────────────────
onValue(gameRef(), snap => {
  const g = snap.val() || {};
  game.state = g.state || "lobby";
  game.currentQuestion = g.currentQuestion || 0;
  game.winnerId = g.winnerId || null;
  game.drawNonce = g.drawNonce || null;
  render();
});

function render() {
  const byttetState = game.state !== sisteState;
  const byttetQ = game.currentQuestion !== sisteQ;

  switch (game.state) {
    case "lobby":       visView("lobby"); break;
    case "question":    renderQuestion(byttetState || byttetQ); break;
    case "reveal":      if (byttetState || byttetQ) renderReveal(); break;
    case "leaderboard": renderLeaderboard(); break;
    case "results":     renderResults(byttetState); break;
  }
  sisteState = game.state;
  sisteQ = game.currentQuestion;
}

// ── QUESTION ───────────────────────────────────────────────────────
function renderQuestion(bygg) {
  visView("question");
  const qi = game.currentQuestion;
  const q = questions[qi];
  if (bygg) {
    document.getElementById("q-merke").textContent = `Spørsmål ${qi + 1} av ${questions.length}`;
    document.getElementById("q-tekst").textContent = q.q;
    const cont = document.getElementById("q-alternativer");
    cont.innerHTML = "";
    q.options.forEach((opt, i) => {
      const d = document.createElement("div");
      d.className = "skjerm-alt";
      d.dataset.i = i;
      d.innerHTML = `<span class="bokstav">${BOKSTAVER[i]}</span><span>${opt}</span>`;
      cont.appendChild(d);
    });
  }
  oppdaterSvartTeller();
}

function oppdaterSvartTeller() {
  const qi = game.currentQuestion;
  const ids = Object.keys(spillere);
  const svart = ids.filter(id => {
    const a = spillere[id].answers;
    return a && a[qi] !== undefined && a[qi] !== null;
  }).length;
  document.getElementById("q-svart").textContent = svart;
  document.getElementById("q-total").textContent = ids.length;
}

// ── REVEAL: søyler som vokser, så grønt riktig svar ────────────────
async function renderReveal() {
  visView("reveal");
  const qi = game.currentQuestion;
  const q = questions[qi];
  document.getElementById("r-merke").textContent = `Fasit — spørsmål ${qi + 1}`;
  document.getElementById("r-tekst").textContent = q.q;

  // Tell svar per alternativ (les ferskt for sikkerhets skyld).
  const snap = await get(playersRef());
  const sp = snap.val() || {};
  const tellinger = [0, 0, 0, 0];
  Object.values(sp).forEach(p => {
    const v = p.answers && p.answers[qi];
    if (v !== undefined && v !== null && tellinger[v] !== undefined) tellinger[v]++;
  });
  const maks = Math.max(1, ...tellinger);

  const cont = document.getElementById("r-soyler");
  cont.innerHTML = "";
  q.options.forEach((opt, i) => {
    const rad = document.createElement("div");
    rad.className = "soyle-rad";
    rad.dataset.i = i;
    rad.innerHTML = `
      <div class="soyle-bokstav" data-i="${i}">${BOKSTAVER[i]}</div>
      <div style="flex:1;">
        <div class="alt-tekst">${opt}</div>
        <div class="soyle-spor"><div class="soyle-fyll" data-i="${i}">0</div></div>
      </div>
      <div class="hake">✓</div>`;
    cont.appendChild(rad);
  });

  // Animer søylene opp først …
  requestAnimationFrame(() => {
    q.options.forEach((opt, i) => {
      const fyll = cont.querySelector(`.soyle-fyll[data-i="${i}"]`);
      const pct = (tellinger[i] / maks) * 100;
      fyll.style.width = Math.max(pct, tellinger[i] > 0 ? 8 : 0) + "%";
      fyll.textContent = tellinger[i];
    });
  });

  // … deretter lyser riktig(e) svar grønt med ✓ (litt drama).
  setTimeout(() => {
    riktigeIndekser(q).forEach(ci => {
      const rad = cont.querySelector(`.soyle-rad[data-i="${ci}"]`);
      if (rad) rad.classList.add("riktig");
    });
  }, 1500);
}

// ── LEADERBOARD: topp 5 ────────────────────────────────────────────
async function renderLeaderboard() {
  visView("leaderboard");
  const snap = await get(playersRef());
  const sp = snap.val() || {};
  const topp = Object.values(sp)
    .map(p => ({ name: p.name || "?", score: p.score || 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const cont = document.getElementById("lb-liste");
  cont.innerHTML = "";
  if (topp.length === 0) {
    cont.innerHTML = `<div class="ltrad"><span class="navn">Ingen spillere ennå</span></div>`;
    return;
  }
  topp.forEach((p, i) => {
    const rad = document.createElement("div");
    rad.className = "ltrad";
    rad.innerHTML = `
      <span class="plass">${i + 1}</span>
      <span class="navn">${p.name}</span>
      <span class="poeng">${p.score}</span>`;
    rad.style.opacity = "0";
    rad.style.transform = "translateY(16px)";
    cont.appendChild(rad);
    setTimeout(() => {
      rad.style.transition = "all .5s ease";
      rad.style.opacity = "1";
      rad.style.transform = "translateY(0)";
    }, 120 * i);
  });
}

// ── RESULTS: kvalifiserte + fasit-oppsummering + vinnertrekning ────
function renderResults(nyState) {
  visView("results");
  if (nyState) { byggKvalifiserte(); byggFasitListe(); }

  // Vinner trekkes når admin har skrevet game.winnerId (+ ny nonce ved omtrekk).
  if (game.winnerId && trekningForNonce !== game.drawNonce) {
    trekningForNonce = game.drawNonce;
    trekningKjort = false;
    startTrekning(game.winnerId);
  }
}

// Vis hele puljen det trekkes blant: alle med flest riktige (10; ellers 9, osv.).
async function byggKvalifiserte() {
  const overskrift = document.getElementById("kval-overskrift");
  const liste = document.getElementById("kval-liste");
  liste.innerHTML = "";
  const snap = await get(playersRef());
  const sp = snap.val() || {};
  const navn = Object.values(sp);
  if (navn.length === 0) {
    overskrift.textContent = "Ingen deltakere registrert";
    return;
  }
  const maksScore = Math.max(0, ...navn.map(p => p.score || 0));
  const kvalifiserte = navn.filter(p => (p.score || 0) === maksScore);
  overskrift.textContent =
    `Disse hadde flest riktige — ${maksScore} av ${questions.length} ` +
    `(${kvalifiserte.length} ${kvalifiserte.length === 1 ? "person" : "personer"})`;
  kvalifiserte.forEach((p, i) => {
    const rad = document.createElement("div");
    rad.className = "ltrad";
    rad.innerHTML = `<span class="plass">🎯</span><span class="navn">${p.name || "?"}</span>`;
    rad.style.opacity = "0";
    rad.style.transform = "translateY(16px)";
    liste.appendChild(rad);
    setTimeout(() => {
      rad.style.transition = "all .5s ease";
      rad.style.opacity = "1";
      rad.style.transform = "translateY(0)";
    }, 100 * i);
  });
}

function byggFasitListe() {
  const cont = document.getElementById("fasit-liste");
  cont.innerHTML = "";
  questions.forEach((q, i) => {
    const rad = document.createElement("div");
    rad.className = "fasit-rad";
    const svar = riktigeIndekser(q).map(ci => q.options[ci]).join(" / ");
    rad.innerHTML = `<span class="num">${i + 1}.</span> ${q.q}
      <br><span class="svar">✓ ${svar}</span>`;
    cont.appendChild(rad);
  });
}

async function startTrekning(winnerId) {
  if (trekningKjort) return;
  trekningKjort = true;

  const snap = await get(playersRef());
  const sp = snap.val() || {};
  const navnListe = Object.values(sp).map(p => p.name || "?");
  const vinnerNavn = (sp[winnerId] && sp[winnerId].name) || "?";
  const vinnerScore = (sp[winnerId] && sp[winnerId].score) || 0;

  // Kvalifiserte (de med høyest score) brukes som flimrenavn.
  const maksScore = Math.max(0, ...Object.values(sp).map(p => p.score || 0));
  const kvalifiserte = Object.values(sp)
    .filter(p => (p.score || 0) === maksScore)
    .map(p => p.name || "?");
  const flimre = kvalifiserte.length ? kvalifiserte : (navnListe.length ? navnListe : ["?"]);

  const hjul = document.getElementById("hjul");
  const hjulNavn = document.getElementById("hjul-navn");
  const vinnerBoks = document.getElementById("vinner-boks");
  vinnerBoks.classList.add("skjult");
  hjul.classList.remove("skjult");

  // Spill drumroll (robust — animasjonen virker uansett).
  const drum = document.getElementById("drum");
  try { drum.currentTime = 0; drum.play().catch(() => {}); } catch (e) { /* ignorer */ }

  // Lykkehjul: flimrer raskt, bremser gradvis ned (~3 sek).
  const start = performance.now();
  const varighet = 3000;
  let nesteForsinkelse = 50;

  function tick(naa) {
    const t = naa - start;
    hjulNavn.textContent = flimre[Math.floor(Math.random() * flimre.length)];
    if (t < varighet) {
      // Bremser ned: forsinkelsen øker mot slutten.
      nesteForsinkelse = 50 + Math.pow(t / varighet, 3) * 350;
      setTimeout(() => requestAnimationFrame(tick), nesteForsinkelse);
    } else {
      laasVinner(vinnerNavn, vinnerScore);
    }
  }
  requestAnimationFrame(tick);
}

function laasVinner(navn, score) {
  document.getElementById("hjul").classList.add("skjult");
  const boks = document.getElementById("vinner-boks");
  boks.classList.remove("skjult");
  document.getElementById("vinner-navn").textContent = navn;
  document.getElementById("vinner-info").textContent = `${score} av ${questions.length} riktige 🎉`;
  skytKonfetti();
}

function skytKonfetti() {
  if (typeof confetti !== "function") return;
  const slutt = Date.now() + 2500;
  (function ramme() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 } });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 } });
    if (Date.now() < slutt) requestAnimationFrame(ramme);
  })();
  confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
}
