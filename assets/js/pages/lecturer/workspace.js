(() => {
  const app = globalThis.IE104;
  const service = app?.services?.teaching;
  const topics = app?.services?.lecturerTopics;
  if (!service || (window.UITLecturerCatalog && !new URLSearchParams(location.search).has('project'))) return;
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
  const date = value => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit', hourCycle:'h23', timeZone:'Asia/Ho_Chi_Minh' }).formatToParts(new Date(value)).map(part => [part.type,part.value]));
    return `${parts.day}/${parts.month}/${parts.year} - ${parts.hour}:${parts.minute}`;
  };
  const region = (sectionId, anchorId) => {
    const section = document.getElementById(sectionId);
    const node = el('div');
    node.id = anchorId;
    node.tabIndex = -1;
    section.replaceChildren(node);
    return node;
  };
  const notice = el('p', '', 'teaching-notice');
  notice.setAttribute('role', 'status');
  notice.tabIndex = -1;
  const header = document.querySelector('.page-header');
  const projectId = new URLSearchParams(location.search).get('project') || app.data.lecturerRealDefaultProjectId || 'GV-DT001-N01';
  header.append(notice);
  const subscribers = [];
  let state = null;
  let saving = false;
  const overviewTemplate = document.getElementById('tong-quan').cloneNode(true);
  const overview = region('overview-section', 'tong-quan');
  const { renderList, renderLecturerSupervisors, renderSupervisedSummary } = app.shared.topicOverview;
  const overviewDate = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh',
  });

  function overviewView(state) {
    app.shared.renderLecturerOverview(overview, state, overviewTemplate);
  }
  function notify(message, failure = false) {
    notice.textContent = message;
    notice.dataset.error = String(failure);
  }
  function refresh() {
    try {
      state = topics ? topics.workspaceState(projectId) : service.getState(projectId);
      if (topics?.projectIdentity) state.project = topics.projectIdentity(state.project);
      document.querySelector('.page-header__topic-name').textContent = state.project.title;
      overviewView(state);
      subscribers.forEach(render => render(state));
      notify(state.warning || (app.ui.lecturerWorkspace.dirty ? 'Đánh giá đang có thay đổi chưa lưu. Dữ liệu mới ở tab khác sẽ không ghi đè phần đang nhập.' : ''));
      document.body.dataset.projectId = projectId;
      const back = document.querySelector('.back-navigation .back-link');
      if (back && topics) back.href = topics.returnUrl('supervised', new URLSearchParams(location.search).get('return'), location.href);
    } catch (failure) {
      state = null;
      document.querySelector('.page-header__topic-name').textContent = 'Không thể mở đề tài';
      delete document.body.dataset.projectId;
      overview.replaceChildren(el('p', failure.message, 'teaching-notice'));
      subscribers.forEach(render => render(null));
      notify(failure.message, true);
    }
  }
  async function commit(snapshot, operation, dialog, message) {
    if (saving) return;
    try {
      if (!state || snapshot.projectId !== projectId) throw new Error('Đề tài đã thay đổi. Hãy mở lại hộp thoại.');
      if (state.readOnly) throw new Error('Đề tài này chưa có dữ liệu xử lý. Hiện chỉ được xem thông tin trong danh mục.');
      saving = true;
      await operation(snapshot);
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
  function modal(title, submitText, build, submit, message, {
    showCancel = true, className, closeIcon, beforeSubmit, submitVariant = 'primary', descriptionId, submitDisabled = false,
  } = {}) {
    if (!state || document.querySelector('.teaching-dialog[open]')) return;
    const snapshot = { projectId, revision: state.revision, progressRevision: state.progress?.revision };
    const dialog = el('dialog', '', 'topic-dialog teaching-dialog workflow-dialog');
    if (className) dialog.classList.add(className);
    const heading = el('h2', title);
    heading.id = 'teaching-dialog-title';
    dialog.setAttribute('aria-labelledby', heading.id);
    if (descriptionId) dialog.setAttribute('aria-describedby', descriptionId);
    const form = el('form', '', 'topic-dialog__form');
    const error = el('p', '', 'teaching-error');
    error.dataset.teachingError = '';
    error.setAttribute('role', 'alert');
    error.tabIndex = -1;
    const body = el('div', '', 'teaching-fields');
    build(body, state);
    const actions = el('div', '', 'topic-dialog__actions');
    const save = el('button', submitText, `topic-dialog__btn topic-dialog__btn--${submitVariant}`);
    save.type = 'submit';
    save.disabled = submitDisabled;
    if (showCancel) actions.append(button('Hủy', () => dialog.close()));
    actions.append(save);
    form.append(error, body, actions);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (save.disabled) return;
      if (beforeSubmit?.({ form, submitButton: save, heading }) === false) return;
      commit(snapshot, captured => submit(new FormData(form), captured), dialog, message);
    });
    const dialogHeader = el('header');
    const dialogClose = button('×', () => dialog.close());
    if (closeIcon) {
      dialogClose.className = 'topic-dialog__close';
      dialogClose.replaceChildren(closeIcon);
    } else {
      dialogClose.classList.add('workflow-dialog__close');
    }
    dialogClose.setAttribute('aria-label', 'Đóng hộp thoại');
    if (submitVariant === 'danger') dialogClose.autofocus = true;
    dialogHeader.append(heading, dialogClose);
    dialog.append(dialogHeader, form);
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
  app.ui ||= {};
  app.ui.lecturerWorkspace = { el, button, field, date, region, modal, commit, notify, refresh, service, get state() { return state; }, subscribe(render) { subscribers.push(render); if (state) render(state); }, dirty: false };
  window.addEventListener('storage', event => { if ([app.storage.teachingKey, app.storage.progressKey, app.storage.teamKey, app.storage.proposalKey, app.storage.registrationKey, null].includes(event.key)) refresh(); });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('beforeunload', event => { if (app.ui.lecturerWorkspace.dirty) { event.preventDefault(); event.returnValue = ''; } });
  document.addEventListener('DOMContentLoaded', () => globalThis.IE104.services.invitationIdentity?.ready.then(refresh));
  refresh();
})();
