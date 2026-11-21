(() => {
  const service = globalThis.IE104?.services?.projectTeams;
  const projectId = document.body.dataset.projectId;
  if (!service || !projectId) return;
  const preview = location.protocol === 'file:';
  const memberDialog = document.getElementById('add-team-member-dialog');
  const inviteDialog = document.getElementById('invite-supervisor-dialog');
  const memberForm = document.getElementById('add-team-member-form');
  const inviteForm = document.getElementById('invite-supervisor-form');
  const addButton = document.getElementById('add-team-member-button');
  const inviteButton = document.getElementById('invite-supervisor-button');
  const inviteSubmit = document.getElementById('send-invite-supervisor');
  const search = document.getElementById('supervisor-search');
  const results = document.getElementById('supervisor-search-results');
  const notice = document.querySelector('[data-team-notice]');
  const result = document.querySelector('[data-team-result]');
  const memberError = document.querySelector('[data-member-error]');
  const inviteError = document.querySelector('[data-invite-error]');
  const cancelDialog = document.getElementById('cancel-team-invitation-dialog');
  const cancelError = document.querySelector('[data-cancel-invitation-error]');
  const cancelConfirm = document.querySelector('[data-confirm-cancel-invitation]');
  const memberTemplate = document.querySelector('.team-member').cloneNode(true);
  let state = null;
  let memberRevision = 0;
  let inviteRevision = 0;
  let selectedLecturer = '';
  let pendingCancel = null;
  let saving = false;

  function showError(node, failure) {
    node.textContent = failure.message;
    node.hidden = false;
    node.focus();
  }

  function setResult(message) {
    result.textContent = message;
    result.hidden = false;
    result.focus();
  }

  function refresh() {
    try {
      state = service.getState(projectId, { preview });
      const permission = service.getPermission(state);
      notice.textContent = permission.reason || 'Thao tác thử chỉ lưu trên trình duyệt này; chưa xác minh sinh viên hoặc gửi lời mời đến giảng viên.';
      const full = state.members.length >= state.maxMembers;
      addButton.disabled = !permission.allowed || full;
      inviteButton.disabled = !permission.allowed;
      memberForm.querySelector('button[type="submit"]').disabled = !permission.allowed || full;
      inviteSubmit.disabled = !permission.allowed || !selectedLecturer;
      document.querySelector('.project-team__note').textContent = `Đề tài này cho phép tối đa ${state.maxMembers} thành viên, bao gồm nhóm trưởng. Hiện có ${state.members.length} thành viên.`;
      const members = document.querySelector('.team-member-list');
      members.replaceChildren(...state.members.map(member => {
        const item = memberTemplate.cloneNode(true);
        item.querySelector('.team-member__name').textContent = `${member.name} - ${member.code}`;
        item.querySelector('.team-member__role').textContent = member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên';
        return item;
      }));
      const invitations = document.querySelector('.pending-invitations__list');
      invitations.replaceChildren();
      state.invitations.filter(invitation => invitation.status === 'pending').forEach(invitation => {
        const lecturer = globalThis.IE104.data.projectLecturers.find(item => item.id === invitation.lecturerId);
        const item = document.createElement('li');
        item.className = 'pending-invitation';
        const name = document.createElement('p');
        name.className = 'pending-invitation__name';
        name.textContent = lecturer?.name || 'Giảng viên không còn trong danh mục';
        const date = document.createElement('p');
        date.className = 'pending-invitation__meta';
        date.textContent = `Ngày lưu: ${new Date(invitation.createdAt).toLocaleDateString('vi-VN')}`;
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'pending-invitation__cancel';
        cancel.textContent = 'Hủy';
        cancel.disabled = !permission.allowed;
        cancel.setAttribute('aria-label', `Hủy lời mời ${lecturer?.name || ''}`);
        cancel.setAttribute('aria-haspopup', 'dialog');
        cancel.setAttribute('aria-controls', 'cancel-team-invitation-dialog');
        cancel.addEventListener('click', () => {
          try {
            const current = service.getState(projectId);
            if (!service.getPermission(current).allowed) { refresh(); return; }
            pendingCancel = { id: invitation.id, revision: current.revision };
          } catch (failure) { notice.textContent = failure.message; return; }
          document.querySelector('[data-cancel-invitation-name]').textContent = lecturer?.name || '';
          cancelError.hidden = true;
          cancelDialog.showModal();
        });
        item.append(name, date, cancel);
        invitations.append(item);
      });
      if (!invitations.children.length) {
        const empty = document.createElement('li');
        empty.textContent = 'Chưa có lời mời đang chờ.';
        invitations.append(empty);
      }
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

  function updateResults() {
    selectedLecturer = '';
    inviteSubmit.disabled = true;
    results.replaceChildren();
    results.hidden = false;
    try {
      const lecturers = service.getLecturers(projectId, search.value);
      lecturers.forEach(lecturer => {
        const item = document.createElement('li');
        item.className = 'supervisor-search-results__item';
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'supervisor-search-results__option';
        const name = document.createElement('span');
        name.className = 'supervisor-search-results__name';
        name.textContent = lecturer.name;
        const email = document.createElement('span');
        email.className = 'supervisor-search-results__email';
        email.textContent = lecturer.email;
        button.append(name, email);
        button.addEventListener('click', () => {
          selectedLecturer = lecturer.id;
          search.value = `${lecturer.name} - ${lecturer.email}`;
          results.hidden = true;
          inviteSubmit.disabled = !service.getPermission(state).allowed;
          inviteSubmit.focus();
        });
        item.append(button);
        results.append(item);
      });
      document.getElementById('supervisor-search-help').textContent = lecturers.length ? `${lecturers.length} giảng viên phù hợp. Chọn một kết quả bên dưới.` : 'Không có giảng viên phù hợp; người đã tham gia hoặc có lời mời đang chờ được loại khỏi kết quả.';
    } catch (failure) { showError(inviteError, failure); }
  }

  [addButton, inviteButton].forEach(button => {
    button.removeAttribute('command');
    button.removeAttribute('commandfor');
  });
  memberForm.noValidate = true;
  inviteForm.noValidate = true;
  inviteSubmit.type = 'submit';
  document.getElementById('new-team-member-role').querySelector('[value="nhom-truong"]').disabled = true;
  addButton.addEventListener('click', () => {
    if (!refresh() || !service.getPermission(state).allowed || state.members.length >= state.maxMembers) return;
    memberRevision = state.revision;
    memberForm.reset();
    memberError.hidden = true;
    memberForm.querySelectorAll('[aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
    memberDialog.showModal();
  });
  inviteButton.addEventListener('click', () => {
    if (!refresh() || !service.getPermission(state).allowed) return;
    inviteRevision = state.revision;
    inviteForm.reset();
    selectedLecturer = '';
    inviteError.hidden = true;
    updateResults();
    inviteDialog.showModal();
  });
  search.addEventListener('input', updateResults);
  memberForm.addEventListener('submit', event => {
    event.preventDefault();
    if (saving || !state) return;
    const fields = { name: document.getElementById('new-team-member-name'), code: document.getElementById('new-team-member-code'), role: document.getElementById('new-team-member-role') };
    Object.values(fields).forEach(field => field.removeAttribute('aria-invalid'));
    memberError.hidden = true;
    const input = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
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
      setResult('Đã lưu thành viên vào nhóm thử trên trình duyệt. Chưa xác minh thông tin sinh viên.');
    } catch (failure) { showError(memberError, failure); }
    finally { saving = false; }
  });
  inviteForm.addEventListener('submit', event => {
    event.preventDefault();
    if (saving || !state) return;
    saving = true;
    try {
      service.inviteSupervisor(projectId, selectedLecturer, document.getElementById('invitation-message').value, inviteRevision);
      inviteDialog.close();
      selectedLecturer = '';
      refresh();
      setResult('Đã lưu lời mời thử trên trình duyệt. Chưa gửi đến giảng viên; giảng viên chưa được thêm vào đề tài.');
    } catch (failure) { showError(inviteError, failure); }
    finally { saving = false; }
  });
  cancelConfirm.addEventListener('click', () => {
    if (saving || !pendingCancel) return;
    saving = true;
    try {
      service.cancelInvitation(projectId, pendingCancel.id, pendingCancel.revision);
      cancelDialog.close();
      refresh();
      setResult('Đã hủy lời mời thử trong bản lưu trên trình duyệt.');
    } catch (failure) { showError(cancelError, failure); }
    finally { saving = false; }
  });
  cancelDialog.addEventListener('close', () => { pendingCancel = null; });
  window.addEventListener('storage', event => { if (event.key === globalThis.IE104.storage.teamKey || event.key === null) refresh(); });
  window.addEventListener('pageshow', refresh);
  refresh();
  document.body.dataset.teamReady = 'true';
})();
