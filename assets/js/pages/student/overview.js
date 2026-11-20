(() => {
  const service = globalThis.IE104?.services?.overview;
  if (!document.body.classList.contains('student-overview-page')) return;
  const progressList = document.querySelector('.topic-progress__list');
  const requestList = document.querySelector('.recent-requests__list');
  const figure = document.querySelector('.registration-status__figure');
  if (location.protocol === 'file:') {
    document.querySelectorAll('[data-preview-count]').forEach(count => {
      count.textContent = count.dataset.previewCount;
    });
    document.querySelector('.dashboard-summary').setAttribute('aria-describedby', 'overview-preview-label');
    figure.hidden = progressList.hidden = requestList.hidden = false;
    return;
  }

  if (!service) return;
  const progressTemplate = progressList.firstElementChild.cloneNode(true);
  const requestTemplate = requestList.firstElementChild.cloneNode(true);
  const notice = document.querySelector('[data-overview-notice]');
  const chart = document.querySelector('.registration-status__chart');
  const percentLabels = chart.querySelector('.registration-status__percentages');
  const percentFormat = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });
  const dateFormat = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeFormat = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const filters = { total: [], active: ['dang-thuc-hien'], approved: ['dang-thuc-hien', 'hoan-thanh'], pending: ['cho-duyet'], rejected: ['tu-choi'] };
  const names = { approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Đã từ chối', withdrawn: 'Đã rút' };

  function listUrl(statuses) {
    const query = new URLSearchParams();
    statuses.forEach(status => query.append('status', status));
    return `de-tai-cua-toi-sinh-vien.html${query.size ? `?${query}` : ''}`;
  }

  function drawChart(counts) {
    const slices = chart.querySelector('[data-chart-slices]');
    if (slices.children.length === 3) {
      const circle = slices.firstElementChild.cloneNode(true);
      circle.classList.add('registration-chart-withdrawn');
      slices.append(circle);
    }
    const keys = Object.keys(names);
    let offset = 0;
    percentLabels.replaceChildren();
    Array.from(slices.children).forEach((circle, index) => {
      const share = counts.total ? counts[keys[index]] / counts.total : 0;
      const percent = share * 100;
      circle.setAttribute('pathLength', '100');
      circle.setAttribute('stroke-dasharray', `${percent} ${100 - percent}`);
      circle.setAttribute('stroke-dashoffset', String(-offset));
      circle.style.display = percent ? '' : 'none';
      if (percent >= 8) {
        const angle = (offset + percent / 2) * 2 * Math.PI / 100;
        const label = document.createElementNS(chart.namespaceURI, 'text');
        label.setAttribute('x', String(120 + 76 * Math.sin(angle)));
        label.setAttribute('y', String(120 - 76 * Math.cos(angle)));
        label.setAttribute('font-size', '13');
        label.setAttribute('dominant-baseline', 'central');
        label.textContent = percentFormat.format(share);
        percentLabels.append(label);
      }
      offset += percent;
    });
    chart.querySelectorAll('text')[1].textContent = counts.total;
    chart.querySelector('title').textContent = `Trạng thái ${counts.total} đề tài`;
    const shownKeys = counts.withdrawn ? keys : keys.slice(0, 3);
    chart.querySelector('desc').textContent = shownKeys.map(key => `${names[key]}: ${counts[key]}`).join('. ');
    const legend = document.querySelector('.registration-status__legend ul');
    legend.replaceChildren(...shownKeys.map(key => {
      const item = document.createElement('li');
      item.className = `registration-status__item registration-status__item--${key}`;
      const text = document.createElement('strong');
      text.textContent = `${names[key]}: ${counts[key]}`;
      item.append(text);
      return item;
    }));
  }

  function empty(list, text) { const item = document.createElement('li'); item.className = 'overview-empty'; item.textContent = text; list.replaceChildren(item); }

  function render() {
    try {
      const state = service.getState();
      notice.textContent = state.warning ? 'Một số dữ liệu chưa tải được. Hãy tải lại trang để thử lại.' : '';
      Object.entries(filters).forEach(([key, statuses]) => {
        const card = document.querySelector(`.summary-card--${key}`);
        card.querySelector('strong').textContent = state.counts[key];
        card.querySelector('a').href = listUrl(statuses);
      });
      document.querySelector('.topic-progress .dashboard-section__header a').href = listUrl(['dang-thuc-hien']);
      document.querySelector('.recent-requests .dashboard-section__header a').href = listUrl([]);
      drawChart(state.counts);
      figure.hidden = false;
      progressList.hidden = false;
      requestList.hidden = false;
      progressList.replaceChildren(...state.active.map((topic, index) => {
        const item = progressTemplate.cloneNode(true);
        const title = item.querySelector('h3');
        title.id = `overview-topic-${index}`;
        title.textContent = topic.title;
        item.querySelector('article').setAttribute('aria-labelledby', title.id);
        item.querySelector('.topic-progress__info p').textContent = `${topic.groupName} · Giảng viên: ${topic.lecturer}`;
        const progress = item.querySelector('progress');
        progress.id = `overview-progress-${index}`;
        if (topic.percent === null) progress.removeAttribute('value');
        else progress.value = topic.percent;
        progress.textContent = topic.percent === null ? 'Chưa có dữ liệu tiến độ' : `${topic.percent}%`;
        const label = item.querySelector('label');
        label.htmlFor = progress.id;
        label.textContent = topic.percent === null ? 'Chưa có dữ liệu tiến độ' : `${topic.percent}% hoàn thành`;
        const link = item.querySelector('.topic-progress__link');
        if (topic.detailUrl) { link.href = topic.detailUrl; link.setAttribute('aria-label', `Xem đề tài ${topic.title}`); }
        else link.remove();
        return item;
      }));
      if (!state.active.length) empty(progressList, 'Bạn chưa có đề tài đang thực hiện.');
      requestList.replaceChildren(...state.recent.slice(0, 2).map((topic, index) => {
        const item = requestTemplate.cloneNode(true);
        const title = item.querySelector('h3');
        title.id = `overview-request-${index}`;
        title.textContent = topic.title;
        item.querySelector('article').setAttribute('aria-labelledby', title.id);
        const badge = item.querySelector('.request-card__status');
        badge.className = `request-card__status request-card__status--${topic.status === 'da-rut' ? 'withdrawn' : ['cho-duyet', 'yeu-cau-chinh-sua'].includes(topic.status) ? 'pending' : topic.status === 'tu-choi' ? 'rejected' : 'approved'}`;
        badge.textContent = topic.statusLabel;
        item.querySelector('.request-card__type').textContent = topic.requestType;
        const time = item.querySelector('time');
        time.dateTime = topic.createdAt;
        const submittedAt = new Date(topic.createdAt);
        time.textContent = `${dateFormat.format(submittedAt)} · ${timeFormat.format(submittedAt)}`;
        const link = item.querySelector('.request-card__link');
        if (topic.detailUrl) { link.href = topic.detailUrl; link.setAttribute('aria-label', `Xem chi tiết ${topic.title}`); }
        else link.remove();
        return item;
      }));
      if (!state.recent.length) empty(requestList, 'Chưa có đăng ký hoặc đề xuất.');
      document.body.dataset.overviewReady = 'true';
    } catch {
      notice.textContent = 'Chưa tải được Tổng quan. Hãy tải lại trang để thử lại.';
    }
  }

  window.addEventListener('pageshow', render);
  window.addEventListener('storage', render);
  render();
})();
