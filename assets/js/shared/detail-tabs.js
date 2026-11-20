/* Only switches detail sections and animates their underline; no data mutations. */
(() => {
  const nav = document.querySelector('.detail-tabs-nav');
  const container = document.querySelector('.student-detail-panels');
  if (!nav || !container) return;
  const links = [...nav.querySelectorAll('.detail-tabs-link')];
  const panels = [...container.querySelectorAll(':scope > .student-detail-panel')];
  if (!links.length || links.some(link => !panels.some(panel => `#${panel.id}` === link.hash))) return;
  const indicator = document.createElement('span');
  indicator.className = 'detail-tabs-indicator';
  indicator.setAttribute('aria-hidden', 'true');
  nav.append(indicator);
  let selected;
  let hovered;
  let frame;
  const panelForHash = () => {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    return panels.find(panel => panel === target || panel.contains(target)) || panels[0];
  };
  const move = link => {
    if (!link) return;
    const base = nav.getBoundingClientRect();
    const box = link.getBoundingClientRect();
    nav.style.setProperty('--detail-indicator-x', `${box.left - base.left}px`);
    nav.style.setProperty('--detail-indicator-y', `${box.bottom - base.top - 3}px`);
    nav.style.setProperty('--detail-indicator-width', `${box.width}px`);
  };
  const focused = () => links.find(link => link === document.activeElement);
  const restore = () => move(focused() || selected);
  const select = panel => {
    panels.forEach(item => {
      const active = item === panel;
      item.classList.toggle('is-active', active);
      item.hidden = !active;
    });
    links.forEach(link => {
      if (link.hash === `#${panel.id}`) {
        link.setAttribute('aria-current', 'location');
        selected = link;
      } else link.removeAttribute('aria-current');
    });
    move(hovered || selected);
  };
  nav.classList.add('detail-tabs--enhanced');
  container.classList.add('student-detail-panels--enhanced');
  select(panelForHash());
  requestAnimationFrame(() => nav.classList.add('detail-tabs--ready'));
  links.forEach(link => {
    link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      const x = window.scrollX;
      const y = window.scrollY;
      if (location.hash !== link.hash) history.pushState(null, '', link.hash);
      select(panels.find(panel => `#${panel.id}` === link.hash));
      link.focus({ preventScroll: true });
      // Preserve the viewport even when the outgoing section held focus/anchors.
      window.scrollTo({ left: x, top: y, behavior: 'instant' });
    });
    link.addEventListener('pointerenter', () => { hovered = link; move(link); });
    link.addEventListener('pointerdown', () => move(link));
    link.addEventListener('focus', () => move(link));
  });
  nav.addEventListener('pointerleave', () => { hovered = null; restore(); });
  nav.addEventListener('focusout', () => queueMicrotask(() => move(hovered || focused() || selected)));
  const refresh = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => move(hovered || focused() || selected));
  };
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(refresh);
    observer.observe(nav);
    links.forEach(link => observer.observe(link));
  }
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('popstate', () => select(panelForHash()));
  window.addEventListener('hashchange', () => select(panelForHash()));
  document.fonts?.ready.then(refresh);
})();
