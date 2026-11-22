(() => {
  const app = globalThis.IE104;
  const { proposals, requests, approvedProjects } = app.services;
  const query = new URLSearchParams(location.search);
  const id = query.has('proposal') ? query.get('proposal') : query.get('ma') ?? 'DX001';
  const isLegacy = app.data.initialRequests.some(item => item.id === id && item.kind === 'de-xuat');
  const dateFormat = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
  });
  const date = value => value ? dateFormat.format(new Date(value)) : '';
  const outlineDate = value => value ? value.split('-').reverse().join('/') : '';
  const missing = 'Chưa có thông tin';
  const article = document.getElementById('dx001');
  const recipientTitle = article.querySelector('#proposal-recipient-title');
  const recipientLabel = article.querySelector('[data-recipient-label]');
  const recipientAvatar = article.querySelector('.proposal-recipient__avatar');
  const recipientDepartment = article.querySelector('[data-recipient-department]');
  const attachmentRow = article.querySelector('[data-proposal-attachment]');
  const attachmentNote = article.querySelector('[data-proposal-attachment-note]');
  const badge = document.querySelector('.proposal-status');
  const actions = document.querySelector('.pending-proposal-header__actions');
  const notice = document.querySelector('.pending-proposal-notice');
  const result = document.querySelector('[data-pending-result]');
  const edit = actions.querySelector('[data-proposal-edit]');
  const project = actions.querySelector('[data-proposal-project]');
  const buttons = actions.querySelectorAll('[data-proposal-action]');
  const dialog = document.getElementById('withdraw-proposal-dialog');
  const dialogTitle = document.getElementById('withdraw-proposal-title');
  const question = dialog.querySelector('[data-pending-question]');
  const confirm = dialog.querySelector('[data-confirm-pending-withdraw]');
  const error = dialog.querySelector('[data-pending-error]');
  const actionLabels = { withdraw: 'Rút đề xuất', remove: 'Xóa khỏi danh sách' };
  const historyLabels = { ...actionLabels, edit: 'Lưu chỉnh sửa', resubmit: 'Gửi lại đề xuất' };
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
        submittedDate: date(record.resubmittedAt || record.createdAt),
      };
    }

    if (query.has('proposal')) {
      const record = proposals.findById(id);
      if (!record) return null;
      const canChange = record.status === 'cho-duyet';
      return {
        ...record, owner: true, permissions: { edit: canChange, withdraw: canChange },
        recipient: record.supervisorName, recipientRole: 'Hướng dẫn chính',
        submittedDate: date(record.createdAt), dateLabel: 'Ngày lưu đề xuất',
      };
    }

    const seed = IE104Proposals.getSeed(id);
    if (!seed) return null;
    return {
      ...seed, permissions: {},
      typeLabel: seed.topicTypeLabel, recipient: seed.studentName, recipientRole: seed.studentId,
      submittedDate: date(seed.submittedAt),
      status: { pending: 'cho-duyet', approved: 'da-duyet', rejected: 'tu-choi' }[seed.status],
      decision: seed.decidedAt ? { reason: seed.reason, decidedAt: seed.decidedAt } : null,
    };
  }

  function statusMessage(record) {
    const messages = {
      'cho-duyet': 'Đề xuất đang chờ giảng viên xét duyệt.',
      'yeu-cau-chinh-sua': 'Giảng viên yêu cầu chỉnh sửa đề xuất.',
      'da-duyet': 'Đề xuất đã được giảng viên duyệt.',
      'tu-choi': 'Đề xuất đã bị từ chối.',
      'da-rut': 'Đề xuất đã rút. Bạn vẫn có thể xem lại nội dung.',
      'da-xoa': 'Đề xuất đã được xóa khỏi danh sách trên bản demo.',
    };
    const feedback = record.decision?.reason || (record.status === 'yeu-cau-chinh-sua' ? record.feedback : '');
    return [messages[record.status], feedback].filter(Boolean).join(' ');
  }

  function renderRecord(record) {
    const details = article.querySelector('[data-proposal-record]');
    const outline = record.outline;
    const people = outline?.members || record.members;
    const supervisor = outline?.supervisor;
    const hasExtraSupervisorInfo = supervisor && (supervisor.name !== record.recipient || supervisor.degree || supervisor.workplace);
    const person = value => value && [value.name, value.degree, value.workplace].filter(Boolean).join(' - ');
    const fields = [
      ['Mã đề xuất', record.id],
      [record.dateLabel || 'Ngày gửi đề xuất', record.submittedDate],
      ['Hình thức', record.mode && (record.mode === 'nhom' ? 'Nhóm' : 'Cá nhân')],
      ['Tên nhóm', record.groupName],
      ['Sinh viên thực hiện', people?.map(member => [member.name, member.code, member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên'].join(' - ')).join('\n')],
      ['Thông tin GVHD trong đề cương', hasExtraSupervisorInfo && person(supervisor)],
      ['Người hướng dẫn phụ trong đề cương', person(outline?.secondarySupervisor)],
      ['Phạm vi', outline && record.scope !== (outline.methodAndScope ?? (outline.scope || record.scope)) && record.scope],
      ['Lời nhắn', record.message],
      ['Ngày gửi ban đầu', record.resubmittedAt && date(record.createdAt)],
      ['Phản hồi trước khi gửi lại', record.resubmittedAt && record.feedback],
      ['Lần sửa gần nhất', date(record.updatedAt)],
      ['Ngày xét duyệt', date(record.decision?.decidedAt)],
      ['Ngày rút', date(record.withdrawnAt)],
    ];
    details.replaceChildren();
    for (const [label, value] of fields) {
      if (!value) continue;
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      details.append(row);
    }
    const history = article.querySelector('[data-proposal-history]');
    history.replaceChildren();
    for (const event of record.history || []) {
      const item = document.createElement('li');
      item.textContent = `${date(event.at)} · ${historyLabels[event.action]}`;
      history.append(item);
    }
    history.parentElement.hidden = !history.childElementCount;
  }

  async function renderRecipient(record) {
    recipientTitle.textContent = record.owner ? 'Thông tin hướng dẫn' : 'Sinh viên gửi đề xuất';
    recipientLabel.textContent = record.owner
      ? (record.recipientRole === 'Đồng hướng dẫn' ? 'Giảng viên đồng hướng dẫn' : 'Giảng viên hướng dẫn chính')
      : 'Họ và tên';
    recipientAvatar.textContent = record.recipient?.trim().split(/\s+/).slice(-2)
      .map(part => part.charAt(0)).join('').toLocaleUpperCase('vi') || '';
    recipientAvatar.hidden = !recipientAvatar.textContent;
    recipientDepartment.textContent = !record.owner && record.recipientRole ? `MSSV: ${record.recipientRole}` : '';
    recipientDepartment.hidden = !recipientDepartment.textContent;

    const supervisorId = record.supervisorId || record.lecturerId;
    const entry = globalThis.IE104SupervisionEntry;
    if (!entry || !record.owner || !supervisorId?.startsWith('giang-vien-')) return;
    const teachers = await entry.getTeachers().catch(() => []);
    if (displayed !== record) return;
    const teacher = teachers.find(person => person.id === supervisorId);
    if (!teacher) return;
    recipientDepartment.textContent = entry.departmentLabel(teacher.department);
    recipientDepartment.hidden = false;
  }

  function render() {
    try {
      const record = findProposal();
      if (!record) throw new Error('Không tìm thấy đề xuất của sinh viên hiện tại. Hãy chọn lại hồ sơ từ Đề tài của tôi.');
      const status = record.deletedAt ? 'da-xoa' : record.status;
      const label = status === 'da-xoa' ? 'Đã xóa khỏi danh sách' : requests.labels[status];
      displayed = record;
      badge.hidden = false;
      badge.dataset.requestStatus = status;
      badge.dataset.status = { 'da-duyet': 'approved', 'tu-choi': 'rejected' }[status] || '';
      badge.textContent = label;
      notice.textContent = statusMessage({ ...record, status });
      document.title = `${record.title} — ${label} | Đề tài của tôi`;
      article.hidden = Boolean(record.deletedAt);
      article.dataset.proposalId = record.id;

      edit.hidden = !record.permissions.edit;
      if (!edit.hidden) edit.href = `tao-de-xuat.html?proposal=${encodeURIComponent(record.id)}`;
      for (const button of buttons) button.hidden = !record.permissions[button.dataset.proposalAction];
      project.hidden = isLegacy || !record.owner || record.status !== 'da-duyet';
      if (!project.hidden) project.href = approvedProjects.studentUrl(approvedProjects.projectIdFor(record.id));
      actions.hidden = edit.hidden && project.hidden && Array.from(buttons).every(button => button.hidden);
      if (article.hidden) return;

      const attachment = record.attachment?.name || record.attachmentName || record.attachment;
      const outline = record.outline;
      const fields = {
        ...record,
        courseLabel: app.ui.studentCourseLabel(record, true),
        englishTitle: outline?.englishTitle,
        semester: record.semester && `Học kỳ ${['he', 'summer'].includes(record.semester) ? '3' : record.semester}`,
        academicYear: record.academicYear?.replace(/\s*[-–]\s*/, ' – '),
        startDate: outlineDate(outline?.startDate),
        endDate: outlineDate(outline?.endDate),
        methodAndScope: outline?.methodAndScope ?? [outline?.method, outline?.scope || record.scope].filter(Boolean).join('\n\n'),
        plan: outline?.plan,
        attachmentText: attachment && `${attachment}${Number.isFinite(record.attachment?.size) ? ` (${record.attachment.size} byte)` : ''}`,
      };
      for (const field of article.querySelectorAll('[data-proposal-field]')) {
        const value = fields[field.dataset.proposalField];
        field.textContent = value || missing;
        field.classList.toggle('is-missing', !value);
      }
      attachmentRow.hidden = !attachment;
      attachmentNote.textContent = attachment ? 'Bản demo chỉ lưu thông tin tệp.' : 'Chưa có tài liệu đính kèm.';
      void renderRecipient(record);
      renderRecord(record);
    } catch (failure) {
      displayed = null;
      actions.hidden = true;
      article.hidden = true;
      badge.hidden = true;
      notice.textContent = failure.message;
      document.title = 'Chi tiết đề tài | Đề tài của tôi';
    }
  }

  for (const button of buttons) {
    button.addEventListener('click', () => {
      render();
      const action = button.dataset.proposalAction;
      if (!displayed?.permissions[action]) return;
      pending = { action, revision: displayed.revision || 0 };
      dialogTitle.textContent = actionLabels[action];
      question.textContent = action === 'withdraw'
        ? `Bạn có chắc muốn rút đề xuất “${displayed.title}”?`
        : `Bạn có chắc muốn xóa đề xuất “${displayed.title}” khỏi danh sách?`;
      confirm.textContent = actionLabels[action];
      error.hidden = true;
      confirm.disabled = false;
      dialog.showModal();
    });
  }

  confirm.addEventListener('click', async () => {
    if (!pending || saving) return;
    const { action, revision } = pending;
    saving = true;
    confirm.disabled = true;
    try {
      if (isLegacy) {
        if (action === 'withdraw') await requests.withdrawProposal(id, revision);
        else await requests.removeProposal(id, revision);
      } else {
        await proposals.withdraw(id, revision);
      }
      dialog.close();
      render();
      result.textContent = action === 'withdraw' ? 'Đã rút đề xuất trên bản demo.' : 'Đã xóa đề xuất khỏi danh sách trên bản demo.';
      result.hidden = false;
      result.focus();
    } catch (failure) {
      error.textContent = failure.message;
      error.hidden = false;
      error.focus();
    } finally {
      saving = false;
      confirm.disabled = false;
    }
  });

  dialog.addEventListener('close', () => { pending = null; });
  window.addEventListener('pageshow', render);
  window.addEventListener('ie104:proposals-updated', render);
  window.addEventListener('storage', event => {
    if ([app.storage.requestKey, app.storage.proposalKey, null].includes(event.key) || event.key?.startsWith('ie104.proposal-decision.v1.')) render();
  });
  render();
  document.body.dataset.pendingRequestReady = 'true';
})();
