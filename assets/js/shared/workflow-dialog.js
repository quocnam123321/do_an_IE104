(() => {
  const app = globalThis.IE104;
  if (!app) return;
  app.ui ||= {};
  function progressTime(value) {
    const date = new Date(value);
    let updatedAt = 'Chưa có thông tin';
    if (Number.isFinite(date.getTime())) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        hourCycle: 'h23', timeZone: 'Asia/Ho_Chi_Minh',
      }).formatToParts(date).map(part => [part.type, part.value]));
      updatedAt = `${parts.day}/${parts.month}/${parts.year} - ${parts.hour}:${parts.minute}`;
    }
    return updatedAt;
  }
  function progressHistorySection({ entries, taskId }) {
    const updates = entries.filter(entry => entry.taskId === taskId)
      .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));
    const section = document.createElement('section'); section.className = 'workflow-history';
    const heading = document.createElement('h3'); heading.id = 'workflow-history-title';
    heading.textContent = `Lịch sử cập nhật (${updates.length})`; section.setAttribute('aria-labelledby', heading.id); section.append(heading);
    if (!updates.length) {
      const empty = document.createElement('p'); empty.textContent = 'Chưa có cập nhật tiến độ.'; section.append(empty); return section;
    }
    const list = document.createElement('ol'); list.className = 'workflow-history__list';
    updates.forEach(entry => {
      const item = document.createElement('li'); const details = document.createElement('details');
      const summary = document.createElement('summary'); const row = document.createElement('span'); row.className = 'workflow-history__summary';
      const author = document.createElement('strong'); author.className = 'workflow-history__author';
      author.textContent = [entry.actorName, entry.actorCode].filter(Boolean).join(' - ') || 'Chưa có thông tin người cập nhật';
      const time = document.createElement('time'); time.dateTime = entry.createdAt; time.textContent = progressTime(entry.createdAt);
      const percent = document.createElement('span'); percent.className = 'workflow-history__percent';
      percent.textContent = Number.isFinite(entry.percent) ? `${entry.percent}%` : 'Chưa có %';
      row.append(author, time, percent); summary.append(row);
      const content = document.createElement('p'); content.className = 'workflow-history__content';
      content.textContent = entry.content || 'Không có nội dung báo cáo.';
      details.append(summary, content); item.append(details); list.append(item);
    });
    section.append(list); return section;
  }
  app.ui.workflowIcon = kind => {
    const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg');
    for (const [key,value] of Object.entries({ viewBox:'0 0 24 24', width:'20', height:'20', fill:'none', stroke:'currentColor', 'stroke-width':'1.7', 'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true', class:'workflow-state-icon' })) svg.setAttribute(key,value);
    if (kind === 'calendar' || kind === 'file') { const path=document.createElementNS(ns,'path'); path.setAttribute('d',kind==='calendar'?'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z':'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h6'); svg.append(path); return svg; }
    const circle = document.createElementNS(ns,'circle'); circle.setAttribute('cx','12'); circle.setAttribute('cy','12'); circle.setAttribute('r','9'); svg.append(circle);
    if (kind !== 'pending') { const path = document.createElementNS(ns,'path'); path.setAttribute('d',kind === 'done' ? 'm8 12 3 3 5-6' : 'M12 7v5l3 2'); svg.append(path); }
    return svg;
  };
  app.ui.workflowDetails = ({ title, fields, actionText, action, disabled = false, returnTo, extraActions = [], progressHistory = null }) => {
    const dialog = document.createElement('dialog'); dialog.className = 'workflow-dialog';
    const heading = document.createElement('h2'); heading.id = 'workflow-dialog-title'; heading.textContent = title; dialog.setAttribute('aria-labelledby', heading.id);
    const header = document.createElement('header');
    const close = document.createElement('button'); close.type = 'button'; close.className = 'workflow-dialog__close'; close.textContent = '×'; close.setAttribute('aria-label', 'Đóng hộp thoại'); close.addEventListener('click', () => dialog.close()); header.append(heading, close);
    const body = document.createElement('div'); body.className = 'workflow-dialog__body';
    fields.forEach(([label, value, multiline]) => {
      const row = document.createElement('div'); const text = document.createElement('label'); const input = document.createElement(multiline ? 'textarea' : 'input');
      input.id = `workflow-field-${body.childElementCount}`; input.readOnly = true; input.value = value ?? 'Chưa có thông tin'; if (multiline) input.rows = 4;
      text.textContent = label; text.htmlFor = input.id; row.append(text, input); body.append(row);
    });
    if (progressHistory) body.append(progressHistorySection(progressHistory));
    const footer = document.createElement('footer'); const cancel = document.createElement('button'); cancel.type = 'button'; cancel.textContent = 'Đóng'; cancel.addEventListener('click', () => dialog.close()); footer.append(cancel);
    extraActions.forEach(item => { const next = document.createElement('button'); next.type = 'button'; next.textContent = item.text; next.disabled = Boolean(item.disabled); next.addEventListener('click', () => { dialog.close(); item.action(); }); footer.append(next); });
    if (action) { const next = document.createElement('button'); next.type = 'button'; next.className = 'workflow-dialog__primary'; next.textContent = actionText; next.disabled = disabled; next.dataset.workflowAction = ''; next.addEventListener('click', () => { dialog.close(); action(); }); footer.append(next); }
    dialog.append(header, body, footer); document.body.append(dialog); dialog.addEventListener('close', () => { dialog.remove(); if (!document.querySelector('dialog[open]')) returnTo?.()?.focus({ preventScroll: true }); }, { once: true }); dialog.showModal(); return dialog;
  };
})();
