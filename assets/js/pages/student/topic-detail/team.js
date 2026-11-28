(() => {
  const service = globalThis.IE104?.services?.projectTeams;
  const projectId = document.body.dataset.projectId;
  if (!service || !projectId) return;
  if (document.body.hasAttribute('data-archived-sample')) {
    const message = document.createElement('li');
    message.textContent = 'Chưa có dữ liệu thành viên của nhóm này.';
    document.querySelector('.topic-team__members').replaceChildren(message);
    document.querySelector('.project-team__note').hidden = true;
    document.querySelector('[data-team-notice]').hidden = true;
    document.querySelector('.pending-invitations').hidden = true;
    document.body.dataset.teamReady = 'true';
    return;
  }
  const preview = location.protocol === 'file:';
  const memberDialog = document.getElementById('add-team-member-dialog');
  const inviteDialog = document.getElementById('invite-supervisor-dialog');
  const inviteSuccess = document.getElementById('invite-supervisor-success');
  const memberForm = document.getElementById('add-team-member-form');
  const inviteForm = document.getElementById('invite-supervisor-form');
  const addButton = document.getElementById('add-team-member-button');
  const inviteButton = document.getElementById('invite-supervisor-button');
  const inviteSubmit = document.getElementById('send-invite-supervisor');
  const search = document.getElementById('supervisor-search');
  const results = document.getElementById('supervisor-search-results');
  const inviteOption = document.getElementById('invite-supervisor-option');
  const inviteSearchStatus = inviteForm.querySelector('[data-invite-search-status]');
  const capacity = document.querySelector('.project-team__note');
  const capacityLimit = capacity.querySelector('[data-team-capacity]');
  const fullMessage = capacity.querySelector('[data-team-full-message]');
  const notice = document.querySelector('[data-team-notice]');
  const memberError = document.querySelector('[data-member-error]');
  const inviteError = document.querySelector('[data-invite-error]');
  const cancelDialog = document.getElementById('cancel-team-invitation-dialog');
  const cancelSuccess = document.getElementById('cancel-team-invitation-success');
  const cancelError = document.querySelector('[data-cancel-invitation-error]');
  const cancelConfirm = document.querySelector('[data-confirm-cancel-invitation]');
  const members = document.querySelector('.topic-team__members');
  const memberTemplate = members.firstElementChild.cloneNode(true);
  const groupName = document.querySelector('.topic-team__group-name');
  const teamTitle = document.getElementById('team-title');
  let state = null;
  let memberRevision = 0;
  let inviteRevision = 0;
  let selectedLecturer = '';
  let inviteOptions = [];
  let inviteLoad = 0;
  let pendingCancel = null;
  let saving = false;

  function showError(node, failure) {
    node.textContent = failure.message;
    node.hidden = false;
    node.focus();
  }

  function refresh() {
    try {
      state = service.getState(projectId, { preview });
      const participants = globalThis.IE104.services.lecturerTopics.supervisedParticipants(state.project, state.members);
      groupName.textContent = participants.label;
      groupName.hidden = !participants.isGroup;
      teamTitle.textContent = participants.isGroup ? 'Nhóm thực hiện' : 'Sinh viên thực hiện';
      const permission = service.getPermission(state);
      notice.textContent = permission.reason;
      notice.hidden = !permission.reason;
      const full = state.members.length >= state.maxMembers;
      addButton.disabled = !permission.allowed || full;
      inviteButton.disabled = !permission.allowed;
      memberForm.querySelector('button[type="submit"]').disabled = !permission.allowed || full;
      inviteSubmit.disabled = !permission.allowed || !selectedLecturer || saving;
      capacityLimit.textContent = `tối đa ${state.maxMembers} thành viên`;
      fullMessage.hidden = !full;
      members.replaceChildren(...state.members.map(member => {
        const item = memberTemplate.cloneNode(true);
        const initials = member.name.trim().split(/\s+/).slice(-2).map(part => part[0]).join('').toUpperCase();
        item.querySelector('.team-member__avatar').textContent = initials;
        item.querySelector('.team-member__name').textContent = member.name;
        item.querySelector('.team-member__id').textContent = participants.isGroup ? member.code : participants.code || member.code;
        const role = item.querySelector('.team-member__role');
        role.textContent = member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên';
        return item;
      }));
      renderInvitations(state.invitations, permission.allowed);
      return true;
    } catch (failure) {
      state = null;
      notice.textContent = failure.message;
      addButton.disabled = true;
      inviteButton.disabled = true;
      memberForm.querySelector('button[type="submit"]').disabled = true;
      inviteSubmit.disabled = true;
      document.querySelectorAll('.pending-invitation__cancel').forEach(button => { button.disabled = true; });
      return false;
    }
  }

  const { normalizeSearch, departmentLabel, selectionDepartment } = globalThis.IE104SupervisionEntry;

  function renderInvitations(invitations, canManage) {
    const section = document.querySelector('.pending-invitations');
    const list = section.querySelector('.pending-invitations__list');
    const visible = invitations.filter(invitation => invitation.status !== 'cancelled');
    section.hidden = visible.length === 0;

    const directory = visible.some(invitation => invitation.lecturerId.startsWith('giang-vien-'))
      ? globalThis.IE104SupervisionEntry?.getTeachers().catch(() => [])
      : null;

    list.replaceChildren(...visible.map(invitation => {
      const lecturer = globalThis.IE104.data.projectLecturers.find(item => item.id === invitation.lecturerId);
      const knownName = invitation.lecturerName || lecturer?.name;
      const lecturerName = knownName || 'Giảng viên không còn trong danh mục';
      const item = document.createElement('li');
      item.className = 'pending-invitation supervisor-card';

      const avatar = document.createElement('span');
      avatar.className = 'supervisor-card__avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = knownName ? knownName.trim().split(/\s+/).slice(-2).map(part => part[0]).join('') : 'GV';

      const content = document.createElement('div');
      content.className = 'supervisor-card__content';
      const name = document.createElement('p');
      name.className = 'supervisor-card__name';
      name.textContent = lecturerName;
      const department = document.createElement('p');
      department.className = 'supervisor-card__department';
      department.textContent = departmentLabel(lecturer?.department);
      const date = document.createElement('p');
      date.className = 'pending-invitation__meta';
      date.textContent = 'Ngày gửi: ' + new Date(invitation.createdAt).toLocaleDateString('vi-VN');
      content.append(name, department, date);
      if (invitation.status === 'accepted' || invitation.status === 'rejected') {
        const status = document.createElement('p');
        status.className = 'pending-invitation__status';
        status.dataset.status = invitation.status;
        status.textContent = invitation.status === 'accepted' ? 'Đã đồng ý đồng hướng dẫn' : 'Đã từ chối';
        content.append(status);
      }
      if (invitation.decidedAt) {
        const decisionDate = document.createElement('p');
        decisionDate.className = 'pending-invitation__meta';
        decisionDate.textContent = new Date(invitation.decidedAt).toLocaleString('vi-VN');
        content.append(decisionDate);
      }
      if (invitation.decisionNote) {
        const reason = document.createElement('p');
        reason.textContent = invitation.decisionNote;
        content.append(reason);
      }
      const actions = document.createElement('div');
      actions.className = 'pending-invitation__actions';
      if (invitation.thread) {
        const thread = document.createElement('a');
        thread.className = 'pending-invitation__thread';
        thread.href = `de-tai-cua-toi-sinh-vien.html?loi-moi=${encodeURIComponent(invitation.id)}#loi-moi-huong-dan`;
        thread.textContent = 'Xem trao đổi';
        actions.append(thread);
      }

      item.append(avatar, content);
      if (invitation.thread || invitation.status === 'pending') item.append(actions);
      directory?.then(lecturers => {
        const profile = lecturers.find(lecturer => lecturer.id === invitation.lecturerId);
        if (profile) department.textContent = departmentLabel(profile.department);
      });
      if (invitation.status !== 'pending') return item;

      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'pending-invitation__cancel';
      cancel.textContent = 'Hủy';
      cancel.disabled = !canManage;
      cancel.setAttribute('aria-label', 'Hủy lời mời ' + lecturerName);
      cancel.setAttribute('aria-haspopup', 'dialog');
      cancel.setAttribute('aria-controls', 'cancel-team-invitation-dialog');
      cancel.addEventListener('click', () => {
        try {
          const current = service.getState(projectId);
          if (!service.getPermission(current).allowed) { refresh(); return; }
          pendingCancel = { id: invitation.id, revision: current.revision };
        } catch (failure) { notice.textContent = failure.message; return; }
        document.querySelector('[data-cancel-invitation-name]').textContent = lecturerName;
        cancelError.hidden = true;
        cancelDialog.showModal();
      });

      actions.append(cancel);
      return item;
    }));
  }

  function updateResults() {
    if (!inviteOptions.length) return;
    const query = normalizeSearch(search.value);
    let hasMatch = false;
    for (const { option, keywords } of inviteOptions) {
      option.hidden = !keywords.includes(query);
      hasMatch ||= !option.hidden;
    }
    const hiddenSelection = results.querySelector('label[hidden] input:checked');
    if (hiddenSelection) {
      hiddenSelection.checked = false;
      selectedLecturer = '';
      inviteSubmit.disabled = true;
    }
    results.hidden = !hasMatch;
    results.scrollTop = 0;
    inviteSearchStatus.hidden = hasMatch;
    inviteSearchStatus.textContent = hasMatch ? '' : 'Không tìm thấy giảng viên phù hợp.';
  }

  function renderInviteOptions(lecturers) {
    inviteOptions = lecturers.map(lecturer => {
      const option = inviteOption.content.firstElementChild.cloneNode(true);
      option.querySelector('input').value = lecturer.id;
      option.querySelector('.supervisor-dialog__name').textContent = lecturer.name;
      const specialty = selectionDepartment(lecturer);
      option.querySelector('.supervisor-dialog__specialty').textContent = specialty;
      return {
        option,
        keywords: normalizeSearch(`${lecturer.name} ${specialty} ${lecturer.email}`),
      };
    });
    results.replaceChildren(...inviteOptions.map(({ option }) => option));
    if (!inviteOptions.length) {
      inviteSearchStatus.textContent = 'Không còn giảng viên có thể mời cho đề tài này.';
      return;
    }
    updateResults();
  }

  [addButton, inviteButton].forEach(button => {
    button.removeAttribute('command');
    button.removeAttribute('commandfor');
  });
  memberForm.noValidate = true;
  memberDialog.querySelector('.team-member-dialog__close').addEventListener('click', () => memberDialog.close());
  addButton.addEventListener('click', () => {
    if (!refresh() || !service.getPermission(state).allowed || state.members.length >= state.maxMembers) return;
    memberRevision = state.revision;
    memberForm.reset();
    memberError.hidden = true;
    memberForm.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
    memberDialog.showModal();
  });
  inviteButton.addEventListener('click', async () => {
    if (!refresh() || !service.getPermission(state).allowed) return;
    const load = ++inviteLoad;
    inviteRevision = state.revision;
    inviteForm.reset();
    selectedLecturer = '';
    inviteOptions = [];
    results.replaceChildren();
    results.hidden = true;
    inviteError.hidden = true;
    inviteSubmit.disabled = true;
    inviteSearchStatus.hidden = false;
    inviteSearchStatus.textContent = 'Đang tải danh sách giảng viên…';
    inviteDialog.showModal();

    try {
      const lecturers = await service.getLecturers(projectId);
      if (inviteDialog.open && load === inviteLoad) renderInviteOptions(lecturers);
    } catch (failure) {
      if (!inviteDialog.open || load !== inviteLoad) return;
      inviteSearchStatus.hidden = true;
      inviteError.textContent = failure.message;
      inviteError.hidden = false;
    }
  });
  search.addEventListener('input', updateResults);
  search.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.isComposing) event.preventDefault();
  });
  results.addEventListener('change', event => {
    selectedLecturer = event.target.value;
    inviteSubmit.disabled = saving || !state || !service.getPermission(state).allowed;
    inviteError.hidden = true;
  });
  memberForm.addEventListener('submit', event => {
    event.preventDefault();
    if (saving || !state) return;
    const fields = {
      name: document.getElementById('new-team-member-name'),
      code: document.getElementById('new-team-member-code'),
    };
    Object.values(fields).forEach(field => field.removeAttribute('aria-invalid'));
    memberError.hidden = true;
    const input = { name: fields.name.value, code: fields.code.value, role: 'thanh-vien' };
    const checked = service.validateMember(input, state);
    if (checked.errors.length) {
      showError(memberError, new Error(checked.errors.map(error => error.message).join(' ')));
      checked.errors.forEach(error => fields[error.field]?.setAttribute('aria-invalid', 'true'));
      fields[checked.errors[0].field]?.focus();
      return;
    }
    saving = true;
    try {
      service.addMember(projectId, checked.value, memberRevision);
      memberDialog.close();
      refresh();
      (addButton.disabled ? teamTitle : addButton).focus({ preventScroll: true });
    } catch (failure) { showError(memberError, failure); }
    finally { saving = false; }
  });
  inviteForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving || !state || !selectedLecturer || !service.getPermission(state).allowed) return;
    saving = true;
    inviteSubmit.disabled = true;
    inviteError.hidden = true;
    try {
      await service.inviteSupervisor(projectId, selectedLecturer, '', inviteRevision);
      inviteDialog.close();
      selectedLecturer = '';
      refresh();
      inviteSuccess.showModal();
    } catch (failure) {
      if (inviteDialog.open) showError(inviteError, failure);
    } finally {
      saving = false;
      inviteSubmit.disabled = !state || !selectedLecturer || !service.getPermission(state).allowed;
    }
  });
  cancelConfirm.addEventListener('click', async () => {
    if (saving || !cancelDialog.open || !pendingCancel) return;
    saving = true;
    cancelError.hidden = true;
    try {
      await service.cancelInvitation(projectId, pendingCancel.id, pendingCancel.revision);
      cancelDialog.close();
      refresh();
      cancelSuccess.showModal();
    } catch (failure) { showError(cancelError, failure); }
    finally { saving = false; }
  });
  cancelDialog.addEventListener('close', () => {
    if (!cancelDialog.open) pendingCancel = null;
  });
  inviteSuccess.addEventListener('close', () => inviteButton.focus({ preventScroll: true }));
  cancelSuccess.addEventListener('close', () => inviteButton.focus({ preventScroll: true }));
  window.addEventListener('storage', event => { if ([globalThis.IE104.storage.teamKey, globalThis.IE104.storage.teachingKey, null].includes(event.key)) refresh(); });
  document.addEventListener('ie104:project-team-updated', refresh);
  globalThis.IE104Supervision?.subscribe(refresh);
  window.addEventListener('pageshow', refresh);
  refresh();
  document.body.dataset.teamReady = 'true';
})();
