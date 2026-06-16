// vafsquiz/js/firebase-config.js
// Felles Firebase-oppsett som DELES av deltaker-, skjerm- og admin-siden.
// Bruker Firebase Modular SDK v10 via CDN (ESM-import).
//
// ┌─────────────────────────────────────────────────────────────────────┐
// │  ESPEN MÅ FYLLE INN HER:                                             │
// │  1. Gå til https://console.firebase.google.com/                     │
// │  2. Opprett (eller gjenbruk) et prosjekt.                           │
// │  3. Legg til en web-app (</>-ikonet) og kopier "firebaseConfig".    │
// │  4. Aktiver Build → Realtime Database (velg en lokasjon).           │
// │  5. Lim verdiene inn under, og pass på at databaseURL er satt.      │
// └─────────────────────────────────────────────────────────────────────┘

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase, ref, onValue, get, set, update, push, child, remove
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Config fra Firebase-konsollen (vafsquiz-prosjektet).
const firebaseConfig = {
  apiKey: "AIzaSyB1EtdvN3hmK6ChPTkIe8TMM4OPX4Xe-gs",
  authDomain: "vafsquiz.firebaseapp.com",
  databaseURL: "https://vafsquiz-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "vafsquiz",
  storageBucket: "vafsquiz.firebasestorage.app",
  messagingSenderId: "881660626303",
  appId: "1:881660626303:web:c0050f605eca3b7e36464a"
};

// Enkel sjekk: er config fortsatt en plassholder? Da varsler vi tydelig i UI.
export const configMangler = firebaseConfig.apiKey === "DIN_API_KEY_HER";

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Re-eksporter db-funksjonene så de tre sidene kan importere alt fra ÉN fil.
export { ref, onValue, get, set, update, push, child, remove };

// Praktiske referanser brukt av flere sider.
export const gameRef = () => ref(db, "game");
export const playersRef = () => ref(db, "players");

// Viser en tydelig advarsel på siden hvis Firebase-config ikke er fylt inn ennå.
export function visConfigAdvarselHvisNodvendig() {
  if (!configMangler) return false;
  const boks = document.createElement("div");
  boks.style.cssText =
    "position:fixed;left:0;right:0;bottom:0;z-index:9999;background:#b00020;color:#fff;" +
    "padding:14px 18px;font-family:system-ui,sans-serif;font-size:15px;text-align:center;";
  boks.innerHTML =
    "⚠️ Firebase er ikke satt opp ennå. Fyll inn config i " +
    "<code style='background:rgba(255,255,255,.2);padding:2px 6px;border-radius:4px'>js/firebase-config.js</code> " +
    "for at quizen skal virke.";
  document.body.appendChild(boks);
  return true;
}
