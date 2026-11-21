(() => {
  'use strict';
  const app = window.IE104;
  const topics = window.TeacherTopicStore;
  const proposals = window.IE104Proposals;
  const { teaching, projectProgress } = app.services;
  const filePreview = window.location?.protocol === 'file:';
  const select = selector => document.querySelector(selector);
  const chart = select('.topic-status__chart');
  const circles = [...chart.querySelectorAll('circle')];
  const chartLabels = chart.querySelector('g');
  const chartTotal = chartLabels.querySelector('text:nth-of-type(2)');
  const legend = [...document.querySelectorAll('.topic-status__legend > div')];
  const progressList = select('.supervised-progress__list');
  const pendingList = select('.pending-requests__list');
  const warning = select('#overview-storage-warning');
  const loadingStatus = select('#lecturer-overview-status');
  const percentFormat = new Intl.NumberFormat('vi-VN', { style: 'percent', maximumFractionDigits: 1 });
  const dateFormat = new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
  });
  progressList.setAttribute('aria-labelledby', 'supervised-progress-title');
  pendingList.setAttribute('aria-labelledby', 'pending-requests-title');

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function card(className, id, title, code, action, href) {
    const article = element('article', undefined, className);
    const heading = element('h3', title);
    heading.id = id;
    article.setAttribute('aria-labelledby', id);
    const link = element('a', action + ' ');
    link.href = href;
    link.setAttribute('aria-label', `${action} ${title} (${code})`);
    const arrow = element('span', '→');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(arrow);
    article.append(heading, element('p', 'Mã đề tài: ' + code), link);
    return { article, link };
  }

  function progressCard(project, index) {
    const { article, link } = card('topic-progress-card', `overview-project-${index}`, project.title,
      project.displayId || project.topicId || project.id, 'Xem đề tài',
      (project.workspaceId && project.sourceRecord
        ? app.services.lecturerTopics.detailUrl(project)
        : `chi-tiet-de-tai-dang-huong-dan-giang-vien.html?project=${encodeURIComponent(project.id)}`) + '#tien-do');
    const group = element('p', 'Nhóm thực hiện: ' + (project.groupName || 'Chưa có nhóm thực hiện'));
    let detail;
    try {
      const sample = project.sourceRecord?.supervision?.tasks;
      const totalSample = sample ? sample.notStarted.length + sample.inProgress.length + sample.completed.length : 0;
      const { percent, total } = project.sourceRecord
        ? { total: totalSample, percent: totalSample ? Math.round(100 * sample.completed.length / totalSample) : 0 }
        : projectProgress.summarize(projectProgress.getState(project.id));
      if (total) {
        detail = element('p');
        const meter = element('progress', `${percent}%`);
        meter.id = `overview-progress-${index}`;
        meter.max = 100;
        meter.value = percent;
        const label = element('label', `${percent}% hoàn thành`);
        label.htmlFor = meter.id;
        detail.append(label, meter);
      } else {
        detail = element('p', project.sourceRecord && !sample ? 'Chưa có dữ liệu tiến độ.' : 'Chưa có công việc để tính tiến độ.');
      }
    } catch {
      detail = element('p', 'Không đọc được tiến độ của đề tài.');
    }
    link.before(group, detail);
    return article;
  }

  function proposalCard(record, index, pending) {
    const { article, link } = card(pending ? 'request-card' : 'topic-progress-card',
      `overview-${pending ? 'request' : 'approved'}-${index}`, record.title, record.topicId,
      pending ? 'Xem đề xuất' : 'Xem đề xuất đã duyệt',
      `chi-tiet-de-xuat-giang-vien.html?ma=${encodeURIComponent(record.id)}${pending ? '' : '&return=danh-sach-de-tai-dang-huong-dan.html'}`);
    link.before(element('p', `Sinh viên: ${record.studentName} · ${record.studentId}`));
    if (pending) {
      article.querySelector('h3').after(element('p', 'Chờ duyệt', 'status-badge'));
      const submitted = element('p', 'Ngày gửi: ');
      const timestamp = Date.parse(record.submittedAt);
      if (Number.isFinite(timestamp)) {
        const time = element('time', dateFormat.format(timestamp));
        time.dateTime = record.submittedAt;
        submitted.append(time);
      } else {
        submitted.append('Chưa có thông tin');
      }
      link.before(submitted);
    } else {
      link.before(element('p', 'Chưa có dữ liệu tiến độ.'));
    }
    return article;
  }

  function renderChart(counts, total) {
    const empty = select('#topic-status-empty');
    chart.parentElement.hidden = !total;
    empty.hidden = Boolean(total);
    if (!total) {
      empty.textContent = total === 0 ? 'Chưa có đề tài để thống kê.' : 'Chưa đọc được đầy đủ dữ liệu đề tài.';
      return;
    }
    let offset = 0;
    const labels = [];
    const descriptions = counts.map((count, index) => {
      const share = count / total;
      const arc = share * 100;
      circles[index].setAttribute('stroke-dasharray', `${arc} ${100 - arc}`);
      circles[index].setAttribute('stroke-dashoffset', -offset);
      const percent = percentFormat.format(share);
      if (count) {
        const angle = (offset + arc / 2) * 2 * Math.PI / 100;
        const label = document.createElementNS(chart.namespaceURI, 'text');
        label.classList.add('topic-status__percent');
        label.setAttribute('x', 130 + 78 * Math.sin(angle));
        label.setAttribute('y', 120 - 78 * Math.cos(angle));
        label.setAttribute('dominant-baseline', 'central');
        label.textContent = percent;
        labels.push(label);
      }
      offset += arc;
      legend[index].querySelector('dd').textContent = count;
      return `${legend[index].querySelector('dt').textContent}: ${count}, chiếm ${percent}.`;
    });
    select('#status-chart-title').textContent = `Tổng số ${total} đề tài`;
    select('#status-chart-description').textContent = descriptions.join(' ');
    chartTotal.textContent = total;
    chartLabels.querySelectorAll('.topic-status__percent').forEach(label => label.remove());
    chartLabels.append(...labels);
  }

  function render() {
    let created;
    try { created = app.services.lecturerTopics?.list('created', { catalogOnly: filePreview }) || topics.read(); }
    catch { /* Thông báo lỗi hiển thị bên dưới. */ }
    const records = proposals.getAll();
    const proposalError = filePreview ? '' : proposals.getError();
    const approved = records.filter(record => record.status === 'approved');
    const pending = records.filter(record => record.status === 'pending').sort((first, second) =>
      (Date.parse(second.submittedAt) || 0) - (Date.parse(first.submittedAt) || 0));
    let supervised = [];
    let progressError = '';
    try {
      supervised = app.services.lecturerTopics?.list('supervised') || [];
      if (!filePreview) supervised.push(...teaching.listSupervisedProjects().map(({ project }) => project));
    } catch (failure) { progressError = failure.message; }
    const unique = (entries, title) => app.topicIdentity?.uniqueTitles(entries, title) || entries;
    supervised = unique(supervised);
    const active = supervised.filter(project => project.status === 'dang-thuc-hien');
    const completed = supervised.filter(project => project.status === 'hoan-thanh');
    const remainingApproved = unique([...supervised, ...approved]).filter(record =>
      approved.includes(record) && !supervised.some(project => project.id === record.topicId));
    const inProgress = active.length + remainingApproved.length;
    const chartCreated = unique([...active, ...completed, ...remainingApproved, ...(created || [])],
      entry => entry.title || entry.name).filter(entry => created?.includes(entry));
    const total = created && !proposalError && !progressError ? chartCreated.length + inProgress + completed.length : null;
    const open = chartCreated.filter(topic => topic.status === 'open').length;
    const values = { total, created: created?.length, supervised: proposalError || progressError ? null : inProgress, pending: proposalError ? null : pending.length };
    for (const [key, count] of Object.entries(values)) {
      select(`[aria-labelledby="${key}-count-title"] strong`).textContent = count ?? '—';
    }
    loadingStatus.hidden = true;
    warning.textContent = filePreview
      ? 'Đang xem dữ liệu có sẵn. Mở website qua localhost để xem dữ liệu đã lưu trên trình duyệt.'
      : [created ? '' : 'Không đọc được danh sách đề tài đã tạo.', proposalError, progressError].filter(Boolean).join(' ');
    warning.hidden = !warning.textContent;
    renderChart([inProgress, open, completed.length, chartCreated.length - open], total);

    const progressCards = [...active.map(progressCard), ...remainingApproved.map((record, index) => proposalCard(record, index, false))];
    const requestCards = proposalError ? [] : pending.map((record, index) => proposalCard(record, index, true));
    progressList.replaceChildren(...(progressCards.length ? progressCards : [element('p',
      proposalError ? 'Chưa đọc được đầy đủ đề tài đang hướng dẫn.' : 'Chưa có đề tài đang hướng dẫn.')]));
    pendingList.replaceChildren(...(requestCards.length ? requestCards : [element('p',
      proposalError ? 'Chưa đọc được yêu cầu chờ duyệt.' : 'Không có yêu cầu chờ duyệt.')]));
  }

  proposals.subscribe(render);
  window.addEventListener('storage', event => {
    if ([topics.key, app.storage.progressKey, app.storage.teamKey, app.services.lecturerTopicRepository?.key, null].includes(event.key)) render();
  });
  window.addEventListener('ie104:lecturer-topics-updated', render);
  render();
})();
