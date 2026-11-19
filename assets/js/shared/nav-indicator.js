/* Progressive enhancement: links and details remain native HTML controls. */
(() => {
  document.querySelectorAll('[data-nav-indicator]').forEach((nav) => {
    const indicator = nav.querySelector(':scope > .main-nav__indicator');
    const tabs = [...nav.querySelectorAll('.main-nav__list > .main-nav__item > .main-nav__link, .main-nav__list > .main-nav__item > details > .main-nav__label')];
    if (!indicator || !tabs.length || nav.dataset.indicatorInitialized) return;

    const menu = nav.closest('.site-navigation');
    const compact = window.matchMedia('(max-width: 67.99rem)');
    let hovered = null;
    let layoutFrame = 0;

    const tabFor = (element) => tabs.find((tab) =>
      tab === element || tab.contains(element) ||
      (tab.matches('summary') && tab.parentElement.contains(element))
    );
    const focused = () => tabFor(document.activeElement);
    const current = () => tabFor(nav.querySelector('[aria-current="page"]'));

    const moveTo = (tab) => {
      if (compact.matches || !tab) {
        nav.classList.remove('main-nav--indicator-visible');
        return;
      }
      const navRect = nav.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      if (!navRect.width || !tabRect.width) {
        nav.classList.remove('main-nav--indicator-visible');
        return;
      }
      const style = getComputedStyle(tab);
      const leftInset = parseFloat(style.paddingLeft) + parseFloat(style.borderLeftWidth);
      const rightInset = parseFloat(style.paddingRight) + parseFloat(style.borderRightWidth);
      const text = tab.querySelector('.main-nav__text');
      const textRect = text?.getBoundingClientRect();
      // Span excludes padding and the dropdown arrow; fallback subtracts tab insets.
      const x = (textRect ? textRect.left : tabRect.left + leftInset) - navRect.left - nav.clientLeft + nav.scrollLeft;
      const width = textRect ? textRect.width : tabRect.width - leftInset - rightInset;
      nav.style.setProperty('--indicator-x', `${x}px`);
      nav.style.setProperty('--indicator-width', `${Math.max(0, width)}px`);
      nav.classList.add('main-nav--indicator-visible');
    };

    const restore = () => moveTo(focused() || current());
    const refresh = () => {
      cancelAnimationFrame(layoutFrame);
      layoutFrame = requestAnimationFrame(() => moveTo(hovered || focused() || current()));
    };

    tabs.forEach((tab) => {
      tab.addEventListener('pointerenter', () => { hovered = tab; moveTo(tab); });
      tab.addEventListener('pointerdown', () => moveTo(tab));
    });
    nav.addEventListener('pointerleave', () => { hovered = null; restore(); });
    nav.addEventListener('focusin', () => moveTo(focused() || current()));
    nav.addEventListener('focusout', () => {
      queueMicrotask(() => moveTo(focused() || hovered || current()));
    });

    const setLayout = () => {
      hovered = null;
      if (menu) {
        // A focused desktop item remains reachable when resizing into the menu.
        menu.open = !compact.matches || nav.contains(document.activeElement);
      }
      refresh();
    };
    compact.addEventListener('change', setLayout);
    window.addEventListener('resize', refresh, { passive: true });
    nav.addEventListener('scroll', refresh, { passive: true });
    menu?.addEventListener('toggle', refresh);

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(refresh);
      observer.observe(nav);
      tabs.forEach((tab) => observer.observe(tab.querySelector('.main-nav__text') || tab));
    }
    const mutations = new MutationObserver(refresh);
    mutations.observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'], childList: true, characterData: true });
    document.fonts?.ready.then(refresh);
    document.fonts?.addEventListener('loadingdone', refresh);

    if (menu) menu.open = !compact.matches;
    moveTo(current());
    nav.dataset.indicatorInitialized = 'true';
    nav.classList.add('main-nav--enhanced');
    // Commit the initial geometry without a transition, then enable motion.
    indicator.getBoundingClientRect();
    requestAnimationFrame(() => nav.classList.add('main-nav--indicator-ready'));
  });
})();
