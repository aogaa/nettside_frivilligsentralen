(function () {
  const form = document.querySelector("[data-beredskap-form]");

  if (!form) {
    return;
  }

  // Mottaker styres av skjematjenestens serverkonfigurasjon.
  const honeypotInput = form.querySelector('input[name="_honey"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const message = form.querySelector("[data-beredskap-message]");
  const defaultButtonText = submitButton.textContent;

  function setMessage(text, type) {
    message.textContent = text;
    message.classList.remove("is-success", "is-error");

    if (type) {
      message.classList.add(`is-${type}`);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitButton.disabled) return;

    if (honeypotInput && honeypotInput.value) {
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sender...";
    setMessage("", null);

    try {
      await window.Skjema.submit('beredskap', window.Skjema.serialize(form), {website: honeypotInput ? honeypotInput.value : ''});

      form.reset();
      setMessage("Takk! Vi tar kontakt med deg.", "success");
    } catch (error) {
      setMessage("Beklager, meldingen gikk ikke gjennom. Prøv igjen litt senere.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonText;
    }
  });
})();
