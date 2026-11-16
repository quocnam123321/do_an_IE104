(() => {
  const app = globalThis.IE104;
  const service = app?.services?.teaching;
  if (!service) return;
  const el = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  const button = (text, action, disabled = false) => {
    const node = el('button', text, 'topic-dialog__btn topic-dialog__btn--secondary');
    node.type = 'button';
    node.disabled = disabled;
    node.addEventListener('click', action);
    return node;
  };
  const date = value => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(value));
  const region = (sectionId, anchorId) => {
    const section = document.getElementById(sectionId);
    const node = el('div');
    node.id = anchorId;
    section.replaceChildren(node);
    return node;
  };
  const notice = el('p', '', 'teaching-notice');
  notice.setAttribute('role', 'status');
  notice.tabIndex = -1;
  const header = document.querySelector('.page-header');
  const label = el('label', 'Đề tài / Nhóm thực hiện', 'teaching-project-label');
  const select = el('select');
  select.id = 'teaching-project';
  label.htmlFor = select.id;
  const projects = service.listProjects();
  projects.forEach(project => select.add(new Option(project.label, project.id)));
  let projectId = new URLSearchParams(location.search).get('project') || 'GV-DT001-N01';
  select.value = projectId;
  header.append(label, select, notice);
  const subscribers = [];
  let state = null;
  let saving = false;
  const overviewTemplate = document.getElementById('tong-quan').cloneNode(true);
  const overview = region('overview-section', 'tong-quan');
  function overviewView(current) {
    if (current.projectId === 'GV-DT001-N01') {
      overview.replaceChildren(...[...overviewTemplate.childNodes].map(node => node.cloneNode(true)));
      return;
    }
    const card = el('section', '', 'teaching-card');
    card.append(el('h2', current.project.title));
    const dl = el('dl', '', 'teaching-metadata');
    const fields = [['Mã đề tài', current.project.topicId || current.project.id], ['Nhóm thực hiện', current.project.groupName], ['Trạng thái', current.project.statusLabel || 'Đang thực hiện'], ['Học kỳ', current.project.semester], ['Năm học', current.project.academicYear]];
    fields.forEach(([name, value]) => { const row = el('div'); row.append(el('dt', name), el('dd', value)); dl.append(row); });
    card.append(dl, el('h3', 'Nhóm thực hiện'));
    current.team.members.forEach(member => card.append(el('p', `${member.name} - ${member.code}${member.role === 'nhom-truong' ? ' - Nhóm trưởng' : ''}`)));
    const lecturers = current.team.supervisorIds.map(id => app.data.projectLecturers.find(item => item.id === id)?.name || id);
    card.append(el('h3', 'Giảng viên hướng dẫn'), el('p', lecturers.join(' - ')));
    overview.replaceChildren(card);
  }
  function notify(message, failure = false) {
    notice.textContent = message;
    notice.dataset.error = String(failure);
  }
  function refresh() {
    try {
      state = service.getState(projectId);
      document.querySelector('.page-header__topic-name').textContent = state.project.title;
      overviewView(state);
      subscribers.forEach(render => render(state));
      notify(state.warning || (app.ui.lecturerWorkspace.dirty ? 'Đánh giá đang có thay đổi chưa lưu. Dữ liệu mới ở tab khác sẽ không ghi đè phần đang nhập.' : 'Dữ liệu mẫu. Thay đổi được lưu trên trình duyệt này.'));
      select.value = projectId;
      document.body.dataset.projectId = projectId;
    } catch (failure) {
      state = null;
      overview.replaceChildren(el('p', failure.message, 'teaching-notice'));
      subscribers.forEach(render => render(null));
      notify(failure.message, true);
    }
  }
  function commit(snapshot, operation, dialog, message) {
    if (saving) return;
    try {
      if (!state || snapshot.projectId !== projectId) throw new Error('Đề tài đã thay đổi. Hãy mở lại hộp thoại.');
      saving = true;
      operation(snapshot);
      dialog?.close();
      refresh();
      notify(message || 'Đã lưu thay đổi trên trình duyệt này.');
      if (dialog) requestAnimationFrame(() => notice.focus({ preventScroll: true }));
    } catch (failure) {
      const error = dialog?.querySelector('[data-teaching-error]');
      if (error) { error.textContent = failure.message; error.focus(); }
      else notify(failure.message, true);
    } finally { saving = false; }
  }
  function modal(title, submitText, build, submit) {
    if (!state || document.querySelector('.teaching-dialog[open]')) return;
    const snapshot = { projectId, revision: state.revision, progressRevision: state.progress?.revision };
    const dialog = el('dialog', '', 'topic-dialog teaching-dialog');
    const heading = el('h2', title);
    heading.id = 'teaching-dialog-title';
    dialog.setAttribute('aria-labelledby', heading.id);
    const form = el('form', '', 'topic-dialog__form');
    const error = el('p', '', 'teaching-error');
    error.dataset.teachingError = '';
    error.setAttribute('role', 'alert');
    error.tabIndex = -1;
    const body = el('div', '', 'teaching-fields');
    build(body, state);
    const actions = el('div', '', 'topic-dialog__actions');
    const save = el('button', submitText, 'topic-dialog__btn topic-dialog__btn--primary');
    save.type = 'submit';
    actions.append(button('Hủy', () => dialog.close()), save);
    form.append(error, body, actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      commit(snapshot, captured => submit(new FormData(form), captured), dialog);
    });
    dialog.append(heading, form);
    document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove(), { once: true });
    dialog.addEventListener('keydown', event => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled)')].filter(node => node.getClientRects().length);
      const target = event.shiftKey && document.activeElement === controls[0] ? controls.at(-1) : !event.shiftKey && document.activeElement === controls.at(-1) ? controls[0] : null;
      if (target) { event.preventDefault(); target.focus(); }
    });
    dialog.showModal();
    return dialog;
  }
  function field(parent, name, text, type = 'text', value = '', options = {}) {
    const label = el('label', text);
    const input = el(type === 'textarea' ? 'textarea' : type === 'select' ? 'select' : 'input');
    if (input.tagName === 'INPUT') input.type = type;
    input.name = name;
    input.id = `teaching-${name}`;
    label.htmlFor = input.id;
    input.value = value;
    Object.assign(input, options);
    parent.append(label, input);
    return input;
  }
  select.addEventListener('change', () => {
    if (document.querySelector('.teaching-dialog[open]')) return;
    if (app.ui.lecturerWorkspace.dirty && !window.confirm('Bỏ thay đổi đánh giá chưa lưu để đổi đề tài?')) { select.value = projectId; return; }
    app.ui.lecturerWorkspace.dirty = false;
    projectId = select.value;
    const url = new URL(location.href);
    url.searchParams.set('project', projectId);
    history.replaceState(history.state, '', url);
    refresh();
  });
  app.ui ||= {};
  app.ui.lecturerWorkspace = { el, button, field, date, region, modal, commit, notify, refresh, service, get state() { return state; }, subscribe(render) { subscribers.push(render); if (state) render(state); }, dirty: false };
  window.addEventListener('storage', event => { if ([app.storage.teachingKey, app.storage.progressKey, app.storage.teamKey, null].includes(event.key)) refresh(); });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('beforeunload', event => { if (app.ui.lecturerWorkspace.dirty) { event.preventDefault(); event.returnValue = ''; } });
  refresh();
})();
