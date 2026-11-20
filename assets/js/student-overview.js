(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (typeof window.IntersectionObserver !== 'function' || reducedMotion.matches) return;

  const sections = document.querySelectorAll('.student-overview-page .fade-in-up');
  if (!sections.length) return;

  const animateCounter = (el) => {
    const target = Number.parseInt(el.textContent, 10);
    if (Number.isNaN(target)) return;
    const duration = 700;
    const start = performance.now();
    el.textContent = '0';
    const step = (timestamp) => {
      if (!el.closest('.is-animated')) {
        el.textContent = target;
        return;
      }
      const progress = Math.min(1, Math.max(0, (timestamp - start) / duration));
      const eased = progress * (2 - progress);
      el.textContent = Math.floor(target * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const revealSection = (section) => {
    section.classList.add('is-visible');
    observer.unobserve(section);
    section.removeEventListener('focusin', revealOnFocus);
  };
  const revealOnFocus = (event) => revealSection(event.currentTarget);

  const observer = new IntersectionObserver((entries) => {
    if (reducedMotion.matches) return;
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      if (!target.classList.contains('is-visible')) {
        revealSection(target);
        target.querySelectorAll('.summary-card__count strong').forEach(animateCounter);
      }
    });
  }, { threshold: 0.1 });

  sections.forEach((section) => {
    if (section.matches(':focus-within')) return;
    observer.observe(section);
    section.addEventListener('focusin', revealOnFocus);
    section.classList.add('is-animated');
  });

  reducedMotion.addEventListener('change', () => {
    observer.disconnect();
    observer.takeRecords();
    sections.forEach((section) => {
      section.classList.remove('is-animated', 'is-visible');
      section.removeEventListener('focusin', revealOnFocus);
    });
  }, { once: true });
})();
