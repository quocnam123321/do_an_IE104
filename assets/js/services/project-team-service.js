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

  function supervisorIds(team, state) {
    return [...new Set([...team.supervisorIds, ...state.invitations.filter(item => item.status === 'accepted').map(item => item.lecturerId)])];
  }

  function getState(projectId, { preview = false } = {}) {
    const { project, team } = getDefinition(projectId, preview);
    const state = stateFrom(team, preview ? [] : app.storage.readProjectTeams());
    if (!preview && globalThis.IE104Supervision) {
      const threads = globalThis.IE104Supervision.getAll().filter(record => record.projectId === projectId);
      state.invitations.push(...threads.map(record => ({
        id: record.id, lecturerId: record.teacher.id, lecturerName: record.teacher.name,
        status: record.status, createdAt: record.createdAt, thread: true,
        decidedAt: record.decision?.at, decisionNote: record.decision?.note,
      })));
    }
    return { ...state, project: clone(project), maxMembers: team.maxMembers, supervisorIds: supervisorIds(team, state), ...(preview ? { preview } : {}) };
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
    const pending = state.invitations.filter(invitation => ['pending', 'accepted'].includes(invitation.status));
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
    checkChange({ ...state, project }, revision);
    change(state, team);
    state.revision += 1;
    state.updatedAt = new Date().toISOString();
    const next = records.filter(item => item.projectId !== projectId);
    app.storage.writeProjectTeams([...next, state]);
    if (typeof document !== 'undefined') document.dispatchEvent(new Event('ie104:project-team-updated'));
    return { ...clone(state), project: clone(project), maxMembers: team.maxMembers, supervisorIds: supervisorIds(team, state) };
  }

  function addMember(projectId, input, revision) {
    return mutate(projectId, revision, (state, team) => {
      const checked = validateMember(input, { ...state, maxMembers: team.maxMembers });
      if (checked.errors.length) throw new Error(checked.errors[0].message);
      state.members.push(checked.value);
    });
  }

  async function inviteSupervisor(projectId, lecturerId, message, revision) {
    const entry = globalThis.IE104SupervisionEntry;
    const store = globalThis.IE104Supervision;
    const [lecturers, student] = await Promise.all([entry.getTeachers(), store ? entry.getStudent() : null]);
    const lecturer = lecturers.find(item => item.id === lecturerId);
    if (!lecturer) throw new Error('Chọn giảng viên từ danh sách kết quả.');
    if (!store) {
      return mutate(projectId, revision, (state, team) => {
        if (!canInvite(lecturer, { ...state, supervisorIds: supervisorIds(team, state) })) {
          throw new Error('Giảng viên đã tham gia đề tài hoặc đã có lời mời đang chờ.');
        }
        if (state.invitations.some(item => item.status === 'accepted')) throw new Error('Đề tài đã có giảng viên đồng hướng dẫn được mời.');
        const text = String(message || '').trim();
        if (text.length > 2000) throw new Error('Lời nhắn tối đa 2000 ký tự.');
        state.invitations.push({ id: `INV-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`, lecturerId, lecturerName: lecturer.name, lecturerEmail: lecturer.email || '', lecturerDepartment: lecturer.department || '', role: 'secondary', message: text, status: 'pending', createdAt: new Date().toISOString() });
      });
    }
    if (!student) throw new Error('Đăng nhập bằng tài khoản sinh viên để tiếp tục gửi lời mời hướng dẫn.');

    const state = getState(projectId);
    checkChange(state, revision);
    if (!canInvite(lecturer, state)) throw new Error('Giảng viên đã tham gia đề tài hoặc đã có lời mời đang chờ.');
    if (state.invitations.some(item => item.status === 'accepted')) throw new Error('Đề tài đã có giảng viên đồng hướng dẫn được mời.');
    return store.create({
      student, teacher: lecturer, projectId, subject: state.project.title.slice(0, 120),
      message: String(message || '').trim() || 'Nhóm em trân trọng mời thầy/cô đồng hướng dẫn đề tài này.',
    });
  }

  function checkChange(state, revision) {
    const permission = getPermission(state);
    if (!permission.allowed) throw new Error(permission.reason);
    if (!Number.isInteger(revision) || revision !== state.revision) throw new Error('Thông tin nhóm đã thay đổi ở tab khác. Hãy đóng hộp thoại và mở lại để xem bản mới.');
  }

  function cancelInvitation(projectId, invitationId, revision) {
    const state = getState(projectId);
    checkChange(state, revision);
    const invitation = state.invitations.find(item => item.id === invitationId);
    if (invitation?.thread) {
      return globalThis.IE104SupervisionEntry.getStudent().then(student =>
        globalThis.IE104Supervision.cancelProjectInvitation(invitationId, student?.id, projectId));
    }
    return mutate(projectId, revision, state => {
      const invitation = state.invitations.find(item => item.id === invitationId);
      if (!invitation || invitation.status !== 'pending') throw new Error('Lời mời này không còn ở trạng thái đang chờ.');
      invitation.status = 'cancelled';
      invitation.cancelledAt = new Date().toISOString();
    });
  }

  function canReview(invitation, recipient) {
    if (typeof recipient === 'string') return invitation.lecturerId === recipient;
    return recipient && (recipient.demo === true && recipient.id === 'GV001' || invitation.lecturerId === recipient.id);
  }

  function listInvitations(lecturerId) {
    const definitions = [...(app.data.myTopics || []), ...(app.data.lecturerProjects || []), ...(app.services.approvedProjects?.list('student') || [])];
    const seen = new Set();
    const result = [];
    for (const project of definitions) {
      if (seen.has(project.id)) continue;
      seen.add(project.id);
      const state = getState(project.id);
      for (const invitation of state.invitations) {
        if (!invitation.thread && canReview(invitation, lecturerId) && invitation.status === 'pending' && project.status === 'dang-thuc-hien') result.push({ project: clone(project), invitation: clone(invitation), revision: state.revision, members: state.members });
      }
    }
    return result.sort((a, b) => Date.parse(b.invitation.createdAt) - Date.parse(a.invitation.createdAt));
  }

  async function invitationDetail(projectId, invitationId) {
    const recipient = await app.services.invitationIdentity.resolve();
    if (!recipient) throw new Error('Đăng nhập bằng tài khoản giảng viên để xem lời mời.');
    const state = getState(projectId);
    const invitation = state.invitations.find(item => item.id === invitationId && canReview(item, recipient));
    if (!invitation || invitation.status !== 'pending') throw new Error('Lời mời đã được xử lý hoặc không gửi đến giảng viên hiện tại.');
    if (state.project.status !== 'dang-thuc-hien') throw new Error('Đề tài không còn ở trạng thái đang thực hiện.');
    return { ...state, invitation: clone(invitation), recipient };
  }

  async function respondInvitation(projectId, invitationId, status, note, revision) {
    if (!['accepted', 'rejected'].includes(status)) throw new Error('Chọn phản hồi hợp lệ.');
    const recipient = await app.services.invitationIdentity.resolve();
    if (!recipient) throw new Error('Đăng nhập bằng tài khoản giảng viên để phản hồi lời mời.');
    const { project, team } = getDefinition(projectId);
    const records = app.storage.readProjectTeams();
    const state = stateFrom(team, records);
    if (state.revision !== revision) throw new Error('Lời mời đã thay đổi. Đóng hộp thoại và mở lại để xem thông tin mới.');
    if (project.status !== 'dang-thuc-hien') throw new Error('Đề tài đã kết thúc nên không thể xử lý lời mời.');
    const invitation = state.invitations.find(item => item.id === invitationId);
    if (!invitation || !canReview(invitation, recipient)) throw new Error('Lời mời không gửi đến giảng viên hiện tại.');
    if (invitation.status !== 'pending') throw new Error('Lời mời này đã được xử lý hoặc đã hủy.');
    const reason = String(note || '').trim();
    if (reason.length > 2000 || status === 'rejected' && reason.length < 10) throw new Error('Lý do từ chối cần từ 10 đến 2000 ký tự, không tính khoảng trắng ở hai đầu.');
    if (status === 'accepted') {
      if (supervisorIds(team, state).includes(invitation.lecturerId)) throw new Error('Giảng viên đã tham gia hướng dẫn đề tài này.');
      if (state.invitations.some(item => item.status === 'accepted')) throw new Error('Đề tài đã có giảng viên đồng hướng dẫn được mời.');
    }
    Object.assign(invitation, { status, decisionNote: reason, decidedAt: new Date().toISOString(), decidedBy: recipient.id, ...(recipient.demo ? { demoDecision: true } : {}) });
    state.revision++;
    state.updatedAt = invitation.decidedAt;
    app.storage.writeProjectTeams([...records.filter(item => item.projectId !== projectId), state]);
    document.dispatchEvent(new Event('ie104:project-team-updated'));
    return getState(projectId);
  }

  app.services.projectTeams = { listInvitations, invitationDetail, respondInvitation, getState, getPermission, validateMember, getLecturers, addMember, inviteSupervisor, cancelInvitation };
})();
