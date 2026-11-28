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
  const mode = panel.querySelector('.student-task-mode');
  const modeIcon = mode.querySelector('svg');
  const modeText = mode.querySelector('span');
  const databaseProject = service.usesDatabase(projectId);
  panel.querySelector('.update-history-section').hidden = !databaseProject;
  const notice = panel.querySelector('[data-progress-notice]');
  const completionNotice = panel.querySelector('#progress-completion-notice');
  const result = panel.querySelector('[data-progress-result]');
  const detailDialog = panel.querySelector('#task-detail-dialog');
  const showComments = ui.mountTaskComments(detailDialog, 'student');
  const savedDialog = panel.querySelector('#task-saved-dialog');
  const detailActions = detailDialog.querySelector('footer');
  const editDetailButton = detailActions.querySelector('[data-task-detail-action="edit"]');
  const updateButton = detailActions.querySelector('[data-task-detail-action="update"]');
  const updateDialog = panel.querySelector('#task-update-dialog');
  const updateForm = updateDialog.querySelector('form');
  const updateError = updateForm.querySelector('#task-update-error');
  const dialogs = { add: document.getElementById('task-add-popover'), edit: document.getElementById('task-edit-cv-01'), remove: document.getElementById('task-delete-cv-01') };
  const datePicker = ui.proposalDatePicker;
  for (const dialog of [dialogs.add, dialogs.edit]) {
    datePicker?.enhanceDate(dialog.querySelector('[name="han-hoan-thanh"]'), { timeZone: 'Asia/Ho_Chi_Minh' });
  }
  const { labels, today, memberIndex, renderMemberPopover, renderCard, fillDetails, fillStats } = ui.progressTaskView;
  const columnClasses = { 'chua-thuc-hien': 'task-column--not-started', 'dang-thuc-hien': 'task-column--in-progress', 'da-hoan-thanh': 'task-column--done' };
  const columnIcons = { 'chua-thuc-hien': 'list', 'dang-thuc-hien': 'progress', 'da-hoan-thanh': 'done' };
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
  let updateSnapshot;
  const errors = {};
  let deleteMode = false;
  mode.hidden = false;
  function syncSelection() {
    mode.disabled = !state || !service.getPermissions(state).manage;
    mode.dataset.mode = deleteMode ? 'done' : 'delete';
    modeText.textContent = deleteMode ? 'Xong' : 'Xóa';
    modeIcon.toggleAttribute('hidden', !deleteMode);
    mode.setAttribute('aria-pressed', String(deleteMode));
  }
  function renderDetail(task) {
    const codes = new Set(task.assigneeCodes || [task.assigneeCode]);
    const assignees = state.team.members.filter(member => codes.has(service.memberKey(member)));
    const latestUpdate = databaseProject && state.history.find(entry => entry.taskId === task.id);
    fillDetails(detailDialog, task, assignees.map(member => member.name).join(', '), latestUpdate);

    const { manage } = service.getPermissions(state);
    editDetailButton.disabled = !manage;
    editDetailButton.hidden = !manage && state.team.project.status !== 'hoan-thanh';
    updateButton.hidden = !databaseProject || !service.canUpdateTask(state, task);
    detailActions.hidden = editDetailButton.hidden && updateButton.hidden;
  }

  function showDetail(taskId) {
    if (!refresh()) return;
    const task = state.tasks.find(item => item.id === taskId);
    if (!task) return;
    renderDetail(task);
    detailDialog.dataset.taskId = taskId;
    showComments({ projectId, taskId });
    detailDialog.showModal();
    detailDialog.scrollTop = 0;
  }

  editDetailButton.addEventListener('click', () => open('edit', detailDialog.dataset.taskId));
  const updateStatus = updateForm.elements['trang-thai'];
  const updatePercent = updateForm.elements['phan-tram'];
  function syncPercent() {
    const fixed = updateStatus.value !== 'dang-thuc-hien';
    if (fixed) updatePercent.value = updateStatus.value === 'da-hoan-thanh' ? 100 : 0;
    else if (['0', '100'].includes(updatePercent.value)) updatePercent.value = '';
    updatePercent.readOnly = fixed;
  }
  updateStatus.addEventListener('change', syncPercent);
  updateButton.addEventListener('click', () => {
    if (!refresh()) return;
    const task = state.tasks.find(item => item.id === detailDialog.dataset.taskId);
    if (!task || !service.canUpdateTask(state, task)) return;
    updateForm.reset();
    updateError.hidden = true;
    updateSnapshot = { taskId: task.id, revision: state.revision };
    updateStatus.value = task.status;
    updatePercent.value = task.percent ?? '';
    syncPercent();
    updateDialog.showModal();
  });
  updateDialog.addEventListener('close', () => {
    if (detailDialog.open) updateButton.focus();
  });
  updateForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || !updateSnapshot) return;
    const { taskId, revision } = updateSnapshot;
    const checked = service.validateUpdate({ taskId, content: updateForm.elements['noi-dung'].value,
      status: updateStatus.value, percent: updatePercent.value });
    if (checked.errors.length) {
      updateError.textContent = checked.errors.map(item => item.message).join(' ');
      updateError.hidden = false;
      updateError.focus();
      return;
    }
    const button = updateForm.querySelector('[type="submit"]');
    saving = button.disabled = true;
    updateError.hidden = true;
    try {
      await service.updateProgress(projectId, checked.value, revision);
      updateDialog.close();
      detailDialog.close();
      refresh();
      result.textContent = 'Đã lưu cập nhật tiến độ.';
      result.hidden = false;
      result.focus();
    } catch (failure) {
      updateError.textContent = failure.message;
      updateError.hidden = false;
      updateError.focus();
    } finally { saving = button.disabled = false; }
  });
  detailDialog.addEventListener('close', () => {
    if (!dialogs.edit.open && !savedDialog.open) focusTask(detailDialog.dataset.taskId);
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
    if (key === 'remove') dialog.querySelector('footer').before(error);
    else (form.querySelector('.task-editor__body') || form).prepend(error);
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
    dialog.querySelector('[command="close"]').setAttribute('aria-label', `Đóng hộp ${key === 'remove' ? 'xóa công việc' : key === 'edit' ? 'sửa công việc' : 'thêm công việc'}`);
    dialog.addEventListener('close', () => {
      if (!committed && pending) {
        if (key === 'add') addButton.focus({ preventScroll: true });
        else if (key === 'remove') mode.focus({ preventScroll: true });
        else if (key === 'edit' && detailDialog.open) {
          const task = state?.tasks.find(item => item.id === pending.taskId);
          if (task) {
            renderDetail(task);
            const target = editDetailButton.disabled ? detailDialog.querySelector('.workflow-dialog__close') : editDetailButton;
            target.focus({ preventScroll: true });
          } else detailDialog.close();
        } else focusTask(pending.taskId);
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
      checkbox.value = service.memberKey(member);
      checkbox.checked = selected.has(checkbox.value);
      label.append(checkbox, element('span', '', member.name));
      return label;
    }));
    if (!state.team.members.length) {
      options.append(element('p', 'task-editor__empty-assignees', 'Chưa có dữ liệu thành viên của nhóm này.'));
    }
    picker.open = false;
    updateAssigneeCount(picker);
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
    const statusIcon = icon(columnIcons[status], 'task-column__icon');
    column.append(heading);
    heading.append(statusIcon, element('span', '', label));
    const tasks = element('ul', 'task-column__list');
    tasks.tabIndex = 0;
    tasks.setAttribute('aria-labelledby', heading.id);
    tasks.setAttribute('aria-describedby', 'student-task-board-help');
    column.append(tasks);
    return { status, column, tasks };
  });

  function renderTask(task, members, date) {
    const people = (task.assigneeCodes || [task.assigneeCode]).map(code => members.get(code)).filter(Boolean);
    const remove = deleteMode ? element('button', 'student-task-remove', '−') : null;
    if (remove) {
      remove.type = 'button';
      remove.dataset.progressAction = 'remove';
      remove.setAttribute('aria-label', 'Xóa công việc: ' + task.title);
    }
    return renderCard(task, people, date, detailDialog.id, remove);
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
      addButton.disabled = completed || (databaseProject && !permissions.manage);
      previewNote.hidden = Boolean(permissions.manage);
      previewNote.textContent = preview ? 'Mở đề tài qua localhost để lưu công việc.' : 'Chỉ nhóm trưởng được lưu công việc mới.';
      const date = today();
      const summary = service.summarize(state);
      panel.querySelector('#overall-progress').value = summary.percent;
      panel.querySelector('#overall-progress').textContent = `${summary.percent}%`;
      panel.querySelector('.progress-overview__percent').textContent = `${summary.percent}% hoàn thành`;
      summaryText.hidden = summary.method !== 'completed-ratio';
      summaryText.textContent = summaryText.hidden ? '' : 'Tính theo số công việc đã hoàn thành vì một số công việc chưa có phần trăm cụ thể.';
      fillStats(overview, summary, state.tasks, date);
      const members = memberIndex(state.team.members);
      popovers.replaceChildren(...Array.from(members.values(), renderMemberPopover));
      columns.forEach(({ status, tasks }) => {
        const matching = state.tasks.filter(task => task.status === status);
        const scrollTop = tasks.scrollTop;
        tasks.replaceChildren(...matching.map(task => renderTask(task, members, date)));
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
        paragraphs[0].textContent = `Ngày cập nhật: ${new Date(entry.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })} - ${entry.actorName}`;
        paragraphs[1].textContent = `Nội dung đã làm: ${entry.content}`;
        item.querySelector('.progress-update-card__status').textContent = labels[entry.status];
        item.querySelector('.progress-update-card__summary p:last-child').textContent = `Mức hoàn thành: ${entry.percent}%`;
        return item;
      }));
      if (!state.history.length) { const empty = document.createElement('li'); empty.textContent = 'Chưa có cập nhật tiến độ.'; history.append(empty); }
      Object.values(dialogs).forEach(dialog => { dialog.querySelector('[type="submit"]').disabled = !permissions.manage; });
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
    const deadline = form.elements['han-hoan-thanh'];
    const checked = service.validateTask({
      title: values.get('ten-cong-viec'),
      description: values.get('mo-ta'),
      assigneeCodes: values.getAll('nguoi-phu-trach'),
      deadline: datePicker ? datePicker.read(deadline) : values.get('han-hoan-thanh'),
      status: values.get('trang-thai'),
    }, state.team, { editing: key === 'edit' });
    const fields = {
      title: form.elements['ten-cong-viec'],
      description: form.elements['mo-ta'],
      assigneeCode: form.querySelector('[data-task-assignee-toggle]'),
      deadline,
    };
    const statusInputs = [...form.querySelectorAll('[name="trang-thai"]')];
    [...Object.values(fields), ...statusInputs].forEach(field => field.removeAttribute('aria-invalid'));
    for (const error of checked.errors) {
      if (error.field === 'status') statusInputs.forEach(input => input.setAttribute('aria-invalid', 'true'));
      else fields[error.field]?.setAttribute('aria-invalid', 'true');
    }
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
    if ((key === 'edit' || key === 'remove') && !service.getPermissions(state).manage) return;
    const dialog = dialogs[key];
    const form = dialog.querySelector('form');
    form.reset();
    errors[key].hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
    if (key === 'remove' && !task) return;
    pending = { key, taskId, revision: state.revision };
    committed = false;
    if (key === 'add' || key === 'edit') {
      resetAssignees(form, task);
      if (task) {
        form.elements['ten-cong-viec'].value = task.title;
        const deadline = form.elements['han-hoan-thanh'];
        if (datePicker) datePicker.fill(deadline, task.deadline);
        else deadline.value = task.deadline;
        form.elements['mo-ta'].value = task.description || '';
        form.elements['trang-thai'].value = task.status;
      }
    } else if (key === 'remove') {
      dialog.querySelector('[data-task-delete-name]').textContent = task.title;
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
    dialog.querySelector('form').addEventListener('submit', async event => {
      event.preventDefault();
      if (!pending || pending.key !== key || saving || !state) return;
      if (dialog.querySelector('[type="submit"]').disabled) return;
      const form = event.currentTarget;
      const values = new FormData(form);
      const checked = key === 'remove' ? null : validateTaskForm(form, key, values);
      if (checked?.errors.length) { showError(key, new Error(checked.errors.map(error => error.message).join(' '))); return; }
      const { taskId, revision } = pending;
      saving = true;
      try {
        if (key === 'remove') await service.deleteTask(projectId, taskId, revision);
        else await service.saveTask(projectId, taskId, checked.value, revision);
        committed = true;
        dialog.close();
        refresh();
        if (key === 'edit') {
          if (detailDialog.open) detailDialog.close();
          result.hidden = true;
          savedDialog.dataset.taskId = taskId;
          savedDialog.showModal();
          return;
        }
        result.textContent = databaseProject ? 'Đã lưu thay đổi công việc.' : 'Đã lưu thay đổi công việc/tiến độ thử trên trình duyệt này.';
        result.hidden = false;
        result.focus();
      } catch (failure) { showError(key, failure); }
      finally { saving = false; }
    });
  });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('ie104:proposals-updated', refresh);
  window.addEventListener('storage', event => { if ([globalThis.IE104.storage.progressKey, globalThis.IE104.storage.teamKey, globalThis.IE104.storage.teachingKey, null].includes(event.key)) refresh(); });
  refresh();
  panel.dataset.progressReady = 'true';
})();
