(() => {
  'use strict';
  const app = window.IE104;
  const topics = window.TeacherTopicStore;
  const proposals = window.IE104Proposals;
  const { teaching, projectProgress, lecturerTopics } = app.services;
  const progressPreviewLimit = 5;
  const pendingPreviewLimit = 4;
  const cardIcons = {
    code: ['m20 13-7 7L3 10V3h7l10 10Z', 'M7.5 5.75a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z'],
    person: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
    group: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
      'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75'],
    calendar: ['M8 3v4m8-4v4M3 10h18', 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z'],
    arrow: ['M4 12h15m-6-6 6 6-6 6'],
  };
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
  const minimumChartLabelShare = 0.08;
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
    link.append(cardIcon('arrow'));
    article.append(heading, link);
    return { article, heading, link };
  }

  function cardIcon(icon) {
    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    for (const [attribute, setting] of Object.entries({
      viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.75',
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false',
    })) svg.setAttribute(attribute, setting);
    for (const shape of cardIcons[icon]) {
      const path = document.createElementNS(namespace, 'path');
      path.setAttribute('d', shape);
      svg.append(path);
    }
    return svg;
  }

  function metadataItem(icon, label, value = '', className = 'topic-progress-card__meta-item') {
    const item = element('span', undefined, className);
    item.append(cardIcon(icon), element('span', label + ': ', 'visually-hidden'),
      typeof value === 'string' ? element('span', value) : value);
    return item;
  }

  function participantMetadata(project, members) {
    const participants = lecturerTopics?.supervisedParticipants(project, members) || {
      isGroup: Boolean(project.groupName),
      label: project.groupName,
      studentLabel: [project.studentName || members[0]?.name, members[0]?.code || project.studentId]
        .filter(value => value && value !== 'xxxxxxxx').join(' · '),
    };
    return participants.isGroup ? metadataItem('group', 'Nhóm thực hiện', participants.label)
      : metadataItem('person', 'Cá nhân thực hiện', participants.studentLabel || 'Chưa có thông tin');
  }

  function progressCard({ project, record }, index) {
    const topic = project || record;
    const codeType = { 'do-an-mon-hoc': 'course', 'do-an': 'course', 'do-an-tot-nghiep': 'graduation', 'khoa-luan': 'thesis' };
    const code = project
      ? project.displayId || project.topicCode || lecturerTopics?.projectIdentity(project).displayId || project.topicId || project.id
      : record.topicCode || window.UITLecturerCatalog?.formatCode(codeType[record.topicType], record.topicId) || record.topicId;
    const projectId = project ? project.workspaceId || project.id : record.topicId;
    const detailPage = 'chi-tiet-de-tai-dang-huong-dan-giang-vien.html';
    const href = filePreview && project?.sourceRecord
      ? `${detailPage}?topic=${encodeURIComponent(project.id)}`
      : project?.workspaceId ? lecturerTopics.detailUrl(project)
        : `${detailPage}?project=${encodeURIComponent(projectId)}`;
    const { article, heading, link } = card('topic-progress-card', `overview-project-${index}`, topic.title, code, 'Xem đề tài', `${href}#tien-do`);
    let members = topic.members || topic.outline?.members || [];
    if (project) {
      try {
        members = app.services.projectTeams?.getState(projectId, { preview: filePreview }).members || members;
      } catch {
        // Danh mục mẫu có thể chỉ có thông tin người thực hiện trong hồ sơ đề tài.
      }
    }
    const detail = element('p', undefined, 'topic-progress-card__progress');
    try {
      const catalogOnly = project?.sourceRecord && !project.sharedStudentProject;
      const sample = catalogOnly ? project.sourceRecord.supervision?.tasks : null;
      const totalSample = sample ? sample.notStarted.length + sample.inProgress.length + sample.completed.length : 0;
      const { percent, total } = catalogOnly
        ? { total: totalSample, percent: totalSample ? Math.round(100 * sample.completed.length / totalSample) : 0 }
        : project ? projectProgress.summarize(projectProgress.getState(projectId, { preview: filePreview })) : { total: 0 };
      if (total) {
        const meter = element('progress', `${percent}%`);
        meter.id = `overview-progress-${index}`;
        meter.max = 100;
        meter.value = percent;
        const label = element('label', `${percent}% hoàn thành`);
        label.htmlFor = meter.id;
        detail.append(label, meter);
      } else {
        detail.textContent = !project || (catalogOnly && !sample) ? 'Chưa có dữ liệu tiến độ.' : 'Chưa có công việc để tính tiến độ.';
      }
    } catch {
      detail.textContent = 'Không đọc được tiến độ của đề tài.';
    }
    const metadata = element('p', undefined, 'topic-progress-card__meta');
    metadata.append(metadataItem('code', 'Mã đề tài', code), participantMetadata(topic, members));
    const summary = element('div', undefined, 'topic-progress-card__summary');
    summary.append(heading, metadata);
    article.replaceChildren(summary, detail, link);
    return article;
  }

  function proposalCard(record, index) {
    const { article, heading, link } = card('request-card', `overview-request-${index}`, record.title, record.id,
      'Xem đề xuất', `chi-tiet-de-xuat-giang-vien.html?ma=${encodeURIComponent(record.id)}`);
    const student = [record.studentName, record.studentId].filter(Boolean).join(' · ') || 'Chưa có thông tin';
    const submitted = proposals.formatSubmissionDate(record.submittedAt);
    let time = 'Chưa có thông tin';
    if (submitted) {
      time = element('time', submitted);
      time.dateTime = record.submittedAt;
    }
    const metadata = element('p', undefined, 'request-card__meta');
    metadata.append(metadataItem('person', 'Sinh viên gửi đề xuất', student, 'request-card__meta-item'),
      metadataItem('calendar', 'Ngày gửi', time, 'request-card__meta-item'));
    article.replaceChildren(heading, metadata, link);
    return article;
  }

  function progressEntries(catalogue, projects, approved) {
    const catalogEntries = catalogue.filter(topic => lecturerTopics?.isListedInSupervisedTab(topic) ?? true)
      .map(project => ({ project, title: project.title, status: project.status,
        date: Date.parse(project.startsAt || project.sourceRecord?.supervision?.milestones?.[0] || project.createdAt) }));
    const additional = lecturerTopics?.additionalSupervisedTopics(projects, approved) ?? projects.map(({ project }) => ({
      project, record: { title: project.title, topicStatus: project.status, sortDate: project.startsAt || project.createdAt },
    }));
    const entries = [...catalogEntries, ...additional.map(({ project, record }) => ({
      project, record, title: record.title, status: record.topicStatus, date: Date.parse(record.sortDate || record.decidedAt),
    }))];
    return (app.topicIdentity?.uniqueTitles(entries) || entries)
      .filter(entry => entry.status === 'dang-thuc-hien' || entry.status === 'in-progress')
      .sort((first, second) => {
        if (Number.isNaN(first.date) || Number.isNaN(second.date)) return Number.isNaN(first.date) - Number.isNaN(second.date);
        return second.date - first.date;
      })
      .slice(0, progressPreviewLimit);
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
      if (share >= minimumChartLabelShare) {
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
    try {
      const entries = lecturerTopics?.list('created', { catalogOnly: filePreview }) || topics.read();
      created = lecturerTopics ? entries.filter(lecturerTopics.isListedInCreatedTab) : entries;
    } catch { /* Thông báo lỗi hiển thị bên dưới. */ }
    const records = proposals.getAll();
    const proposalError = filePreview ? '' : proposals.getError();
    const approved = records.filter(record => record.status === 'approved');
    const pending = proposals.filterPending(records).sort(proposals.compareSubmissionDates);
    let catalogue = [];
    let projects = [];
    let progressError = '';
    try {
      catalogue = lecturerTopics?.list('supervised', { catalogOnly: filePreview }) || [];
      if (!filePreview) projects = teaching.listSupervisedProjects();
    } catch (failure) { progressError = failure.message; }
    const unique = entries => app.topicIdentity?.uniqueTitles(entries) || entries;
    const supervised = unique([...catalogue, ...projects.map(({ project }) => project)]);
    const active = supervised.filter(project => project.status === 'dang-thuc-hien');
    const completed = supervised.filter(project => project.status === 'hoan-thanh');
    const remainingApproved = unique([...supervised, ...approved]).filter(record =>
      approved.includes(record) && !supervised.some(project => project.id === record.topicId));
    const inProgress = active.length + remainingApproved.length;
    const open = created?.filter(topic => topic.status === 'open').length ?? 0;
    const closed = created?.filter(topic => topic.status === 'closed').length ?? 0;
    const chartCounts = [inProgress, open, completed.length, closed];
    const total = created && !proposalError && !progressError ? chartCounts.reduce((sum, count) => sum + count, 0) : null;
    const values = { total, created: created?.length, supervised: proposalError || progressError ? null : inProgress, pending: proposalError ? null : pending.length };
    for (const [key, count] of Object.entries(values)) {
      select(`[aria-labelledby="${key}-count-title"] strong`).textContent = count ?? '—';
    }
    loadingStatus.hidden = true;
    warning.textContent = filePreview
      ? 'Đang xem dữ liệu có sẵn. Mở website qua localhost để xem dữ liệu đã lưu trên trình duyệt.'
      : [created ? '' : 'Không đọc được danh sách đề tài đã tạo.', proposalError, progressError].filter(Boolean).join(' ');
    warning.hidden = !warning.textContent;
    renderChart(chartCounts, total);

    const progressCards = progressEntries(catalogue, projects, approved).map(progressCard);
    const requestCards = proposalError ? [] : pending.slice(0, pendingPreviewLimit).map(proposalCard);
    progressList.replaceChildren(...(progressCards.length ? progressCards : [element('p',
      progressError || proposalError ? 'Chưa đọc được đầy đủ đề tài đang hướng dẫn.' : 'Chưa có đề tài đang hướng dẫn.')]));
    pendingList.replaceChildren(...(requestCards.length ? requestCards : [element('p',
      proposalError ? 'Chưa đọc được yêu cầu chờ duyệt.' : 'Không có yêu cầu chờ duyệt.')]));
  }

  proposals.subscribe(render);
  window.addEventListener('storage', event => {
    if ([topics.key, app.storage.registrationKey, app.storage.progressKey, app.storage.teamKey, app.services.lecturerTopicRepository?.key, null].includes(event.key)) render();
  });
  window.addEventListener('ie104:lecturer-topics-updated', render);
  window.addEventListener('ie104:registrations-updated', render);
  render();
})();
