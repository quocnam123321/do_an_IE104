(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.shared ||= {};
  const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
  function milestones(record, fallback) {
    const outline = record.outline;
    const saved = record.milestones || record.sourceRecord?.supervision?.milestones || fallback || [];
    return [
      outline?.startDate || record.startsAt || saved[0],
      outline?.progressReportDate || record.progressReportDate || saved[1],
      outline?.finalReportDate || outline?.endDate || record.finalReportDate || saved[2],
    ].map(value => {
      if (!value) return 'Chưa có mốc thời gian';
      if (/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(value) && Number.isFinite(Date.parse(value))) return dateFormat.format(new Date(value));
      return value;
    });
  }
  function fields(record) {
    const outline = record.outline;
    if (!outline) return [];
    // Ngày, nhóm, GVHD, phương pháp và kế hoạch có khung riêng trong Tổng quan.
    const secondary = outline.secondarySupervisor;
    return [
      ['Tên đề tài tiếng Anh', outline.englishTitle],
      ['Người hướng dẫn phụ trong đề cương', secondary?.name ? [secondary.name, secondary.degree, secondary.workplace].filter(Boolean).join(' - ') : ''],
    ].filter(([, value]) => Boolean(value?.trim()));
  }
  function render(container, record) {
    if (!container) return;
    container.replaceChildren();
    const rows = fields(record);
    container.hidden = !rows.length;
    if (!rows.length) return;
    const title = document.createElement('h2');
    title.textContent = 'Thông tin bổ sung';
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
  app.shared.proposalOutline = { fields, render, milestones };
})();
