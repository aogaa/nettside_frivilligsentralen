(function () {
  "use strict";

  const FORM_ID = 'sprakkafe-telling';
  let loaded = false;
  let loadSequence = 0;
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

    rowIndex[dato] = { inputs: inputs, statusEl: statusEl, msgInput: msgInput, revision: 0 };
    return tr;
  }

  function setRowStatus(el, text, type) {
    el.textContent = text;
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add("is-" + type);
  }

  async function saveRow(dato, inputs, msgInput, btn, statusEl) {
    if (!loaded || (honeypot && honeypot.value)) { setRowStatus(statusEl, 'Vent til tallene er hentet før du lagrer.', 'error'); return; }
    const payload = {dato: dato, kommentar: msgInput.value.trim()};
    FELTER.forEach(function (f) { payload[f.key] = Number(inputs[f.key].value); });
    btn.disabled = true;
    setRowStatus(statusEl, 'Lagrer …', null);
    try {
      const result = await window.Skjema.submit(FORM_ID, payload, {expectedRevision: rowIndex[dato].revision || 0});
      if (result.replayed) { await loadSaved(); }
      else { rowIndex[dato].revision = result.revision; }
      updateTotals();
      setRowStatus(statusEl, 'Lagret – e-post satt i kø ✓', 'success');
    } catch (error) {
      setRowStatus(statusEl, error.message || 'Ikke bekreftet lagret. Prøv igjen.', 'error');
    } finally { btn.disabled = false; }
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
    const sequence = ++loadSequence;
    loaded = false;
    setGlobal("Henter lagrede tall …", null);
    try {
      const entries = await window.Skjema.attendance(FORM_ID);
      if (sequence !== loadSequence) return;
      entries.forEach(function (entry) {
        const row = rowIndex[entry.dato];
        if (!row) return;
        row.revision = entry.revision;
        row.msgInput.value = entry.kommentar || "";
        FELTER.forEach(function (f) {
          if (typeof entry[f.key] === "number" && row.inputs[f.key]) {
            row.inputs[f.key].value = entry[f.key];
          }
        });
      });
      updateTotals();
      loaded = true;
      setGlobal("", null);
    } catch (err) {
      if (sequence !== loadSequence) return;
      loaded = false;
      setGlobal("Kunne ikke hente tallene. Last siden på nytt og prøv igjen.", "error");
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
