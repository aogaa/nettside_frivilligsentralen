(function () {
  const form = document.querySelector("[data-newsletter-form]");

  if (!form) {
    return;
  }

  const endpoint = "https://n8n.aogaa.no/webhook/70558d75-06a4-44e9-a233-7034223a42cb";
  const token = "vafmV-2026-01-18__k9H3xQp7mT2nR5sL8dF1aC4gJ6uZ0yW";
  const emailInput = form.querySelector('input[name="email"]');
  const honeypotInput = form.querySelector('input[name="website"]');
  const submitButton = form.querySelector('button[type="submit"]');
  const message = form.querySelector("[data-newsletter-message]");

  function setMessage(text, type) {
    message.textContent = text;
    message.classList.remove("is-success", "is-error");

    if (type) {
      message.classList.add(`is-${type}`);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (honeypotInput.value) {
      return;
    }

    if (!emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    const email = emailInput.value.trim();

    submitButton.disabled = true;
    submitButton.textContent = "Sender...";
    setMessage("", null);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-newsletter-token": token
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        throw new Error("Newsletter signup failed");
      }

      form.reset();
      setMessage("Takk! Du er meldt på nyhetsbrevet.", "success");
    } catch (error) {
      setMessage("Beklager, påmeldingen gikk ikke gjennom. Prøv igjen litt senere.", "error");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Meld meg på";
    }
  });
})();
