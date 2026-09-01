(function () {
  "use strict";

  const form = document.querySelector("[data-jb-form]");
  if (!form) return;

  // Samme aktiverte FormSubmit-mottaker som eksisterende VAFS-skjemaer.
  const FORMSUBMIT_URL =
    "https://formsubmit.co/ajax/espen@vestreaker.frivilligsentral.no";

  const submitButton = form.querySelector(".jb-submit");
  const message = form.querySelector("[data-jb-message]");
  const successBox = form.querySelector("[data-jb-success]");
  const errorSummary = form.querySelector("[data-jb-error-summary]");
  const errorList = form.querySelector("[data-jb-error-list]");
  const honeypot = form.querySelector('input[name="_honey"]');
  const defaultButtonText = submitButton.textContent;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let submitting = false;

  const rules = [
    {
      id: "jb-navn",
      label: "Navn",
      test: () => document.getElementById("jb-navn").value.trim().length > 0,
      message: "Skriv inn navnet ditt.",
    },
    {
      id: "jb-telefon",
      label: "Telefon",
      test: () =>
        (document.getElementById("jb-telefon").value.match(/\d/g) || []).length >= 6,
      message: "Skriv inn et telefonnummer vi kan nå deg på.",
    },
    {
      id: "jb-epost",
      label: "E-post",
      test: () => EMAIL_RE.test(document.getElementById("jb-epost").value.trim()),
      message: "Skriv inn en gyldig e-postadresse.",
    },
    {
      id: "jb-datoer",
      label: "Dager",
      group: true,
      test: () => form.querySelectorAll('input[name="datoer"]:checked').length > 0,
      message: "Velg minst én dag.",
    },
    {
      id: "jb-samtykke",
      label: "Samtykke",
      checkbox: true,
      test: () => document.getElementById("jb-samtykke").checked,
      message: "Du må samtykke før vi kan følge opp påmeldingen.",
    },
  ];

  function fieldFor(rule) {
    return document.getElementById(rule.id);
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
      const valid = rule.test();
      setRuleError(rule, !valid);
      if (!valid) errors.push(rule);
    });
    return errors;
  }

  function focusRule(rule) {
    if (rule.group) {
      const firstDate = form.querySelector('input[name="datoer"]');
      if (firstDate) firstDate.focus();
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
    if (rule.group) {
      form.querySelectorAll('input[name="datoer"]').forEach((checkbox) => {
        checkbox.addEventListener("change", function () {
          if (rule.test()) setRuleError(rule, false);
        });
      });
      return;
    }

    const field = fieldFor(rule);
    if (!field) return;
    field.addEventListener(rule.checkbox ? "change" : "input", function () {
      if (rule.test()) setRuleError(rule, false);
    });
  });

  function selectedDates() {
    return Array.from(form.querySelectorAll('input[name="datoer"]:checked')).map(
      (checkbox) => checkbox.value
    );
  }

  function value(id) {
    return (document.getElementById(id).value || "").trim();
  }

  function buildMessage() {
    const wantsSimilar = document.getElementById("jb-lignende").checked;
    return [
      "Ny påmelding til julebakst på Vinderenhjemmet",
      "",
      "Navn: " + value("jb-navn"),
      "E-post: " + value("jb-epost"),
      "Telefon: " + value("jb-telefon"),
      "Valgte dager:",
      ...selectedDates().map((date) => "- " + date),
      "",
      "Ønsker beskjed om lignende aktiviteter: " + (wantsSimilar ? "Ja" : "Nei"),
      "Samtykke til oppfølging av påmeldingen: Ja",
    ].join("\n");
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
    setMessage("Sender inn påmeldingen …", null);

    const data = new FormData();
    data.append("Melding", buildMessage());
    data.append("_subject", "Ny påmelding - julebakst på Vinderenhjemmet");
    data.append("_captcha", "false");
    data.append("_replyto", value("jb-epost"));
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
        !payload ||
        payload.success === true ||
        String(payload.success).toLowerCase() === "true";
      if (!confirmed) throw new Error("Uventet svar fra tjenesten");

      form.reset();
      setMessage("", null);
      if (successBox) {
        successBox.hidden = false;
        successBox.focus();
      }
    } catch (error) {
      setMessage(
        "Noe gikk galt, og påmeldingen ble ikke sendt. Prøv igjen, eller kontakt Espen direkte.",
        "error"
      );
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });
})();
