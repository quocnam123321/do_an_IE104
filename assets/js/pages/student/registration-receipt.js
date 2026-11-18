(() => {
  const content = document.querySelector('[data-receipt-content]');
  const app = globalThis.IE104;
  const service = app?.services?.registrations;
  if (!content || !service) return;
  function render() {
    try {
      const id = new URLSearchParams(location.search).get('registration');
      const record = service.findById(id);
      if (!record || !service.owns(record)) throw new Error('Không tìm thấy đăng ký của sinh viên hiện tại trên trình duyệt này.');
      const title = document.createElement('h3');
      title.textContent = record.topic.title;
      const details = document.createElement('dl');
      const fields = [['Mã yêu cầu', record.id], ['Mã đề tài', record.topic.displayId || record.topic.id], ['Nhóm', record.groupName],
        ['Trạng thái', service.labels[record.status]], ['Ngày lưu', new Date(record.createdAt).toLocaleString('vi-VN')]];
      if (record.message) fields.push(['Lời nhắn', record.message]);
      if (record.decision) fields.push(['Ngày xử lý', new Date(record.decision.decidedAt).toLocaleString('vi-VN')]);
      if (record.decision?.reason) fields.push(['Lý do từ chối', record.decision.reason]);
      if (!record.lecturerId) fields.push(['Xét duyệt', 'Đăng ký mẫu cũ chưa có mã giảng viên nhận.']);
      fields.forEach(([label, value]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt');
        const description = document.createElement('dd');
        term.textContent = label;
        description.textContent = value;
        row.append(term, description);
        details.append(row);
      });
      const members = document.createElement('ul');
      record.members.forEach(member => {
        const item = document.createElement('li');
        item.textContent = `${member.code} - ${member.name} - ${member.role === 'nhom-truong' ? 'Nhóm trưởng' : 'Thành viên'}`;
        members.append(item);
      });
      content.replaceChildren(title, details, members);
      if (record.status === 'da-duyet') {
        const link = document.createElement('a');
        link.href = `chi-tiet-de-tai-da-duyet-sinh-vien.html?project=${encodeURIComponent(`DT-${record.id}`)}`;
        link.textContent = 'Xem đề tài đang thực hiện';
        content.append(link);
      }
    } catch (error) { content.textContent = error.message; }
  }
  window.addEventListener('storage', event => { if ([null, app.storage.registrationKey].includes(event.key)) render(); });
  window.addEventListener('ie104:registrations-updated', render);
  window.addEventListener('pageshow', render);
  render();
})();
