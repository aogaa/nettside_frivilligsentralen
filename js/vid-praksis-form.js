(function () {
  "use strict";

  const form = document.querySelector("[data-vid-form]");
  if (!form) return;

  // Samme FormSubmit-mottaker som leksehjelp/sprakkafe (allerede aktivert).
  const FORMSUBMIT_URL =
    "https://formsubmit.co/ajax/espen@vestreaker.frivilligsentral.no";

  const honeypot = form.querySelector('input[name="_honey"]');
  const submitButton = form.querySelector(".vid-submit");
  const message = form.querySelector("[data-vid-message]");
  const successBox = form.querySelector("[data-vid-success]");
  const errorSummary = form.querySelector("[data-vid-error-summary]");
  const errorList = form.querySelector("[data-vid-error-list]");
  const heroCta = document.querySelector("[data-vid-hero-cta]");

  const defaultButtonText = submitButton.textContent;
  let submitting = false;
  let startTracked = false;

  // ---- Analyse (kun hvis samtykke er gitt og gtag er lastet) ----
  function track(eventName, params) {
    if (typeof window.gtag === "function") {
      window.gtag("event", eventName, params || {});
    }
  }

  if (heroCta) {
    heroCta.addEventListener("click", function () {
      track("vid_meld_interesse_hero");
    });
  }

  form.addEventListener(
    "focusin",
    function () {
      if (!startTracked) {
        startTracked = true;
        track("vid_skjema_start");
      }
    },
    { once: false }
  );

  // ---- Validering ----
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Rekkefølgen styrer også rekkefølgen i feiloppsummeringen.
  const rules = [
    {
      id: "vid-navn",
      test: (v) => v.trim().length > 0,
      msg: "Skriv inn navnet ditt.",
    },
    {
      id: "vid-epost",
      test: (v) => EMAIL_RE.test(v.trim()),
      msg: "Skriv inn en gyldig e-postadresse.",
    },
    {
      id: "vid-telefon",
      // Minst 6 sifre – tåler mellomrom, +47 osv.
      test: (v) => (v.match(/\d/g) || []).length >= 6,
      msg: "Skriv inn et telefonnummer vi kan nå deg på.",
    },
    {
      id: "vid-studium",
      test: (v) => v.trim().length > 0,
      msg: "Skriv inn hvilket studium du går på ved VID.",
    },
    {
      id: "vid-periode",
      test: (v) => v.trim().length > 0,
      msg: "Skriv inn omtrent når du ønsker å ha praksis.",
    },
    {
      id: "vid-samtykke",
      type: "checkbox",
      test: (checked) => checked === true,
      msg: "Du må samtykke før vi kan ta kontakt.",
      labelText: "Samtykke",
    },
  ];

  function fieldLabelText(field, rule) {
    if (rule.labelText) return rule.labelText;
    const label = form.querySelector('label[for="' + rule.id + '"]');
    if (label) {
      // Fjern «*» og hjelpetekst-merker.
      return label.textContent.replace(/\*/g, "").trim();
    }
    return field.name || rule.id;
  }

  function setFieldError(field, rule, hasError) {
    const errEl = form.querySelector('[data-err-for="' + rule.id + '"]');
    if (errEl) {
      errEl.textContent = hasError ? rule.msg : "";
    }
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
      const field = document.getElementById(rule.id);
      if (!field) return;
      const value = rule.type === "checkbox" ? field.checked : field.value;
      const ok = rule.test(value);
      setFieldError(field, rule, !ok);
      if (!ok) {
        errors.push({
          id: rule.id,
          msg: rule.msg,
          label: fieldLabelText(field, rule),
        });
      }
    });
    return errors;
  }

  function showErrorSummary(errors) {
    if (!errorSummary || !errorList) return;
    errorList.innerHTML = "";
    errors.forEach((err) => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = "#" + err.id;
      a.textContent = err.label + ": " + err.msg;
      a.addEventListener("click", function (e) {
        e.preventDefault();
        const field = document.getElementById(err.id);
        if (field) field.focus();
      });
      li.appendChild(a);
      errorList.appendChild(li);
    });
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function clearErrorSummary() {
    if (errorSummary) errorSummary.hidden = true;
  }

  // Fjern feil på et felt så snart brukeren retter det.
  rules.forEach((rule) => {
    const field = document.getElementById(rule.id);
    if (!field) return;
    const evt = rule.type === "checkbox" ? "change" : "input";
    field.addEventListener(evt, function () {
      const value = rule.type === "checkbox" ? field.checked : field.value;
      if (rule.test(value)) setFieldError(field, rule, false);
    });
  });

  function setMessage(text, type) {
    message.textContent = text;
    message.classList.remove("is-success", "is-error");
    if (type) message.classList.add("is-" + type);
  }

  // Bygg én lesbar melding (FormSubmit viser bare ett innholdsfelt pålitelig).
  function buildMessageText() {
    const val = (id) => (document.getElementById(id).value || "").trim();
    const aktiviteter = Array.from(
      form.querySelectorAll('input[name="aktiviteter"]:checked')
    ).map((el) => el.value);

    const lines = [
      "Navn: " + val("vid-navn"),
      "E-post: " + val("vid-epost"),
      "Telefon: " + val("vid-telefon"),
      "Studium ved VID: " + val("vid-studium"),
      "Ønsket praksisperiode: " + val("vid-periode"),
      "Aktiviteter: " + (aktiviteter.length ? aktiviteter.join(", ") : "Ikke oppgitt"),
    ];
    const erfaring = val("vid-erfaring");
    if (erfaring) lines.push("Ønsker erfaring med: " + erfaring);
    lines.push("Samtykke til kontakt: Ja");
    return lines.join("\n");
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Bot: stille aksept uten å sende.
    if (honeypot && honeypot.value) return;
    if (submitting) return;

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
    setMessage("Sender inn …", null);

    const data = new FormData();
    data.append("Melding", buildMessageText());
    data.append("_subject", "Ny interessert – 60 timer som betyr noe (VID-praksis)");
    data.append("_captcha", "false");
    data.append("_replyto", document.getElementById("vid-epost").value.trim());
    if (honeypot) data.append("_honey", honeypot.value);

    try {
      const response = await fetch(FORMSUBMIT_URL, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });

      if (!response.ok) throw new Error("Innsending feilet: " + response.status);

      // FormSubmit svarer med { success: "true", ... } ved mottak.
      let payload = null;
      try {
        payload = await response.json();
      } catch (e) {
        payload = null;
      }
      const confirmed =
        !payload ||
        payload.success === true ||
        String(payload.success).toLowerCase() === "true";
      if (!confirmed) throw new Error("Uventet svar fra tjenesten");

      // Bekreftet mottak.
      form.reset();
      setMessage("", null);
      if (successBox) {
        successBox.hidden = false;
        successBox.focus();
      }
      track("vid_skjema_sendt");
    } catch (error) {
      setMessage(
        "Noe gikk galt, og skjemaet ble ikke sendt. Prøv igjen, eller kontakt " +
          "Vestre Aker Frivilligsentral direkte.",
        "error"
      );
      track("vid_skjema_feil");
    } finally {
      submitting = false;
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });
})();
