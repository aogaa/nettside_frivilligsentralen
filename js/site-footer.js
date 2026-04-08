(() => {
  const existingBand = document.querySelector('.contact-band');
  if (existingBand) {
    return;
  }

  const footer = document.createElement('section');
  footer.className = 'contact-band';
  footer.setAttribute('aria-label', 'Kontaktinformasjon');
  footer.innerHTML = `
    <div class="contact-band-inner section">
      <a class="contact-band-facebook" href="https://www.facebook.com/stiftelsen.vestreakerfrivillighetssentral" target="_blank" rel="noopener noreferrer" aria-label="Folg oss pa Facebook">
        <span class="contact-band-facebook-icon" aria-hidden="true">f</span>
      </a>
      <div class="contact-band-content">
        <h2>Kontakt</h2>
        <p><strong>TELEFON</strong> <span>23 22 05 80</span></p>
        <p><strong>E-POST</strong> <span>post@vestreaker.frivilligsentral.no</span></p>
        <p>Ris Skolevei 14, 0373 Oslo</p>
        <p>Moteplass Vinderen<br>Slemdalsveien 72</p>
      </div>
    </div>
  `;

  document.body.appendChild(footer);
})();
