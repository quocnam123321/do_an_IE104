(() => {
  const app = globalThis.IE104;
  const { proposals, requests, approvedProjects } = app.services;
  const query = new URLSearchParams(location.search);
  const id = query.has('proposal') ? query.get('proposal') : query.get('ma') ?? 'DX001';
  const isLegacy = !app.proposalDatabase && app.data.initialRequests.some(item => item.id === id && item.kind === 'de-xuat');
  const dateFormat = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
  });
  const date = value => value ? dateFormat.format(new Date(value)) : '';
  const article = document.getElementById('dx001');
  const recipientTitle = article.querySelector('#proposal-recipient-title');
  const recipientName = article.querySelector('[data-recipient-name]');
  const recipientAvatar = article.querySelector('.proposal-recipient__avatar');
  const recipientDepartment = article.querySelector('[data-recipient-department]');
  const recipientDemo = article.querySelector('[data-recipient-demo]');
  const recipientReviewer = article.querySelector('[data-recipient-reviewer]');
  const recipientDecision = article.querySelector('[data-recipient-decision]');
  const recipientEmail = article.querySelector('[data-recipient-email]');
  const recipientNoEmail = article.querySelector('[data-recipient-no-email]');
  const badge = article.querySelector('.request-topic__heading .status-badge');
  const badgeText = badge.querySelector('[data-proposal-status]');
  const actions = article.querySelector('.pending-proposal-actions');
  const notice = document.querySelector('.pending-proposal-notice');
  const rejection = document.querySelector('.pending-proposal-rejection');
  const rejectionReason = rejection.querySelector('[data-proposal-rejection-reason]');
  const result = document.querySelector('[data-pending-result]');
  const edit = actions.querySelector('[data-proposal-edit]');
  const project = actions.querySelector('[data-proposal-project]');
  const buttons = actions.querySelectorAll('[data-proposal-action]');
  const dialog = document.getElementById('withdraw-proposal-dialog');
  const dialogTitle = document.getElementById('withdraw-proposal-title');
  const question = document.getElementById('withdraw-proposal-question');
  const dialogNotice = document.getElementById('withdraw-proposal-notice');
  const closeDialog = dialog.querySelector('.pending-withdraw-dialog__close');
  const cancel = dialog.querySelector('[data-pending-cancel]');
  const confirm = dialog.querySelector('[data-confirm-pending-withdraw]');
  const error = dialog.querySelector('[data-pending-error]');
  const actionLabels = { withdraw: 'Rút đề xuất', remove: 'Xóa khỏi danh sách' };
  const historyLabels = { ...actionLabels, edit: 'Lưu chỉnh sửa', resubmit: 'Gửi lại đề xuất', reject: 'Từ chối đề xuất' };
  let displayed = null;
  let pending = null;
  let saving = false;

  function findProposal() {
    if (isLegacy) {
      const record = requests.findStudentProposal(id);
      if (!record) return null;
      return {
        ...record, owner: true, permissions: requests.permissions(record),
        recipient: record.lecturerName, recipientRole: record.supervisionRoleLabel || IE104Proposals.getSeed(id)?.supervisionRoleLabel,
      };
    }

    const record = query.has('proposal') ? proposals.findById(id) : proposals.findStudentSample(id);
    if (record) {
      const canChange = record.status === 'cho-duyet';
      return {
        ...record, owner: true, permissions: { edit: canChange, withdraw: canChange },
        recipient: record.supervisorName, recipientRole: record.supervisionRoleLabel || 'Hướng dẫn chính',
      };
    }
    if (query.has('proposal')) return null;

    const seed = IE104Proposals.getSeed(id);
    if (!seed) return null;
    return {
      ...seed, permissions: {},
      typeLabel: seed.topicTypeLabel, recipient: seed.lecturerName, recipientRole: seed.supervisionRoleLabel,
      status: { pending: 'cho-duyet', approved: 'da-duyet', rejected: 'tu-choi', withdrawn: 'da-rut' }[seed.status],
      decision: seed.decidedAt ? { reason: seed.reason, decidedAt: seed.decidedAt } : null,
    };
  }

  function statusMessage(record) {
    const messages = {
      'yeu-cau-chinh-sua': 'Giảng viên yêu cầu chỉnh sửa đề xuất.',
      'da-duyet': 'Đề xuất đã được giảng viên duyệt.',
      'da-xoa': 'Đề xuất đã được xóa khỏi danh sách trên bản demo.',
    };
    const feedback = record.decision?.reason || (record.status === 'yeu-cau-chinh-sua' ? record.feedback : '');
    return [messages[record.status], feedback].filter(Boolean).join(' ');
  }

  function renderHistory(events) {
    const history = article.querySelector('[data-proposal-history]');
    history.replaceChildren();
    for (const event of events) {
      const item = document.createElement('li');
      const timestamp = document.createElement('time');
      timestamp.dateTime = event.at;
      timestamp.textContent = date(event.at);
      const action = document.createElement('span');
      action.textContent = historyLabels[event.action];
      item.append(timestamp, ' · ', action);
      history.append(item);
    }
    history.parentElement.hidden = !history.childElementCount;
  }

  function renderRecipientName(name) {
    recipientName.textContent = name || 'Chưa có thông tin';
    recipientName.classList.toggle('is-missing', !name);
    recipientAvatar.textContent = name?.trim().split(/\s+/).slice(-2)
      .map(part => part.charAt(0)).join('').toLocaleUpperCase('vi') || '';
    recipientAvatar.hidden = !recipientAvatar.textContent;
  }

  async function renderRecipient(record) {
    const supervisorTitle = record.recipientRole === 'Đồng hướng dẫn'
      ? 'Giảng viên đồng hướng dẫn'
      : 'Giảng viên hướng dẫn chính';
    recipientTitle.textContent = record.demoReceiver ? 'Giảng viên đã chọn'
      : ['tu-choi', 'da-rut'].includes(record.status) ? 'Giảng viên nhận đề xuất' : supervisorTitle;
    recipientDemo.hidden = !record.demoReceiver;
    recipientDemo.textContent = record.isSharedDemo ? 'Hàng chờ minh họa của trình duyệt này'
      : record.demoReceiver ? `Tài khoản tiếp nhận demo ${record.demoReceiver}` : '';
    const reviewer = record.reviewer?.login;
    recipientReviewer.hidden = !reviewer;
    recipientReviewer.textContent = reviewer ? `Tài khoản có thể duyệt ${reviewer}` : '';
    const decidedBy = record.decision?.lecturerName;
    recipientDecision.hidden = !decidedBy;
    const decisionLabel = record.status === 'tu-choi' ? 'Đã từ chối bởi' : 'Đã duyệt bởi';
    recipientDecision.textContent = decidedBy ? `${decisionLabel} ${decidedBy}` : '';
    renderRecipientName(record.recipient);
    recipientDepartment.textContent = 'Chưa cập nhật bộ môn';
    recipientDepartment.hidden = !record.recipient;
    recipientEmail.hidden = true;
    recipientEmail.textContent = '';
    recipientEmail.removeAttribute('href');
    recipientNoEmail.hidden = !record.recipient;

    const supervisorId = record.supervisorId || record.lecturerId;
    const entry = globalThis.IE104SupervisionEntry;
    if (!entry) return;
    let teacher = record.supervisorProfile;
    if (!teacher && /^giang-vien-\d+$/.test(supervisorId)) {
      const teachers = await entry.getTeachers().catch(() => []);
      if (displayed !== record) return;
      teacher = teachers.find(person => person.id === supervisorId);
    }
    if (!teacher) return;

    renderRecipientName(teacher.name);
    recipientDepartment.textContent = entry.selectionDepartment(teacher);
    recipientDepartment.hidden = false;
    const email = teacher.email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    recipientEmail.textContent = email;
    recipientEmail.href = `mailto:${encodeURIComponent(email).replace('%40', '@')}`;
    recipientEmail.hidden = false;
    recipientNoEmail.hidden = true;
  }

  function render() {
    try {
      const record = findProposal();
      if (!record) throw new Error('Không tìm thấy đề xuất của sinh viên hiện tại. Hãy chọn lại hồ sơ từ Đề tài của tôi.');
      const status = record.deletedAt ? 'da-xoa' : record.status;
      const withdrawn = status === 'da-rut';
      const rejected = status === 'tu-choi';
      const label = status === 'da-xoa' ? 'Đã xóa khỏi danh sách' : requests.labels[status];
      displayed = record;
      badge.hidden = Boolean(record.deletedAt);
      badge.dataset.requestStatus = status;
      badgeText.textContent = label;
      notice.textContent = withdrawn || rejected ? '' : statusMessage({ ...record, status });
      if (rejected) {
        const reason = record.decision?.reason?.trim() || record.reason?.trim() || record.feedback?.trim();
        rejectionReason.textContent = reason || 'Chưa có lý do từ chối.';
      }
      rejection.hidden = !rejected;
      document.title = `${record.title} — ${label} | Đề tài của tôi`;
      article.hidden = Boolean(record.deletedAt);
      article.dataset.proposalId = record.id;

      edit.hidden = !record.permissions.edit;
      if (!edit.hidden) edit.href = `tao-de-xuat.html?proposal=${encodeURIComponent(record.id)}`;
      for (const button of buttons) button.hidden = withdrawn || !record.permissions[button.dataset.proposalAction];
      project.hidden = isLegacy || !record.owner || record.status !== 'da-duyet';
      if (!project.hidden) project.href = approvedProjects.studentUrl(record.topicId || approvedProjects.projectIdFor(record.id));
      actions.hidden = edit.hidden && project.hidden && Array.from(buttons).every(button => button.hidden);
      if (article.hidden) return;

      const participants = app.services.lecturerTopics.supervisedParticipants(record, record.outline?.members);
      app.shared.proposalDetailFields.render(article, {
        ...record,
        participantGroup: participants.isGroup ? participants.label : '',
        courseLabel: app.ui.studentCourseLabel(record, true),
      }, { showSampleSummaryNote: !withdrawn });
      void renderRecipient(record);
      renderHistory(withdrawn ? [] : (record.history ?? []));
    } catch (failure) {
      displayed = null;
      badge.hidden = true;
      actions.hidden = true;
      article.hidden = true;
      rejection.hidden = true;
      notice.textContent = failure.message;
      document.title = 'Chi tiết đề xuất đề tài | Đề tài của tôi';
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      render();
      const action = button.dataset.proposalAction;
      if (!displayed || button.hidden) return;
      pending = { action, revision: displayed.revision || 0 };
      const withdrawing = action === 'withdraw';
      dialog.dataset.action = action;
      dialogTitle.textContent = withdrawing ? 'Rút đề xuất đề tài' : actionLabels[action];
      if (withdrawing) {
        const topic = document.createElement('strong');
        topic.textContent = displayed.title;
        question.replaceChildren('Bạn có muốn rút đề xuất đề tài ', topic, '?');
      } else {
        question.textContent = `Bạn có chắc muốn xóa đề xuất “${displayed.title}” khỏi danh sách?`;
      }
      dialogNotice.hidden = cancel.hidden = withdrawing;
      dialog.setAttribute('aria-describedby', withdrawing ? question.id : `${question.id} ${dialogNotice.id}`);
      confirm.textContent = withdrawing ? 'Xác nhận rút' : actionLabels[action];
      error.hidden = true;
      confirm.disabled = false;
      dialog.showModal();
      (withdrawing ? closeDialog : cancel).focus();
    });
  }

  confirm.addEventListener('click', async () => {
    if (!pending || saving) return;
    const { action, revision } = pending;
    saving = true;
    confirm.disabled = closeDialog.disabled = cancel.disabled = true;
    try {
      if (isLegacy) {
        if (action === 'withdraw') await requests.withdrawProposal(id, revision);
        else await requests.removeProposal(id, revision);
      } else {
        await proposals.withWriteLock(() => proposals.withdraw(id, revision));
      }
      dialog.close();
      render();
      result.textContent = app.proposalDatabase ? 'Đã rút đề xuất.'
        : action === 'withdraw' ? 'Đã rút đề xuất trên bản demo.' : 'Đã xóa đề xuất khỏi danh sách trên bản demo.';
      result.hidden = false;
      result.focus();
    } catch (failure) {
      error.textContent = failure.message;
      error.hidden = false;
      error.focus();
    } finally {
      saving = false;
      confirm.disabled = closeDialog.disabled = cancel.disabled = false;
    }
  });

  dialog.addEventListener('cancel', event => { if (saving) event.preventDefault(); });
  dialog.addEventListener('close', () => { pending = null; });
  window.addEventListener('pageshow', render);
  window.addEventListener('ie104:proposals-updated', render);
  window.addEventListener('storage', event => {
    if ([app.storage.requestKey, app.storage.proposalKey, null].includes(event.key) || event.key?.startsWith('ie104.proposal-decision.v1.')) render();
  });
  render();
  document.body.dataset.pendingRequestReady = 'true';
})();
