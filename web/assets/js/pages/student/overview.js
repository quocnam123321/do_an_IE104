(() => {
  const app = globalThis.IE104;
  const service = app?.services?.overview;
  if (!document.body.classList.contains('student-overview-page') || !service) return;

  const progressList = document.querySelector('.supervised-progress__list');
  const requestList = document.querySelector('.pending-requests__list');
  const notice = document.querySelector('[data-overview-notice]');
  const chart = document.querySelector('.topic-status__chart');
  const chartContent = chart.parentElement;
  const emptyChart = document.querySelector('#topic-status-empty');
  const chartLabels = chart.querySelector('g');
  const chartTotal = chartLabels.querySelector('text:nth-of-type(2)');
  const legend = document.querySelector('.topic-status__legend');
  const preview = location.protocol === 'file:';
  const percentFormat = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });
  const dateFormat = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
  });
  const timeFormat = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const iconPaths = {
    code: ['m20 13-7 7L3 10V3h7l10 10Z', 'M7.5 5.75a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z'],
    person: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z'],
    group: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
      'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    calendar: ['M8 3v4m8-4v4M3 10h18', 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z'],
    arrow: ['M4 12h15m-6-6 6 6-6 6'],
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function svgElement(tag, attributes) {
    const node = document.createElementNS(chart.namespaceURI, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
    return node;
  }

  const slices = Object.entries(service.statuses).map(([status, label]) => {
    const circle = svgElement('circle', {
      cx: 130, cy: 120, r: 78, fill: 'none', 'stroke-width': 48,
      pathLength: 100, 'stroke-dasharray': '0 100', transform: 'rotate(-90 130 120)', 'data-status': status,
    });
    chart.insertBefore(circle, chartLabels);
    const row = element('div');
    row.dataset.status = status;
    const value = element('dd');
    row.append(element('dt', '', label), value);
    legend.append(row);
    return { status, label, circle, row, value };
  });

  function drawChart(total, counts) {
    chartContent.hidden = !total;
    emptyChart.hidden = Boolean(total);
    const labels = [];
    let offset = 0;
    for (const { status, label, circle, row, value } of slices) {
      const count = counts[status];
      const share = total ? count / total : 0;
      const arc = share * 100;
      circle.setAttribute('stroke-dasharray', `${arc} ${100 - arc}`);
      circle.setAttribute('stroke-dashoffset', -offset);
      circle.toggleAttribute('hidden', !count);
      value.textContent = count;
      row.hidden = !count && !['dang-thuc-hien', 'cho-duyet', 'hoan-thanh', 'tu-choi'].includes(status);
      if (share >= 0.08) {
        const angle = (offset + arc / 2) * 2 * Math.PI / 100;
        const text = svgElement('text', {
          class: 'topic-status__percent', x: 130 + 78 * Math.sin(angle), y: 120 - 78 * Math.cos(angle),
          'dominant-baseline': 'central',
        });
        text.textContent = percentFormat.format(share);
        labels.push(text);
      }
      offset += arc;
    }
    chartTotal.textContent = total;
    chart.querySelector('desc').textContent = slices.map(({ status, label }) =>
      `${label}: ${counts[status]} (${percentFormat.format(total ? counts[status] / total : 0)})`).join(' · ');
    chartLabels.querySelectorAll('.topic-status__percent').forEach(label => label.remove());
    chartLabels.append(...labels);
  }

  function icon(name) {
    const svg = svgElement('svg', {
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false',
    });
    svg.append(...iconPaths[name].map(d => svgElement('path', { d })));
    return svg;
  }

  function metadata(className, iconName, label, value) {
    const item = element('span', className);
    const content = element('span');
    content.append(element('span', 'visually-hidden', label + ': '), value);
    item.append(icon(iconName), content);
    return item;
  }

  function card(headingId, title, className, action, href) {
    const article = element('article', className);
    const heading = element('h3', '', title);
    heading.id = headingId;
    article.setAttribute('aria-labelledby', headingId);
    const link = element('a');
    link.append(element('span', '', action), icon('arrow'));
    link.setAttribute('aria-describedby', headingId);
    if (href) link.href = href;
    return { article, heading, link };
  }

  function progressCard(topic, index) {
    const detailUrl = topic.detailUrl?.startsWith('chi-tiet-de-tai-sinh-vien.html')
      ? topic.detailUrl.replace(/#.*$/, '') + '#tien-do' : topic.detailUrl;
    const { article, heading, link } = card(`overview-project-${index}`, topic.title, 'topic-progress-card', 'Xem đề tài', detailUrl);
    const { isGroup, label: participant } = topic.participants;
    const meta = element('p', 'topic-progress-card__meta');
    const code = app.services.studentTopicCodes.get(topic) || 'Chưa có mã đề tài';
    meta.append(
      metadata('topic-progress-card__meta-item', 'code', 'Mã đề tài', code),
      metadata('topic-progress-card__meta-item', isGroup ? 'group' : 'person',
        isGroup ? 'Nhóm thực hiện' : 'Sinh viên thực hiện', participant || 'Chưa có thông tin')
    );
    const summary = element('div', 'topic-progress-card__summary');
    summary.append(heading, meta);
    const detail = element('p', 'topic-progress-card__progress');
    if (topic.progress?.total) {
      const percent = topic.progress.percent;
      const meter = element('progress', '', `${percent}%`);
      meter.id = `overview-progress-${index}`;
      meter.max = 100;
      meter.value = percent;
      const label = element('label', '', `${percent}% hoàn thành`);
      label.htmlFor = meter.id;
      detail.append(label, meter);
    } else {
      detail.textContent = topic.progress ? 'Chưa có công việc để tính tiến độ.' : 'Không đọc được tiến độ của đề tài.';
    }
    article.append(summary, detail);
    if (detailUrl) article.append(link);
    return article;
  }

  function requestCard(topic, index) {
    const action = topic.requestId.startsWith('DK') ? 'Xem đăng ký' : 'Xem đề xuất';
    const { article, heading, link } = card(`overview-request-${index}`, topic.title, 'request-card', action, topic.detailUrl);
    const submittedAt = new Date(Date.parse(topic.submittedAt));
    let time = 'Chưa có thông tin';
    if (Number.isFinite(submittedAt.getTime())) {
      const date = dateFormat.format(submittedAt);
      time = element('time', '', topic.submittedAt.length === 10 ? date : `${timeFormat.format(submittedAt)} · ${date}`);
      time.dateTime = topic.submittedAt;
    }
    const meta = element('p', 'request-card__meta');
    meta.append(
      metadata('request-card__meta-item', 'person', 'Giảng viên nhận yêu cầu', topic.lecturer || 'Chưa có thông tin'),
      metadata('request-card__meta-item', 'calendar', 'Thời gian gửi', time)
    );
    article.append(heading, meta);
    if (topic.detailUrl) article.append(link);
    return article;
  }

  function render() {
    try {
      const state = service.getState({ preview });
      notice.textContent = state.warning ? 'Một số dữ liệu chưa tải được. Hãy tải lại trang để thử lại.' : '';
      const values = { total: state.total, active: state.counts['dang-thuc-hien'], completed: state.counts['hoan-thanh'], pending: state.counts['cho-duyet'] };
      document.querySelectorAll('[data-overview-count]').forEach(node => { node.textContent = values[node.dataset.overviewCount]; });
      emptyChart.textContent = 'Chưa có đề tài để thống kê.';
      drawChart(state.total, state.counts);
      progressList.replaceChildren(...(state.active.length ? state.active.map(progressCard)
        : [element('p', '', 'Bạn chưa có đề tài đang thực hiện.')]));
      requestList.replaceChildren(...(state.pending.length ? state.pending.map(requestCard)
        : [element('p', '', 'Không có yêu cầu chờ duyệt.')]));
      document.body.dataset.overviewReady = 'true';
    } catch {
      notice.textContent = 'Chưa tải được Tổng quan. Hãy tải lại trang để thử lại.';
    }
  }

  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  window.addEventListener('storage', event => {
    const { teamKey, progressKey, registrationKey, requestKey, proposalKey, teachingKey } = app.storage;
    if ([null, teamKey, progressKey, registrationKey, requestKey, proposalKey, teachingKey].includes(event.key)) render();
  });
  window.addEventListener('ie104:registrations-updated', render);
  window.addEventListener('ie104:proposals-updated', render);
  window.IE104Proposals?.subscribe?.(render);
  render();
})();
