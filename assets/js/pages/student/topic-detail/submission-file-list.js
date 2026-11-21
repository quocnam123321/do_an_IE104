(() => {
  const ui = globalThis.IE104.ui;
  let nextId = 0;
  let visiblePopup;

  function closeOnScroll(event) {
    if (visiblePopup?.matches(':popover-open') &&
        !(event.target instanceof Node && visiblePopup.contains(event.target))) visiblePopup.hidePopover();
  }
  window.addEventListener('scroll', closeOnScroll, { capture: true, passive: true });
  window.addEventListener('resize', closeOnScroll);

  function position(popup, fileLine, label) {
    const gutter = 12;
    const gap = 6;
    const anchor = label.getBoundingClientRect();
    const { clientWidth, clientHeight } = document.documentElement;
    const below = clientHeight - gutter - anchor.bottom - gap;
    const above = anchor.top - gutter - gap;
    popup.style.removeProperty('--submission-file-popup-height');
    const { width, height } = popup.getBoundingClientRect();
    const opensAbove = below < height && above > below;
    popup.style.setProperty('--submission-file-popup-height', Math.max(opensAbove ? above : below, 0) + 'px');
    const top = opensAbove ? anchor.top - gap - popup.offsetHeight : anchor.bottom + gap;
    const left = Math.min(Math.max(anchor.right - width, fileLine.getBoundingClientRect().left, gutter),
      clientWidth - gutter - width);
    popup.style.top = Math.max(top, gutter) + 'px';
    popup.style.left = left + 'px';
  }

  function fileNames(names) {
    const list = document.createElement('ul');
    list.className = 'submission-file-names';
    for (const name of names) {
      const row = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = name;
      label.title = name;
      row.append(ui.workflowIcon('file'), label);
      list.append(row);
    }
    return list;
  }

  function attach(fileLine, names) {
    if (names.length < 2) return;
    const remainingNames = names.slice(1);
    const popup = document.createElement('div');
    popup.id = 'student-submission-files-' + ++nextId;
    popup.className = 'submission-file-popup';
    popup.setAttribute('popover', 'auto');
    popup.setAttribute('role', 'region');

    const title = document.createElement('p');
    title.id = popup.id + '-heading';
    title.textContent = 'Tệp trong bài nộp';
    popup.setAttribute('aria-labelledby', title.id);
    const list = fileNames(remainingNames);
    list.tabIndex = 0;
    popup.append(title, list);

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'submission-file-toggle';
    trigger.setAttribute('popovertarget', popup.id);
    trigger.setAttribute('aria-controls', popup.id);
    trigger.setAttribute('aria-expanded', 'false');
    const label = document.createElement('span');
    label.className = 'submission-file-toggle__label';
    label.textContent = '+' + remainingNames.length + ' tệp';
    const chevron = document.createElement('span');
    chevron.className = 'submission-file-toggle__chevron';
    chevron.setAttribute('aria-hidden', 'true');
    label.append(chevron);
    trigger.append(label);
    fileLine.append(trigger);
    fileLine.after(popup);

    popup.addEventListener('beforetoggle', event => {
      if (event.newState !== 'closed') return;
      trigger.setAttribute('aria-expanded', 'false');
      if (visiblePopup === popup) visiblePopup = null;
    });
    popup.addEventListener('toggle', () => {
      if (!popup.matches(':popover-open')) return;
      visiblePopup = popup;
      list.scrollTop = 0;
      position(popup, fileLine, label);
      trigger.setAttribute('aria-expanded', 'true');
    });
  }

  ui.submissionFileList = { attach };
})();
