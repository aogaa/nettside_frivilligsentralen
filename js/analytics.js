(() => {
  const measurementId = 'G-0JSYB8Y5PF';
  const trackedHosts = ['frivilligsentralen.org', 'www.frivilligsentralen.org'];
  const CONSENT_KEY = 'cookieConsent';

  function loadAnalytics() {
    if (!trackedHosts.includes(window.location.hostname)) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() {
      window.dataLayer.push(arguments);
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    window.gtag('js', new Date());
    window.gtag('config', measurementId);
  }

  function hideBanner(banner) {
    banner.style.transform = 'translateY(110%)';
    setTimeout(() => banner.remove(), 400);
  }

  function showConsentBanner() {
    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Informasjonskapsler');
    banner.innerHTML = `
      <p class="cookie-banner__text">
        Vi bruker informasjonskapsler (cookies) for å analysere trafikk og forbedre nettsiden.
        Les mer i vår <a href="om-oss.html#personvern">personvernerklæring</a>.
      </p>
      <div class="cookie-banner__actions">
        <button class="cookie-banner__btn cookie-banner__btn--accept">Godta</button>
        <button class="cookie-banner__btn cookie-banner__btn--decline">Kun nødvendige</button>
      </div>
    `;

    document.body.appendChild(banner);
    requestAnimationFrame(() => {
      banner.style.transform = 'translateY(0)';
    });

    banner.querySelector('.cookie-banner__btn--accept').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'accepted');
      hideBanner(banner);
      loadAnalytics();
    });

    banner.querySelector('.cookie-banner__btn--decline').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'declined');
      hideBanner(banner);
    });
  }

  const consent = localStorage.getItem(CONSENT_KEY);
  if (consent === 'accepted') {
    loadAnalytics();
  } else if (!consent) {
    document.addEventListener('DOMContentLoaded', showConsentBanner);
  }
})();
