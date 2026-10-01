document.addEventListener('DOMContentLoaded', () => {
  const bootScreen = document.getElementById('boot-screen');

  if (bootScreen) {
    const skipButton = bootScreen.querySelector('[data-boot-skip]');
    let hasSeenBoot = false;

    try {
      hasSeenBoot = sessionStorage.getItem('portfolio-hud-booted') === 'true';
      if (!hasSeenBoot) sessionStorage.setItem('portfolio-hud-booted', 'true');
    } catch {
      hasSeenBoot = false;
    }

    const dismissBoot = () => {
      if (bootScreen.classList.contains('is-dismissed')) return;
      bootScreen.classList.add('is-dismissed');
      bootScreen.setAttribute('aria-hidden', 'true');
      window.setTimeout(() => bootScreen.setAttribute('hidden', ''), 260);
    };

    skipButton?.addEventListener('click', dismissBoot);

    if (hasSeenBoot || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      dismissBoot();
    } else {
      window.setTimeout(dismissBoot, 1800);
    }
  }

  const navLinks = Array.from(document.querySelectorAll('nav .nav-link'));
  const sections = navLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        navLinks.forEach(link => {
          const isCurrent = link.getAttribute('href') === `#${entry.target.id}`;
          link.classList.toggle('active', isCurrent);
          if (isCurrent) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-28% 0px -62% 0px', threshold: 0 });

    sections.forEach(section => sectionObserver.observe(section));
  }

  const suitToggle = document.querySelector('[data-suit-toggle]');
  let stealthEnabled = false;

  try {
    stealthEnabled = sessionStorage.getItem('portfolio-hud-suit') === 'stealth';
  } catch {}

  const applySuit = () => {
    document.body.dataset.suit = stealthEnabled ? 'stealth' : 'mark-iii';
    suitToggle?.setAttribute('aria-pressed', String(stealthEnabled));
    suitToggle?.setAttribute('aria-label', stealthEnabled ? 'Switch to Mark III suit theme' : 'Switch to Stealth suit theme');
    const label = suitToggle?.querySelector('[data-suit-label]');
    if (label) label.textContent = stealthEnabled ? 'STEALTH MODE' : 'MARK III MODE';
  };

  applySuit();

  suitToggle?.addEventListener('click', () => {
    stealthEnabled = !stealthEnabled;
    applySuit();
    try {
      sessionStorage.setItem('portfolio-hud-suit', stealthEnabled ? 'stealth' : 'mark-iii');
    } catch {}
  });

  const cursor = document.getElementById('hud-cursor');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (cursor && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    let cursorFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    document.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch') return;
      pointerX = event.clientX;
      pointerY = event.clientY;

      if (!cursorFrame) {
        cursorFrame = window.requestAnimationFrame(() => {
          cursor.style.transform = `translate3d(${pointerX - 16}px, ${pointerY - 16}px, 0)`;
          cursor.classList.add('is-visible');
          cursorFrame = 0;
        });
      }
    }, { passive: true });

    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  }

  let typedSequence = '';
  let suitUpTimer;

  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) {
      typedSequence = '';
      return;
    }

    if (event.target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;

    typedSequence = `${typedSequence}${event.key.toLowerCase()}`.slice(-6);
    if (typedSequence !== 'jarvis') return;

    document.body.classList.remove('suit-up');
    void document.body.offsetWidth;
    document.body.classList.add('suit-up');
    window.clearTimeout(suitUpTimer);
    suitUpTimer = window.setTimeout(() => document.body.classList.remove('suit-up'), 1800);
    typedSequence = '';
  });
});