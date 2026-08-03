(function () {
  const form = document.querySelector("[data-beredskap-form]");

  if (!form) {
    return;
  }

  const endpoint = "https://formsubmit.co/ajax/6f98aaab672470053b3da65ff34dc4fc";
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
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Accept": "application/json"
        },
        body: new FormData(form)
      });

      if (!response.ok) {
        throw new Error("Beredskap signup failed");
      }

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
