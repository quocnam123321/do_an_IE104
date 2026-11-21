(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const clone = value => JSON.parse(JSON.stringify(value));

  function getDefinition(projectId, preview = false) {
    const existingProject = app.data.myTopics.find(item => item.id === projectId) || app.data.lecturerProjects?.find(item => item.id === projectId);
    const existingTeam = app.data.projectTeams.find(item => item.projectId === projectId);
    const approved = !preview && (!existingProject || !existingTeam) ? app.services.approvedProjects?.get(projectId) : null;
    const project = existingProject || approved?.project;
    const team = existingTeam || approved?.team;
    if (!project || !team) throw new Error('Không tìm thấy thông tin nhóm của đề tài.');
    return { project, team };
  }

  function stateFrom(team, records) {
    const saved = records.find(item => item.projectId === team.projectId);
    return clone(saved || { projectId: team.projectId, revision: 0, members: team.members, invitations: team.invitations });
  }

  function getState(projectId, { preview = false } = {}) {
    const { project, team } = getDefinition(projectId, preview);
    const state = stateFrom(team, preview ? [] : app.storage.readProjectTeams());
    return { ...state, project: clone(project), maxMembers: team.maxMembers, supervisorIds: [...team.supervisorIds], ...(preview ? { preview } : {}) };
  }

  function getPermission(state) {
    if (state.preview) return { allowed: false, reason: 'Đang xem thông tin nhóm mẫu. Mở website qua localhost để xem dữ liệu đã lưu và thay đổi thành viên hoặc lời mời.' };
    if (state.project.status !== 'dang-thuc-hien') return { allowed: false, reason: 'Đề tài hiện không ở trạng thái Đang thực hiện nên chỉ được xem thông tin nhóm và lời mời.' };
    if (!state.members.some(member => member.code === app.data.currentStudent?.code && member.role === 'nhom-truong')) return { allowed: false, reason: 'Chỉ nhóm trưởng được thêm thành viên, mời hoặc hủy lời mời giảng viên.' };
    return { allowed: true, reason: '' };
  }

  function validateMember(input, state) {
    const value = { code: String(input.code || '').trim().toUpperCase(), name: String(input.name || '').trim(), role: String(input.role || '') };
    const errors = [];
    if (!value.name || value.name.length > 100) errors.push({ field: 'name', message: 'Nhập họ tên từ 1 đến 100 ký tự.' });
    if (!value.code || value.code.length > 20 || /\s/.test(value.code)) errors.push({ field: 'code', message: 'Nhập MSSV tối đa 20 ký tự, không có khoảng trắng.' });
    if (state.members.some(member => member.code.toUpperCase() === value.code)) errors.push({ field: 'code', message: 'MSSV này đã có trong nhóm.' });
    if (state.members.length >= state.maxMembers) errors.push({ field: 'members', message: `Nhóm đã đủ ${state.maxMembers} thành viên.` });
    if (value.role !== 'thanh-vien') errors.push({ field: 'role', message: 'Nhóm đã có nhóm trưởng. Thành viên mới phải có vai trò Thành viên.' });
    return { errors, value };
  }

  function canInvite(lecturer, state) {
    const pending = state.invitations.filter(invitation => invitation.status === 'pending');
    const excluded = [...state.supervisorIds, ...pending.map(invitation => invitation.lecturerId)];
    if (excluded.includes(lecturer.id)) return false;
    return !lecturer.email || !app.data.projectLecturers.some(existing =>
      excluded.includes(existing.id) && existing.email?.toLowerCase() === lecturer.email.toLowerCase());
  }

  async function getLecturers(projectId) {
    const lecturers = await globalThis.IE104SupervisionEntry.getTeachers();
    const state = getState(projectId);
    return lecturers.filter(lecturer => canInvite(lecturer, state));
  }

  function mutate(projectId, revision, change) {
    const { project, team } = getDefinition(projectId);
    const records = app.storage.readProjectTeams();
    const state = stateFrom(team, records);
    const permission = getPermission({ ...state, project });
    if (!permission.allowed) throw new Error(permission.reason);
    if (!Number.isInteger(revision) || revision !== state.revision) throw new Error('Thông tin nhóm đã thay đổi ở tab khác. Hãy đóng hộp thoại và mở lại để xem bản mới.');
    change(state, team);
    state.revision += 1;
    state.updatedAt = new Date().toISOString();
    const next = records.filter(item => item.projectId !== projectId);
    app.storage.writeProjectTeams([...next, state]);
    return { ...clone(state), project: clone(project), maxMembers: team.maxMembers, supervisorIds: [...team.supervisorIds] };
  }

  function addMember(projectId, input, revision) {
    return mutate(projectId, revision, (state, team) => {
      const checked = validateMember(input, { ...state, maxMembers: team.maxMembers });
      if (checked.errors.length) throw new Error(checked.errors[0].message);
      state.members.push(checked.value);
    });
  }

  async function inviteSupervisor(projectId, lecturerId, message, revision) {
    const lecturers = await globalThis.IE104SupervisionEntry.getTeachers();
    const lecturer = lecturers.find(item => item.id === lecturerId);
    if (!lecturer) throw new Error('Chọn giảng viên từ danh sách kết quả.');

    return mutate(projectId, revision, (state, team) => {
      if (!canInvite(lecturer, { ...state, supervisorIds: team.supervisorIds })) {
        throw new Error('Giảng viên đã tham gia đề tài hoặc đã có lời mời đang chờ.');
      }
      const text = String(message || '').trim();
      if (text.length > 2000) throw new Error('Lời nhắn tối đa 2000 ký tự.');
      state.invitations.push({ id: `INV-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`, lecturerId, lecturerName: lecturer.name, message: text, status: 'pending', createdAt: new Date().toISOString() });
    });
  }

  function cancelInvitation(projectId, invitationId, revision) {
    return mutate(projectId, revision, state => {
      const invitation = state.invitations.find(item => item.id === invitationId);
      if (!invitation || invitation.status !== 'pending') throw new Error('Lời mời này không còn ở trạng thái đang chờ.');
      invitation.status = 'cancelled';
      invitation.cancelledAt = new Date().toISOString();
    });
  }

  app.services.projectTeams = { getState, getPermission, validateMember, getLecturers, addMember, inviteSupervisor, cancelInvitation };
})();
