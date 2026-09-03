(function () {
  "use strict";

  const form = document.querySelector("[data-soup-form]");
  if (!form) return;

  // Mottaker for Røa Soup. Merk: FormSubmit må aktiveres én gang per mottaker,
  // og aktiveringen gjelder per origin (fungerer i praksis kun fra produksjon).
  const FORMSUBMIT_URL =
    "https://formsubmit.co/ajax/mari@oslovest.frivilligsentral.no";

  const submitButton = form.querySelector(".soup-submit");
  const message = form.querySelector("[data-soup-message]");
  const successBox = form.querySelector("[data-soup-success]");
  const errorSummary = form.querySelector("[data-soup-error-summary]");
  const errorList = form.querySelector("[data-soup-error-list]");
  const honeypot = form.querySelector('input[name="_honey"]');
  const counter = form.querySelector("[data-soup-counter]");
  const ideField = document.getElementById("soup-ide");
  const defaultButtonText = submitButton.textContent;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let submitting = false;
  let startTracked = false;

  // ---- Analyse (kun hvis samtykke er gitt og gtag er lastet) ----
  function track(eventName, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
    }
  }

  form.addEventListener("focusin", function () {
    if (!startTracked) {
      startTracked = true;
      track("soup_skjema_start");
    }
  });

  // ---- Tegnteller ----
  if (counter && ideField) {
    const max = ideField.getAttribute("maxlength") || "1500";
    const update = function () {
      counter.textContent = ideField.value.length + " av " + max + " tegn";
    };
    ideField.addEventListener("input", update);
    update();
  }

  // ---- Validering ----
  const rules = [
    {
      id: "soup-navn",
      label: "Navn",
      test: () => document.getElementById("soup-navn").value.trim().length > 0,
      message: "Skriv inn navnet ditt.",
    },
    {
      id: "soup-telefon",
      label: "Telefon",
      test: () =>
        (document.getElementById("soup-telefon").value.match(/\d/g) || []).length >= 6,
      message: "Skriv inn et telefonnummer vi kan nå deg på.",
    },
    {
      id: "soup-epost",
      label: "E-post",
      test: () => EMAIL_RE.test(document.getElementById("soup-epost").value.trim()),
      message: "Skriv inn en gyldig e-postadresse.",
    },
    {
      id: "soup-ide",
      label: "Ideen din",
      test: () => document.getElementById("soup-ide").value.trim().length >= 10,
      message: "Fortell kort om ideen din - noen setninger holder.",
    },
    {
      id: "soup-samtykke",
      label: "Samtykke",
      checkbox: true,
      test: () => document.getElementById("soup-samtykke").checked,
      message: "Du må samtykke før vi kan følge opp ideen din.",
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
        const field = fieldFor(rule);
        if (field) field.focus();
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
    if (!field) return;
    field.addEventListener(rule.checkbox ? "change" : "input", function () {
      if (rule.test()) setRuleError(rule, false);
    });
  });

  function value(id) {
    return (document.getElementById(id).value || "").trim();
  }

  function buildMessage() {
    const wantsNews = document.getElementById("soup-nyheter").checked;
    return [
      "Ny idé til Røa Soup 22. september",
      "",
      "Navn: " + value("soup-navn"),
      "Telefon: " + value("soup-telefon"),
      "E-post: " + value("soup-epost"),
      "",
      "Ideen:",
      value("soup-ide"),
      "",
      "Ønsker beskjed om lignende arrangementer: " + (wantsNews ? "Ja" : "Nei"),
      "Samtykke til oppfølging: Ja",
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
    setMessage("Sender inn ideen din …", null);

    const data = new FormData();
    data.append("Melding", buildMessage());
    data.append("_subject", "Ny idé til Røa Soup");
    data.append("_captcha", "false");
    data.append("_replyto", value("soup-epost"));
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
      if (!confirmed) throw new Error(payload && payload.message ? payload.message : "Uventet svar fra tjenesten");

      form.reset();
      if (counter && ideField) counter.textContent = "0 av 1500 tegn";
      setMessage("", null);
      track("soup_ide_sendt");
      if (successBox) {
        successBox.hidden = false;
        successBox.focus();
      }
    } catch (error) {
      setMessage(
        "Noe gikk galt, og ideen ble ikke sendt. Prøv igjen, eller ring Mari på 23 68 08 50.",
        "error"
      );
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });
})();
