(() => {
  const content = document.querySelector('[data-receipt-content]');
  const service = globalThis.IE104?.services?.proposals;
  if (!content || !service) return;
  const id = new URLSearchParams(location.search).get('proposal');
  const actions = document.querySelector('[data-proposal-actions]');
  const dialog = document.getElementById('withdraw-proposal-dialog');
  const error = document.querySelector('[data-withdraw-error]');
  const confirm = document.querySelector('[data-confirm-withdraw]');
  let displayed = null;
  let pending = null;
  let saving = false;

  function render() {
    const record = service.findById(id);
    if (!record) throw new Error('Không tìm thấy đề xuất đã lưu trên trình duyệt này.');
    const title = document.createElement('h3');
    title.textContent = record.title;
    const details = document.createElement('dl');
    const fields = [['Mã đề xuất thử', record.id], ['Trạng thái mẫu', service.labels[record.status]], ['Loại đề tài', record.typeLabel], ['Môn học', record.courseLabel], ['Học kỳ - Năm học', `${record.semester === 'he' ? 'Hè' : record.semester} - ${record.academicYear}`], ['Giảng viên nhận đề xuất', record.supervisorName], ['Ngày lưu', new Date(record.createdAt).toLocaleString('vi-VN')], ['Mô tả', record.description], ['Mục tiêu', record.objectives], ['Kết quả dự kiến', record.outcomes], ['Tài liệu đính kèm', record.attachment ? `${record.attachment.name} (${record.attachment.size} byte). Chỉ lưu thông tin tệp, chưa lưu nội dung tệp.` : 'Không đính kèm']];
    if (record.decision) { fields.push(['Ngày xét duyệt', new Date(record.decision.decidedAt).toLocaleString('vi-VN')]); if (record.decision.reason) fields.push(['Lý do từ chối', record.decision.reason]); }
    if (record.updatedAt) fields.push(['Lần sửa gần nhất', new Date(record.updatedAt).toLocaleString('vi-VN')]);
    if (record.withdrawnAt) fields.push(['Ngày rút', new Date(record.withdrawnAt).toLocaleString('vi-VN')]);
    fields.forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const description = document.createElement('dd');
      term.textContent = label;
      description.textContent = value;
      row.append(term, description);
      details.append(row);
    });
    content.replaceChildren(title, details);
    if (record.status === 'da-duyet' && globalThis.IE104.services.approvedProjects) {
      const link = document.createElement('a');
      link.href = globalThis.IE104.services.approvedProjects.studentUrl(globalThis.IE104.services.approvedProjects.projectIdFor(record.id));
      link.textContent = 'Mở đề tài và nhóm thực hiện';
      content.append(link);
    }
    displayed = record;
    actions.hidden = record.status !== 'cho-duyet';
    document.querySelector('[data-edit-proposal]').href = `tao-de-xuat.html?proposal=${encodeURIComponent(record.id)}`;
  }

  function refresh() {
    try { render(); }
    catch (failure) { content.textContent = failure.message; actions.hidden = true; displayed = null; }
  }

  document.querySelector('[data-open-withdraw]').addEventListener('click', () => {
    refresh();
    if (!displayed || displayed.status !== 'cho-duyet') return;
    pending = displayed;
    document.querySelector('[data-withdraw-title]').textContent = displayed.title;
    error.hidden = true;
    dialog.showModal();
  });
  dialog.addEventListener('close', () => { pending = null; });
  confirm.addEventListener('click', () => {
    if (!pending || saving) return;
    saving = true;
    confirm.disabled = true;
    try {
      service.withdraw(pending.id, pending.revision || 0);
      dialog.close();
      refresh();
      const result = document.querySelector('[data-proposal-result]');
      result.textContent = 'Đã rút đề xuất thử trên trình duyệt này. Bản lưu vẫn được giữ lại để xem.';
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
  window.addEventListener('pageshow', refresh);
  window.addEventListener('ie104:proposals-updated', refresh);
  window.addEventListener('storage', event => {
    if (event.key === globalThis.IE104.storage.proposalKey || event.key === null) refresh();
  });
  refresh();
})();
