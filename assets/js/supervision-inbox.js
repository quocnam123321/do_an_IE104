(() => {
  'use strict';

  const section = document.querySelector('[data-supervision-role]');
  const role = section.dataset.supervisionRole;
  const isTeacher = role === 'teacher';
  const store = window.IE104Supervision;
  const entry = window.IE104SupervisionEntry;
  const attachments = window.IE104SupervisionAttachments;
  const body = section.querySelector('[data-supervision-inbox]');
  const tabCount = document.querySelector('#supervision-tab [data-supervision-count]');
  const tabCountLabel = document.querySelector('#supervision-tab [data-supervision-count-label]');
  const dateFormat = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  const statusLabels = { accepted: 'Đã đồng ý hướng dẫn', rejected: 'Đã từ chối' };

  body.innerHTML = `
    <div class="supervision__topline">
      <p class="supervision__hint">${isTeacher
        ? 'Bản demo trình duyệt. Chọn giảng viên nhận lời mời để xem và phản hồi.'
        : 'Lời mời được lưu trong trình duyệt này.'}</p>
      ${isTeacher ? '' : '<a href="../chung/huong-nghien-cuu.html" class="supervision__button">Tìm giảng viên</a>'}
    </div>
    <p class="supervision__error supervision__feedback" data-inbox-error role="alert"></p>
    ${isTeacher ? `
      <div class="supervision__field supervision__selector supervision__feedback" data-teacher-picker hidden>
        <label class="supervision__label" for="supervision-teacher">Giảng viên nhận lời mời</label>
        <select class="supervision__control" id="supervision-teacher"></select>
      </div>` : `
      <div class="supervision__actions supervision__feedback" data-inbox-login hidden>
        <a class="supervision__button supervision__button--primary">Đăng nhập để xem lời mời đã gửi</a>
      </div>`}
    <p class="supervision__hint supervision__feedback" data-inbox-empty role="status"></p>
    <div class="supervision__workspace" data-inbox-workspace hidden>
      <div>
        <h2 class="supervision__heading" id="supervision-list-title">${isTeacher ? 'Lời mời đã nhận' : 'Lời mời đã gửi'}</h2>
        <ul class="supervision__list" aria-labelledby="supervision-list-title"></ul>
      </div>
      <article class="supervision__panel" id="supervision-detail" aria-labelledby="supervision-subject">
        <div class="supervision__topline">
          <h2 class="supervision__heading" id="supervision-subject" tabindex="-1"></h2>
          <span class="supervision__badge" data-thread-status></span>
        </div>
        <p class="supervision__hint" data-thread-person></p>
        <ol class="supervision__messages supervision__thread" aria-label="Nội dung trao đổi"></ol>
        <form class="supervision__form supervision__thread" id="supervision-reply" novalidate>
          <div class="supervision__field">
            <label class="supervision__label" for="supervision-reply-text">Trả lời</label>
            <textarea class="supervision__control" id="supervision-reply-text" name="message" rows="3" maxlength="2000" required aria-describedby="supervision-reply-error"></textarea>
            <p class="supervision__error" id="supervision-reply-error" role="alert" hidden></p>
          </div>
          <div data-supervision-picker></div>
          <div class="supervision__actions">
            <button class="supervision__button supervision__button--primary" type="submit">Gửi phản hồi</button>
          </div>
        </form>
        ${isTeacher ? `
          <form class="supervision__form supervision__decision" id="supervision-decision" aria-labelledby="supervision-decision-title">
            <h3 class="supervision__heading" id="supervision-decision-title">Phản hồi lời mời</h3>
            <div class="supervision__field">
              <label class="supervision__label" for="supervision-decision-note">Lời nhắn kèm theo <span class="supervision__hint">(không bắt buộc)</span></label>
              <textarea class="supervision__control" id="supervision-decision-note" name="note" rows="3" maxlength="2000"></textarea>
            </div>
            <div class="supervision__actions">
              <button class="supervision__button supervision__button--danger" type="submit" name="status" value="rejected">Từ chối</button>
              <button class="supervision__button supervision__button--primary" type="submit" name="status" value="accepted">Đồng ý hướng dẫn</button>
            </div>
          </form>` : ''}
        <section class="supervision__decision" aria-labelledby="supervision-result-title" data-thread-result hidden>
          <div class="supervision__topline">
            <h3 class="supervision__heading" id="supervision-result-title">Phản hồi của giảng viên</h3>
            <time class="supervision__hint"></time>
          </div>
          <p class="supervision__decision-note"></p>
          ${isTeacher ? '' : '<a class="supervision__button supervision__button--primary supervision__feedback" data-proposal-link hidden>Tạo đề xuất</a>'}
        </section>
        <p class="supervision__error supervision__feedback" data-thread-error role="alert"></p>
        <p class="supervision__hint supervision__feedback" data-thread-feedback role="status"></p>
      </article>
    </div>`;

  const find = (selector) => body.querySelector(selector);
  const picker = find('[data-teacher-picker]');
  const teachers = find('#supervision-teacher');
  const login = find('[data-inbox-login]');
  const workspace = find('[data-inbox-workspace]');
  const list = find('.supervision__list');
  const inboxError = find('[data-inbox-error]');
  const empty = find('[data-inbox-empty]');
  const subject = find('#supervision-subject');
  const badge = find('[data-thread-status]');
  const person = find('[data-thread-person]');
  const messages = find('.supervision__messages');
  const replyForm = find('#supervision-reply');
  const replyField = replyForm.elements.message;
  const replyAttachment = attachments.createPicker(replyForm.querySelector('[data-supervision-picker]'), 'supervision-reply-attachment');
  const replyError = find('#supervision-reply-error');
  const decisionForm = find('#supervision-decision');
  const result = find('[data-thread-result]');
  const threadError = find('[data-thread-error]');
  const feedback = find('[data-thread-feedback]');
  const detail = find('#supervision-detail');
  const buttons = detail.querySelectorAll('button[type="submit"]');
  let activeId = new URLSearchParams(location.search).get('loi-moi');
  let active;
  let currentStudent;
  let sessionError = '';
  let saving = false;
  let unreadById = new Map();
  let readFrame = 0;

  function textElement(tag, value, className) {
    const element = document.createElement(tag);
    element.textContent = value;
    if (className) element.className = className;
    return element;
  }

  function describeStatus(record) {
    return statusLabels[record.status] ?? (record.messages.length > 1 ? 'Đang trao đổi' : 'Chờ phản hồi');
  }

  function setTime(time, value) {
    time.dateTime = value;
    time.textContent = dateFormat.format(new Date(value));
  }

  function renderTabCount(count) {
    tabCount.hidden = count === 0;
    tabCount.textContent = count ? String(count) : '';
    tabCountLabel.textContent = count
      ? (isTeacher ? `${count} lời mời đang chờ trả lời` : `${count} phản hồi chưa đọc`)
      : '';
  }

  function scheduleRead() {
    if (isTeacher || readFrame) return;
    readFrame = requestAnimationFrame(() => {
      readFrame = 0;
      if (document.hidden || section.hidden || workspace.hidden || !active || !unreadById.get(active.id)) return;
      const bounds = detail.getBoundingClientRect();
      if (bounds.top >= innerHeight || bounds.bottom <= 0) return;
      const viewed = active;
      store.markResponsesRead(viewed).catch((error) => {
        if (active?.id === viewed.id) threadError.textContent = error.message;
      });
    });
  }

  function showTeacherChoices(records) {
    const options = new Map(records.map(({ teacher }) => [teacher.id, teacher.name]));
    const previous = teachers.value;
    const choices = [...options].map(([id, name]) => new Option(name, id));
    teachers.replaceChildren(...choices);
    if (options.has(previous)) teachers.value = previous;
    picker.hidden = !options.size;
    return records.filter(({ teacher }) => teacher.id === teachers.value);
  }

  function renderList(records) {
    const focusedId = document.activeElement?.dataset.invitationId;
    let focusedButton;
    const rows = records.map((record) => {
      const row = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'supervision__list-button';
      button.dataset.invitationId = record.id;
      button.setAttribute('aria-controls', 'supervision-detail');
      if (record.id === activeId) button.setAttribute('aria-current', 'true');
      if (record.id === focusedId) focusedButton = button;
      const status = isTeacher && store.needsTeacherReply(record) ? 'Chờ bạn trả lời' : describeStatus(record);
      button.append(
        textElement('strong', record.subject),
        textElement('span', isTeacher ? record.student.name : record.teacher.name, 'supervision__hint'),
        textElement('span', status, 'supervision__hint')
      );
      const unread = unreadById.get(record.id);
      if (unread) button.append(textElement('span', `${unread} chưa đọc`, 'supervision__badge'));
      row.append(button);
      return row;
    });
    list.replaceChildren(...rows);
    focusedButton?.focus({ preventScroll: true });
  }

  function renderThread(record) {
    const open = record.status === 'pending';
    const moveFocus = !open && (replyForm.contains(document.activeElement) || decisionForm?.contains(document.activeElement));
    subject.textContent = record.subject;
    badge.dataset.status = record.status;
    badge.textContent = describeStatus(record);
    const studentCode = record.student.id === store.student.id ? ` · ${record.student.id}` : '';
    person.textContent = isTeacher
      ? `Sinh viên ${record.student.name}${studentCode}` : `Giảng viên ${record.teacher.name}`;
    messages.replaceChildren(...record.messages.map((message) => {
      const item = document.createElement('li');
      item.className = 'supervision__message';
      const meta = document.createElement('div');
      meta.className = 'supervision__topline';
      const author = message.role === 'teacher' ? record.teacher.name : record.student.name;
      const time = textElement('time', '', 'supervision__hint');
      setTime(time, message.sentAt);
      meta.append(textElement('strong', author), time);
      item.append(meta, textElement('p', message.text));
      if (message.attachment) {
        item.append(attachments.createDownload(message.attachment, (error) => {
          if (activeId === record.id) threadError.textContent = error;
        }));
      }
      return item;
    }));

    replyForm.hidden = !open;
    if (decisionForm) decisionForm.hidden = !open;
    result.hidden = open;
    if (!open) {
      setTime(result.querySelector('time'), record.decision.at);
      const note = result.querySelector('.supervision__decision-note');
      note.textContent = record.decision.note;
      note.hidden = !record.decision.note;
      const next = result.querySelector('[data-proposal-link]');
      if (next) {
        next.hidden = record.status !== 'accepted';
        next.href = `tao-de-xuat.html?loi-moi=${encodeURIComponent(record.id)}`;
      }
      if (moveFocus) subject.focus({ preventScroll: true });
    }
  }

  function clearReplyError() {
    replyField.removeAttribute('aria-invalid');
    replyError.hidden = true;
    replyError.textContent = '';
  }

  function render() {
    inboxError.textContent = '';
    empty.textContent = '';
    if (login) {
      login.hidden = currentStudent !== null;
      if (!currentStudent) {
        active = null;
        renderTabCount(0);
        workspace.hidden = true;
        inboxError.textContent = sessionError;
        return;
      }
    }

    let records;
    try {
      const all = store.getAll();
      records = isTeacher ? showTeacherChoices(all) : all.filter(({ student }) => student.id === currentStudent.id);
      if (isTeacher) {
        renderTabCount(all.filter(store.needsTeacherReply).length);
      } else {
        unreadById = new Map(records.map((record) => [record.id, store.getUnreadResponses(record)]));
        renderTabCount([...unreadById.values()].reduce((sum, count) => sum + count, 0));
      }
    } catch (error) {
      renderTabCount(0);
      if (picker) picker.hidden = true;
      workspace.hidden = true;
      inboxError.textContent = error.message;
      return;
    }

    workspace.hidden = !records.length;
    if (!records.length) {
      active = null;
      empty.textContent = isTeacher ? 'Chưa có lời mời hướng dẫn.' : 'Bạn chưa gửi lời mời hướng dẫn nào.';
      return;
    }

    const next = records.find(({ id }) => id === activeId) ?? records[0];
    if (active?.id !== next.id) {
      replyForm.reset();
      decisionForm?.reset();
      clearReplyError();
      threadError.textContent = '';
      feedback.textContent = '';
    } else if (!saving && (active.status !== next.status || active.messages.length !== next.messages.length)) {
      feedback.textContent = next.status === 'pending' ? 'Cuộc trao đổi có phản hồi mới.' : describeStatus(next);
    }
    activeId = next.id;
    active = next;
    renderList(records);
    renderThread(next);
    scheduleRead();
  }

  async function save(operation, form, success) {
    const submissionId = activeId;
    saving = true;
    buttons.forEach((button) => { button.disabled = true; });
    threadError.textContent = '';
    feedback.textContent = '';
    try {
      const record = await operation();
      if (activeId === record.id) {
        form.reset();
        feedback.textContent = success;
        if (form === replyForm && record.status === 'pending') replyField.focus({ preventScroll: true });
        else subject.focus({ preventScroll: true });
      }
    } catch (error) {
      if (activeId === submissionId) threadError.textContent = error.message;
    } finally {
      render();
      saving = false;
      buttons.forEach((button) => { button.disabled = false; });
    }
  }

  replyField.addEventListener('input', clearReplyError);
  replyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saving || active?.status !== 'pending') return;
    const value = replyField.value.trim();
    const attachmentValid = replyAttachment.validate();
    if (!value) {
      replyField.setAttribute('aria-invalid', 'true');
      replyError.textContent = 'Vui lòng nhập nội dung trả lời.';
      replyError.hidden = false;
      replyField.focus();
      return;
    }
    if (!attachmentValid) {
      replyAttachment.focus();
      return;
    }
    const invitation = active;
    const actor = { role, id: isTeacher ? teachers.value : currentStudent.id };
    const file = replyAttachment.getFile();
    save(async () => {
      if (!isTeacher && (await entry.getStudent())?.id !== actor.id) {
        throw new Error('Phiên đăng nhập đã thay đổi. Hãy tải lại trang để tiếp tục.');
      }
      return store.reply(invitation.id, actor, value, file);
    }, replyForm, 'Đã lưu phản hồi trong bản demo.');
  });
  decisionForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (saving || active?.status !== 'pending' || !event.submitter) return;
    const status = event.submitter.value;
    save(
      () => store.decide(active.id, teachers.value, status, decisionForm.elements.note.value),
      decisionForm,
      'Đã lưu quyết định trong bản demo.'
    );
  });
  teachers?.addEventListener('change', render);
  list.addEventListener('click', (event) => {
    const button = event.target.closest('[data-invitation-id]');
    if (!button) return;
    activeId = button.dataset.invitationId;
    render();
    subject.focus();
  });
  if (login) login.querySelector('a').href = entry.getInboxLoginUrl();
  if (!isTeacher) {
    const refreshSession = async () => {
      currentStudent = undefined;
      sessionError = '';
      render();
      try {
        currentStudent = await entry.getStudent();
      } catch {
        currentStudent = null;
        sessionError = 'Không kiểm tra được phiên đăng nhập. Hãy thử đăng nhập lại.';
      }
      render();
    };
    refreshSession();
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) refreshSession();
    });
    document.addEventListener('visibilitychange', scheduleRead);
    if ('IntersectionObserver' in window) new IntersectionObserver(scheduleRead).observe(detail);
  }
  store.subscribe(render);
  render();
})();
