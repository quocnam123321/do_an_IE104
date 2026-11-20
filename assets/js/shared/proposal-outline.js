(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.shared ||= {};
  function fields(record) {
    const outline = record.outline;
    if (!outline) return [];
    const person = value => [value.name, value.degree, value.workplace].filter(Boolean).join(' - ');
    const date = value => value ? value.split('-').reverse().join('/') : 'Chưa xác định';
    return [
      ['Tên đề tài tiếng Anh', outline.englishTitle],
      ['Thời gian dự kiến', outline.startDate || outline.endDate ? `${date(outline.startDate)} - ${date(outline.endDate)}` : ''],
      ['Sinh viên thực hiện', outline.members.map(member => `${member.name} - ${member.code}${member.role === 'nhom-truong' ? ' - Nhóm trưởng' : ''}`).join('\n')],
      ['Thông tin GVHD trong đề cương', person(outline.supervisor)],
      ['Người hướng dẫn phụ trong đề cương', person(outline.secondarySupervisor)],
      ['Phương pháp thực hiện', outline.method],
      ['Nội dung chính, phạm vi và cách đánh giá', outline.scope],
      ['Kế hoạch thực hiện và phân công', outline.plan],
    ].filter(([, value]) => Boolean(value));
  }
  function render(container, record) {
    container.replaceChildren();
    const rows = fields(record);
    container.hidden = !rows.length;
    if (!rows.length) return;
    const title = document.createElement('h2');
    title.textContent = 'Đề cương chi tiết';
    const list = document.createElement('dl');
    list.className = 'proposal-outline-details';
    rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const text = document.createElement('dd');
      term.textContent = label;
      text.textContent = value;
      row.append(term, text);
      list.append(row);
    });
    container.append(title, list);
  }
  app.shared.proposalOutline = { fields, render };
})();
