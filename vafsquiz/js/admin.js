// vafsquiz/js/admin.js — vertens styringsside.
import { questions } from "./questions.js";
import {
  db, ref, onValue, get, set, update, remove,
  gameRef, playersRef, visConfigAdvarselHvisNodvendig
} from "./firebase-config.js";

visConfigAdvarselHvisNodvendig();

const SISTE_Q = questions.length - 1; // 9

const btn = {
  start: document.getElementById("btn-start"),
  fasit: document.getElementById("btn-fasit"),
  ledertavle: document.getElementById("btn-ledertavle"),
  neste: document.getElementById("btn-neste"),
  trekk: document.getElementById("btn-trekk"),
  nullstill: document.getElementById("btn-nullstill"),
};

let game = { state: "lobby", currentQuestion: 0 };
let spillere = {};

// ── Lytt på tilstand ───────────────────────────────────────────────
onValue(gameRef(), snap => {
  const g = snap.val() || {};
  game.state = g.state || "lobby";
  game.currentQuestion = g.currentQuestion || 0;
  oppdaterUI();
});
onValue(playersRef(), snap => {
  spillere = snap.val() || {};
  oppdaterUI();
});

// ── Oppdater statuslinje + hvilke knapper som vises ────────────────
function oppdaterUI() {
  const antall = Object.keys(spillere).length;
  const qi = game.currentQuestion;

  // Skjul alle styringsknapper, vis riktig for gjeldende state.
  [btn.start, btn.fasit, btn.ledertavle, btn.neste, btn.trekk].forEach(b => b.classList.add("skjult"));

  const steg = document.getElementById("status-steg");
  const tekst = document.getElementById("status-tekst");
  const detalj = document.getElementById("status-detalj");
  const hint = document.getElementById("hint");

  switch (game.state) {
    case "lobby":
      steg.textContent = "LOBBY";
      tekst.textContent = `${antall} spiller${antall === 1 ? "" : "e"} registrert`;
      detalj.textContent = "Klar til å starte når alle er med.";
      hint.textContent = "Neste: Start quizen → spørsmål 1 vises.";
      btn.start.classList.remove("skjult");
      break;

    case "question": {
      const svart = antallSvart(qi);
      steg.textContent = `SPØRSMÅL ${qi + 1}/${questions.length}`;
      tekst.textContent = `${svart} av ${antall} har svart`;
      detalj.textContent = questions[qi].q;
      hint.textContent = "Vent til folk har svart, så Vis fasit.";
      btn.fasit.classList.remove("skjult");
      break;
    }

    case "reveal":
      steg.textContent = `FASIT ${qi + 1}/${questions.length}`;
      tekst.textContent = "Fasit vises på storskjermen";
      detalj.textContent = `Riktig: ${questions[qi].options[questions[qi].correct]}`;
      hint.textContent = "Poeng er nå beregnet. Neste: Vis ledertavle.";
      btn.ledertavle.classList.remove("skjult");
      break;

    case "leaderboard":
      steg.textContent = "LEDERTAVLE";
      tekst.textContent = "Topp 5 vises på storskjermen";
      detalj.textContent = "";
      hint.textContent = qi < SISTE_Q
        ? "Neste: gå videre til neste spørsmål."
        : "Dette var siste spørsmål — Neste går til resultater.";
      btn.neste.classList.remove("skjult");
      btn.neste.textContent = qi < SISTE_Q ? "Neste spørsmål →" : "Vis resultater →";
      break;

    case "results":
      steg.textContent = "RESULTATER";
      tekst.textContent = "Sluttresultat på storskjermen";
      detalj.textContent = "Klar for vinnertrekning!";
      hint.textContent = "Trykk Trekk vinner for drumroll + konfetti på skjermen.";
      btn.trekk.classList.remove("skjult");
      break;
  }
}

function antallSvart(qi) {
  return Object.values(spillere).filter(p => {
    const a = p.answers;
    return a && a[qi] !== undefined && a[qi] !== null;
  }).length;
}

// ── Poengberegning: regn score på nytt fra alle svar (idempotent) ──
function beregnPoeng() {
  const oppdatering = {};
  Object.entries(spillere).forEach(([id, p]) => {
    const answers = p.answers || {};
    let score = 0;
    questions.forEach((q, i) => {
      if (answers[i] !== undefined && answers[i] !== null && Number(answers[i]) === q.correct) score++;
    });
    oppdatering[`${id}/score`] = score;
  });
  return update(playersRef(), oppdatering);
}

// ── Knappehandlinger ───────────────────────────────────────────────
btn.start.addEventListener("click", () => {
  set(gameRef(), { state: "question", currentQuestion: 0, winnerId: null });
});

btn.fasit.addEventListener("click", async () => {
  await beregnPoeng();              // oppdater score før reveal
  update(gameRef(), { state: "reveal" });
});

btn.ledertavle.addEventListener("click", () => {
  update(gameRef(), { state: "leaderboard" });
});

btn.neste.addEventListener("click", () => {
  if (game.currentQuestion < SISTE_Q) {
    update(gameRef(), { state: "question", currentQuestion: game.currentQuestion + 1 });
  } else {
    update(gameRef(), { state: "results" });
  }
});

btn.trekk.addEventListener("click", async () => {
  // Vinnerlogikk: høyeste score som faktisk forekommer, trekk én tilfeldig.
  const snap = await get(playersRef());
  const sp = snap.val() || {};
  const ids = Object.keys(sp);
  if (ids.length === 0) { alert("Ingen spillere å trekke blant."); return; }
  const maks = Math.max(...ids.map(id => sp[id].score || 0));
  const kvalifiserte = ids.filter(id => (sp[id].score || 0) === maks);
  const vinner = kvalifiserte[Math.floor(Math.random() * kvalifiserte.length)];
  // Skriv winnerId → storskjermen starter drumroll-animasjonen.
  // (Ny nonce hver gang så gjentatt trekk også trigger ny animasjon.)
  await update(gameRef(), { winnerId: vinner, drawNonce: Date.now() });
  btn.trekk.textContent = "🥁 Trekk på nytt";
});

btn.nullstill.addEventListener("click", async () => {
  if (!confirm("Sikker? Dette sletter ALLE spillere og starter spillet på nytt.")) return;
  await remove(playersRef());
  await set(gameRef(), { state: "lobby", currentQuestion: 0, winnerId: null });
  btn.trekk.textContent = "🥁 Trekk vinner";
});
