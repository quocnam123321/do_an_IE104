(() => {
  const service = globalThis.IE104?.services?.overview;
  if (!service || !document.body.classList.contains('student-overview-page')) return;
  const progressList = document.querySelector('.topic-progress__list');
  const requestList = document.querySelector('.recent-requests__list');
  const progressTemplate = progressList.firstElementChild.cloneNode(true);
  const requestTemplate = requestList.firstElementChild.cloneNode(true);
  const notice = document.querySelector('[data-overview-notice]');
  const chart = document.querySelector('.registration-status__chart');
  const filters = { total: [], active: ['dang-thuc-hien'], approved: ['dang-thuc-hien', 'hoan-thanh'], pending: ['cho-duyet'], rejected: ['tu-choi'] };
  const names = { approved: 'Đã duyệt', pending: 'Chờ duyệt', rejected: 'Đã từ chối', withdrawn: 'Đã rút' };

  function listUrl(statuses) {
    const query = new URLSearchParams();
    statuses.forEach(status => query.append('status', status));
    return `de-tai-cua-toi-sinh-vien.html${query.size ? `?${query}` : ''}`;
  }

  function drawChart(counts) {
    const circles = chart.querySelectorAll('circle');
    const texts = chart.querySelectorAll('text');
    const keys = ['approved', 'pending', 'rejected', 'withdrawn'];
    if (circles.length === 3) {
      const circle = circles[0].cloneNode(true);
      circle.classList.add('registration-chart-withdrawn');
      circles[0].parentNode.append(circle);
    }
    let offset = 0;
    chart.querySelectorAll('circle').forEach((circle, index) => {
      const percent = counts.total ? counts[keys[index]] / counts.total * 100 : 0;
      circle.setAttribute('pathLength', '100');
      circle.setAttribute('stroke-dasharray', `${percent} ${100 - percent}`);
      circle.setAttribute('stroke-dashoffset', String(-offset));
      circle.style.display = percent ? '' : 'none';
      offset += percent;
    });
    texts[1].textContent = counts.total;
    [...texts].slice(2).forEach(text => { text.style.display = 'none'; });
    chart.querySelector('title').textContent = `Trạng thái ${counts.total} đề tài`;
    chart.querySelector('desc').textContent = keys.map(key => `${names[key]}: ${counts[key]}`).join('. ');
    const legend = document.querySelector('.registration-status__legend ul');
    legend.replaceChildren(...keys.map(key => {
      const item = document.createElement('li');
      item.className = `registration-status__item registration-status__item--${key}`;
      const text = document.createElement('strong');
      const percent = counts.total ? Math.round(counts[key] / counts.total * 1000) / 10 : 0;
      text.textContent = `${names[key]}: ${counts[key]} (${percent}%)`;
      item.append(text);
      return item;
    }));
    document.querySelector('.registration-status__note').textContent = 'Đã duyệt gồm đề tài đang thực hiện và đã hoàn thành. Đã rút được thống kê riêng.';
  }

  function empty(list, text) { const item = document.createElement('li'); item.className = 'overview-empty'; item.textContent = text; list.replaceChildren(item); }

  function render() {
    try {
      const state = service.getState();
      notice.textContent = state.warning ? `Số liệu theo các nguồn đọc được. ${state.warning}` : '';
      Object.entries(filters).forEach(([key, statuses]) => {
        const card = document.querySelector(`.summary-card--${key}`);
        card.querySelector('strong').textContent = state.counts[key];
        card.querySelector('a').href = listUrl(statuses);
      });
      document.querySelector('.topic-progress .dashboard-section__header a').href = listUrl(['dang-thuc-hien']);
      document.querySelector('.recent-requests .dashboard-section__header a').href = listUrl([]);
      drawChart(state.counts);
      document.querySelector('.registration-status__figure').hidden = false;
      progressList.hidden = false;
      requestList.hidden = false;
      progressList.replaceChildren(...state.active.map((topic, index) => {
        const item = progressTemplate.cloneNode(true);
        const title = item.querySelector('h3');
        title.id = `overview-topic-${index}`;
        title.textContent = topic.title;
        item.querySelector('article').setAttribute('aria-labelledby', title.id);
        item.querySelector('.topic-progress__info p').textContent = `${topic.groupName} - Giảng viên: ${topic.lecturer}`;
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
      requestList.replaceChildren(...state.recent.map((topic, index) => {
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
        time.textContent = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short' }).format(new Date(topic.createdAt));
        const link = item.querySelector('.request-card__link');
        if (topic.detailUrl) { link.href = topic.detailUrl; link.setAttribute('aria-label', `Xem chi tiết ${topic.title}`); }
        else link.remove();
        return item;
      }));
      if (!state.recent.length) empty(requestList, 'Chưa có đăng ký hoặc đề xuất.');
      document.body.dataset.overviewReady = 'true';
    } catch (failure) { notice.textContent = failure.message; }
  }

  window.addEventListener('pageshow', render);
  window.addEventListener('storage', render);
  render();
})();
