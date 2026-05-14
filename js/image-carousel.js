(() => {
  // The file server allows image loading, but not cross-origin directory reads.
  const imageFiles = [
    "20220308_111804.jpg",
    "20220308_141915.jpg",
    "20220308_161423.jpg",
    "20220524_190421.jpg",
    "20220525_095208.jpg",
    "20220611_111918.jpg",
    "20220611_112800.jpg",
    "20220611_122342.jpg",
    "20220611_131640.jpg",
    "20220611_132456.jpg",
    "20220817_141215.jpg",
    "20220824_183108.jpg",
    "20220824_183122.jpg",
    "20220824_183141.jpg",
    "20220824_183235.jpg",
    "20220824_183320.jpg",
    "20220828_095929.jpg",
    "20220921_173041.jpg",
    "20220921_173937.jpg",
    "20220927_124751.jpg",
    "20220927_124808.jpg",
    "20220927_131835.jpg",
    "20220927_135528.jpg",
    "20220927_135533.jpg",
    "20221010_102245.jpg",
    "20221104_122433.jpg",
    "20221118_131708.jpg",
    "20221207_115237.jpg",
    "20230227_205007.jpg",
    "20230307_184538.jpg",
    "20230318_135504.jpg",
    "20230919_132156.jpg",
    "20230919_133627.jpg",
    "20230927_121719.jpg",
    "20231016_194751.jpg",
    "20231017_120448.jpg",
    "20231017_120611.jpg",
    "20231128_174050.jpg",
    "20231205_174713.jpg",
    "20240321_183613.jpg",
    "20240424_095241.jpg",
    "20241002_123907.jpg",
    "20241002_134436.jpg",
    "20250604_181422.jpg",
    "20250605_092731.jpg",
    "20250612_132832.jpg",
    "IMG_7677.jpg",
    "IMG_7742.jpg",
  ];

  const carousel = document.querySelector(".image-carousel");
  if (!carousel || !imageFiles.length) return;

  const stage = carousel.querySelector(".image-carousel-stage");
  const status = carousel.querySelector(".image-carousel-status");
  const images = Array.from(carousel.querySelectorAll(".image-carousel-image"));
  const previousButton = carousel.querySelector('[data-carousel-action="previous"]');
  const nextButton = carousel.querySelector('[data-carousel-action="next"]');
  const toggleButton = carousel.querySelector('[data-carousel-action="toggle"]');
  const baseUrl = carousel.dataset.imageBaseUrl || "";
  const intervalMs = 5000;

  let orderedImages = shuffle(imageFiles).map((fileName) => `${baseUrl}${encodeURIComponent(fileName)}`);
  let index = 0;
  let activeImage = 0;
  let timerId = null;
  let isPaused = false;

  function shuffle(items) {
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function preloadImage(src) {
    const image = new Image();
    image.src = src;
  }

  function showImage(nextIndex) {
    if (!orderedImages.length) return;

    index = (nextIndex + orderedImages.length) % orderedImages.length;
    const incoming = images[1 - activeImage];
    const outgoing = images[activeImage];

    incoming.onload = () => {
      incoming.classList.add("is-active");
      outgoing.classList.remove("is-active");
      incoming.alt = "Bilde fra Vestre Aker Frivilligsentral";
      outgoing.alt = "";
      outgoing.setAttribute("aria-hidden", "true");
      incoming.removeAttribute("aria-hidden");
      activeImage = 1 - activeImage;
      status.hidden = true;
      stage.classList.add("has-image");
      preloadImage(orderedImages[(index + 1) % orderedImages.length]);
    };

    incoming.onerror = () => {
      orderedImages = orderedImages.filter((_, imageIndex) => imageIndex !== index);
      if (!orderedImages.length) {
        status.textContent = "Bildene kunne ikke lastes.";
        status.hidden = false;
        stopTimer();
        return;
      }
      showImage(index);
    };

    incoming.src = orderedImages[index];
  }

  function startTimer() {
    stopTimer();
    if (!isPaused && orderedImages.length > 1) {
      timerId = window.setInterval(() => showImage(index + 1), intervalMs);
    }
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function move(direction) {
    showImage(index + direction);
    startTimer();
  }

  previousButton?.addEventListener("click", () => move(-1));
  nextButton?.addEventListener("click", () => move(1));
  toggleButton?.addEventListener("click", () => {
    isPaused = !isPaused;
    toggleButton.textContent = isPaused ? "▶" : "Ⅱ";
    toggleButton.setAttribute("aria-label", isPaused ? "Start karusell" : "Pause karusell");
    if (isPaused) {
      stopTimer();
    } else {
      startTimer();
    }
  });

  showImage(0);
  startTimer();
})();
