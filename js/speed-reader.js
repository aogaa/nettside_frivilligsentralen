(function () {
  const readers = document.querySelectorAll(".speed-reader");

  if (!readers.length) {
    return;
  }

  const articlePaths = {
    no: "beredskap-bygges-for-krisen.html",
    en: "preparedness-is-built-before-the-crisis.html",
    de: "vorsorge-wird-vor-der-krise-aufgebaut.html",
    hr: "pripravnost-se-gradi-prije-krize.html",
    fr: "la-resilience-se-construit-avant-la-crise.html",
  };

  const labels = {
    no: {
      start: "Start",
      pause: "Pause",
      ready: "Trykk start",
      loading: "Laster tekst",
      empty: "Ingen tekst funnet",
      unit: "ord",
      speedLabel: "Hastighet",
      speedUnit: "ord/min",
      speedLabels: ["Rolig", "Normal", "Rask", "Veldig rask"],
      tip: "<strong>Tips:</strong> Start på ca. 250-300 ord/min hvis du er ny til metoden. De fleste klarer 400-500 etter litt øvelse. Fokuser blikket på midten av skjermen og la ordene komme til deg.",
    },
    en: {
      start: "Start",
      pause: "Pause",
      ready: "Press start",
      loading: "Loading text",
      empty: "No text found",
      unit: "words",
      speedLabel: "Speed",
      speedUnit: "words/min",
      speedLabels: ["Calm", "Normal", "Fast", "Very fast"],
      tip: "<strong>Tip:</strong> Start at around 250-300 words/min if you are new to the method. Most people can manage 400-500 after a little practice. Focus your gaze on the centre of the screen and let the words come to you.",
    },
    de: {
      start: "Start",
      pause: "Pause",
      ready: "Start drücken",
      loading: "Text wird geladen",
      empty: "Kein Text gefunden",
      unit: "Wörter",
      speedLabel: "Geschwindigkeit",
      speedUnit: "Wörter/min",
      speedLabels: ["Ruhig", "Normal", "Schnell", "Sehr schnell"],
      tip: "<strong>Tipp:</strong> Beginnen Sie mit ca. 250-300 Wörtern/min, wenn die Methode neu für Sie ist. Viele schaffen nach etwas Übung 400-500. Richten Sie den Blick auf die Mitte des Bildschirms und lassen Sie die Wörter zu sich kommen.",
    },
    hr: {
      start: "Start",
      pause: "Pauza",
      ready: "Pritisnite start",
      loading: "Učitavanje teksta",
      empty: "Tekst nije pronađen",
      unit: "riječi",
      speedLabel: "Brzina",
      speedUnit: "riječi/min",
      speedLabels: ["Polako", "Normalno", "Brzo", "Vrlo brzo"],
      tip: "<strong>Savjet:</strong> Počnite s oko 250-300 riječi/min ako ste novi u ovoj metodi. Većina ljudi nakon malo vježbe može čitati 400-500. Usmjerite pogled prema sredini zaslona i pustite da riječi dolaze k vama.",
    },
    fr: {
      start: "Start",
      pause: "Pause",
      ready: "Appuyez sur start",
      loading: "Chargement du texte",
      empty: "Aucun texte trouvé",
      unit: "mots",
      speedLabel: "Vitesse",
      speedUnit: "mots/min",
      speedLabels: ["Calme", "Normal", "Rapide", "Très rapide"],
      tip: "<strong>Conseil :</strong> Commencez autour de 250-300 mots/min si cette méthode est nouvelle pour vous. La plupart des personnes atteignent 400-500 après un peu d'entraînement. Fixez le centre de l'écran et laissez les mots venir à vous.",
    },
  };

  const textCache = {};

  function normalizeWords(text) {
    return text
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .filter(Boolean);
  }

  function extractArticleText(doc) {
    const body = doc.querySelector(".article-body");

    if (!body) {
      return "";
    }

    const chunks = [];

    for (const child of body.children) {
      if (child.classList.contains("article-source") || child.classList.contains("real-gallery")) {
        break;
      }

      if (child.matches("p:not(.article-source), .quote-box")) {
        chunks.push(child.textContent.trim());
      }
    }

    return chunks.join(" ");
  }

  async function loadWords(lang) {
    if (textCache[lang]) {
      return textCache[lang];
    }

    const response = await fetch(articlePaths[lang]);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const words = normalizeWords(extractArticleText(doc));
    textCache[lang] = words;

    return words;
  }

  function sentencePause(word) {
    return /[.!?]"?$/.test(word) ? 1.7 : 1;
  }

  function requestedLanguage(fallback) {
    const params = new URLSearchParams(window.location.search);
    const lang = params.get("lang");

    return articlePaths[lang] ? lang : fallback;
  }

  function setupReader(reader) {
    const tabs = reader.querySelectorAll(".speed-reader-tab");
    const count = reader.querySelector(".speed-reader-count");
    const word = reader.querySelector(".speed-reader-word");
    const progress = reader.querySelector(".speed-reader-progress span");
    const toggle = reader.querySelector('[data-reader-action="toggle"]');
    const back = reader.querySelector('[data-reader-action="back"]');
    const forward = reader.querySelector('[data-reader-action="forward"]');
    const reset = reader.querySelector('[data-reader-action="reset"]');
    const speed = reader.querySelector('input[type="range"]');
    const speedValue = reader.querySelector("[data-reader-speed-value]");
    const speedLabel = reader.querySelector("[data-reader-speed-label]");
    const speedUnit = reader.querySelector("[data-reader-speed-unit]");
    const speedLabels = reader.querySelectorAll(".speed-reader-speed-labels span");
    const tip = reader.querySelector("[data-reader-tip]");

    let lang = requestedLanguage(reader.dataset.currentLang || "no");
    let words = [];
    let index = 0;
    let timer = null;
    let readyText = true;
    let playing = false;

    function activeLabels() {
      return labels[lang] || labels.no;
    }

    function isPlaying() {
      return playing;
    }

    function setPlaying(nextPlaying) {
      playing = nextPlaying;
      reader.classList.toggle("is-reading", playing);

      if (!playing && timer) {
        clearTimeout(timer);
        timer = null;
      }

      toggle.textContent = playing ? activeLabels().pause : activeLabels().start;
    }

    function updateStaticLabels() {
      const copy = activeLabels();

      if (speedLabel) {
        speedLabel.textContent = copy.speedLabel;
      }

      if (speedUnit) {
        speedUnit.textContent = copy.speedUnit;
      }

      if (tip) {
        tip.innerHTML = copy.tip;
      }

      speedLabels.forEach((label, labelIndex) => {
        label.textContent = copy.speedLabels[labelIndex] || "";
      });
    }

    function fitCurrentWord() {
      word.style.removeProperty("--reader-word-scale");
      word.classList.remove("allow-word-break");

      if (!word.textContent || readyText || !words.length) {
        return;
      }

      const availableWidth = word.clientWidth;
      const actualWidth = word.scrollWidth;

      if (!availableWidth || actualWidth <= availableWidth) {
        return;
      }

      const scale = Math.max(0.42, Math.min(1, availableWidth / actualWidth));
      word.style.setProperty("--reader-word-scale", scale.toFixed(3));

      requestAnimationFrame(() => {
        if (word.scrollWidth > word.clientWidth) {
          word.classList.add("allow-word-break");
        }
      });
    }

    function update() {
      const copy = activeLabels();
      const total = words.length;
      const shownIndex = total ? Math.min(index, total) : 0;

      count.textContent = `${shownIndex} / ${total} ${copy.unit}`;
      word.textContent = readyText && total ? copy.ready : total ? words[Math.max(0, Math.min(index - 1, total - 1))] : copy.empty;
      progress.style.width = total ? `${(shownIndex / total) * 100}%` : "0";
      speedValue.textContent = speed.value;
      updateStaticLabels();
      requestAnimationFrame(fitCurrentWord);
    }

    function scheduleNext() {
      if (!isPlaying()) {
        return;
      }

      if (index >= words.length) {
        setPlaying(false);
        update();
        return;
      }

      const delay = (60000 / Number(speed.value)) * sentencePause(words[Math.max(index - 1, 0)]);

      timer = setTimeout(() => {
        timer = null;
        index += 1;
        readyText = false;
        update();
        scheduleNext();
      }, delay);
    }

    async function setLanguage(nextLang) {
      const wasPlaying = isPlaying();
      setPlaying(false);
      lang = nextLang;
      reader.dataset.currentLang = lang;
      word.textContent = activeLabels().loading;

      tabs.forEach((tab) => {
        tab.classList.toggle("is-active", tab.dataset.lang === lang);
      });

      try {
        words = await loadWords(lang);
      } catch (error) {
        words = [];
      }

      index = 0;
      readyText = true;
      update();

      if (wasPlaying && words.length) {
        readyText = false;
        index = 1;
        update();
        setPlaying(true);
        scheduleNext();
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        setLanguage(tab.dataset.lang);
      });
    });

    toggle.addEventListener("click", () => {
      if (!words.length) {
        return;
      }

      if (isPlaying()) {
        setPlaying(false);
        return;
      }

      if (readyText) {
        readyText = false;
        index = Math.max(index, 1);
        update();
      }

      setPlaying(true);
      scheduleNext();
    });

    back.addEventListener("click", () => {
      index = Math.max(0, index - 10);
      readyText = index === 0;
      update();
    });

    forward.addEventListener("click", () => {
      index = Math.min(words.length, index + 10);
      readyText = false;
      update();
    });

    reset.addEventListener("click", () => {
      setPlaying(false);
      index = 0;
      readyText = true;
      update();
    });

    speed.addEventListener("input", () => {
      speedValue.textContent = speed.value;

      if (isPlaying()) {
        setPlaying(false);
        setPlaying(true);
        scheduleNext();
      }
    });

    setLanguage(lang);
  }

  readers.forEach(setupReader);
})();
