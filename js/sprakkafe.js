(function () {
  "use strict";

  // Endepunkt for lagring/henting av tall (Cloud Function, egen samling for sprakkafe)
  const FUNCTION_URL =
    "https://europe-west1-frivilligsentralen-org.cloudfunctions.net/sprakkafe";

  // FormSubmit-endepunkt (samme mottaker som leksehjelp, allerede aktivert).
  const FORMSUBMIT_URL =
    "https://formsubmit.co/ajax/espen@vestreaker.frivilligsentral.no";

  const MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

  // Tirsdager hosten 2026 – ingen hostferiepause (alle tirsdager med).
  const TIRSDAGER = [
    "2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22", "2026-09-29",
    "2026-10-06", "2026-10-13", "2026-10-20", "2026-10-27",
    "2026-11-03", "2026-11-10", "2026-11-17", "2026-11-24",
    "2026-12-01", "2026-12-08", "2026-12-15"
  ];

  const FELTER = [
    { key: "deltakere", label: "Antall deltakere" },
    { key: "bord", label: "Antall bord" },
    { key: "frivillige", label: "Antall frivillige" }
  ];

  const honeypot = document.getElementById("sk-honey");
  const globalStatus = document.querySelector("[data-sk-global-status]");
  const rowIndex = {}; // dato -> { inputs: {key: el}, statusEl }

  function norskDato(iso) {
    const d = new Date(iso + "T00:00:00");
    return "Tirsdag " + d.getDate() + ". " + MND[d.getMonth()];
  }

  function toInt(value) {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) return 0;
    return Math.min(n, 999);
  }

  function setGlobal(text, type) {
    if (!globalStatus) return;
    globalStatus.textContent = text;
    globalStatus.classList.remove("is-success", "is-error");
    if (type) globalStatus.classList.add("is-" + type);
  }

  function th(text) {
    const el = document.createElement("th");
    el.textContent = text;
    return el;
  }

  function emptyTd() {
    const td = document.createElement("td");
    td.setAttribute("data-label", "");
    return td;
  }

  function buildTable(container) {
    const table = document.createElement("table");
    table.className = "sk-table";

    // thead
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.appendChild(th("Dato"));
    FELTER.forEach(function (f) { headRow.appendChild(th(f.label)); });
    headRow.appendChild(th("Melding (valgfritt)"));
    headRow.appendChild(th(""));
    thead.appendChild(headRow);
    table.appendChild(thead);

    // tbody
    const tbody = document.createElement("tbody");
    TIRSDAGER.forEach(function (dato) {
      tbody.appendChild(buildRow(dato));
    });
    table.appendChild(tbody);

    // tfoot (totaler)
    const tfoot = document.createElement("tfoot");
    const footRow = document.createElement("tr");
    const totLabel = document.createElement("td");
    totLabel.textContent = "Totalt";
    totLabel.setAttribute("data-label", "");
    footRow.appendChild(totLabel);
    FELTER.forEach(function (f) {
      const td = document.createElement("td");
      td.setAttribute("data-label", f.label);
      td.setAttribute("data-total", f.key);
      td.textContent = "0";
      footRow.appendChild(td);
    });
    footRow.appendChild(emptyTd());
    footRow.appendChild(emptyTd());
    tfoot.appendChild(footRow);
    table.appendChild(tfoot);

    container.appendChild(table);
  }

  function buildRow(dato) {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.className = "sk-date-cell";
    dateTd.setAttribute("data-label", "Dato");
    dateTd.textContent = norskDato(dato);
    tr.appendChild(dateTd);

    const inputs = {};
    FELTER.forEach(function (f) {
      const td = document.createElement("td");
      td.setAttribute("data-label", f.label);
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.inputMode = "numeric";
      input.placeholder = "0";
      input.setAttribute("aria-label", f.label + " " + norskDato(dato));
      td.appendChild(input);
      tr.appendChild(td);
      inputs[f.key] = input;
    });

    // Melding
    const msgTd = document.createElement("td");
    msgTd.setAttribute("data-label", "Melding");
    const msgInput = document.createElement("input");
    msgInput.type = "text";
    msgInput.placeholder = "Beskjed til Espen …";
    msgInput.setAttribute("aria-label", "Melding for " + norskDato(dato));
    msgTd.appendChild(msgInput);
    tr.appendChild(msgTd);

    // Handling
    const actionTd = document.createElement("td");
    actionTd.setAttribute("data-label", "");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sk-save-btn";
    btn.textContent = "Lagre";
    const statusEl = document.createElement("span");
    statusEl.className = "sk-row-status";
    statusEl.setAttribute("role", "status");
    statusEl.setAttribute("aria-live", "polite");
    actionTd.appendChild(btn);
    actionTd.appendChild(statusEl);
    tr.appendChild(actionTd);

    btn.addEventListener("click", function () {
      saveRow(dato, inputs, msgInput, btn, statusEl);
    });

    rowIndex[dato] = { inputs: inputs, statusEl: statusEl };
    return tr;
  }

  function setRowStatus(el, text, type) {
    el.textContent = text;
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add("is-" + type);
  }

  async function saveRow(dato, inputs, msgInput, btn, statusEl) {
    if (honeypot && honeypot.value) return; // bot

    const payload = { dato: dato, website: honeypot ? honeypot.value : "" };
    FELTER.forEach(function (f) {
      payload[f.key] = toInt(inputs[f.key].value);
    });

    btn.disabled = true;
    setRowStatus(statusEl, "Lagrer …", null);

    // 1) Lagre tallene i Firestore
    try {
      const response = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("save failed");
      FELTER.forEach(function (f) { inputs[f.key].value = payload[f.key]; });
      updateTotals();
    } catch (err) {
      setRowStatus(statusEl, "Feil – ikke lagret, prøv igjen", "error");
      btn.disabled = false;
      return;
    }

    // 2) Send tallene (og evt. melding) paa e-post til Espen
    const melding = msgInput.value.trim();
    try {
      await sendEpost(dato, inputs, melding);
      if (melding) msgInput.value = "";
      setRowStatus(statusEl, "Lagret + sendt på e-post ✓", "success");
    } catch (err) {
      setRowStatus(statusEl, "Lagret ✓, men e-post feilet", "error");
    } finally {
      btn.disabled = false;
    }
  }

  async function sendEpost(dato, inputs, melding) {
    if (honeypot && honeypot.value) return;
    const dagtekst = norskDato(dato);
    // Samle alt i ETT "Melding"-felt (FormSubmit viste bare ett felt ved separate felt).
    const deler = FELTER.map(function (f) {
      return f.label + ": " + toInt(inputs[f.key].value);
    });
    let tekst = dagtekst + "  •  " + deler.join("  •  ");
    if (melding) tekst += "  •  Beskjed: " + melding;

    const data = new FormData();
    data.append("Melding", tekst);
    data.append("_subject", "Språkkafé " + dagtekst);
    data.append("_captcha", "false");
    if (honeypot) data.append("_honey", honeypot.value);

    const response = await fetch(FORMSUBMIT_URL, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data
    });
    if (!response.ok) throw new Error("epost failed");
  }

  function updateTotals() {
    FELTER.forEach(function (f) {
      let sum = 0;
      Object.keys(rowIndex).forEach(function (dato) {
        const el = rowIndex[dato].inputs[f.key];
        if (el) sum += toInt(el.value);
      });
      const cell = document.querySelector('[data-total="' + f.key + '"]');
      if (cell) cell.textContent = String(sum);
    });
  }

  async function loadSaved() {
    try {
      const response = await fetch(FUNCTION_URL, { method: "GET" });
      if (!response.ok) throw new Error("load failed");
      const json = await response.json();
      const entries = (json && json.entries) || [];
      entries.forEach(function (entry) {
        const row = rowIndex[entry.dato];
        if (!row) return;
        FELTER.forEach(function (f) {
          if (typeof entry[f.key] === "number" && row.inputs[f.key]) {
            row.inputs[f.key].value = entry[f.key];
          }
        });
      });
      updateTotals();
      setGlobal("", null);
    } catch (err) {
      setGlobal("Kunne ikke hente lagrede tall akkurat nå. Du kan fortsatt registrere.", "error");
    }
  }

  function init() {
    const container = document.querySelector("[data-sprakkafe]");
    if (!container) return;
    buildTable(container);
    loadSaved();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
