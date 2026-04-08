(() => {
  const headers = document.querySelectorAll('.site-header, .subpage-header');
  if (!headers.length) return;

  headers.forEach((header) => {
    const headerInner = header.querySelector('.header-inner');
    const nav = header.querySelector('.main-nav');
    if (!headerInner || !nav) return;

    if (header.querySelector('.nav-toggle')) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Meny');
    button.innerHTML = '<span class="nav-toggle-lines" aria-hidden="true"></span>';

    button.addEventListener('click', () => {
      const isOpen = header.classList.toggle('nav-open');
      button.setAttribute('aria-expanded', String(isOpen));
    });

    headerInner.appendChild(button);
  });
})();
