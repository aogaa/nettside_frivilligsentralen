(function () {
  const readers = document.querySelectorAll(".speed-reader");

  if (!readers.length) {
    return;
  }

  const articlePaths = {
    no: "beredskap-bygges-for-krisen.html",
    en: "preparedness-is-built-before-the-crisis.html",
  };

  const labels = {
    no: {
      start: "▷ Start",
      pause: "⏸ Pause",
      ready: "Trykk start",
      loading: "Laster tekst",
      empty: "Ingen tekst funnet",
      unit: "ord",
    },
    en: {
      start: "▷ Start",
      pause: "⏸ Pause",
      ready: "Press start",
      loading: "Loading text",
      empty: "No text found",
      unit: "words",
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

    const path = articlePaths[lang];
    const response = await fetch(path);
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const words = normalizeWords(extractArticleText(doc));
    textCache[lang] = words;

    return words;
  }

  function sentencePause(word) {
    return /[.!?]"?$/.test(word) ? 1.7 : 1;
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

    let lang = reader.dataset.currentLang || "no";
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

      if (!playing && timer) {
        clearTimeout(timer);
        timer = null;
      }

      toggle.textContent = playing ? activeLabels().pause : activeLabels().start;
    }

    function update() {
      const copy = activeLabels();
      const total = words.length;
      const shownIndex = total ? Math.min(index, total) : 0;

      count.textContent = `${shownIndex} / ${total} ${copy.unit}`;
      word.textContent = readyText && total ? copy.ready : total ? words[Math.max(0, Math.min(index - 1, total - 1))] : copy.empty;
      progress.style.width = total ? `${(shownIndex / total) * 100}%` : "0";
      speedValue.textContent = speed.value;
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

    setLanguage(lang).then(() => {
      readyText = true;
      update();
    });
  }

  readers.forEach(setupReader);
})();
