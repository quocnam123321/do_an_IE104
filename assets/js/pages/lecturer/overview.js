(() => {
  const app = globalThis.IE104;
  if (!app?.services?.lecturerTopics || !document.querySelector('.dashboard-summary')) return;
  const status = document.getElementById('lecturer-overview-status');
  const make = (tag, text, className) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  };
  function render() {
    const errors = [];
    const attempt = action => { try { return action(); } catch (failure) { errors.push(failure.message); return null; } };
    const catalog = app.services.lecturerTopics;
    const created = attempt(() => catalog.list('created'));
    const supervised = attempt(() => catalog.list('supervised'));
    const requests = attempt(() => globalThis.IE104Proposals.getAll());
    if (globalThis.IE104Proposals.getError()) errors.push(globalThis.IE104Proposals.getError());
    const dynamic = requests?.filter(record => record.status === 'approved') || [];
    const requestsComplete = requests && !globalThis.IE104Proposals.getError();
    const supervisedCount = supervised && requestsComplete ? supervised.length + dynamic.length : null;
    const counts = [created && supervisedCount !== null ? created.length + supervisedCount : null, created?.length, supervisedCount, requestsComplete ? requests.filter(record => record.status === 'pending').length : null];
    document.querySelectorAll('.summary-card__value strong').forEach((node, index) => { node.textContent = counts[index] ?? '—'; });
    const grouped = new Map();
    const add = label => grouped.set(label, (grouped.get(label) || 0) + 1);
    created?.forEach(topic => {
      const availability = app.services.publishedTopics.availability(topic);
      add(availability.allowed ? 'Đang mở đăng ký' : 'Chưa mở / đã đóng đăng ký');
    });
    supervised?.forEach(topic => add(topic.statusLabel));
    dynamic.forEach(() => add('Đang thực hiện'));
    const legend = document.querySelector('.topic-status__legend');
    document.querySelector('.topic-status__content').hidden = errors.length > 0;
    legend.replaceChildren();
    const svg = document.querySelector('.topic-status__chart');
    svg.replaceChildren();
    const ns = 'http://www.w3.org/2000/svg';
    const total = [...grouped.values()].reduce((sum, count) => sum + count, 0);
    const title = document.createElementNS(ns, 'title');
    title.id = 'status-chart-title';
    title.textContent = `Tổng ${total} mục đề tài: ${[...grouped].map(([label, count]) => `${label}: ${count}`).join('; ')}`;
    svg.append(title);
    svg.removeAttribute('aria-describedby');
    svg.setAttribute('aria-labelledby', title.id);
    let offset = 0;
    [...grouped].forEach(([label, count], index) => {
      const row = make('div');
      row.classList.add(`overview-legend-${index % 4}`);
      row.append(make('dt', label), make('dd', count));
      legend.append(row);
      const arc = document.createElementNS(ns, 'circle');
      const fraction = total ? count / total * 100 : 0;
      const attributes = { cx: 130, cy: 120, r: 78, fill: 'none', 'stroke-width': 48, pathLength: 100,
        'stroke-dasharray': `${fraction} ${100 - fraction}`, 'stroke-dashoffset': -offset, transform: 'rotate(-90 130 120)' };
      Object.entries(attributes).forEach(([name, value]) => arc.setAttribute(name, value));
      arc.classList.add(`overview-chart-segment-${index % 4}`);
      svg.append(arc);
      offset += fraction;
    });
    const center = document.createElementNS(ns, 'text');
    center.setAttribute('x', '130'); center.setAttribute('y', '130'); center.setAttribute('text-anchor', 'middle');
    center.textContent = total;
    center.classList.add('overview-chart-total');
    svg.append(center);
    const progressList = document.querySelector('.supervised-progress__list');
    progressList.replaceChildren();
    const entries = [
      ...(supervised || []).map(topic => ({ id: topic.workspaceId, title: topic.title, groupName: topic.groupName, url: catalog.detailUrl(topic) + '#tien-do' })),
      ...dynamic.map(record => ({ id: record.topicId, title: record.title, groupName: record.groupName || `Nhóm của ${record.studentName}`,
        url: ['student', 'registration'].includes(record.source) ? app.services.approvedProjects.lecturerUrl(record.topicId) + '#tien-do' : `chi-tiet-de-xuat-giang-vien.html?ma=${encodeURIComponent(record.id)}` })),
    ];
    entries.slice(0, 3).forEach(entry => {
      const card = make('article', undefined, 'topic-progress-card');
      card.append(make('h3', entry.title), make('p', `Nhóm thực hiện: ${entry.groupName}`));
      try {
        const state = catalog.workspaceState(entry.id);
        if (!state.progress) card.append(make('p', 'Chưa có dữ liệu tiến độ của nhóm.'));
        else {
          const summary = app.services.projectProgress.summarize(state.progress);
          const label = make('label', summary.percent === null ? 'Chưa đủ dữ liệu tính tiến độ' : `${summary.percent}% hoàn thành`);
          const bar = make('progress');
          bar.id = `overview-progress-${entry.id}`;
          bar.max = 100;
          if (summary.percent !== null) bar.value = summary.percent;
          label.htmlFor = bar.id;
          card.append(label, bar);
        }
      } catch (failure) { card.append(make('p', failure.message)); }
      const link = make('a', 'Xem đề tài →');
      link.href = entry.url;
      card.append(link);
      progressList.append(card);
    });
    if (!entries.length) progressList.append(make('p', supervised ? 'Chưa có đề tài đang hướng dẫn.' : 'Chưa đọc được danh sách đề tài.'));
    const requestList = document.querySelector('.pending-requests__list');
    requestList.replaceChildren();
    const pending = requests?.filter(record => record.status === 'pending') || [];
    pending.slice().sort((a, b) => (Date.parse(b.submittedAt) || 0) - (Date.parse(a.submittedAt) || 0)).slice(0, 3).forEach(record => {
      const card = make('article', undefined, 'request-card');
      card.append(make('h3', record.title), make('p', 'Chờ duyệt', 'status-badge'), make('p', `${record.groupName ? record.groupName + ' - ' : ''}${record.studentName} - ${record.studentId}`));
      card.append(make('p', `Ngày gửi: ${record.submittedAt ? new Date(record.submittedAt).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Chưa có thông tin'}`));
      const link = make('a', 'Xem yêu cầu →');
      link.href = `chi-tiet-de-xuat-giang-vien.html?ma=${encodeURIComponent(record.id)}`;
      card.append(link);
      requestList.append(card);
    });
    if (!pending.length) requestList.append(make('p', errors.length ? 'Chưa đọc đủ danh sách yêu cầu.' : 'Không có yêu cầu chờ duyệt.'));
    status.textContent = errors.length ? [...new Set(errors)].join(' ') : 'Tổng gồm đề tài đã tạo và các mục đang hướng dẫn.';
  }
  window.addEventListener('storage', render);
  ['pageshow', 'ie104:proposals-updated', 'ie104:registrations-updated', 'ie104:lecturer-topics-updated'].forEach(event => window.addEventListener(event, render));
  window.addEventListener('focus', render);
  let timer;
  const schedule = () => {
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(render, 30000);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); schedule(); });
  window.addEventListener('pagehide', () => clearInterval(timer));
  window.addEventListener('pageshow', schedule);
  schedule();
  render();
})();
