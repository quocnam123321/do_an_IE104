(() => {
  if (typeof HTMLElement.prototype.showPopover !== 'function') return;
  const app = globalThis.IE104 ||= {};

  let placeOpenPopup;
  window.addEventListener('resize', () => placeOpenPopup?.());
  window.addEventListener('scroll', () => placeOpenPopup?.(), true);

  function setupPopup(anchor, trigger, panel, { matchWidth = false, scrollArea = panel, preferAbove = false } = {}) {
    panel.setAttribute('popover', 'auto');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', panel.id);
    const isOpen = () => panel.matches(':popover-open');

    function place() {
      if (!isOpen()) return;
      const edge = 8;
      const gap = 6;
      const viewport = document.documentElement;
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= viewport.clientHeight) {
        panel.hidePopover();
        return;
      }
      if (matchWidth) panel.style.width = `${rect.width}px`;
      const above = rect.top - gap - edge;
      const below = viewport.clientHeight - rect.bottom - gap - edge;
      const naturalHeight = panel.offsetHeight + scrollArea.scrollHeight - scrollArea.clientHeight;
      const flip = preferAbove || (naturalHeight > below && above > below);
      const availableHeight = `${Math.max(0, flip ? above : below)}px`;
      panel.style.maxHeight = `min(${availableHeight}, var(--proposal-popup-max-height, ${availableHeight}))`;
      panel.style.left = `${Math.max(edge, Math.min(rect.left, viewport.clientWidth - edge - panel.offsetWidth))}px`;
      panel.style.top = `${flip ? rect.top - gap - panel.offsetHeight : rect.bottom + gap}px`;
    }

    panel.addEventListener('beforetoggle', event => {
      const opened = event.newState === 'open';
      trigger.setAttribute('aria-expanded', String(opened));
      if (opened) placeOpenPopup = place;
      else if (placeOpenPopup === place) placeOpenPopup = undefined;
    });
    return {
      isOpen,
      place,
      open() {
        panel.showPopover({ source: trigger });
        place();
      },
      close() {
        if (isOpen()) panel.hidePopover();
      },
    };
  }

  const triggers = new Map();
  const selectPickers = new Map();
  const syncSelects = [];
  const chevron = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
  const normalize = text => text.toLocaleLowerCase('vi').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');

  function enhanceSelect(select) {
    if (!select || selectPickers.has(select)) return selectPickers.get(select);
    const label = select.labels[0];
    if (!label) return;
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = `${select.id}-picker`;
    trigger.className = 'proposal-picker-trigger';
    trigger.dataset.proposalSelectTrigger = '';
    trigger.setAttribute('role', 'combobox');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-required', String(select.required));
    const selectedText = document.createElement('span');
    selectedText.id = `${select.id}-picker-value`;
    if (!select.translate) selectedText.translate = false;
    trigger.append(selectedText);
    trigger.insertAdjacentHTML('beforeend', chevron);
    label.id ||= `${select.id}-label`;
    trigger.setAttribute('aria-labelledby', `${label.id} ${selectedText.id}`);
    const description = select.getAttribute('aria-describedby');
    if (description) trigger.setAttribute('aria-describedby', description);

    const panel = document.createElement('div');
    panel.id = `${select.id}-choices`;
    panel.className = 'proposal-picker-popup proposal-select-popup';
    if (!select.translate) panel.translate = false;
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-labelledby', label.id);
    const popup = setupPopup(trigger, trigger, panel, { matchWidth: true });
    select.after(trigger, panel);
    select.hidden = true;
    label.htmlFor = trigger.id;
    triggers.set(select, trigger);

    let choices = [];
    let active = -1;
    let prefix = '';
    let lastKeyTime = 0;

    const labelOf = option => option ? globalThis.IE104Language?.optionLabel(option) ?? option.label : '';

    function sync() {
      const selected = select.selectedOptions[0];
      selectedText.textContent = labelOf(selected);
      trigger.classList.toggle('is-placeholder', !select.value);
      trigger.disabled = select.disabled;
      for (const name of ['aria-invalid', 'aria-describedby']) {
        const value = select.getAttribute(name);
        if (value) trigger.setAttribute(name, value);
        else trigger.removeAttribute(name);
      }
      if (trigger.disabled) popup.close();
    }

    function activate(index) {
      if (!choices[index]) return;
      choices[active]?.classList.remove('is-active');
      active = index;
      const option = choices[active];
      option.classList.add('is-active');
      trigger.setAttribute('aria-activedescendant', option.id);
      const top = option.offsetTop;
      if (top < panel.scrollTop) panel.scrollTop = top;
      else if (top + option.offsetHeight > panel.scrollTop + panel.clientHeight) {
        panel.scrollTop = top + option.offsetHeight - panel.clientHeight;
      }
    }

    function choose(option) {
      popup.close();
      trigger.focus();
      if (option.dataset.value === select.value) return;
      select.value = option.dataset.value;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function open(fromEnd = false) {
      choices = Array.from(select.options).filter(option => !option.disabled && !option.hidden).map((option, index) => {
        const item = document.createElement('div');
        item.id = `${panel.id}-${index}`;
        item.className = 'proposal-select-option';
        item.setAttribute('role', 'option');
        item.setAttribute('aria-selected', String(option.selected));
        item.dataset.value = option.value;
        item.textContent = labelOf(option);
        return item;
      });
      if (!choices.length) return;
      active = -1;
      panel.replaceChildren(...choices);
      popup.open();
      const selectedIndex = choices.findIndex(option => option.dataset.value === select.value);
      activate(selectedIndex >= 0 ? selectedIndex : fromEnd ? choices.length - 1 : 0);
    }

    trigger.addEventListener('click', () => {
      if (popup.isOpen()) popup.close();
      else open();
    });
    trigger.addEventListener('keydown', event => {
      const { key } = event;
      if (key === 'Tab' || key === 'Escape') {
        if (key === 'Escape' && popup.isOpen()) event.preventDefault();
        popup.close();
        return;
      }
      if (key === 'Enter' || key === ' ') {
        if (popup.isOpen() && choices[active]) {
          event.preventDefault();
          choose(choices[active]);
        }
        return;
      }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
        event.preventDefault();
        const alreadyOpen = popup.isOpen();
        if (!alreadyOpen) open(key === 'ArrowUp');
        if (key === 'Home') activate(0);
        if (key === 'End') activate(choices.length - 1);
        if (alreadyOpen && key === 'ArrowDown') activate(Math.min(active + 1, choices.length - 1));
        if (alreadyOpen && key === 'ArrowUp') activate(Math.max(active - 1, 0));
        return;
      }
      if (key.length !== 1 || event.ctrlKey || event.metaKey || event.altKey) return;
      event.preventDefault();
      if (!popup.isOpen()) open();
      const now = Date.now();
      prefix = (now - lastKeyTime < 650 ? prefix : '') + normalize(key);
      lastKeyTime = now;
      const match = choices.findIndex(option => normalize(option.textContent).startsWith(prefix));
      if (match >= 0) activate(match);
    });
    panel.addEventListener('pointermove', event => {
      const index = choices.indexOf(event.target.closest('[role="option"]'));
      if (event.pointerType === 'mouse' && index >= 0) activate(index);
    });
    panel.addEventListener('click', event => {
      const option = event.target.closest('[role="option"]');
      if (option) choose(option);
    });
    panel.addEventListener('beforetoggle', event => {
      if (event.newState !== 'closed') return;
      prefix = '';
      trigger.removeAttribute('aria-activedescendant');
    });
    select.addEventListener('change', sync);
    syncSelects.push(sync);
    const picker = { sync, close: popup.close, trigger };
    selectPickers.set(select, picker);
    sync();
    return picker;
  }

  document.querySelectorAll('select[data-proposal-picker]').forEach(enhanceSelect);
  app.ui ||= {};
  app.ui.proposalPickers = {
    setupPopup,
    enhanceSelect,
    fieldFor: field => triggers.get(field) || field,
    syncSelects: () => syncSelects.forEach(sync => sync()),
  };
})();
