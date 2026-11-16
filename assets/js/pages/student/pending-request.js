(() => {
  const selectedId = new URLSearchParams(location.search).get('ma');
  if (selectedId && selectedId !== 'DX001') {
    location.replace(`chi-tiet-de-xuat-nhom.html${location.search}${location.hash}`);
    return;
  }
  const service = globalThis.IE104?.services?.requests;
  const article = document.getElementById('dx001');
  const dialog = document.getElementById('withdraw-proposal-dialog');
  if (!service || !article || !dialog) return;
  const actions = document.querySelector('.pending-proposal-header__actions');
  const open = actions.querySelector('button');
  const confirm = dialog.querySelector('[data-confirm-pending-withdraw]');
  const error = dialog.querySelector('[data-pending-error]');
  const result = document.querySelector('[data-pending-result]');
  const notice = document.querySelector('.pending-proposal-notice');
  let record = null;
  let pending = null;
  let saving = false;

  function render() {
    try {
      record = service.findById('DX001');
      if (!record) throw new Error('Không tìm thấy đề xuất DX001.');
      actions.hidden = !service.permissions(record).edit;
      article.hidden = Boolean(record.deletedAt);
      document.querySelector('.proposal-status').textContent = record.deletedAt ? 'Đã xóa khỏi danh sách' : service.labels[record.status];
      document.querySelector('.proposal-status').dataset.requestStatus = record.deletedAt ? 'da-xoa' : record.status;
      notice.textContent = record.deletedAt ? 'Đề xuất đã được xóa khỏi danh sách thử.' : record.status === 'da-duyet' ? 'Đề xuất đã được giảng viên duyệt. Đề tài đang thực hiện.' : record.status === 'tu-choi' ? `Đề xuất đã bị từ chối. ${record.feedback}` : record.status === 'cho-duyet' ? 'Đề xuất đang chờ giảng viên xét duyệt. Bạn chưa thể bắt đầu thực hiện đề tài.' : 'Đề xuất đã rút. Bạn có thể xem lại thông tin và lịch sử trong danh sách yêu cầu.';
      document.getElementById('proposal-topic-title').textContent = record.title;
      const values = article.querySelectorAll('.pending-proposal-summary__meta dd');
      [record.typeLabel, record.courseLabel, record.semester, record.academicYear].forEach((value, index) => { values[index].textContent = value; });
      const recipient = article.querySelectorAll('.proposal-recipient dd');
      recipient[0].textContent = record.lecturerName;
      article.querySelector('.proposal-recipient__avatar').textContent = record.lecturerName.split(' ').filter(Boolean).map((part, index, parts) => index === 0 || index === parts.length - 1 ? part[0] : '').join('');
      recipient[2].textContent = new Date(record.resubmittedAt || record.createdAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
      article.querySelector('.proposal-description p').textContent = record.description;
      article.querySelector('.proposal-objectives p').textContent = record.objectives || 'Chưa có thông tin';
      article.querySelector('.proposal-outcomes p').textContent = record.outcomes || 'Chưa có thông tin';
      return true;
    } catch (failure) { actions.hidden = true; article.hidden = true; notice.textContent = failure.message; return false; }
  }

  open.removeAttribute('command');
  open.removeAttribute('commandfor');
  open.addEventListener('click', () => {
    if (!render() || !service.permissions(record).withdraw) return;
    pending = { revision: record.revision };
    dialog.querySelector('[data-pending-question]').textContent = `Bạn có chắc muốn rút đề xuất “${record.title}”?`;
    error.hidden = true;
    confirm.disabled = false;
    dialog.showModal();
  });
  confirm.addEventListener('click', () => {
    if (!pending || saving) return;
    saving = true;
    confirm.disabled = true;
    try {
      service.mutate('DX001', pending.revision, 'withdraw');
      dialog.close();
      render();
      result.textContent = 'Đã lưu việc rút đề xuất thử trên trình duyệt. Chưa gửi đến giảng viên hoặc hệ thống.';
      result.hidden = false;
      result.focus();
    } catch (failure) { error.textContent = failure.message; error.hidden = false; error.focus(); }
    finally { saving = false; confirm.disabled = false; }
  });
  dialog.addEventListener('close', () => { pending = null; });
  window.addEventListener('pageshow', render);
  window.addEventListener('storage', event => { if ([globalThis.IE104.storage.requestKey, null].includes(event.key) || event.key?.startsWith('ie104.proposal-decision.v1.')) render(); });
  render();
  document.body.dataset.pendingRequestReady = 'true';
})();
