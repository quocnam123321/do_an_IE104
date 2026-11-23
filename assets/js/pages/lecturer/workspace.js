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
  function overviewView(current) {
    const project = current.project;
    const sample = app.data.studentProjectOverviews?.[current.projectId];
    const originalSample = current.projectId === 'GV-DT001-N01';
    overview.replaceChildren(...overviewTemplate.cloneNode(true).children);
    const main = overview.querySelector('.topic-overview-layout__main');
    const aside = overview.querySelector('.topic-overview-layout__aside');
    overview.querySelector('.topic-summary h2').textContent = project.title;
    const badge = overview.querySelector('.topic-summary__status');
    badge.replaceChildren(el('span', 'Trạng thái đề tài: ', 'visually-hidden'), project.statusLabel || 'Chưa có thông tin');
    badge.dataset.status = project.status;
    const semester = project.semester === 'he' ? 'hè' : project.semester;
    const period = [semester && 'Học kỳ ' + semester, project.academicYear].filter(Boolean).join(' · ');
    const fields = [project.displayId || project.topicId || project.id, project.typeLabel, window.UITLecturerCatalog.subjectLabel(project, true), period];
    overview.querySelectorAll('.topic-summary dd').forEach((node, index) => {
      node.textContent = fields[index] || 'Chưa có thông tin';
    });

    const cover = overview.querySelector('.topic-summary__image');
    if (!originalSample) {
      const image = el('img', null, 'gv-default-image');
      image.src = '../../assets/images/uit-logo.png';
      image.alt = '';
      cover.replaceChildren(image);
      cover.setAttribute('aria-label', 'Ảnh UIT mặc định');
      const content = { ...sample, ...project };
      main.querySelector('.topic-description p').textContent = content.description || 'Chưa có thông tin';
      for (const key of ['objectives', 'outcomes', 'requirements']) {
        const section = main.querySelector('.topic-' + key);
        const value = content[key];
        const items = (Array.isArray(value) ? value : String(value || '').split(/\r?\n/)).map(item => item.trim()).filter(Boolean);
        section.hidden = key === 'requirements' && !items.length;
        section.querySelector('ul').replaceChildren(...(items.length ? items : ['Chưa có thông tin']).map(item => el('li', item)));
      }
      const milestones = sample?.milestones || [
        project.outline?.startDate || project.startsAt,
        project.outline?.progressReportDate || project.progressReportDate,
        project.outline?.finalReportDate || project.finalReportDate,
      ];
      aside.querySelectorAll('.topic-milestones dd').forEach((node, index) => {
        const value = milestones[index];
        node.textContent = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value.split('-').reverse().join('/') : value || 'Chưa có thông tin';
      });
    }

    aside.querySelector('.topic-team__group-name').textContent = project.groupName || 'Chưa đặt tên nhóm';
    const members = aside.querySelector('.topic-team__members');
    const memberTemplate = members.firstElementChild;
    members.replaceChildren(...current.team.members.map(member => {
      const row = memberTemplate.cloneNode(true);
      const avatar = row.querySelector('.team-member__avatar');
      avatar.textContent = member.name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('');
      avatar.setAttribute('aria-label', member.name);
      row.querySelector('.team-member__name').textContent = member.name;
      row.querySelector('.team-member__id').textContent = member.code;
      row.querySelector('.team-member__role').textContent = member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên';
      return row;
    }));
    if (!members.children.length) members.append(el('li', 'Chưa có thông tin thành viên nhóm.'));

    if (project.outline && app.shared?.proposalOutline) {
      const section = el('section', null, 'topic-overview-card');
      app.shared.proposalOutline.render(section, project);
      main.append(section);
    }
    for (const [title, value] of [
      ['Phương pháp và phạm vi thực hiện', project.methodAndScope],
      ['Kế hoạch thực hiện và phân công', project.plan],
    ]) {
      if (!value?.trim()) continue;
      const section = el('section', null, 'topic-overview-card');
      section.setAttribute('data-project-method-plan', '');
      section.append(el('h2', title), el('p', value, 'project-method-plan-text'));
      main.append(section);
    }
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
  function modal(title, submitText, build, submit, message) {
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
      commit(snapshot, captured => submit(new FormData(form), captured), dialog, message);
    });
    dialog.classList.add('workflow-dialog');
    const dialogHeader = el('header');
    const dialogClose = button('×', () => dialog.close()); dialogClose.classList.add('workflow-dialog__close'); dialogClose.setAttribute('aria-label', 'Đóng hộp thoại');
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
  refresh();
})();
