(() => {
  'use strict';

  const store = window.IE104Proposals;
  if (!store) return;
  const missing = 'Chưa có thông tin';
  const demoNote = 'Dữ liệu demo được lưu trên trình duyệt này, chưa đồng bộ qua máy chủ.';
  const statusLabels = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
  const topicLabels = { pending: 'Chờ duyệt', approved: 'Đang thực hiện', rejected: 'Từ chối' };
  const dateFormat = new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh',
  });

  function setText(selector, value, parent = document) {
    const element = parent.querySelector(selector);
    if (element) element.textContent = value || missing;
  }

  function resultMessage(record) {
    if (record.status === 'approved') return 'Đề xuất đã được duyệt. Đề tài đang thực hiện.';
    if (record.status === 'rejected') return `Đề xuất đã bị từ chối. Lý do: ${record.reason}`;
    return 'Đề xuất đang chờ giảng viên xét duyệt. Bạn chưa thể bắt đầu thực hiện đề tài.';
  }

  function updateMyTopics(record) {
    const card = document.querySelector('.student-my-topics-list-page [data-topic-id="DX001"]');
    if (!card || !record) return;
    card.dataset.status = record.topicStatus;
    const badge = card.querySelector('.topic-card__status');
    badge.textContent = topicLabels[record.status];
    badge.className = 'topic-card__status topic-card__status--' +
      ({ pending: 'pending', approved: 'progress', rejected: 'rejected' }[record.status]);
    const link = card.querySelector('.topic-card__link');
    link.href = 'chi-tiet-de-tai-cho-duyet-sinh-vien.html?ma=DX001';
    let feedback = card.querySelector('[data-proposal-feedback]');
    if (!feedback) {
      feedback = document.createElement('p');
      feedback.className = 'topic-card__decision';
      feedback.setAttribute('data-proposal-feedback', '');
      card.querySelector('.topic-card__content').append(feedback);
    }
    feedback.hidden = record.status === 'pending' && !store.getError();
    feedback.textContent = store.getError() || (record.status === 'rejected'
      ? `Lý do từ chối: ${record.reason}` : 'Đề xuất đã được duyệt trong bản demo.');
    document.dispatchEvent(new Event('ie104:topics-updated'));
  }

  function updateRequest(record) {
    const article = document.querySelector('.request-detail-page #dx001');
    if (!article || !record) return;
    article.dataset.requestStatus = { pending: 'cho-duyet', approved: 'da-duyet', rejected: 'tu-choi' }[record.status];
    setText('[data-proposal-request-status]', statusLabels[record.status], article);
    setText('.request-detail__status-label', statusLabels[record.status], article);
    setText('[data-proposal-request-feedback]', resultMessage(record), article);
    const note = article.querySelector('[data-proposal-demo-note]');
    if (note) note.textContent = store.getError() || demoNote;
    const processed = record.status !== 'pending';
    const actions = article.querySelector('.request-detail__actions');
    if (actions) actions.hidden = processed;
    const edit = article.querySelector('.request-detail__edit-disclosure');
    if (edit) {
      // Giữ fragment chỉnh sửa cũ, nhưng không cho nhập lại hồ sơ đã xử lý.
      for (const control of edit.querySelectorAll('input, select, textarea, button')) {
        if (!control.hasAttribute('data-original-disabled')) {
          control.dataset.originalDisabled = String(control.disabled);
        }
        control.disabled = processed || control.dataset.originalDisabled === 'true';
      }
      edit.hidden = processed;
    }
    const selector = document.querySelector('.request-detail-notice a[href="#dx001"]');
    if (selector) selector.textContent = `DX001 — Đề xuất theo nhóm · ${statusLabels[record.status]}`;
  }

  function updateDetail() {
    const page = document.querySelector('.pending-proposal-page');
    if (!page) return;
    const query = new URLSearchParams(window.location.search);
    const id = query.has('ma') ? query.get('ma') : 'DX001';
    const record = store.get(id);
    const article = page.querySelector('.pending-proposal');
    const actions = page.querySelector('.pending-proposal-header__actions');
    const badges = page.querySelectorAll('[data-proposal-status]');
    const nameRow = page.querySelector('.student-topic-overview-name');
    const notice = page.querySelector('.pending-proposal-notice');
    if (!record) {
      article.hidden = true;
      actions.hidden = true;
      for (const badge of badges) badge.hidden = true;
      nameRow.hidden = true;
      notice.textContent = 'Không tìm thấy đề xuất theo mã đã chọn. Quay lại Đề tài của tôi để chọn hồ sơ hợp lệ.';
      document.title = 'Không tìm thấy đề xuất | Đề tài của tôi';
      return;
    }
    article.hidden = false;
    nameRow.hidden = false;
    article.dataset.proposalId = record.id;
    for (const badge of badges) {
      badge.hidden = false;
      badge.textContent = topicLabels[record.status];
      badge.dataset.status = record.status;
    }
    notice.textContent = `Đề xuất ${record.id}. ${resultMessage(record)} ${store.getError() || demoNote}`;
    document.title = `${record.title} — ${topicLabels[record.status]} | Đề tài của tôi`;
    actions.hidden = record.status !== 'pending' || record.id !== 'DX001';
    if (record.status !== 'pending') {
      const dialog = document.getElementById('withdraw-proposal-dialog');
      if (dialog?.open) dialog.close();
    }
    setText('#proposal-topic-title', record.title);
    setText('[data-proposal-name]', record.title);
    const academicYear = (record.academicYear || '').replace(/\s*[-–]\s*/g, '–');
    const semester = [record.semester ? `Học kỳ ${record.semester}` : '', academicYear].filter(Boolean).join(' • ');
    const summaryValues = { id: record.id, type: record.topicTypeLabel, course: record.courseLabel, semester };
    for (const [field, value] of Object.entries(summaryValues)) {
      setText(`[data-proposal-summary-field="${field}"]`, value, article);
    }
    const ownProposal = record.id === 'DX001';
    article.querySelector('.topic-overview-layout__aside').setAttribute('aria-label',
      `${ownProposal ? 'Giảng viên nhận đề xuất' : 'Sinh viên gửi đề xuất'} và tài liệu đính kèm`);
    setText('#proposal-recipient-title', ownProposal ? 'Giảng viên nhận đề xuất' : 'Sinh viên gửi đề xuất');
    const recipientLabels = ['Họ tên', ownProposal ? 'Vai trò được đề xuất' : 'MSSV', 'Ngày gửi đề xuất'];
    const recipientValues = [ownProposal ? record.supervisor : record.studentName,
      ownProposal ? record.supervisionRoleLabel : record.studentId,
      record.submittedAt ? dateFormat.format(new Date(record.submittedAt)) : missing];
    article.querySelectorAll('.proposal-recipient dt').forEach((element, index) => {
      element.textContent = recipientLabels[index];
    });
    article.querySelectorAll('.proposal-recipient dd').forEach((element, index) => {
      element.textContent = recipientValues[index] || missing;
    });
    setText('.proposal-recipient__avatar', ownProposal ? 'GV' : 'SV');
    setText('.proposal-description p', record.description, article);
    setText('.proposal-objectives p', record.objectives, article);
    setText('.proposal-outcomes p', record.outcomes, article);
    setText('.topic-attachments__file > span', record.attachment || 'Chưa có tài liệu đính kèm', article);
    const attachmentButton = article.querySelector('.proposal-attachments__item button');
    if (attachmentButton) attachmentButton.hidden = !record.attachment;
  }

  function render() {
    const record = store.get('DX001');
    updateMyTopics(record);
    updateRequest(record);
    updateDetail();
  }

  store.subscribe(render);
  render();
})();
