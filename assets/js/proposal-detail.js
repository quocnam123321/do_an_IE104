(() => {
  'use strict';
  const store = window.IE104Proposals;
  const content = document.querySelector('.request-detail');
  if (!store || !content) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.has('ma') ? params.get('ma').trim() : (window.IE104?.data?.lecturerRealProposalSeeds?.[0]?.id || 'DX-GV001');
  const badge = document.querySelector('.request-detail-heading .status-badge');
  const feedback = document.getElementById('proposal-decision-feedback');
  const actions = content.querySelector('.request-detail__actions');
  const reason = document.getElementById('rejection-reason');
  const reasonError = document.getElementById('rejection-reason-error');
  const result = document.getElementById('proposal-result');
  const forms = ['approve', 'reject'].map((action) => document.getElementById(`${action}-proposal-form`));
  const dialogs = forms.map((form) => form.closest('dialog'));
  const labels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối', withdrawn: 'Đã rút' };
  const dateFormat = new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });
  let busy = false;
  let displayedRevision;
  let pendingRevision;
  for (const dialog of dialogs) dialog.addEventListener('beforetoggle', event => {
    if (event.newState === 'open') pendingRevision = displayedRevision;
  });

  // Giới hạn đường quay về ở hai danh sách nội bộ có thể mở đề xuất.
  try {
    const pending = 'yeu-cau-cho-duyet.html';
    const teaching = 'danh-sach-de-tai-dang-huong-dan.html';
    const target = new URL(params.get('return') || pending, location.href);
    const matches = path => target.origin === location.origin && target.protocol === location.protocol &&
      target.pathname === new URL(path, location.href).pathname;
    const fromTeaching = matches(teaching) && store.get(id)?.status === 'approved';
    if (matches(pending) || fromTeaching) {
      const back = document.querySelector('.back-link');
      const crumb = document.querySelector('.breadcrumb a[href="yeu-cau-cho-duyet.html"]');
      back.href = crumb.href = (fromTeaching ? teaching : pending) + target.search;
      if (fromTeaching) {
        back.querySelector('span').textContent = 'Quay lại Đề tài đang hướng dẫn';
        crumb.textContent = 'Đề tài đang hướng dẫn';
      }
    }
  } catch { /* URL không hợp lệ: giữ liên kết HTML về danh sách. */ }

  function text(selector, value) {
    const node = content.querySelector(selector);
    if (node) node.textContent = value || 'Chưa có thông tin';
  }

  function render() {
    const record = store.get(id);
    content.hidden = !record;
    badge.hidden = !record;
    document.getElementById('proposal-not-found').hidden = Boolean(record);
    if (!record) {
      for (const dialog of dialogs) if (dialog.open) dialog.close();
      return;
    }
    const registration = record.source === 'registration';
    document.querySelector('.request-detail-heading h1').textContent = registration ? 'Chi tiết đăng ký đề tài' : 'Chi tiết đề xuất đề tài';
    text('#proposal-student-title', registration ? 'Nhóm trưởng gửi đăng ký' : 'Sinh viên gửi đề xuất');
    actions.querySelector('.request-action--approve span').textContent = registration ? 'Duyệt đăng ký' : 'Duyệt đề xuất';
    for (const [index, action] of ['Duyệt', 'Từ chối'].entries()) {
      dialogs[index].querySelector('h2').textContent = `${action} ${registration ? 'đăng ký' : 'đề xuất'}`;
      dialogs[index].querySelector('.topic-dialog__desc').textContent = `Bạn có chắc muốn ${action.toLocaleLowerCase('vi')} ${registration ? 'đăng ký' : 'đề xuất'} này?`;
      dialogs[index].querySelector('.topic-dialog__close').setAttribute('aria-label', `Đóng hộp thoại ${action.toLocaleLowerCase('vi')} ${registration ? 'đăng ký' : 'đề xuất'}`);
      const label = dialogs[index].querySelector('.topic-dialog__info-row span').firstChild;
      label.textContent = registration ? 'Đăng ký: ' : 'Đề xuất: ';
    }
    let group = content.querySelector('[data-registration-group]');
    if (!group) {
      group = document.createElement('section');
      group.dataset.registrationGroup = '';
      group.className = 'request-student panel';
      content.querySelector('.request-student').after(group);
    }
    group.hidden = !registration;
    group.replaceChildren();
    if (registration) {
      const heading = document.createElement('h2');
      heading.textContent = `Nhóm đăng ký: ${record.groupName}`;
      const members = document.createElement('ul');
      record.members.forEach(member => {
        const item = document.createElement('li');
        item.textContent = `${member.name} - ${member.code} - ${member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên'}`;
        members.append(item);
      });
      group.append(heading, members);
      if (record.message) {
        const message = document.createElement('p');
        message.textContent = `Lời nhắn: ${record.message}`;
        group.append(message);
      }
    }
    document.title = `${record.id} — ${record.title} | Chi tiết ${registration ? 'đăng ký' : 'đề xuất'}`;
    content.dataset.proposalId = record.id;
    displayedRevision = record.revision;
    badge.textContent = labels[record.status];
    badge.dataset.status = record.status;
    text('#proposal-topic-title', `${record.id} — ${record.title}`);
    const topicFields = content.querySelectorAll('.request-topic__meta dd');
    [record.topicTypeLabel, window.UITLecturerCatalog.subjectLabel(record, true), record.semester ? `Học kỳ ${record.semester}` : '', record.academicYear]
      .forEach((value, index) => { topicFields[index].textContent = value || 'Chưa có thông tin'; });
    const studentFields = content.querySelectorAll('.request-student__meta dd');
    studentFields[0].textContent = record.studentName;
    studentFields[1].textContent = record.studentId;
    const sent = document.createElement('time');
    if (record.submittedAt) {
      sent.dateTime = record.submittedAt;
      sent.textContent = dateFormat.format(new Date(record.submittedAt));
      studentFields[2].replaceChildren(sent);
    } else studentFields[2].textContent = 'Chưa có thông tin';
    text('.request-student__avatar', record.studentName.split(/\s+/).slice(-2).map((part) => part[0]).join(''));
    text('.request-description p', record.description);
    text('.request-objectives p', record.objectives);
    text('.request-outcomes p', record.outcomes);
    let outlinePanel = content.querySelector('[data-proposal-outline-view]');
    if (!outlinePanel) {
      outlinePanel = document.createElement('section');
      outlinePanel.dataset.proposalOutlineView = '';
      outlinePanel.className = 'proposal-outline-panel';
      content.querySelector('.request-outcomes').after(outlinePanel);
    }
    window.IE104.shared?.proposalOutline?.render(outlinePanel, record);
    text('.request-attachments__file span', record.attachment);
    content.querySelector('.request-attachments').hidden = registration;
    document.getElementById('proposal-student-preview').href = registration ? `../sinh-vien/chi-tiet-dang-ky-da-luu.html?registration=${encodeURIComponent(record.id)}` : record.source === 'student' ? `../sinh-vien/${globalThis.IE104.services.proposals.detailUrl(record.id)}` : `../sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html?ma=${encodeURIComponent(record.id)}`;
    document.getElementById('proposal-student-preview').hidden = record.source === 'uit-demo';
    for (const form of forms) {
      form.querySelector('strong').textContent = `${record.id} — ${record.title}`;
      form.querySelector('button[type="submit"]').disabled = busy || record.status !== 'pending';
    }
    actions.hidden = record.status !== 'pending';
    for (const button of actions.querySelectorAll('button')) button.disabled = busy || record.status !== 'pending';
    result.hidden = record.status === 'pending';
    text('[data-proposal-result]', record.status === 'approved'
      ? `${record.topicId} — ${record.title}: Đang thực hiện.` : record.status === 'withdrawn' ? 'Sinh viên đã rút đề xuất.' : 'Đề xuất đã bị từ chối.');
    text('[data-proposal-reason]', record.reason ? `Lý do từ chối: ${record.reason}` : '');
    content.querySelector('[data-proposal-reason]').hidden = !record.reason;
    text('[data-proposal-decision-time]', record.decidedAt ? `Thời điểm xử lý: ${dateFormat.format(new Date(record.decidedAt))}.` : '');
    if (store.getError()) feedback.textContent = store.getError();
    if (!busy && record.status !== 'pending') {
      const wasOpen = dialogs.some((dialog) => dialog.open);
      for (const dialog of dialogs) if (dialog.open) dialog.close();
      if (wasOpen) {
        feedback.textContent = 'Đề xuất đã được xử lý. Kết quả đã cập nhật bên dưới.';
        feedback.focus();
      }
    }
  }

  function validateReason() {
    const invalid = reason.value.trim().length < 10;
    reasonError.hidden = !invalid;
    reason.setAttribute('aria-invalid', String(invalid));
    return !invalid;
  }
  reason.addEventListener('input', () => {
    if (reason.getAttribute('aria-invalid') === 'true') validateReason();
  });

  for (const form of forms) {
    form.noValidate = true;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy) return;
      const reject = form.id === 'reject-proposal-form';
      const error = form.querySelector('[data-decision-error]');
      error.hidden = true;
      if (reject && !validateReason()) { reason.focus(); return; }
      busy = true;
      form.setAttribute('aria-busy', 'true');
      render();
      try {
        await store.decide(id, reject ? 'rejected' : 'approved', reason.value, pendingRevision ?? displayedRevision);
        form.closest('dialog').close();
        feedback.textContent = `Đã lưu quyết định ${reject ? 'từ chối' : 'duyệt'} ${id}.`;
        feedback.focus();
      } catch (failure) {
        error.textContent = failure.name === 'SecurityError' || failure.name === 'QuotaExceededError'
          ? 'Không lưu được quyết định. Hãy cho phép lưu trữ trên trình duyệt và thử lại. Chưa cập nhật kết quả.'
          : failure.message;
        error.hidden = false;
      } finally {
        busy = false;
        form.removeAttribute('aria-busy');
        render();
      }
    });
  }
  store.subscribe(render);
  render();
})();
