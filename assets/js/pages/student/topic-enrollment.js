(() => {
  const app = globalThis.IE104;
  const form = document.querySelector('.registration-form');
  const service = app?.services?.registrations;
  if (!form || !service) return;
  const store = globalThis.TeacherTopicStore;
  const topicId = (store && new URLSearchParams(location.search).get('topic')) ?? form.dataset.topicId;
  const extra = document.getElementById('additional-members');
  const template = document.getElementById('registration-member-template');
  const add = form.querySelector('.add-member');
  const submit = form.querySelector('.submit-registration');
  const dialog = document.getElementById('registration-confirm-dialog');
  const review = dialog.querySelector('[data-registration-review]');
  const confirm = dialog.querySelector('[data-confirm-registration]');
  const errorBox = document.getElementById('registration-error');
  const resultBox = document.getElementById('registration-result');
  const closedState = document.getElementById('registration-closed-template')?.content.firstElementChild.cloneNode(true);
  if (closedState) {
    closedState.hidden = true;
    form.after(closedState);
  }
  let rules;
  let nextIndex = 3;
  let pending;
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
    (first || document.getElementById('student-role')).focus();
  }

  function refreshMembers() {
    const all = cards();
    all.slice(1).forEach((card, index) => {
      const label = `Thành viên ${index + 2}`;
      card.querySelector('strong').textContent = label;
      const remove = card.querySelector('.remove-member');
      remove.disabled = false;
      remove.setAttribute('aria-label', `Xóa ${label.toLocaleLowerCase('vi')}`);
      card.querySelectorAll('input').forEach(input => { input.required = true; });
    });
    add.disabled = all.length >= rules.maxMembers;
  }

  function showSaved(record) {
    form.hidden = true;
    resultBox.replaceChildren(document.createTextNode('Đăng ký thử đã được lưu trên trình duyệt này. '));
    const link = document.createElement('a');
    link.href = `chi-tiet-dang-ky-da-luu.html?registration=${encodeURIComponent(record.id)}`;
    link.textContent = 'Xem đăng ký đã lưu';
    resultBox.append(link);
    resultBox.hidden = false;
    errorBox.hidden = true;
  }

  function renderTopic(topic) {
    const record = topic.record;
    const summary = document.querySelector('.summary');
    const article = summary.closest('article');
    article.setAttribute('aria-label', topic.title);
    document.title = topic.title + ' | Chi tiết đề tài';
    summary.querySelector('h2').textContent = topic.title;
    const values = [topic.code, topic.typeLabel, topic.courseLabel, 'Theo nhóm', topic.semester, topic.academicYear];
    summary.querySelectorAll('.summary__meta dd').forEach((value, index) => { value.textContent = values[index]; });
    article.querySelectorAll('.detail-body .content-box').forEach((box, index) => {
      const field = ['description', 'objectives', 'outcomes', 'requirements'][index];
      box.replaceChildren(...(record[field] || 'Chưa có thông tin').split('\n').map(text => {
        const paragraph = document.createElement('p');
        paragraph.textContent = text;
        return paragraph;
      }));
    });
    const image = article.querySelector('.topic-image img');
    image.parentElement.classList.toggle('topic-image--uit', !record.image);
    if (record.image) {
      image.src = record.image;
      image.alt = 'Ảnh minh họa ' + topic.title;
    } else {
      image.src = '../../assets/images/uit-logo.png';
      image.alt = 'Logo Trường Đại học Công nghệ Thông tin - UIT';
    }
    const supervisor = article.querySelector('.supervisor');
    supervisor.querySelector('h4').textContent = topic.lecturer;
    supervisor.querySelector('.supervisor__profile p').hidden = topic.id !== 'DT001';
    supervisor.querySelector('dl').hidden = topic.id !== 'DT001';
    article.querySelector('[aria-labelledby="topic-attachments-title"]').hidden = topic.id !== 'DT001';
    form.querySelector('.registration-form__group-size').textContent = `Nhóm gồm ${rules.minMembers} - ${rules.maxMembers} thành viên`;
  }

  function checkExisting() {
    try {
      const topic = service.getTopic(topicId);
      document.querySelector('.detail-body').hidden = Boolean(store && !topic);
      if (!topic) throw new Error('Không tìm thấy đề tài để đăng ký.');
      rules = topic.registrationRules;
      if (topic.record) renderTopic(topic);
      refreshMembers();
      if (closedState) closedState.hidden = topic.status !== 'closed';
      const record = service.findByTopic(topicId);
      errorBox.hidden = true;
      if (record) {
        if (dialog.open) dialog.close();
        showSaved(record);
      } else {
        const closed = topic.status === 'closed';
        if (closed && dialog.open) dialog.close();
        form.hidden = closed;
        resultBox.hidden = true;
        submit.disabled = closed;
      }
    } catch (error) {
      if (dialog.open) dialog.close();
      if (closedState) closedState.hidden = true;
      form.hidden = true;
      resultBox.hidden = true;
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      submit.disabled = true;
    }
  }

  function showReview() {
    let topic;
    try {
      topic = service.getTopic(topicId);
    } catch {
      checkExisting();
      return;
    }
    if (!topic || topic.status === 'closed') return checkExisting();
    rules = topic.registrationRules;
    const checked = app.validation.validateRegistration(readValue(), rules);
    if (checked.errors.length) return showErrors(checked.errors);
    clearErrors();
    pending = checked.value;
    review.replaceChildren();
    const lines = [topic.title, `Nhóm: ${pending.groupName}`, ...pending.members.map(member => `${member.code} - ${member.name} - ${member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên'}`)];
    if (pending.message) lines.push(`Lời nhắn: ${pending.message}`);
    lines.forEach(text => { const line = document.createElement('p'); line.textContent = text; review.append(line); });
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
    add.focus();
  });
  submit.addEventListener('click', showReview);
  form.addEventListener('submit', event => { event.preventDefault(); if (!submit.disabled) showReview(); });
  confirm.addEventListener('click', () => {
    if (saving || !pending) return;
    saving = true;
    confirm.disabled = true;
    try {
      const record = service.create(topicId, pending);
      dialog.close();
      showSaved(record);
    } catch (error) {
      dialog.close();
      if (error.fields) showErrors(error.fields);
      else {
        checkExisting();
        errorBox.textContent = error.message;
        errorBox.hidden = false;
      }
    } finally {
      saving = false;
      confirm.disabled = false;
    }
  });
  window.addEventListener('pageshow', checkExisting);
  window.addEventListener('storage', event => {
    if (event.key === app.storage.registrationKey || event.key === store?.key || event.key === null) checkExisting();
  });
  form.noValidate = true;
  checkExisting();
  form.dataset.enrollmentReady = 'true';
})();
