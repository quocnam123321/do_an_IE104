(() => {
  const content = document.querySelector('[data-receipt-content]');
  const service = globalThis.IE104?.services?.registrations;
  if (!content || !service) return;
  try {
    const id = new URLSearchParams(location.search).get('registration');
    const record = service.findById(id);
    if (!record) throw new Error('Không tìm thấy đăng ký đã lưu trên trình duyệt này.');
    const title = document.createElement('h3');
    title.textContent = record.topic.title;
    const details = document.createElement('dl');
    const fields = [['Mã yêu cầu', record.id], ['Mã đề tài', record.topic.displayId || record.topic.id], ['Nhóm', record.groupName], ['Trạng thái mẫu', 'Chờ duyệt'], ['Ngày lưu', new Date(record.createdAt).toLocaleString('vi-VN')]];
    if (record.message) fields.push(['Lời nhắn', record.message]);
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
  } catch (error) {
    content.textContent = error.message;
  }
})();
