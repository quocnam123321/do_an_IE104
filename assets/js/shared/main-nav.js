(() => {
  const navs = document.querySelectorAll('.main-nav');
  if (!navs.length) return;

  navs.forEach((nav) => {
    const list = nav.querySelector('.main-nav__list');
    if (!list) return;

    let indicator = nav.querySelector('.main-nav__indicator');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'main-nav__indicator';
      indicator.setAttribute('aria-hidden', 'true');
      nav.append(indicator);
    }

    const tabs = Array.from(
      list.querySelectorAll(
        ':scope > .main-nav__item > .main-nav__link, :scope > .main-nav__item > .main-nav__disclosure > .main-nav__label'
      )
    );
    if (!tabs.length) return;

    const currentTab =
      tabs.find((tab) => tab.getAttribute('aria-current') === 'page') ||
      tabs.find((tab) => tab.hasAttribute('aria-current')) ||
      tabs[0];

    const compact = window.matchMedia('(max-width: 67.99rem)');
    let activeTarget = currentTab;
    let pointerTab = null;

    function measureAndSet(target) {
      if (!target || compact.matches) return false;
      const navRect = nav.getBoundingClientRect();
      const tabRect = target.getBoundingClientRect();
      if (navRect.width === 0 || tabRect.width === 0) return false;

      const style = window.getComputedStyle(target);
      const padLeft = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.borderLeftWidth) || 0);
      const padRight = (parseFloat(style.paddingRight) || 0) + (parseFloat(style.borderRightWidth) || 0);

      let x = tabRect.left + padLeft - navRect.left - nav.clientLeft + nav.scrollLeft;
      let width = Math.max(0, tabRect.width - padLeft - padRight);

      const textEl = target.querySelector('.main-nav__text');
      if (textEl) {
        const textRect = textEl.getBoundingClientRect();
        if (textRect.width > 0) {
          x = textRect.left - navRect.left - nav.clientLeft + nav.scrollLeft;
          width = textRect.width;
        }
      } else if (target.matches('.main-nav__label') && document.createRange) {
        const range = document.createRange();
        range.selectNodeContents(target);
        const rangeRect = range.getBoundingClientRect();
        if (rangeRect.width > 0) {
          x = rangeRect.left - navRect.left - nav.clientLeft + nav.scrollLeft;
          width = rangeRect.width;
        }
      }

      nav.style.setProperty('--indicator-x', `${x.toFixed(2)}px`);
      nav.style.setProperty('--indicator-width', `${width.toFixed(2)}px`);
      return true;
    }

    function moveIndicator(target, immediate = false) {
      if (!target) return;
      activeTarget = target;

      if (immediate) {
        nav.classList.remove('main-nav--ready');
        measureAndSet(target);
        requestAnimationFrame(() => {
          nav.classList.add('main-nav--ready');
        });
      } else {
        measureAndSet(target);
      }
    }

    function getFocusedTab() {
      const activeEl = document.activeElement;
      if (!activeEl || !nav.contains(activeEl)) return null;
      const item = activeEl.closest('.main-nav__item');
      if (!item) return null;
      return tabs.find((tab) => tab.closest('.main-nav__item') === item) || null;
    }

    tabs.forEach((tab) => {
      tab.addEventListener('pointerenter', () => {
        pointerTab = tab;
        moveIndicator(tab, false);
      });

      tab.addEventListener('pointerdown', () => {
        moveIndicator(tab, false);
      });

      tab.addEventListener('focus', () => {
        moveIndicator(tab, false);
      });
    });

    nav.addEventListener('focusin', (event) => {
      const item = event.target.closest('.main-nav__item');
      if (!item) return;
      const tab = tabs.find((candidate) => candidate.closest('.main-nav__item') === item);
      if (tab) moveIndicator(tab, false);
    });

    nav.addEventListener('pointerleave', () => {
      pointerTab = null;
      const fallback = getFocusedTab() || currentTab;
      moveIndicator(fallback, false);
    });

    nav.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        if (!pointerTab) {
          const fallback = getFocusedTab() || currentTab;
          moveIndicator(fallback, false);
        }
      });
    });

    // Đặt vị trí ban đầu dưới tab aria-current="page", bật transition ở frame kế tiếp
    nav.classList.add('main-nav--js');
    moveIndicator(currentTab, true);

    compact.addEventListener('change', () => {
      pointerTab = null;
      moveIndicator(getFocusedTab() || currentTab, true);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        moveIndicator(activeTarget || currentTab, true);
      });
    }

    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(() => {
        moveIndicator(activeTarget || currentTab, true);
      });
      observer.observe(nav);
      observer.observe(list);
    } else {
      window.addEventListener('resize', () => {
        moveIndicator(activeTarget || currentTab, true);
      });
    }
  });
})();

