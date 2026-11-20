(() => {
  const app = globalThis.IE104;
  const form = document.querySelector('.registration-form');
  const service = app?.services?.registrations;
  if (!form || !service) return;
  const store = globalThis.TeacherTopicStore;
  const topicId = (store && new URLSearchParams(location.search).get('topic')) || form.dataset.topicId;
  if (!topicId) return;
  try {
    const profile = app.services.profile?.getState();
    const name = form.querySelector('#student-name');
    if (name && profile?.code === app.data.currentStudent?.code && profile.name) name.value = profile.name;
  } catch {
    // The registration form keeps its editable initial value if the profile cannot be loaded.
  }
  let rules = service.getRules(topicId);
  const extra = document.getElementById('additional-members');
  const template = document.getElementById('registration-member-template');
  const groupSize = form.querySelector('.registration-form__group-size');
  const studentRole = document.getElementById('student-role');
  const add = form.querySelector('.add-member');
  const submit = form.querySelector('.submit-registration');
  const dialog = document.getElementById('registration-confirm-dialog');
  const review = dialog.querySelector('[data-registration-review]');
  const confirm = dialog.querySelector('[data-confirm-registration]');
  const errorBox = document.getElementById('registration-error');
  const resultBox = document.getElementById('registration-result');
  const availability = document.querySelector('[data-published-availability]');
  let nextIndex = 2;
  let pending;
  let pendingRevision;
  let availabilityError = false;
  let saving = false;

  function cards() {
    return [...form.querySelectorAll('.member-card')];
  }

  function controls() {
    return cards().map(card => ({ code: card.querySelector('input[name$="mssv"], #student-code'), name: card.querySelector('input[name$="ho-ten"], #student-name'), role: card.querySelector('select') }));
  }

  function readValue() {
    return {
      groupName: document.getElementById('group-name').value,
      message: document.getElementById('registration-message').value,
      members: controls().map(member => ({ code: member.code.value, name: member.name.value, role: member.role.value })),
    };
  }

  function clearErrors() {
    form.querySelectorAll('[data-registration-error]').forEach(node => node.remove());
    form.querySelectorAll('[aria-invalid]').forEach(field => {
      field.removeAttribute('aria-invalid');
      const ids = (field.getAttribute('aria-describedby') || '').split(' ').filter(id => !id.endsWith('-registration-error'));
      if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
      else field.removeAttribute('aria-describedby');
    });
    errorBox.hidden = true;
  }

  function showErrors(errors) {
    clearErrors();
    const members = controls();
    const marked = new Set();
    let first;
    errors.forEach(error => {
      const parts = error.field.split('.');
      const field = error.field === 'groupName' ? document.getElementById('group-name') : error.field === 'message' ? document.getElementById('registration-message') : parts[0] === 'members' && parts.length === 3 ? members[Number(parts[1])]?.[parts[2]] : null;
      if (!field || marked.has(field)) return;
      marked.add(field);
      const note = document.createElement('p');
      note.dataset.registrationError = 'true';
      note.className = 'registration-field-error';
      note.id = `${field.id}-registration-error`;
      note.textContent = error.message;
      field.setAttribute('aria-invalid', 'true');
      field.setAttribute('aria-describedby', note.id);
      field.after(note);
      first ||= field;
    });
    errorBox.textContent = errors.map(error => error.message).filter((message, index, all) => all.indexOf(message) === index).join(' ');
    errorBox.hidden = false;
    (first || studentRole).focus();
  }

  function refreshMembers() {
    const all = cards();
    const solo = all.length === 1;
    if (solo) studentRole.value = 'nhom-truong';
    studentRole.querySelector('option[value="thanh-vien"]').disabled = solo;
    all.slice(1).forEach((card, index) => {
      const label = `Thành viên ${index + 2}`;
      card.querySelector('strong').textContent = label;
      const remove = card.querySelector('.remove-member');
      remove.disabled = false;
      remove.setAttribute('aria-label', `Xóa ${label.toLocaleLowerCase('vi')}`);
      card.querySelectorAll('input').forEach(input => { input.required = true; });
    });
    groupSize.textContent = rules.maxMembers === 1 ? 'Đăng ký cá nhân.' : `Đăng ký từ 1 đến ${rules.maxMembers} thành viên.`;
    add.disabled = all.length >= rules.maxMembers;
  }

  function showSaved(record) {
    form.hidden = true;
    if (availability) availability.hidden = true;
    resultBox.hidden = false;
    errorBox.hidden = true;
    if (!service.owns(record)) {
      resultBox.textContent = 'Đề tài đã có lượt đăng ký trong bản demo.';
      return;
    }
    const projectUrl = service.projectUrl(record);
    resultBox.textContent = record.status === 'da-dang-ky'
      ? 'Đã đăng ký thành công. Đề tài đã chuyển sang Đang thực hiện trong bản demo. '
      : `Đăng ký đã lưu trên trình duyệt này (${service.labels[record.status]}). `;
    if (projectUrl) {
      const project = document.createElement('a');
      project.href = projectUrl;
      project.textContent = 'Xem chi tiết đề tài';
      resultBox.append(project, ' · ');
    }
    const receipt = document.createElement('a');
    receipt.href = service.receiptUrl(record.id);
    receipt.textContent = 'Xem thông tin đăng ký';
    resultBox.append(receipt);
  }

  function checkExisting() {
    try {
      const record = service.findByTopic(topicId);
      if (record) {
        if (dialog.open) dialog.close();
        showSaved(record);
      } else {
        form.hidden = false;
        if (availability) availability.hidden = false;
        resultBox.hidden = true;
        const topic = service.getTopic(topicId);
        rules = service.getRules(topicId);
        refreshMembers();
        const unavailable = !topic || topic.status === 'closed' || (topic.source === 'lecturer-created' && !topic.availability.allowed);
        submit.disabled = unavailable;
        if (unavailable) { availabilityError = true; errorBox.textContent = topic?.availability?.reason || 'Đề tài không còn mở đăng ký.'; errorBox.hidden = false; add.disabled = true; if (dialog.open) dialog.close(); }
        else if (availabilityError) { errorBox.hidden = true; availabilityError = false; }
      }
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      submit.disabled = true;
    }
  }

  function showReview() {
    let current;
    try {
      current = service.getTopic(topicId);
      if (!current || current.status === 'closed') throw new Error('Đề tài không còn mở đăng ký.');
      if (current?.source === 'lecturer-created') {
        if (!current.availability.allowed) throw new Error(current.availability.reason);
        rules = service.getRules(topicId);
        pendingRevision = current.revision;
      }
    } catch (failure) { errorBox.textContent = failure.message; errorBox.hidden = false; return; }
    const checked = service.validateEnrollment(readValue(), rules);
    if (checked.errors.length) return showErrors(checked.errors);
    clearErrors();
    pending = checked.value;
    review.replaceChildren();
    const lines = [service.getTopic(topicId).title, `Hình thức: ${pending.members.length === 1 ? 'Cá nhân' : 'Theo nhóm'}`];
    if (pending.groupName) lines.push(`Tên nhóm: ${pending.groupName}`);
    for (const member of pending.members) {
      lines.push(`${member.code} - ${member.name}${pending.members.length > 1 ? ` - ${member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên'}` : ''}`);
    }
    if (pending.message) lines.push(`Lời nhắn: ${pending.message}`);
    lines.forEach(text => { const line = document.createElement('p'); line.textContent = text; review.append(line); });
    const outcome = document.createElement('p');
    outcome.id = 'registration-confirm-note';
    outcome.textContent = 'Sau khi xác nhận, đề tài sẽ chuyển sang Đang thực hiện trong bản demo.';
    review.append(outcome);
    dialog.setAttribute('aria-describedby', outcome.id);
    confirm.disabled = false;
    dialog.showModal();
  }

  add.addEventListener('click', () => {
    if (cards().length >= rules.maxMembers) return;
    clearErrors();
    const fragment = template.content.cloneNode(true);
    fragment.querySelectorAll('*').forEach(node => {
      for (const attribute of ['id', 'name', 'for', 'aria-labelledby']) {
        if (node.hasAttribute(attribute)) node.setAttribute(attribute, node.getAttribute(attribute).replaceAll('INDEX', String(nextIndex)));
      }
    });
    nextIndex += 1;
    extra.append(fragment);
    refreshMembers();
    extra.lastElementChild.querySelector('input').focus();
  });
  extra.addEventListener('click', event => {
    const button = event.target.closest('.remove-member');
    if (!button) return;
    button.closest('.member-card').remove();
    clearErrors();
    refreshMembers();
    (add.disabled ? studentRole : add).focus();
  });
  submit.addEventListener('click', showReview);
  form.addEventListener('submit', event => { event.preventDefault(); if (!submit.disabled) showReview(); });
  confirm.addEventListener('click', async () => {
    if (saving || !pending) return;
    saving = true;
    confirm.disabled = true;
    try {
      const record = await service.submit(topicId, pending, pendingRevision);
      dialog.close();
      showSaved(record);
      resultBox.tabIndex = -1;
      resultBox.focus();
    } catch (error) {
      dialog.close();
      if (error.fields) showErrors(error.fields);
      else { errorBox.textContent = error.message; errorBox.hidden = false; }
    } finally {
      saving = false;
      confirm.disabled = false;
    }
  });
  window.addEventListener('pageshow', checkExisting);
  window.addEventListener('storage', event => {
    if (event.key === app.services.lecturerTopicRepository?.key || event.key === null) {
      if (dialog.open) { dialog.close(); pending = null; }
      checkExisting();
    } else if (event.key === app.storage.registrationKey || event.key === store?.key) checkExisting();
  });
  window.addEventListener('ie104:published-topics-updated',checkExisting);
  form.noValidate = true;
  refreshMembers();
  checkExisting();
  form.dataset.enrollmentReady = 'true';
})();
