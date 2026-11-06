/* Felles skjemaklient. Felt og klientvalidering leses fra HTML.
 * Mottaker, lagringspolicy og autoritativ validering ligger i skjematjenesten.
 * Skjema-ID følger sidens sti. Malen med data-demo sender aldri.
 * buildMessage brukes bare til brukerens valgfrie mailto-reserve ved feil.
 */

(function () {
  "use strict";

  var DEFAULT_ENDPOINT = "espen@vestreaker.frivilligsentral.no";
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var forms = document.querySelectorAll("[data-frivillig-form]");
  Array.prototype.forEach.call(forms, initForm);

  function initForm(form) {
    if (form.dataset.demo === "true") return;
    var submitButton = form.querySelector(".bf-submit");
    var message = form.querySelector("[data-bf-message]");
    var successBox = form.querySelector("[data-bf-success]");
    var errorSummary = form.querySelector("[data-bf-error-summary]");
    var errorList = form.querySelector("[data-bf-error-list]");
    var honeypot = form.querySelector('input[name="_honey"]');
    var defaultButtonText = submitButton ? submitButton.textContent : "Send";
    var submitting = false;

    var formId = location.pathname.split("/").filter(Boolean)[0];

    var rules = buildRules(form);
    wireLiveValidation(form, rules);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if ((honeypot && honeypot.value) || submitting) return;

      if (successBox) successBox.hidden = true;

      var errors = validate(form, rules);
      if (errors.length) {
        setMessage(message, "", null);
        showErrorSummary(form, errorSummary, errorList, errors);
        return;
      }
      if (errorSummary) errorSummary.hidden = true;

      submitting = true;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sender …";
      }
      setMessage(message, "Sender …", null);

      send();
    });

    function send() {
      var controller = new AbortController();
      var timeout = setTimeout(function () { controller.abort(); }, 20000);
      window.Skjema.submit(formId, window.Skjema.serialize(form), {
        website: honeypot ? honeypot.value : "", signal: controller.signal
      }).then(function () {
          form.reset();
          setMessage(message, "", null);
          if (successBox) {
            successBox.hidden = false;
            successBox.focus();
          }
        })
        .catch(function () {
          setMessage(
            message,
            "Vi fikk ikke bekreftet innsendingen. Opplysningene dine er beholdt. Du kan prøve igjen eller ringe oss på 23 22 05 80.",
            "error"
          );
          // Alias-mottakere må oppgi sin egen reserveadresse eksplisitt.
          var fallbackEmail = form.dataset.fallbackEmail ||
            (!form.dataset.formsubmit ? DEFAULT_ENDPOINT : "");
          if (message && EMAIL_RE.test(fallbackEmail)) {
            var fallback = document.createElement("a");
            fallback.className = "bf-button bf-button-secondary";
            fallback.href = "mailto:" + fallbackEmail +
              "?subject=" + encodeURIComponent(form.dataset.subject || document.title) +
              "&body=" + encodeURIComponent(buildMessage(form));
            fallback.textContent = form.dataset.fallbackLabel || "Send påmeldingen med e-post";
            message.appendChild(document.createElement("br"));
            message.appendChild(fallback);
            var hint = document.createElement("span");
            hint.textContent = " Åpner e-postprogrammet ditt med opplysningene ferdig utfylt. Du må selv trykke Send der.";
            message.appendChild(hint);
          }
        })
        .then(function () {
          clearTimeout(timeout);
          submitting = false;
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = defaultButtonText;
          }
        });
    }
  }

  /* ---------- Regler bygget fra DOM ---------- */

  function buildRules(form) {
    var elements = form.querySelectorAll("[required], [data-bf-required-group]");
    var rules = [];
    Array.prototype.forEach.call(elements, function (el) {
      if (!el.id) return;
      rules.push(buildRule(form, el));
    });
    return rules;
  }

  function buildRule(form, el) {
    var label = el.dataset.bfLabel || labelTextFor(form, el) || "Feltet";
    var custom = el.dataset.bfError;

    if (el.dataset.bfRequiredGroup) {
      var groupName = el.dataset.bfRequiredGroup;
      return {
        id: el.id,
        el: el,
        label: label,
        group: groupName,
        test: function () {
          return form.querySelectorAll('input[name="' + groupName + '"]:checked').length > 0;
        },
        message: custom || "Velg minst ett alternativ.",
      };
    }

    if (el.type === "checkbox") {
      return {
        id: el.id,
        el: el,
        label: label,
        checkbox: true,
        test: function () {
          return el.checked;
        },
        message: custom || "Dette feltet må hukes av.",
      };
    }

    if (el.type === "email") {
      return {
        id: el.id,
        el: el,
        label: label,
        test: function () {
          return EMAIL_RE.test(el.value.trim());
        },
        message: custom || "Skriv inn en gyldig e-postadresse.",
      };
    }

    if (el.type === "tel") {
      return {
        id: el.id,
        el: el,
        label: label,
        test: function () {
          return (el.value.match(/\d/g) || []).length >= 6;
        },
        message: custom || "Skriv inn et telefonnummer vi kan nå deg på.",
      };
    }

    return {
      id: el.id,
      el: el,
      label: label,
      test: function () {
        return el.value.trim().length > 0 && (el.type !== "number" || el.validity.valid);
      },
      message: custom || "Dette feltet må fylles ut.",
    };
  }

  /* ---------- Validering og feilvisning ---------- */

  function setRuleError(form, rule, hasError) {
    var error = form.querySelector('[data-err-for="' + rule.id + '"]');
    if (error) error.textContent = hasError ? rule.message : "";
    if (!rule.el) return;
    rule.el.classList.toggle("is-invalid", hasError);
    if (hasError) {
      rule.el.setAttribute("aria-invalid", "true");
    } else {
      rule.el.removeAttribute("aria-invalid");
    }
  }

  function validate(form, rules) {
    var errors = [];
    rules.forEach(function (rule) {
      var valid = rule.test();
      setRuleError(form, rule, !valid);
      if (!valid) errors.push(rule);
    });
    return errors;
  }

  function focusRule(form, rule) {
    if (rule.group) {
      var first = form.querySelector('input[name="' + rule.group + '"]');
      if (first) first.focus();
      return;
    }
    if (rule.el) rule.el.focus();
  }

  function showErrorSummary(form, errorSummary, errorList, errors) {
    if (!errorSummary || !errorList) return;
    errorList.innerHTML = "";
    errors.forEach(function (rule) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      link.href = "#" + rule.id;
      link.textContent = rule.label + ": " + rule.message;
      link.addEventListener("click", function (event) {
        event.preventDefault();
        focusRule(form, rule);
      });
      item.appendChild(link);
      errorList.appendChild(item);
    });
    errorSummary.hidden = false;
    errorSummary.focus();
  }

  function wireLiveValidation(form, rules) {
    rules.forEach(function (rule) {
      if (rule.group) {
        var boxes = form.querySelectorAll('input[name="' + rule.group + '"]');
        Array.prototype.forEach.call(boxes, function (checkbox) {
          checkbox.addEventListener("change", function () {
            if (rule.test()) setRuleError(form, rule, false);
          });
        });
        return;
      }
      if (!rule.el) return;
      rule.el.addEventListener(rule.checkbox ? "change" : "input", function () {
        if (rule.test()) setRuleError(form, rule, false);
      });
    });
  }

  /* ---------- Meldingen ---------- */

  function buildMessage(form) {
    var lines = [form.dataset.intro || document.title, ""];
    var seenGroups = {};

    var fields = form.querySelectorAll("input, textarea, select");
    Array.prototype.forEach.call(fields, function (el) {
      if (!el.name || el.name === "_honey") return;
      if (el.dataset.bfSkip !== undefined) return;
      if (el.type === "hidden" || el.type === "submit" || el.type === "button") return;

      if (el.type === "checkbox" && isGroupMember(form, el)) {
        if (seenGroups[el.name]) return;
        seenGroups[el.name] = true;
        var checked = form.querySelectorAll('input[name="' + el.name + '"]:checked');
        lines.push(withColon(groupLabel(form, el)));
        if (checked.length) {
          Array.prototype.forEach.call(checked, function (box) {
            lines.push("- " + box.value);
          });
        } else {
          lines.push("- Ingen valgt");
        }
        return;
      }

      if (el.type === "checkbox") {
        lines.push(labelTextFor(form, el) + ": " + (el.checked ? "Ja" : "Nei"));
        return;
      }

      lines.push(labelTextFor(form, el) + ": " + (el.value.trim() || "Ikke oppgitt"));
    });

    return lines.join("\n");
  }

  function isGroupMember(form, el) {
    if (el.closest("[data-bf-required-group]")) return true;
    if (el.closest(".bf-check-grid")) return true;
    return form.querySelectorAll('input[name="' + el.name + '"]').length > 1;
  }

  function withColon(text) {
    return /[?!.:]$/.test(text) ? text : text + ":";
  }

  function groupLabel(form, el) {
    var fieldset = el.closest("fieldset");
    var legend = fieldset ? fieldset.querySelector("legend") : null;
    if (legend) return cleanLabel(legend.textContent);
    return el.name;
  }

  /* ---------- Etiketter ---------- */

  function labelTextFor(form, el) {
    if (el.dataset && el.dataset.bfLabel) return el.dataset.bfLabel;

    if (el.id) {
      var label = form.querySelector('label[for="' + el.id + '"]');
      if (label) return cleanLabel(label.textContent);
    }

    var wrapping = el.closest("label");
    if (wrapping) return cleanLabel(wrapping.textContent);

    if (el.tagName === "FIELDSET") {
      var legend = el.querySelector("legend");
      if (legend) return cleanLabel(legend.textContent);
    }

    return el.name || "";
  }

  function cleanLabel(text) {
    return (text || "")
      .replace(/\*/g, "")
      .replace(/\(valgfritt\)/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function setMessage(node, text, type) {
    if (!node) return;
    node.textContent = text;
    node.classList.remove("is-error");
    if (type) node.classList.add("is-" + type);
  }
})();
