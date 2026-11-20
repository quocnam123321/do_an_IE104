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
  const notice = panel.querySelector('[data-progress-notice]');
  const result = panel.querySelector('[data-progress-result]');
  const dialogs = { add: document.getElementById('task-add-popover'), edit: document.getElementById('task-edit-cv-01'), remove: document.getElementById('task-delete-cv-01'), update: document.getElementById('progress-update-popover') };
  const labels = { 'chua-thuc-hien': 'Chưa thực hiện', 'dang-thuc-hien': 'Đang thực hiện', 'da-hoan-thanh': 'Đã hoàn thành' };
  let state = null;
  let pending = null;
  let saving = false;
  let committed = false;
  const errors = {};

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
          article?.querySelector(`[data-progress-action="${key}"]`)?.focus({ preventScroll: true });
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
      notice.textContent = permissions.reason || (permissions.manage ? 'Nhóm trưởng quản lý công việc và cập nhật tiến độ. Thao tác thử chỉ lưu trên trình duyệt.' : 'Bạn được cập nhật công việc được phân công. Chỉ nhóm trưởng được thêm, sửa hoặc xóa công việc.');
      addButton.disabled = !permissions.manage;
      updateButton.disabled = !state.tasks.some(task => service.canUpdateTask(state, task));
      const summary = service.summarize(state);
      panel.querySelector('#overall-progress').value = summary.percent;
      panel.querySelector('#overall-progress').textContent = `${summary.percent}%`;
      panel.querySelector('.overall-progress__text').textContent = `${summary.percent}%`;
      panel.querySelectorAll('.progress-stat-item dd').forEach((node, index) => { node.textContent = [summary.total, summary.completed, summary.remaining][index]; });
      list.replaceChildren(...state.tasks.map((task, index) => {
        const item = cardTemplate.cloneNode(true);
        const article = item.querySelector('article');
        const title = item.querySelector('h3');
        article.id = `task-record-${index}`;
        article.dataset.taskId = task.id;
        title.id = `task-record-${index}-title`;
        title.textContent = task.title;
        article.setAttribute('aria-labelledby', title.id);
        const paragraphs = item.querySelectorAll('.task-card__content p');
        const assignee = state.team.members.find(member => member.code === task.assigneeCode);
        paragraphs[0].textContent = `Người phụ trách: ${assignee?.name || 'Không còn trong nhóm'} - ${task.assigneeCode}`;
        paragraphs[1].textContent = `Hạn hoàn thành dự kiến: ${dateText(task.deadline)}`;
        const status = document.createElement('p');
        status.textContent = `${labels[task.status]} - ${task.percent === null ? 'Chưa có % cụ thể' : `${task.percent}%`}`;
        item.querySelector('.task-card__content').append(status);
        item.querySelectorAll('.task-card__actions button').forEach((button, buttonIndex) => {
          button.removeAttribute('command');
          button.removeAttribute('commandfor');
          button.dataset.progressAction = buttonIndex === 0 ? 'edit' : 'remove';
          button.setAttribute('aria-controls', buttonIndex === 0 ? dialogs.edit.id : dialogs.remove.id);
          button.setAttribute('aria-label', `${buttonIndex === 0 ? 'Sửa' : 'Xóa'} công việc: ${task.title}`);
          button.disabled = !permissions.manage;
        });
        return item;
      }));
      if (!state.tasks.length) { const empty = document.createElement('li'); empty.textContent = 'Chưa có công việc.'; list.append(empty); }
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
      return true;
    } catch (failure) {
      state = null;
      notice.textContent = failure.message;
      panel.querySelectorAll('button[command="show-modal"], [data-progress-action], .btn-add-task, .btn-update-progress, button[type="submit"]').forEach(button => { button.disabled = true; });
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
    pending = { key, taskId, revision: state.revision };
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
    } else if (key === 'remove') dialog.querySelector('.delete-task-target strong').textContent = task.title;
    else {
      const select = form.elements['ma-cong-viec'];
      select.replaceChildren(new Option('Chọn công việc', ''));
      state.tasks.filter(item => service.canUpdateTask(state, item)).forEach(item => select.add(new Option(item.title, item.id)));
    }
    dialog.showModal();
  }

  [addButton, updateButton].forEach(button => { button.removeAttribute('command'); button.removeAttribute('commandfor'); });
  addButton.addEventListener('click', () => open('add'));
  updateButton.addEventListener('click', () => open('update'));
  list.addEventListener('click', event => {
    const button = event.target.closest('[data-progress-action]');
    if (!button || button.disabled) return;
    open(button.dataset.progressAction, button.closest('[data-task-id]').dataset.taskId);
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
        if (key === 'remove') service.deleteTask(projectId, pending.taskId, pending.revision);
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
