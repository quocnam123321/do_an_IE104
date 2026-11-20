(() => {
  const service = globalThis.IE104?.services?.projectProgress;
  const projectId = document.body.dataset.projectId;
  const panel = document.getElementById('tien-do');
  if (!service || !projectId || !panel) return;
  const list = panel.querySelector('.task-list');
  const history = panel.querySelector('.update-history');
  const cardTemplate = list.firstElementChild.cloneNode(true);
  const historyTemplate = history.firstElementChild.cloneNode(true);
  const addButton = panel.querySelector('.btn-add-task');
  const updateButton = panel.querySelector('.btn-update-progress');
  addButton.after(updateButton);
  panel.querySelector('.update-history-section').hidden = true;
  const notice = panel.querySelector('[data-progress-notice]');
  const result = panel.querySelector('[data-progress-result]');
  const dialogs = { add: document.getElementById('task-add-popover'), edit: document.getElementById('task-edit-cv-01'), remove: document.getElementById('task-delete-cv-01'), update: document.getElementById('progress-update-popover') };
  const labels = { 'chua-thuc-hien': 'Chưa bắt đầu', 'dang-thuc-hien': 'Đang thực hiện', 'da-hoan-thanh': 'Đã hoàn thành' };
  const columnClasses = { 'chua-thuc-hien': 'task-column--not-started', 'dang-thuc-hien': 'task-column--in-progress', 'da-hoan-thanh': 'task-column--done' };
  const summaryText = document.createElement('p');
  panel.querySelector('#overall-progress').setAttribute('aria-label', 'Tiến độ tổng thể');
  summaryText.className = 'student-progress-summary';
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
  addButton.before(mode); panel.querySelector('#task-list-title').after(modeLabel);
  function syncSelection() {
    mode.disabled = !state || !service.getPermissions(state).manage;
    mode.textContent = deleteMode ? 'Xong' : 'Xóa'; mode.dataset.mode = deleteMode ? 'done' : 'delete';
    mode.setAttribute('aria-pressed', String(deleteMode)); modeLabel.hidden = !deleteMode; panel.dataset.taskDeleteMode = String(deleteMode);
  }
  function showDetail(taskId) {
    if (!refresh()) return;
    const task = state.tasks.find(item => item.id === taskId); if (!task) return;
    const people = state.team.members.filter(member => (task.assigneeCodes || [task.assigneeCode]).includes(member.code));
    globalThis.IE104.ui.workflowDetails({ title: 'Chi tiết công việc', fields: [
      ['Tên công việc', task.title], ['Người phụ trách', people.map(member => `${member.name} - ${member.code}`).join('; ') || task.assigneeCode],
      ['Hạn hoàn thành', dateText(task.deadline)], ['Trạng thái', labels[task.status]], ['Mức hoàn thành', task.percent === null ? 'Chưa có phần trăm cụ thể' : `${task.percent}%`]
    ], progressHistory: { entries: state.history, taskId: task.id }, actionText: 'Sửa công việc', action: () => open('edit', taskId), disabled: !service.getPermissions(state).manage,
    returnTo: () => [...list.querySelectorAll('[data-task-id]')].find(item => item.dataset.taskId === taskId)?.querySelector('.student-task-open') });
  }
  mode.addEventListener('click', () => { if (!state || !service.getPermissions(state).manage) return; deleteMode = !deleteMode; refresh(); });

  Object.entries(dialogs).forEach(([key, dialog]) => {
    const error = document.createElement('p');
    error.id = `progress-error-${key}`;
    error.className = 'progress-form-error';
    error.setAttribute('role', 'alert');
    error.tabIndex = -1;
    error.hidden = true;
    dialog.querySelector('form').prepend(error);
    dialog.querySelector('form').noValidate = true;
    dialog.querySelectorAll('input:not([type="hidden"]), select, textarea').forEach(field => {
      field.setAttribute('aria-describedby', `${field.getAttribute('aria-describedby') || ''} ${error.id}`.trim());
    });
    dialog.querySelector('[command="close"]').setAttribute('aria-label', `Đóng hộp ${key === 'remove' ? 'xóa công việc' : key === 'edit' ? 'sửa công việc' : key === 'add' ? 'thêm công việc' : 'cập nhật tiến độ'}`);
    dialog.addEventListener('close', () => {
      if (!committed && pending) {
        if (key === 'add') addButton.focus({ preventScroll: true });
        else if (key === 'update') updateButton.focus({ preventScroll: true });
        else {
          const article = [...list.querySelectorAll('[data-task-id]')].find(item => item.dataset.taskId === pending.taskId);
          if (key === 'remove') mode.focus({ preventScroll: true });
          else article?.querySelector('.student-task-open')?.focus({ preventScroll: true });
        }
      }
      pending = null;
    });
    errors[key] = error;
  });

  function dateText(value) {
    return value.split('-').reverse().join('/');
  }

  function refresh() {
    try {
      state = service.getState(projectId);

      const permissions = service.getPermissions(state);
      notice.textContent = state.team.project.status !== 'dang-thuc-hien' ? '' : permissions.reason;
      notice.hidden = !notice.textContent;
      addButton.disabled = !permissions.manage;
      updateButton.disabled = !state.tasks.some(task => service.canUpdateTask(state, task));
      const summary = service.summarize(state);
      panel.querySelector('#overall-progress').value = summary.percent;
      panel.querySelector('#overall-progress').textContent = `${summary.percent}%`;
      panel.querySelector('.overall-progress__text').textContent = `${summary.percent}% hoàn thành`;
      summaryText.hidden = summary.method !== 'completed-ratio';
      summaryText.textContent = summaryText.hidden ? '' : 'Tính theo số công việc đã hoàn thành vì một số công việc chưa có phần trăm cụ thể.';
      panel.querySelectorAll('.progress-stat dd').forEach((node, index) => { node.textContent = [summary.total, summary.completed, summary.remaining][index]; });
      const taskItems = state.tasks.map((task, index) => {
        const item = cardTemplate.cloneNode(true);
        const article = item.querySelector('article');
        const title = item.querySelector('h3');
        article.id = `task-record-${index}`;
        article.dataset.taskId = task.id;
        item.dataset.taskStatus = task.status;
        title.id = `task-record-${index}-title`;
        title.textContent = task.title;
        article.setAttribute('aria-labelledby', title.id);
        const paragraphs = item.querySelectorAll('.task-card__content p');
        const codes = task.assigneeCodes || [task.assigneeCode];
        const people = codes.map(code => state.team.members.find(member => member.code === code));
        const names = people.map((person, index) => person?.name || codes[index]).filter(Boolean);
        const prefix = label => {
          const node = document.createElement('span');
          node.className = 'visually-hidden';
          node.textContent = label + ': ';
          return node;
        };
        paragraphs[0].className = 'student-task-assignees';
        paragraphs[0].replaceChildren(prefix('Người phụ trách'), names.join(', ') || 'Chưa có người phụ trách');
        const date = document.createElement('time');
        date.dateTime = task.deadline;
        date.textContent = dateText(task.deadline);
        paragraphs[1].className = 'task-card__deadline';
        paragraphs[1].replaceChildren(prefix('Hạn hoàn thành'), date);
        const status = document.createElement('p');
        status.className = 'student-task-percent';
        status.textContent = task.percent === null ? 'Chưa có phần trăm cụ thể' : `${task.percent}% hoàn thành`;
        item.querySelector('.task-card__content').append(status);
        const content = item.querySelector('.task-card__content');
        const view = document.createElement('button'); view.type = 'button'; view.className = 'student-task-open'; view.dataset.progressAction = 'view';
        view.setAttribute('aria-label', `Chi tiết công việc: ${task.title}`); view.setAttribute('aria-haspopup', 'dialog');
        content.before(view); view.append(content);
        const actions = item.querySelector('.task-card__actions'); actions.replaceChildren();
        if (deleteMode) {
          const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'student-task-remove'; remove.textContent = '−'; remove.dataset.progressAction = 'remove';
          remove.setAttribute('aria-label', `Xóa công việc: ${task.title}`); remove.disabled = !permissions.manage; actions.append(remove);
        }
        return item;
      });
      list.replaceChildren(...Object.entries(labels).map(([status, label]) => {
        const column = document.createElement('li');
        column.classList.add('task-column', columnClasses[status]);
        const heading = document.createElement('h3');
        const items = taskItems.filter(item => item.dataset.taskStatus === status);
        heading.id = `progress-column-${status}`;
        heading.className = 'task-column__title';
        const count = document.createElement('span');
        count.className = 'task-column__count';
        count.textContent = `(${items.length})`;
        const icon = globalThis.IE104.ui.workflowIcon(status === 'da-hoan-thanh' ? 'done' : status === 'dang-thuc-hien' ? 'progress' : 'pending');
        icon.setAttribute('class', 'task-column__icon');
        heading.append(icon, label, count);
        const columnList = document.createElement('ul');
        columnList.className = 'task-column__list';
        columnList.tabIndex = 0;
        columnList.setAttribute('aria-labelledby', heading.id);
        items.forEach(item => {
          const oldTitle = item.querySelector('h3');
          const title = document.createElement('h4');
          title.id = oldTitle.id;
          title.className = 'task-card__title';
          title.textContent = oldTitle.textContent;
          oldTitle.replaceWith(title);
          columnList.append(item);
        });
        if (!items.length) {
          const empty = document.createElement('li'); empty.textContent = 'Chưa có công việc.'; columnList.append(empty);
        }
        column.append(heading, columnList);
        return column;
      }));
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
      panel.querySelectorAll('button[command="show-modal"], [data-progress-action], [data-select-task], .btn-add-task, .btn-update-progress, button[type="submit"]').forEach(button => { button.disabled = true; });
      return false;
    }
  }

  function showError(key, failure) {
    errors[key].textContent = failure.message;
    errors[key].hidden = false;
    errors[key].focus();
  }

  function open(key, taskId = null) {
    if (!refresh()) return;
    const permissions = service.getPermissions(state);
    if ((key === 'update' && !permissions.update) || (key !== 'update' && !permissions.manage)) return;
    const dialog = dialogs[key];
    const form = dialog.querySelector('form');
    form.reset();
    errors[key].hidden = true;
    form.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
    const task = state.tasks.find(item => item.id === taskId);
    if (taskId && !task) return;
    const taskIds = key === 'remove' ? taskId ? [taskId] : [] : [];
    if (key === 'remove' && !taskIds.length) return;
    pending = { key, taskId, taskIds, revision: state.revision };
    committed = false;
    if (key === 'add' || key === 'edit') {
      const select = form.elements['nguoi-phu-trach'];
      select.replaceChildren(new Option('Chọn thành viên nhóm', ''));
      state.team.members.forEach(member => select.add(new Option(`${member.name} - ${member.code}`, member.code)));
      if (task) {
        form.elements['ten-cong-viec'].value = task.title;
        select.value = task.assigneeCode;
        form.elements['han-hoan-thanh'].value = task.deadline;
      }
    } else if (key === 'remove') dialog.querySelector('.delete-task-target strong').textContent = state.tasks.filter(item => taskIds.includes(item.id)).map(item => item.title).join('; ');
    else {
      const select = form.elements['ma-cong-viec'];
      select.replaceChildren(new Option('Chọn công việc', ''));
      state.tasks.filter(item => service.canUpdateTask(state, item)).forEach(item => select.add(new Option(item.title, item.id)));
    }
    dialog.showModal();
  }

  [addButton, updateButton].forEach(button => { button.removeAttribute('command'); button.removeAttribute('commandfor'); });
  dialogs.update.querySelector('[name="ma-cong-viec"]').addEventListener('change', event => {
    const form = event.target.form;
    const task = state?.tasks.find(item => item.id === event.target.value);
    form.elements['trang-thai'].value = task?.status || '';
    form.elements['muc-hoan-thanh'].value = Number.isFinite(task?.percent) ? task.percent : '';
  });
  addButton.addEventListener('click', () => open('add'));
  updateButton.addEventListener('click', () => open('update'));
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
      const form = event.currentTarget;
      const values = new FormData(form);
      let checked;
      if (key === 'add' || key === 'edit') checked = service.validateTask({ title: values.get('ten-cong-viec'), assigneeCode: values.get('nguoi-phu-trach'), deadline: values.get('han-hoan-thanh') }, state.team);
      if (key === 'update') checked = service.validateUpdate({ taskId: values.get('ma-cong-viec'), content: values.get('noi-dung-da-lam'), status: values.get('trang-thai'), percent: values.get('muc-hoan-thanh') });
      if (checked?.errors.length) { showError(key, new Error(checked.errors.map(error => error.message).join(' '))); return; }
      saving = true;
      try {
        if (key === 'remove') service.deleteTasks(projectId, pending.taskIds, pending.revision);
        else if (key === 'update') service.updateProgress(projectId, checked.value, pending.revision);
        else service.saveTask(projectId, pending.taskId, checked.value, pending.revision);
        committed = true;
        dialog.close();
        refresh();
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
