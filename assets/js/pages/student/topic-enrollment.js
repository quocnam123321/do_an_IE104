(() => {
  const app = globalThis.IE104;
  const form = document.querySelector('.registration-form');
  const service = app?.services?.registrations;
  if (!form || !service) return;
  const store = globalThis.TeacherTopicStore;
  const topicId = form.dataset.topicId;
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
  const memberDialog = document.getElementById('registration-member-dialog');
  const memberForm = document.getElementById('registration-member-form');
  const memberName = document.getElementById('registration-member-name');
  const memberCode = document.getElementById('registration-member-code');
  const memberRole = document.getElementById('registration-member-role');
  const memberError = document.getElementById('registration-member-error');
  let editingCard = null;
  let memberOpener = add;
  const heading = document.createElement('div');
  heading.className = 'registration-group-heading';
  const title = document.getElementById('registration-title');
  title.before(heading);
  heading.append(title, add);
  add.setAttribute('aria-haspopup', 'dialog');
  add.setAttribute('aria-controls', memberDialog.id);
  form.querySelector('fieldset > legend').classList.add('visually-hidden');
  form.querySelector('#group-name').closest('div').classList.add('registration-group-name');
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
    const card = first?.closest('.member-card');
    if (card && first.closest('.member-fields')) openMember(card, card.querySelector('.registration-member-edit'));
    else if (first) first.focus();
    else openMember(cards()[0], cards()[0].querySelector('.registration-member-edit'));
  }

  function refreshMembers() {
    const all = cards();
    const solo = all.length === 1;
    if (solo) studentRole.value = 'nhom-truong';
    studentRole.querySelector('option[value="thanh-vien"]').disabled = solo;
    all.slice(1).forEach((card, index) => {
      const label = `Thành viên ${index + 2}`;
      card.querySelector('.member-heading strong').textContent = label;
      const remove = card.querySelector('.remove-member');
      remove.disabled = false;
      remove.setAttribute('aria-label', `Xóa ${label.toLocaleLowerCase('vi')}`);
      card.querySelectorAll('input').forEach(input => { input.required = true; });
    });
    groupSize.textContent = rules.maxMembers === 1 ? 'Đề tài đăng ký cá nhân.' : `Đề tài cho phép tối đa ${rules.maxMembers} thành viên, bao gồm nhóm trưởng${rules.minMembers > 1 ? `. Nhóm cần ít nhất ${rules.minMembers} thành viên` : ''}.`;
    const limitText = document.createElement('span');
    limitText.textContent = groupSize.textContent;
    const info = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    info.setAttribute('viewBox', '0 0 24 24');
    info.setAttribute('fill', 'none');
    info.setAttribute('stroke', 'currentColor');
    info.setAttribute('stroke-width', '1.75');
    info.setAttribute('aria-hidden', 'true');
    const circle = document.createElementNS(info.namespaceURI, 'circle');
    circle.setAttribute('cx', '12'); circle.setAttribute('cy', '12'); circle.setAttribute('r', '9');
    const path = document.createElementNS(info.namespaceURI, 'path');
    path.setAttribute('d', 'M12 11v6M12 7v1');
    info.append(circle, path);
    groupSize.replaceChildren(info, limitText);
    all.forEach(renderMember);
    add.disabled = all.length >= rules.maxMembers;
  }

  function showSaved(record) {
    form.hidden = true;
    add.hidden = true;
    if (memberDialog.open) memberDialog.close();
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
        add.hidden = false;
        resultBox.hidden = true;
        const topic = service.getTopic(topicId);
        rules = service.getRules(topicId);
        refreshMembers();
        const unavailable = !topic || topic.status === 'closed' || (topic.source === 'lecturer-created' && !topic.availability.allowed);
        submit.disabled = unavailable;
        if (unavailable) { availabilityError = true; errorBox.textContent = topic?.availability?.reason || 'Đề tài không còn mở đăng ký.'; errorBox.hidden = false; add.disabled = true; if (memberDialog.open) memberDialog.close(); if (dialog.open) dialog.close(); }
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

  function renderMember(card) {
    const fields = card.querySelector('.member-fields');
    fields.hidden = true;
    card.querySelector('.member-heading').hidden = true;
    const code = card.querySelector('input[name$="mssv"], #student-code');
    const name = card.querySelector('input[name$="ho-ten"], #student-name');
    let summary = card.querySelector('.registration-member-summary');
    if (!summary) {
      summary = document.createElement('div');
      summary.className = 'registration-member-summary';
      const avatar = document.createElement('span');
      avatar.className = 'registration-member-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      const identity = document.createElement('div');
      identity.className = 'registration-member-identity';
      identity.append(document.createElement('strong'), document.createElement('span'));
      const actions = document.createElement('div');
      actions.className = 'registration-member-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'registration-member-edit';
      edit.textContent = 'Sửa';
      edit.setAttribute('aria-haspopup', 'dialog');
      edit.setAttribute('aria-controls', memberDialog.id);
      edit.addEventListener('click', () => openMember(card, edit));
      actions.append(edit);
      const remove = card.querySelector('.remove-member');
      if (remove) actions.append(remove);
      summary.append(avatar, identity, actions);
      card.prepend(summary);
      const role = card.querySelector('select');
      const roleLabel = card.querySelector(`label[for="${role.id}"]`);
      roleLabel.classList.add('visually-hidden');
      role.parentElement.hidden = true;
      const roleText = document.createElement('p');
      roleText.className = 'registration-member-role-text';
      identity.append(roleText);
      card.querySelector(':scope > p')?.remove();
    }
    const parts = name.value.trim().split(/\s+/).filter(Boolean);
    summary.querySelector('.registration-member-avatar').textContent = parts.slice(-2).map(part => part[0]).join('').toLocaleUpperCase('vi');
    summary.querySelector('strong').textContent = name.value;
    summary.querySelector('.registration-member-role-text').textContent = card.querySelector('select').value === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên';
    summary.querySelector('.registration-member-identity > span').textContent = ` · ${code.value}`;
    summary.querySelector('.registration-member-edit').setAttribute('aria-label', `Sửa thành viên ${name.value}`);
    const remove = summary.querySelector('.remove-member');
    if (remove) { remove.disabled = false; remove.setAttribute('aria-label', `Xóa thành viên ${name.value}`); }
  }

  function openMember(card = null, opener = add) {
    if (!card && (add.disabled || cards().length >= rules.maxMembers)) return;
    editingCard = card;
    memberOpener = opener;
    memberForm.reset();
    memberRole.value = card ? card.querySelector('select').value : 'thanh-vien';
    memberError.hidden = true;
    memberName.removeAttribute('aria-invalid');
    memberCode.removeAttribute('aria-invalid');
    memberRole.removeAttribute('aria-invalid');
    document.getElementById('registration-member-title').textContent = card ? 'Sửa thành viên' : 'Thêm thành viên';
    memberForm.querySelector('[type="submit"]').textContent = card ? 'Lưu thay đổi' : 'Thêm thành viên';
    if (card) {
      memberName.value = card.querySelector('input[name$="ho-ten"], #student-name').value;
      memberCode.value = card.querySelector('input[name$="mssv"], #student-code').value;
    }
    memberDialog.showModal();
    memberName.focus();
  }

  add.addEventListener('click', () => openMember());
  memberForm.noValidate = true;
  memberForm.addEventListener('submit', event => {
    event.preventDefault();
    const value = readValue();
    const index = editingCard ? cards().indexOf(editingCard) : value.members.length;
    const candidate = { name: memberName.value, code: memberCode.value, role: memberRole.value };
    if (editingCard) value.members[index] = candidate;
    else value.members.push(candidate);
    if (candidate.role === 'nhom-truong') value.members.forEach((member, other) => { if (other !== index) member.role = 'thanh-vien'; });
    const checked = service.validateEnrollment(value, rules);
    const errors = checked.errors.filter(error => error.field.startsWith(`members.${index}.`) || (!editingCard && error.field === 'members' && value.members.length > rules.maxMembers));
    if (value.members.some((member, other) => other !== index && member.code.trim().toUpperCase() === candidate.code.trim().toUpperCase()) && !errors.some(error => error.message === 'MSSV này đã có trong nhóm.')) errors.push({ field: `members.${index}.code`, message: 'MSSV này đã có trong nhóm.' });
    if (!value.members.some(member => member.role === 'nhom-truong')) errors.push({ field: `members.${index}.role`, message: 'Nhóm cần một nhóm trưởng. Hãy chọn một thành viên khác làm nhóm trưởng trước.' });
    for (const field of [memberName, memberCode, memberRole]) field.removeAttribute('aria-invalid');
    if (errors.length) {
      memberError.textContent = errors.map(error => error.message).join(' ');
      memberError.hidden = false;
      for (const error of errors) {
        const field = error.field.endsWith('.name') ? memberName : error.field.endsWith('.role') ? memberRole : memberCode;
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', memberError.id);
      }
      (errors[0].field.endsWith('.name') ? memberName : errors[0].field.endsWith('.role') ? memberRole : memberCode).focus();
      return;
    }
    if (!editingCard) {
      const fragment = template.content.cloneNode(true);
      fragment.querySelectorAll('*').forEach(node => {
        for (const attribute of ['id', 'name', 'for', 'aria-labelledby']) {
          if (node.hasAttribute(attribute)) node.setAttribute(attribute, node.getAttribute(attribute).replaceAll('INDEX', String(nextIndex)));
        }
      });
      nextIndex += 1;
      extra.append(fragment);
      editingCard = extra.lastElementChild;
    }
    const normalized = checked.value.members[index];
    editingCard.querySelector('input[name$="ho-ten"], #student-name').value = normalized.name;
    editingCard.querySelector('input[name$="mssv"], #student-code').value = normalized.code;
    cards().forEach((card, memberIndex) => { card.querySelector('select').value = checked.value.members[memberIndex].role; });
    clearErrors();
    refreshMembers();
    memberDialog.close();
  });
  memberDialog.querySelector('.registration-member-close').addEventListener('click', () => memberDialog.close());
  memberDialog.addEventListener('close', () => {
    (memberOpener?.isConnected && !memberOpener.disabled ? memberOpener : form.querySelector('.registration-member-edit')).focus();
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
