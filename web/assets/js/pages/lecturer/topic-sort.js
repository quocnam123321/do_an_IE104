(() => {
  const trigger = document.getElementById('topic-sort-trigger');
  const menu = document.getElementById('topic-sort-options');
  if (!trigger || !menu) return;

  const sortControl = trigger.parentElement;
  const select = sortControl.querySelector('select');
  if (!select?.options.length) return;

  const currentLabel = trigger.querySelector('[data-topic-sort-value]');
  const labelOf = option => option ? globalThis.IE104Language?.optionLabel(option) ?? option.label : '';
  const items = Array.from(select.options, (option, index) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'topic-sort-option';
    item.setAttribute('role', 'menuitemradio');
    item.tabIndex = -1;
    item.textContent = labelOf(option);
    item.addEventListener('click', () => {
      const changed = select.selectedIndex !== index;
      select.selectedIndex = index;
      syncSelection();
      closeMenu(true);
      if (changed) select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    return item;
  });

  function syncSelection() {
    currentLabel.textContent = labelOf(select.selectedOptions[0]);
    items.forEach((item, index) => {
      item.setAttribute('aria-checked', String(index === select.selectedIndex));
    });
  }

  function positionMenu() {
    if (menu.hidden) return;
    const anchor = sortControl.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(menu).marginBlockStart);
    const viewportHeight = document.documentElement.clientHeight;
    const below = viewportHeight - anchor.bottom - gap;
    const above = anchor.top - gap;
    const openAbove = below < menu.scrollHeight + 2 && above > below;
    menu.toggleAttribute('data-above', openAbove);
    menu.style.maxBlockSize = `${Math.max(0, openAbove ? above : below)}px`;
  }

  function openMenu(index = Math.max(0, select.selectedIndex)) {
    syncSelection();
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    positionMenu();
    items[index].focus({ preventScroll: true });
  }

  function closeMenu(restoreFocus = false) {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) trigger.focus({ preventScroll: true });
  }

  trigger.addEventListener('click', () => {
    if (menu.hidden) openMenu();
    else closeMenu(true);
  });

  trigger.addEventListener('keydown', event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    openMenu(event.key === 'ArrowDown' ? 0 : items.length - 1);
  });

  sortControl.addEventListener('keydown', event => {
    if (menu.hidden) return;
    if (event.key === 'Escape' || (event.key === 'Tab' && event.shiftKey)) {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    const index = items.indexOf(event.target);
    if (index === -1) return;
    let nextIndex;
    switch (event.key) {
      case 'ArrowDown': nextIndex = (index + 1) % items.length; break;
      case 'ArrowUp': nextIndex = (index + items.length - 1) % items.length; break;
      case 'Home': nextIndex = 0; break;
      case 'End': nextIndex = items.length - 1; break;
      default: return;
    }
    event.preventDefault();
    items[nextIndex].focus();
  });

  document.addEventListener('pointerdown', event => {
    if (!sortControl.contains(event.target)) closeMenu();
  });
  sortControl.addEventListener('focusout', event => {
    if (event.relatedTarget && !sortControl.contains(event.relatedTarget)) closeMenu();
  });
  window.addEventListener('resize', positionMenu);
  window.addEventListener('scroll', positionMenu, { passive: true });
  select.addEventListener('change', syncSelection);
  select.form?.addEventListener('reset', () => setTimeout(syncSelection, 0));
  window.addEventListener('popstate', syncSelection);
  window.addEventListener('pageshow', syncSelection);

  menu.append(...items);
  syncSelection();
  select.hidden = true;
  for (const label of select.labels) label.hidden = true;
  trigger.hidden = false;
})();
