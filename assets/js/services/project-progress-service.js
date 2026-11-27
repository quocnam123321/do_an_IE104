(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const clone = value => JSON.parse(JSON.stringify(value));
  const newId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

  const defaultPercent = {
    'chua-thuc-hien': 0,
    'dang-thuc-hien': null,
    'da-hoan-thanh': 100,
  };

  function stateFrom(projectId, records, team, preview = false) {
    const initial = app.data.projectProgress.find(item => item.projectId === projectId)
      || (!preview && app.services.approvedProjects?.get(projectId)?.progress);
    if (!initial) throw new Error('Không tìm thấy dữ liệu tiến độ của đề tài.');
    const saved = records.find(item => item.projectId === projectId);
    const state = clone(saved || initial);
    if (saved && (saved.sampleTaskVersion ?? 0) < initial.sampleTaskVersion) {
      const ids = new Set(state.tasks.map(task => task.id));
      const leaderCode = team.members.find(member => member.role === 'nhom-truong')?.code;
      // Apply just the extra sample tasks. Keep saved work and honor deletions after the next write.
      for (const task of initial.tasks) {
        if (!task.id.startsWith(`${projectId}-sample-task-`) || ids.has(task.id)) continue;
        const assigneeCode = team.members.some(member => member.code === task.assigneeCode) ? task.assigneeCode : leaderCode || task.assigneeCode;
        state.tasks.push({ ...task, assigneeCode, assigneeCodes: [assigneeCode] });
      }
      state.sampleTaskVersion = initial.sampleTaskVersion;
    }
    return state;
  }

  function getState(projectId, { preview = false } = {}) {
    const team = app.services.projectTeams.getState(projectId, { preview });
    return { ...stateFrom(projectId, preview ? [] : app.storage.readProjectProgress(), team, preview), team };
  }

  function getPermissions(state) {
    if (state.team.preview) return { manage: false, update: false, reason: 'Đang xem tiến độ mẫu. Mở website qua localhost để xem dữ liệu đã lưu và cập nhật công việc.' };
    const member = state.team.members.find(item => item.code === app.data.currentStudent?.code);
    const active = state.team.project.status === 'dang-thuc-hien';
    return {
      manage: active && member?.role === 'nhom-truong',
      update: Boolean(active && member),
      reason: !active ? 'Đề tài không ở trạng thái Đang thực hiện nên chỉ được xem công việc và tiến độ.' : !member ? 'Chỉ thành viên của nhóm được cập nhật tiến độ.' : '',
    };
  }

  function canUpdateTask(state, task) {
    const permission = getPermissions(state);
    return permission.update && (permission.manage || (task.assigneeCodes || [task.assigneeCode]).includes(app.data.currentStudent.code));
  }

  function validateTask(input, team, { editing = false, previousDeadline } = {}) {
    const requestedCodes = input.assigneeCodes ?? [input.assigneeCode];
    const assigneeCodes = Array.isArray(requestedCodes)
      ? [...new Set(requestedCodes.map(code => String(code ?? '').trim()))]
      : [];
    const value = {
      title: String(input.title || '').trim(),
      assigneeCode: assigneeCodes[0] || '',
      assigneeCodes,
      deadline: String(input.deadline || '').trim(),
    };
    if (input.description !== undefined) value.description = String(input.description ?? '').trim();
    if (input.status !== undefined) value.status = input.status;

    const errors = [];
    if (!value.title || value.title.length > 200) errors.push({ field: 'title', message: 'Nhập tên công việc từ 1 đến 200 ký tự.' });
    const memberCodes = new Set(team.members.map(member => member.code));
    if (!assigneeCodes.length || assigneeCodes.some(code => !memberCodes.has(code))) {
      errors.push({ field: 'assigneeCode', message: 'Chọn ít nhất một người phụ trách trong nhóm hiện tại.' });
    }
    if (value.description?.length > 2000) errors.push({ field: 'description', message: 'Nhập mô tả tối đa 2000 ký tự.' });
    const validStatus = typeof value.status === 'string' && Object.hasOwn(defaultPercent, value.status) &&
      (editing || value.status !== 'da-hoan-thanh');
    if (value.status !== undefined && !validStatus) {
      errors.push({ field: 'status', message: editing ? 'Chọn trạng thái hợp lệ.' : 'Chọn trạng thái Chưa bắt đầu hoặc Đang thực hiện.' });
    }
    const date = new Date(`${value.deadline}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value.deadline) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.deadline) errors.push({ field: 'deadline', message: 'Chọn hạn hoàn thành là ngày hợp lệ.' });
    else if (value.deadline !== previousDeadline && value.deadline < new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10)) {
      errors.push({ field: 'deadline', message: 'Chọn ngày từ hôm nay trở đi.' });
    }
    return { errors, value };
  }

  function validateUpdate(input) {
    const value = { taskId: String(input.taskId || ''), content: String(input.content || '').trim(), status: String(input.status || ''), percent: String(input.percent ?? '').trim() === '' ? NaN : Number(input.percent) };
    const errors = [];
    if (!value.taskId) errors.push({ field: 'taskId', message: 'Chọn công việc cần cập nhật.' });
    if (!value.content || value.content.length > 2000) errors.push({ field: 'content', message: 'Nhập nội dung đã làm từ 1 đến 2000 ký tự.' });
    if (!Object.hasOwn(defaultPercent, value.status)) errors.push({ field: 'status', message: 'Chọn trạng thái hợp lệ.' });
    if (!Number.isInteger(value.percent) || value.percent < 0 || value.percent > 100) errors.push({ field: 'percent', message: 'Nhập mức hoàn thành là số nguyên từ 0 đến 100.' });
    else if ((value.status === 'chua-thuc-hien' && value.percent !== 0) || (value.status === 'dang-thuc-hien' && (value.percent === 0 || value.percent === 100)) || (value.status === 'da-hoan-thanh' && value.percent !== 100)) errors.push({ field: 'percent', message: 'Chưa thực hiện: 0%; Đang thực hiện: 1–99%; Đã hoàn thành: 100%.' });
    return { errors, value };
  }

  function mutate(projectId, revision, change) {
    const team = app.services.projectTeams.getState(projectId);
    const records = app.storage.readProjectProgress();
    const state = stateFrom(projectId, records, team);
    const permission = getPermissions({ ...state, team });
    if (!permission.update) throw new Error(permission.reason);
    if (!Number.isInteger(revision) || revision !== state.revision) throw new Error('Tiến độ đã thay đổi ở tab khác. Hãy đóng hộp thoại và mở lại để xem bản mới.');
    change(state, team, permission);
    state.revision += 1;
    state.updatedAt = new Date().toISOString();
    app.storage.writeProjectProgress([...records.filter(item => item.projectId !== projectId), state]);
    return { ...state, team };
  }

  function saveTask(projectId, taskId, input, revision) {
    return mutate(projectId, revision, (state, team, permission) => {
      if (!permission.manage) throw new Error('Chỉ nhóm trưởng được thêm hoặc sửa công việc.');
      const task = taskId ? state.tasks.find(item => item.id === taskId) : null;
      if (taskId && !task) throw new Error('Công việc không còn tồn tại.');
      const checked = validateTask(input, team, { editing: Boolean(taskId), previousDeadline: task?.deadline });
      if (checked.errors.length) throw new Error(checked.errors[0].message);
      const { status, ...fields } = checked.value;
      if (task) {
        Object.assign(task, fields);
        delete task.assignees;
        if (status !== undefined && status !== task.status) {
          task.status = status;
          task.percent = defaultPercent[status];
        }
      } else {
        const initialStatus = status ?? 'chua-thuc-hien';
        state.tasks.push({ ...fields, id: newId('CV'), status: initialStatus, percent: defaultPercent[initialStatus] });
      }
    });
  }

  function deleteTask(projectId, taskId, revision) {
    return deleteTasks(projectId, [taskId], revision);
  }

  function deleteTasks(projectId, taskIds, revision) {
    return mutate(projectId, revision, (state, team, permission) => {
      if (!permission.manage) throw new Error('Chỉ nhóm trưởng được xóa công việc.');
      if (!Array.isArray(taskIds) || !taskIds.length || new Set(taskIds).size !== taskIds.length) throw new Error('Chọn ít nhất một công việc hợp lệ để xóa.');
      if (taskIds.some(id => typeof id !== 'string' || !state.tasks.some(task => task.id === id))) throw new Error('Công việc không còn tồn tại.');
      state.tasks = state.tasks.filter(task => !taskIds.includes(task.id));
    });
  }

  function updateProgress(projectId, input, revision) {
    return mutate(projectId, revision, (state, team) => {
      const checked = validateUpdate(input);
      if (checked.errors.length) throw new Error(checked.errors[0].message);
      const value = checked.value;
      const task = state.tasks.find(item => item.id === value.taskId);
      if (!task) throw new Error('Công việc không còn tồn tại.');
      if (!canUpdateTask({ ...state, team }, task)) throw new Error('Bạn chỉ được cập nhật công việc được phân công cho mình.');
      task.status = value.status;
      task.percent = value.percent;
      state.history.unshift({ ...value, id: newId('UPDATE'), taskTitle: task.title, actorCode: app.data.currentStudent.code, actorName: team.members.find(member => member.code === app.data.currentStudent.code)?.name || app.data.currentStudent.name, createdAt: new Date().toISOString() });
    });
  }

  function summarize(state) {
    const total = state.tasks.length;
    const completed = state.tasks.filter(task => task.status === 'da-hoan-thanh').length;
    const partialsKnown = state.tasks.every(task => Number.isFinite(task.percent));
    return { total, completed, remaining: total - completed, percent: total ? Math.round(partialsKnown ? state.tasks.reduce((sum, task) => sum + task.percent, 0) / total : completed / total * 100) : 0, method: partialsKnown ? 'task-average' : 'completed-ratio' };
  }

  app.services.projectProgress = { getState, getPermissions, canUpdateTask, validateTask, validateUpdate, saveTask, deleteTask, deleteTasks, updateProgress, summarize };
})();
