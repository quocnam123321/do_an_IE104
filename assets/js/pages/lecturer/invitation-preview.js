(() => {
  const params = new URLSearchParams(location.search);
  const host = document.querySelector('[data-supervision-role="teacher"]');
  const app = globalThis.IE104;
  if (!host || !app || params.get('preview') !== 'loi-moi') return;
  const projects = app.data.myTopics.filter(item => item.status === 'dang-thuc-hien').slice(0, 3);
  Object.assign(globalThis.ie104English ??= {}, {
    'Mời giảng viên tham gia đồng hướng dẫn đề tài của nhóm.': 'The group invites you to co-supervise this project.',
    'Đồng ý hướng dẫn đề tài?': 'Accept this supervision invitation?',
    'Từ chối lời mời?': 'Decline this invitation?',
    'Lời nhắn (không bắt buộc)': 'Message (optional)',
    'Đã đồng ý lời mời.': 'Invitation accepted.',
    'Đã từ chối lời mời.': 'Invitation declined.',
    'Đã đồng ý': 'Accepted',
    'Xem chi tiết đề tài': 'View project details'
  });
  globalThis.ie104EnglishPatterns?.push(
    [/^(.*) · Đồng hướng dẫn$/u, (_, code) => `${code} · Co-supervisor`],
    [/^(.*) mời bạn tham gia đồng hướng dẫn đề tài\.$/u, (_, group) => `${group} invites you to co-supervise the project.`]
  );
  const states = new Map();
  const inbox = host.querySelector('[data-supervision-inbox]');
  inbox.hidden = true;
  const panel = document.createElement('div');
  panel.className = 'invitation-preview';
  const heading = document.createElement('h2');
  heading.textContent = 'Lời mời hướng dẫn';
  const list = document.createElement('ul');
  list.className = 'invitation-preview__list';
  const status = document.createElement('p');
  status.className = 'visually-hidden';
  status.setAttribute('role', 'status');
  const dialog = document.createElement('dialog');
  dialog.className = 'invitation-preview__dialog';
  dialog.setAttribute('aria-labelledby', 'invitation-decision-title');
  panel.append(heading, list, status, dialog);
  host.prepend(panel);
  let trigger;
  function node(tag, text, className) {
    const result = document.createElement(tag);
    result.textContent = text;
    if (className) result.className = className;
    return result;
  }
  function button(label, action, variant = '') {
    const result = node('button', label, 'supervision__button' + variant);
    result.type = 'button';
    result.addEventListener('click', action);
    return result;
  }
  function close() { dialog.close(); }
  dialog.addEventListener('close', () => {
    if (trigger?.isConnected) trigger.focus();
    else list.querySelector('a,button')?.focus();
  });
  function decide(project, accepted, event) {
    trigger = event.currentTarget;
    const title = node('h2', accepted ? 'Đồng ý hướng dẫn đề tài?' : 'Từ chối lời mời?');
    title.id = 'invitation-decision-title';
    const top = node('header', '', 'invitation-preview__dialog-heading');
    const dismiss = button('Đóng', close);
    dismiss.setAttribute('aria-label', 'Đóng hộp thoại');
    top.append(title, dismiss);
    const content = node('div', '', 'invitation-preview__dialog-body');
    content.append(node('strong', project.title), node('p', `${project.groupName} mời bạn tham gia đồng hướng dẫn đề tài.`));
    const label = node('label', 'Lời nhắn (không bắt buộc)');
    label.htmlFor = 'invitation-decision-message';
    const message = document.createElement('textarea');
    message.id = label.htmlFor;
    message.rows = 3; message.maxLength = 2000;
    message.className = 'supervision__control';
    content.append(label, message);
    const footer = node('footer', '', 'supervision__actions');
    footer.append(button('Hủy', close), button(accepted ? 'Đồng ý hướng dẫn' : 'Từ chối lời mời', () => {
      states.set(project.id, accepted ? 'accepted' : 'rejected');
      dialog.close();
      render();
      status.textContent = accepted ? 'Đã đồng ý lời mời.' : 'Đã từ chối lời mời.';
    }, accepted ? ' supervision__button--primary' : ' supervision__button--danger'));
    dialog.replaceChildren(top, content, footer);
    dialog.showModal();
  }
  function render() {
    list.replaceChildren(...projects.filter(project => !states.has(project.id)).map((project, index) => {
      const item = node('li', '', 'invitation-preview__card');
      const content = node('div', '', 'invitation-preview__content');
      content.append(node('h3', `${project.displayId} - ${project.title}`),
        node('p', 'Mời giảng viên tham gia đồng hướng dẫn đề tài của nhóm.', 'supervision__hint'));
      const time = node('time', `24/11/2026 · ${String(9 + index).padStart(2, '0')}:00`, 'supervision__hint');
      time.dateTime = `2026-11-24T${String(9 + index).padStart(2, '0')}:00:00+07:00`;
      content.append(time);
      const actions = node('div', '', 'invitation-preview__actions');
      const state = states.get(project.id);
      const detail = node('a', 'Xem chi tiết đề tài', 'supervision__button');
      detail.href = `chi-tiet-de-tai-dang-huong-dan-giang-vien.html?project=${encodeURIComponent(project.id)}#tong-quan`;
      detail.target = '_blank'; detail.rel = 'noopener';
      detail.setAttribute('aria-label', `Xem chi tiết đề tài ${project.title} (mở thẻ mới)`);
      actions.append(detail);
      if (!state) {
        const decisions = node('div', '', 'supervision__actions');
        decisions.append(button('Từ chối', event => decide(project, false, event), ' supervision__button--danger'),
          button('Đồng ý hướng dẫn', event => decide(project, true, event), ' supervision__button--primary'));
        actions.append(decisions);
      }
      item.append(content, actions);
      return item;
    }));
    if (!list.children.length) list.append(node('li', 'Không có lời mời hướng dẫn đang chờ.', 'supervision__hint'));
  }
  render();
})();
