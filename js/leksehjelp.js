(function () {
  "use strict";

  // Endepunkt for lagring/henting av tall (Cloud Function, samme mønster som newsletter.js)
  const FUNCTION_URL =
    "https://europe-west1-frivilligsentralen-org.cloudfunctions.net/leksehjelp";

  // FormSubmit-endepunkt for meldinger til Espen.
  // MERK: Bytt ut med alias etter aktivering, f.eks. "https://formsubmit.co/ajax/<alias>",
  // slik at e-postadressen skjules i kildekoden (samme grep som beredskap-skjemaet).
  const FORMSUBMIT_URL =
    "https://formsubmit.co/ajax/espen@vestreaker.frivilligsentral.no";

  const MND = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];

  // Datoer hosten 2026. stengt = Hostferie (ingen registrering).
  const MANDAGER = [
    "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21",
    { dato: "2026-09-28", stengt: true },
    "2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26",
    "2026-11-02", "2026-11-09", "2026-11-16", "2026-11-23", "2026-11-30",
    "2026-12-07", "2026-12-14"
  ];

  const ONSDAGER = [
    "2026-09-02", "2026-09-09", "2026-09-16", "2026-09-23",
    { dato: "2026-09-30", stengt: true },
    "2026-10-07", "2026-10-14", "2026-10-21", "2026-10-28",
    "2026-11-04", "2026-11-11", "2026-11-18", "2026-11-25",
    "2026-12-02", "2026-12-09", "2026-12-16"
  ];

  const FELTER = {
    mandag: [
      { key: "barn", label: "Antall barn" },
      { key: "voksenopplaering", label: "Voksenopplæring" },
      { key: "frivillige", label: "Frivillige" }
    ],
    onsdag: [
      { key: "elever", label: "Elever" },
      { key: "frivillige", label: "Frivillige" }
    ]
  };

  const honeypot = document.getElementById("lh-honey");
  const globalStatus = document.querySelector("[data-lh-global-status]");
  const rowIndex = {}; // dato -> { ukedag, inputs: {key: el}, statusEl }

  function norskDato(iso, ukedag) {
    const d = new Date(iso + "T00:00:00");
    const ukedagStor = ukedag.charAt(0).toUpperCase() + ukedag.slice(1);
    return ukedagStor + " " + d.getDate() + ". " + MND[d.getMonth()];
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

  function normalizeDates(list, ukedag) {
    return list.map(function (item) {
      if (typeof item === "string") return { dato: item, stengt: false, ukedag: ukedag };
      return { dato: item.dato, stengt: !!item.stengt, ukedag: ukedag };
    });
  }

  function buildTable(container, ukedag, dager) {
    const felter = FELTER[ukedag];
    const table = document.createElement("table");
    table.className = "lh-table";

    // thead
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.appendChild(th("Dato"));
    felter.forEach(function (f) { headRow.appendChild(th(f.label)); });
    headRow.appendChild(th("Melding (valgfritt)"));
    headRow.appendChild(th(""));
    thead.appendChild(headRow);
    table.appendChild(thead);

    // tbody
    const tbody = document.createElement("tbody");
    dager.forEach(function (dag) {
      tbody.appendChild(buildRow(dag, ukedag, felter));
    });
    table.appendChild(tbody);

    // tfoot (totaler)
    const tfoot = document.createElement("tfoot");
    const footRow = document.createElement("tr");
    const totLabel = document.createElement("td");
    totLabel.textContent = "Totalt";
    totLabel.setAttribute("data-label", "");
    footRow.appendChild(totLabel);
    felter.forEach(function (f) {
      const td = document.createElement("td");
      td.setAttribute("data-label", f.label);
      td.setAttribute("data-total-for", ukedag + "-" + f.key);
      td.textContent = "0";
      footRow.appendChild(td);
    });
    footRow.appendChild(emptyTd());
    footRow.appendChild(emptyTd());
    tfoot.appendChild(footRow);
    table.appendChild(tfoot);

    container.appendChild(table);
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

  function buildRow(dag, ukedag, felter) {
    const tr = document.createElement("tr");

    const dateTd = document.createElement("td");
    dateTd.className = "lh-date-cell";
    dateTd.setAttribute("data-label", "Dato");
    dateTd.textContent = norskDato(dag.dato, ukedag);
    tr.appendChild(dateTd);

    if (dag.stengt) {
      tr.classList.add("lh-closed");
      const td = document.createElement("td");
      td.setAttribute("colspan", String(felter.length + 2));
      td.setAttribute("data-label", "");
      td.textContent = "Høstferie (stengt)";
      tr.appendChild(td);
      return tr;
    }

    const inputs = {};
    felter.forEach(function (f) {
      const td = document.createElement("td");
      td.setAttribute("data-label", f.label);
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.inputMode = "numeric";
      input.placeholder = "0";
      input.setAttribute("aria-label", f.label + " " + norskDato(dag.dato, ukedag));
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
    msgInput.setAttribute("aria-label", "Melding for " + norskDato(dag.dato, ukedag));
    msgTd.appendChild(msgInput);
    tr.appendChild(msgTd);

    // Handling
    const actionTd = document.createElement("td");
    actionTd.setAttribute("data-label", "");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lh-save-btn";
    btn.textContent = "Lagre";
    const statusEl = document.createElement("span");
    statusEl.className = "lh-row-status";
    statusEl.setAttribute("role", "status");
    statusEl.setAttribute("aria-live", "polite");
    actionTd.appendChild(btn);
    actionTd.appendChild(statusEl);
    tr.appendChild(actionTd);

    btn.addEventListener("click", function () {
      saveRow(dag.dato, ukedag, felter, inputs, msgInput, btn, statusEl);
    });

    rowIndex[dag.dato] = { ukedag: ukedag, inputs: inputs, statusEl: statusEl };
    return tr;
  }

  function setRowStatus(el, text, type) {
    el.textContent = text;
    el.classList.remove("is-success", "is-error");
    if (type) el.classList.add("is-" + type);
  }

  async function saveRow(dato, ukedag, felter, inputs, msgInput, btn, statusEl) {
    if (honeypot && honeypot.value) return; // bot

    const payload = { dato: dato, ukedag: ukedag, website: honeypot ? honeypot.value : "" };
    felter.forEach(function (f) {
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
      // Vis normaliserte verdier tilbake
      felter.forEach(function (f) { inputs[f.key].value = payload[f.key]; });
      updateTotals(ukedag);
    } catch (err) {
      setRowStatus(statusEl, "Feil – ikke lagret, prøv igjen", "error");
      btn.disabled = false;
      return;
    }

    // 2) Send tallene (og evt. melding) paa e-post til Espen
    const melding = msgInput.value.trim();
    try {
      await sendEpost(dato, ukedag, felter, inputs, melding);
      if (melding) msgInput.value = "";
      setRowStatus(statusEl, "Lagret + sendt på e-post ✓", "success");
    } catch (err) {
      setRowStatus(statusEl, "Lagret ✓, men e-post feilet", "error");
    } finally {
      btn.disabled = false;
    }
  }

  async function sendEpost(dato, ukedag, felter, inputs, melding) {
    if (honeypot && honeypot.value) return;
    const data = new FormData();
    data.append("Dato", norskDato(dato, ukedag));
    felter.forEach(function (f) {
      data.append(f.label, String(toInt(inputs[f.key].value)));
    });
    if (melding) data.append("Melding", melding);
    data.append("_subject", "Leksehjelp " + norskDato(dato, ukedag));
    data.append("_template", "table");
    data.append("_captcha", "false");
    if (honeypot) data.append("_honey", honeypot.value);

    const response = await fetch(FORMSUBMIT_URL, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: data
    });
    if (!response.ok) throw new Error("epost failed");
  }

  function updateTotals(ukedag) {
    FELTER[ukedag].forEach(function (f) {
      let sum = 0;
      Object.keys(rowIndex).forEach(function (dato) {
        const row = rowIndex[dato];
        if (row.ukedag === ukedag && row.inputs[f.key]) {
          sum += toInt(row.inputs[f.key].value);
        }
      });
      const cell = document.querySelector('[data-total-for="' + ukedag + "-" + f.key + '"]');
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
        FELTER[row.ukedag].forEach(function (f) {
          if (typeof entry[f.key] === "number" && row.inputs[f.key]) {
            row.inputs[f.key].value = entry[f.key];
          }
        });
      });
      updateTotals("mandag");
      updateTotals("onsdag");
      setGlobal("", null);
    } catch (err) {
      setGlobal("Kunne ikke hente lagrede tall akkurat nå. Du kan fortsatt registrere.", "error");
    }
  }

  function init() {
    const mContainer = document.querySelector("[data-lh-mandager]");
    const oContainer = document.querySelector("[data-lh-onsdager]");
    if (!mContainer || !oContainer) return;

    buildTable(mContainer, "mandag", normalizeDates(MANDAGER, "mandag"));
    buildTable(oContainer, "onsdag", normalizeDates(ONSDAGER, "onsdag"));
    loadSaved();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
