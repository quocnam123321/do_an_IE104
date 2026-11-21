(() => {
  const service = globalThis.IE104?.services?.projectProgress;
  const projectId = document.body.dataset.projectId;
  const panel = document.getElementById('tien-do');
  if (!service || !projectId || !panel) return;
  const ui = globalThis.IE104.ui;
  const preview = location.protocol === 'file:';
  const archivedProject = document.body.hasAttribute('data-archived-sample')
    ? globalThis.IE104.data.myTopics.find(topic => topic.id === projectId)
    : null;
  const overview = panel.querySelector('.progress-overview');
  const list = panel.querySelector('.task-list');
  const history = panel.querySelector('.update-history');
  const historyTemplate = history.firstElementChild.cloneNode(true);
  const addButton = panel.querySelector('.btn-add-task');
  panel.querySelector('.update-history-section').hidden = true;
  const notice = panel.querySelector('[data-progress-notice]');
  const completionNotice = panel.querySelector('#progress-completion-notice');
  const result = panel.querySelector('[data-progress-result]');
  const detailDialog = panel.querySelector('#task-detail-dialog');
  const savedDialog = panel.querySelector('#task-saved-dialog');
  const detailActions = detailDialog.querySelector('footer');
  const editDetailButton = detailActions.querySelector('[data-task-detail-action="edit"]');
  const updateDetailButton = detailActions.querySelector('[data-task-detail-action="update"]');
  const dialogs = { add: document.getElementById('task-add-popover'), edit: document.getElementById('task-edit-cv-01'), remove: document.getElementById('task-delete-cv-01'), update: document.getElementById('progress-update-popover') };
  const labels = { 'chua-thuc-hien': 'Chưa bắt đầu', 'dang-thuc-hien': 'Đang thực hiện', 'da-hoan-thanh': 'Đã hoàn thành' };
  const columnClasses = { 'chua-thuc-hien': 'task-column--not-started', 'dang-thuc-hien': 'task-column--in-progress', 'da-hoan-thanh': 'task-column--done' };
  const columnIcons = { 'chua-thuc-hien': 'list', 'dang-thuc-hien': 'progress', 'da-hoan-thanh': 'done' };
  const avatarColors = ['task-assignee__avatar--an', 'task-assignee__avatar--binh', 'task-assignee__avatar--cuong'];
  const popovers = document.createElement('div');
  list.parentElement.after(popovers);
  const previewNote = element('p', 'task-editor__preview-note');
  previewNote.hidden = true;
  dialogs.add.querySelector('.task-editor__body').prepend(previewNote);
  const summaryText = document.createElement('p');
  panel.querySelector('#overall-progress').setAttribute('aria-label', 'Tiến độ tổng thể');
  summaryText.className = 'progress-overview__note';
  panel.querySelector('.progress-overview__stats').after(summaryText);
  list.classList.add('task-board__columns');
  list.removeAttribute('tabindex');
  list.setAttribute('aria-label', 'Công việc theo trạng thái');
  let state = null;
  let pending = null;
  let saving = false;
  let committed = false;
  const errors = {};
  let deleteMode = false;
  const mode = document.createElement('button'); mode.type = 'button'; mode.className = 'student-task-mode'; mode.textContent = 'Xóa';
  const modeLabel = document.createElement('span'); modeLabel.className = 'student-delete-mode-label'; modeLabel.textContent = 'Chế độ xóa'; modeLabel.hidden = true;
  dialogs.remove.classList.add('workflow-delete-confirm');
  addButton.before(modeLabel, mode);
  function syncSelection() {
    mode.disabled = !state || !service.getPermissions(state).manage;
    mode.textContent = deleteMode ? 'Xong' : 'Xóa'; mode.dataset.mode = deleteMode ? 'done' : 'delete';
    mode.setAttribute('aria-pressed', String(deleteMode)); modeLabel.hidden = !deleteMode;
  }
  function showDetail(taskId) {
    if (!refresh()) return;
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) return;

    const codes = new Set(task.assigneeCodes || [task.assigneeCode]);
    const assignees = state.team.members.filter(member => codes.has(member.code));
    const badge = detailDialog.querySelector('[data-task-detail-status]');
    badge.dataset.status = task.status;
    badge.textContent = labels[task.status];
    detailDialog.querySelector('#task-detail-title').textContent = task.title;
    detailDialog.querySelector('[data-task-detail-assignees]').textContent =
      assignees.map(member => member.name).join(', ') || 'Chưa phân công';
    detailDialog.querySelector('[data-task-detail-description]').textContent = task.description?.trim() || 'Chưa có mô tả.';

    const deadline = detailDialog.querySelector('[data-task-detail-deadline]');
    const date = element(task.deadline ? 'time' : 'span', '', dateText(task.deadline));
    if (task.deadline) date.dateTime = task.deadline;
    deadline.replaceChildren(icon('calendar', 'task-detail-dialog__calendar'), date);

    editDetailButton.hidden = !service.getPermissions(state).manage;
    updateDetailButton.hidden = !service.canUpdateTask(state, task);
    updateDetailButton.classList.toggle('workflow-dialog__primary', editDetailButton.hidden);
    detailActions.hidden = editDetailButton.hidden && updateDetailButton.hidden;
    detailDialog.dataset.taskId = taskId;
    detailDialog.showModal();
    detailDialog.scrollTop = 0;
  }

  detailActions.addEventListener('click', event => {
    const button = event.target.closest('[data-task-detail-action]');
    if (!button || button.hidden) return;
    detailDialog.close();
    open(button.dataset.taskDetailAction, detailDialog.dataset.taskId);
  });
  detailDialog.addEventListener('close', () => {
    if (!dialogs.edit.open && !dialogs.update.open) focusTask(detailDialog.dataset.taskId);
  });
  savedDialog.addEventListener('close', () => focusTask(savedDialog.dataset.taskId));

  function focusTask(taskId) {
    const card = [...list.querySelectorAll('[data-task-id]')].find(item => item.dataset.taskId === taskId);
    const target = card?.querySelector('.task-card__open') || list.parentElement;
    target.focus({ preventScroll: true });
  }

  mode.addEventListener('click', () => { if (!state || !service.getPermissions(state).manage) return; deleteMode = !deleteMode; refresh(); });

  Object.entries(dialogs).forEach(([key, dialog]) => {
    const error = document.createElement('p');
    error.id = `progress-error-${key}`;
    error.className = 'progress-form-error';
    error.setAttribute('role', 'alert');
    error.tabIndex = -1;
    error.hidden = true;
    const form = dialog.querySelector('form');
    (form.querySelector('.task-editor__body') || form).prepend(error);
    form.noValidate = true;
    form.querySelectorAll('input:not([type="hidden"]), select, textarea, [data-task-assignee-toggle]').forEach(field => {
      field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} ${error.id}`.trim());
    });
    const picker = form.querySelector('[data-task-assignee-picker]');
    if (picker) {
      picker.addEventListener('change', () => updateAssigneeCount(picker));
      form.addEventListener('input', () => {
        if (!state || !form.querySelector('[aria-invalid="true"]')) return;
        const checked = validateTaskForm(form, key);
        error.textContent = checked.errors.map(item => item.message).join(' ');
        error.hidden = !checked.errors.length;
      });
      picker.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || !picker.open) return;
        event.preventDefault();
        picker.open = false;
        picker.querySelector('summary').focus();
      });
    }
    dialog.querySelector('[command="close"]').setAttribute('aria-label', `Đóng hộp ${key === 'remove' ? 'xóa công việc' : key === 'edit' ? 'sửa công việc' : key === 'add' ? 'thêm công việc' : 'cập nhật tiến độ'}`);
    dialog.addEventListener('close', () => {
      if (!committed && pending) {
        if (key === 'add') addButton.focus({ preventScroll: true });
        else if (key === 'remove') mode.focus({ preventScroll: true });
        else focusTask(pending.taskId);
      }
      pending = null;
    });
    errors[key] = error;
  });

  function updateAssigneeCount(picker) {
    const count = picker.querySelectorAll('input:checked').length;
    picker.querySelector('[data-task-assignee-count]').textContent = count ? 'Đã chọn ' + count + ' thành viên' : 'Chọn thành viên';
  }

  function resetAssignees(form, task) {
    const picker = form.querySelector('[data-task-assignee-picker]');
    const options = picker.querySelector('[data-task-assignee-list]');
    const selected = new Set(task?.assigneeCodes ?? [task?.assigneeCode]);
    options.replaceChildren(...state.team.members.map(member => {
      const label = element('label');
      const checkbox = element('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'nguoi-phu-trach';
      checkbox.value = member.code;
      checkbox.checked = selected.has(member.code);
      label.append(checkbox, element('span', '', member.name));
      return label;
    }));
    if (!state.team.members.length) {
      options.append(element('p', 'task-editor__empty-assignees', 'Chưa có dữ liệu thành viên của nhóm này.'));
    }
    picker.open = false;
    updateAssigneeCount(picker);
  }

  function dateText(value) {
    return value ? value.split('-').reverse().join('/') : 'Chưa có hạn';
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function icon(kind, className) {
    const svg = ui.workflowIcon(kind);
    svg.setAttribute('class', className);
    return svg;
  }

  const columns = Object.entries(labels).map(([status, label]) => {
    const column = element('li', 'task-column ' + columnClasses[status]);
    const heading = element('h4', 'task-column__title');
    heading.id = 'progress-column-' + status;
    const count = element('span', 'task-column__count');
    const statusIcon = icon(columnIcons[status], 'task-column__icon');
    column.append(heading);
    heading.append(statusIcon, element('span', '', label), count);
    const tasks = element('ul', 'task-column__list');
    tasks.tabIndex = 0;
    tasks.setAttribute('aria-labelledby', heading.id);
    tasks.setAttribute('aria-describedby', 'student-task-board-help');
    column.append(tasks);
    return { status, column, count, tasks };
  });

  function memberAvatar(member, className) {
    const initials = member.name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
    return element('span', className, initials);
  }

  function renderMemberPopover(member, index) {
    const popover = element('div', 'progress-member-popover');
    popover.id = 'student-progress-member-' + index;
    popover.setAttribute('popover', '');
    popover.setAttribute('role', 'dialog');
    const info = element('div', 'progress-member-popover__info');
    const name = element('p', 'progress-member-popover__name', member.name);
    name.id = popover.id + '-name';
    popover.setAttribute('aria-labelledby', name.id);
    const role = member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên';
    info.append(name, element('p', 'progress-member-popover__id', 'MSSV: ' + member.code),
      element('p', 'progress-member-popover__role', role));
    const avatar = memberAvatar(member, 'progress-member-popover__avatar ' + avatarColors[index % avatarColors.length]);
    avatar.setAttribute('aria-hidden', 'true');
    const close = element('button', 'progress-member-popover__close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Đóng thông tin thành viên');
    close.setAttribute('popovertarget', popover.id);
    close.setAttribute('popovertargetaction', 'hide');
    popover.append(avatar, info, close);
    return popover;
  }

  function renderAssignees(task, members) {
    const assignments = task.assigneeCodes || [task.assigneeCode];
    const people = assignments.map(code => members.get(code)).filter(Boolean);
    const group = element('div', 'task-assignees');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Người phụ trách: ' + (assignments.map(code => members.get(code)?.member.name || code).filter(Boolean).join(', ') || 'Chưa phân công'));
    people.slice(0, 2).forEach(({ member, index }) => {
      const button = element('button', 'task-assignee');
      button.type = 'button';
      button.title = member.name;
      button.setAttribute('aria-label', 'Xem thông tin ' + member.name + ', mã số sinh viên ' + member.code);
      button.setAttribute('aria-haspopup', 'dialog');
      button.setAttribute('popovertarget', 'student-progress-member-' + index);
      const avatar = memberAvatar(member, 'task-assignee__avatar ' + avatarColors[index % avatarColors.length]);
      avatar.setAttribute('aria-hidden', 'true');
      button.append(avatar);
      group.append(button);
    });
    if (people.length > 2) {
      const more = element('span', 'task-assignee__avatar task-assignee__avatar--more', '+' + (people.length - 2));
      more.setAttribute('aria-hidden', 'true');
      group.append(more);
    }
    return group;
  }

  function renderTask(task, members, today) {
    const item = element('li');
    const card = element('article', 'task-card task-card--interactive');
    card.dataset.taskId = task.id;
    const header = element('header', 'task-card__header');
    const title = element('h5', 'task-card__title');
    const open = element('button', 'task-card__open', task.title);
    open.type = 'button';
    open.dataset.progressAction = 'view';
    open.setAttribute('aria-label', 'Chi tiết công việc: ' + task.title);
    open.setAttribute('aria-haspopup', 'dialog');
    open.setAttribute('aria-controls', detailDialog.id);
    title.append(open);
    header.append(title);

    const isOverdue = task.status !== 'da-hoan-thanh' && task.deadline && task.deadline < today;
    if (isOverdue) {
      card.classList.add('task-card--overdue');
      header.append(element('span', 'task-card__overdue', 'Quá hạn'));
    }
    if (deleteMode) {
      const remove = element('button', 'student-task-remove', '−');
      remove.type = 'button';
      remove.dataset.progressAction = 'remove';
      remove.setAttribute('aria-label', 'Xóa công việc: ' + task.title);
      header.append(remove);
    }

    const footer = element('div', 'task-card__footer');
    const due = element('p', 'task-card__deadline');
    const date = task.deadline ? element('time', '', dateText(task.deadline)) : element('span', '', 'Chưa có hạn');
    if (task.deadline) date.dateTime = task.deadline;
    due.append(icon('calendar', 'task-card__icon'), element('span', 'visually-hidden', 'Hạn hoàn thành: '), date);
    footer.append(due, renderAssignees(task, members));
    card.append(header, footer);
    item.append(card);
    return item;
  }

  list.replaceChildren(...columns.map(({ column }) => column));

  function refresh() {
    try {
      state = archivedProject
        ? { tasks: [], history: [], team: { project: archivedProject, members: [], preview } }
        : service.getState(projectId, { preview });

      const permissions = service.getPermissions(state);
      if (!permissions.manage) deleteMode = false;
      const completed = state.team.project.status === 'hoan-thanh';
      notice.textContent = archivedProject ? 'Chưa có dữ liệu tiến độ của đề tài mẫu này.' : completed ? '' : permissions.reason;
      notice.hidden = !notice.textContent;
      completionNotice.hidden = !completed;
      overview.hidden = Boolean(archivedProject);
      addButton.disabled = completed;
      previewNote.hidden = Boolean(permissions.manage);
      previewNote.textContent = preview ? 'Mở đề tài qua localhost để lưu công việc.' : 'Chỉ nhóm trưởng được lưu công việc mới.';
      const summary = service.summarize(state);
      panel.querySelector('#overall-progress').value = summary.percent;
      panel.querySelector('#overall-progress').textContent = `${summary.percent}%`;
      panel.querySelector('.progress-overview__percent').textContent = `${summary.percent}% hoàn thành`;
      summaryText.hidden = summary.method !== 'completed-ratio';
      summaryText.textContent = summaryText.hidden ? '' : 'Tính theo số công việc đã hoàn thành vì một số công việc chưa có phần trăm cụ thể.';
      panel.querySelectorAll('.progress-stat dd').forEach((node, index) => { node.textContent = [summary.total, summary.completed, summary.remaining][index]; });
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format();
      const members = new Map(state.team.members.map((member, index) => [member.code, { member, index }]));
      popovers.replaceChildren(...state.team.members.map(renderMemberPopover));
      columns.forEach(({ status, count, tasks }) => {
        const matching = state.tasks.filter(task => task.status === status);
        const scrollTop = tasks.scrollTop;
        count.replaceChildren(element('span', 'visually-hidden', 'Số công việc: '), '(' + matching.length + ')');
        tasks.replaceChildren(...matching.map(task => renderTask(task, members, today)));
        if (!matching.length) tasks.append(element('li', 'task-column__empty', 'Chưa có công việc.'));
        tasks.scrollTop = scrollTop;
      });
      history.replaceChildren(...state.history.map((entry, index) => {
        const item = historyTemplate.cloneNode(true);
        const title = item.querySelector('h3');
        title.id = `progress-record-${index}-title`;
        title.textContent = entry.taskTitle;
        item.querySelector('article').setAttribute('aria-labelledby', title.id);
        const paragraphs = item.querySelectorAll('.progress-update-card__content p');
        paragraphs[0].textContent = `Ngày cập nhật: ${new Date(entry.createdAt).toLocaleString('vi-VN')} - ${entry.actorName}`;
        paragraphs[1].textContent = `Nội dung đã làm: ${entry.content}`;
        item.querySelector('.progress-update-card__status').textContent = labels[entry.status];
        item.querySelector('.progress-update-card__summary p:last-child').textContent = `Mức hoàn thành: ${entry.percent}%`;
        return item;
      }));
      if (!state.history.length) { const empty = document.createElement('li'); empty.textContent = 'Chưa có cập nhật tiến độ.'; history.append(empty); }
      Object.entries(dialogs).forEach(([key, dialog]) => { dialog.querySelector('[type="submit"]').disabled = key === 'update' ? !permissions.update : !permissions.manage; });
      syncSelection();
      return true;
    } catch (failure) {
      state = null;
      syncSelection();
      notice.textContent = failure.message;
      notice.hidden = false;
      completionNotice.hidden = true;
      panel.querySelectorAll('button[command="show-modal"], [data-progress-action], [data-select-task], .btn-add-task, button[type="submit"]').forEach(button => { button.disabled = true; });
      return false;
    }
  }

  function validateTaskForm(form, key, values = new FormData(form)) {
    const checked = service.validateTask({
      title: values.get('ten-cong-viec'),
      description: values.get('mo-ta'),
      assigneeCodes: values.getAll('nguoi-phu-trach'),
      deadline: values.get('han-hoan-thanh'),
      status: key === 'add' ? values.get('trang-thai') : undefined,
    }, state.team);
    const fields = {
      title: form.elements['ten-cong-viec'],
      description: form.elements['mo-ta'],
      assigneeCode: form.querySelector('[data-task-assignee-toggle]'),
      deadline: form.elements['han-hoan-thanh'],
    };
    Object.values(fields).forEach(field => field.removeAttribute('aria-invalid'));
    checked.errors.forEach(error => fields[error.field]?.setAttribute('aria-invalid', 'true'));
    return checked;
  }

  function showError(key, failure) {
    errors[key].textContent = failure.message;
    errors[key].hidden = false;
    errors[key].focus();
  }

  function open(key, taskId = null) {
    if (!refresh()) return;
    if (key === 'add' && addButton.disabled) return;
    const task = state.tasks.find(item => item.id === taskId);
    if (taskId && !task) return;
    if (key === 'update' && (!task || !service.canUpdateTask(state, task))) return;
    if ((key === 'edit' || key === 'remove') && !service.getPermissions(state).manage) return;
    const dialog = dialogs[key];
    const form = dialog.querySelector('form');
    form.reset();
    errors[key].hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
    const taskIds = key === 'remove' ? taskId ? [taskId] : [] : [];
    if (key === 'remove' && !taskIds.length) return;
    pending = { key, taskId, taskIds, revision: state.revision };
    committed = false;
    if (key === 'add' || key === 'edit') {
      resetAssignees(form, task);
      if (task) {
        form.elements['ten-cong-viec'].value = task.title;
        form.elements['han-hoan-thanh'].value = task.deadline;
        form.elements['mo-ta'].value = task.description || '';
      }
    } else if (key === 'remove') dialog.querySelector('.delete-task-target strong').textContent = state.tasks.filter(item => taskIds.includes(item.id)).map(item => item.title).join('; ');
    else {
      dialog.querySelector('#update-progress-task').textContent = task.title;
      form.elements['trang-thai'].value = task.status;
      form.elements['muc-hoan-thanh'].value = Number.isFinite(task.percent) ? task.percent : '';
    }
    dialog.showModal();
  }

  addButton.removeAttribute('command');
  addButton.removeAttribute('commandfor');
  addButton.addEventListener('click', () => open('add'));
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-progress-action]');
    if (!button || button.disabled) return;
    const taskId = button.closest('[data-task-id]').dataset.taskId;
    if (button.dataset.progressAction === 'view') showDetail(taskId);
    else open(button.dataset.progressAction, taskId);
  });
  Object.entries(dialogs).forEach(([key, dialog]) => {
    dialog.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      if (!pending || pending.key !== key || saving || !state) return;
      if (dialog.querySelector('[type="submit"]').disabled) return;
      const form = event.currentTarget;
      const values = new FormData(form);
      let checked;
      if (key === 'add' || key === 'edit') checked = validateTaskForm(form, key, values);
      if (key === 'update') checked = service.validateUpdate({ taskId: pending.taskId, content: values.get('noi-dung-da-lam'), status: values.get('trang-thai'), percent: values.get('muc-hoan-thanh') });
      if (checked?.errors.length) { showError(key, new Error(checked.errors.map(error => error.message).join(' '))); return; }
      const { taskId, taskIds, revision } = pending;
      saving = true;
      try {
        if (key === 'remove') service.deleteTasks(projectId, taskIds, revision);
        else if (key === 'update') service.updateProgress(projectId, checked.value, revision);
        else service.saveTask(projectId, taskId, checked.value, revision);
        committed = true;
        dialog.close();
        refresh();
        if (key === 'edit') {
          result.hidden = true;
          savedDialog.dataset.taskId = taskId;
          savedDialog.showModal();
          return;
        }
        result.textContent = 'Đã lưu thay đổi công việc/tiến độ thử trên trình duyệt này.';
        result.hidden = false;
        result.focus();
      } catch (failure) { showError(key, failure); }
      finally { saving = false; }
    });
  });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', event => { if ([globalThis.IE104.storage.progressKey, globalThis.IE104.storage.teamKey, null].includes(event.key)) refresh(); });
  refresh();
  panel.dataset.progressReady = 'true';
})();
