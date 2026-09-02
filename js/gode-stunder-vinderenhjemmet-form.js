(function () {
  "use strict";

  const form = document.querySelector("[data-gs-form]");
  if (!form) return;

  const FORMSUBMIT_URL =
    "https://formsubmit.co/ajax/espen@vestreaker.frivilligsentral.no";
  const audience = form.dataset.audience === "student" ? "student" : "general";
  const submitButton = form.querySelector(".gs-submit");
  const message = form.querySelector("[data-gs-message]");
  const successBox = form.querySelector("[data-gs-success]");
  const errorSummary = form.querySelector("[data-gs-error-summary]");
  const errorList = form.querySelector("[data-gs-error-list]");
  const honeypot = form.querySelector('input[name="_honey"]');
  const defaultButtonText = submitButton.textContent;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let submitting = false;

  function byId(id) {
    return form.querySelector("#" + id);
  }

  const rules = [
    {
      id: "gs-navn",
      label: "Navn",
      test: () => byId("gs-navn").value.trim().length > 0,
      message: "Skriv inn navnet ditt.",
    },
    {
      id: "gs-telefon",
      label: "Telefon",
      test: () => (byId("gs-telefon").value.match(/\d/g) || []).length >= 6,
      message: "Skriv inn et telefonnummer vi kan nå deg på.",
    },
    {
      id: "gs-epost",
      label: "E-post",
      test: () => EMAIL_RE.test(byId("gs-epost").value.trim()),
      message: "Skriv inn en gyldig e-postadresse.",
    },
    {
      id: "gs-studium",
      label: "Studium",
      optionalRule: true,
      test: () => !byId("gs-studium") || byId("gs-studium").value.trim().length > 0,
      message: "Skriv hva du studerer.",
    },
    {
      id: "gs-aktiviteter",
      label: "Aktiviteter",
      group: true,
      test: () => form.querySelectorAll('input[name="aktiviteter"]:checked').length > 0,
      message: "Velg minst én aktivitet eller at du er åpen for forslag.",
    },
    {
      id: "gs-tilgjengelighet",
      label: "Når det passer",
      test: () => byId("gs-tilgjengelighet").value.trim().length > 0,
      message: "Fortell kort når det vanligvis passer for deg.",
    },
    {
      id: "gs-samtykke",
      label: "Samtykke",
      checkbox: true,
      test: () => byId("gs-samtykke").checked,
      message: "Du må samtykke før vi kan følge opp interessen.",
    },
  ];

  function fieldFor(rule) {
    return byId(rule.id);
  }

  function setRuleError(rule, hasError) {
    const field = fieldFor(rule);
    const error = form.querySelector('[data-err-for="' + rule.id + '"]');
    if (error) error.textContent = hasError ? rule.message : "";
    if (!field) return;
    field.classList.toggle("is-invalid", hasError);
    if (hasError) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  }

  function validate() {
    const errors = [];
    rules.forEach((rule) => {
      if (rule.optionalRule && !fieldFor(rule)) return;
      const valid = rule.test();
      setRuleError(rule, !valid);
      if (!valid) errors.push(rule);
    });
    return errors;
  }

  function focusRule(rule) {
    if (rule.group) {
      const first = form.querySelector('input[name="aktiviteter"]');
      if (first) first.focus();
      return;
    }
    const field = fieldFor(rule);
    if (field) field.focus();
  }

  function showErrorSummary(errors) {
    if (!errorSummary || !errorList) return;
    errorList.innerHTML = "";
    errors.forEach((rule) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = "#" + rule.id;
      link.textContent = rule.label + ": " + rule.message;
      link.addEventListener("click", function (event) {
        event.preventDefault();
        focusRule(rule);
      });
      item.appendChild(link);
      errorList.appendChild(item);
    });
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function clearErrorSummary() {
    if (errorSummary) errorSummary.hidden = true;
  }

  rules.forEach((rule) => {
    const field = fieldFor(rule);
    if (rule.optionalRule && !field) return;
    if (rule.group) {
      form.querySelectorAll('input[name="aktiviteter"]').forEach((checkbox) => {
        checkbox.addEventListener("change", function () {
          if (rule.test()) setRuleError(rule, false);
        });
      });
      return;
    }
    if (!field) return;
    field.addEventListener(rule.checkbox ? "change" : "input", function () {
      if (rule.test()) setRuleError(rule, false);
    });
  });

  function value(id) {
    const field = byId(id);
    return field ? (field.value || "").trim() : "";
  }

  function selectedActivities() {
    return Array.from(form.querySelectorAll('input[name="aktiviteter"]:checked')).map(
      (checkbox) => checkbox.value
    );
  }

  function buildMessage() {
    const wantsSimilar = byId("gs-lignende").checked;
    const lines = [
      audience === "student"
        ? "Ny studentfrivillig til Vinderenhjemmet"
        : "Ny interessent til Gode stunder på Vinderenhjemmet",
      "",
      "Navn: " + value("gs-navn"),
      "E-post: " + value("gs-epost"),
      "Telefon: " + value("gs-telefon"),
    ];

    if (audience === "student") {
      lines.push("Studium: " + value("gs-studium"));
      lines.push("Ønsket erfaring: " + (value("gs-erfaring") || "Ikke oppgitt"));
    }

    lines.push("", "Aktiviteter:");
    selectedActivities().forEach((activity) => lines.push("- " + activity));
    lines.push(
      "",
      "Når det vanligvis passer: " + value("gs-tilgjengelighet"),
      "Melding: " + (value("gs-melding") || "Ingen melding"),
      "Ønsker beskjed om lignende aktiviteter: " + (wantsSimilar ? "Ja" : "Nei"),
      "Samtykke til oppfølging av interessen: Ja"
    );
    return lines.join("\n");
  }

  function setMessage(text, type) {
    message.textContent = text;
    message.classList.remove("is-error");
    if (type) message.classList.add("is-" + type);
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if ((honeypot && honeypot.value) || submitting) return;

    if (successBox) successBox.hidden = true;
    const errors = validate();
    if (errors.length) {
      setMessage("", null);
      showErrorSummary(errors);
      return;
    }
    clearErrorSummary();

    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Sender …";
    setMessage("Sender interessen din …", null);

    const data = new FormData();
    data.append("Melding", buildMessage());
    data.append(
      "_subject",
      audience === "student"
        ? "Ny studentfrivillig - Vinderenhjemmet"
        : "Ny interessent - gode stunder på Vinderenhjemmet"
    );
    data.append("_captcha", "false");
    data.append("_replyto", value("gs-epost"));
    if (honeypot) data.append("_honey", honeypot.value);

    try {
      const response = await fetch(FORMSUBMIT_URL, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (!response.ok) throw new Error("Innsending feilet: " + response.status);

      let payload = null;
      try {
        payload = await response.json();
      } catch (error) {
        payload = null;
      }
      const confirmed =
        !payload || payload.success === true || String(payload.success).toLowerCase() === "true";
      if (!confirmed) throw new Error("Uventet svar fra tjenesten");

      form.reset();
      setMessage("", null);
      if (successBox) {
        successBox.hidden = false;
        successBox.focus();
      }
    } catch (error) {
      setMessage(
        "Noe gikk galt, og interessen ble ikke sendt. Prøv igjen, eller kontakt Espen direkte.",
        "error"
      );
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });
})();
