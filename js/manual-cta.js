(function () {
  // Sender en egen Google Analytics-hendelse når noen klikker for å åpne
  // eller laste ned REAL-håndboken. Hendelsen sendes kun når analytics
  // faktisk er aktivert (samtykke gitt + sporet vertsnavn), siden
  // window.gtag først defineres av analytics.js i det tilfellet.
  document.addEventListener("click", function (event) {
    var link = event.target.closest("[data-track-manual]");

    if (!link || typeof window.gtag !== "function") {
      return;
    }

    window.gtag("event", "manual_open", {
      manual: "real_best_practices",
      language: link.dataset.manualLang || document.documentElement.lang || "no",
      link_url: link.href,
      link_text: (link.textContent || "").trim().slice(0, 100),
      page_location: window.location.href,
    });
  });
})();
