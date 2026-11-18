(() => {
  'use strict';
  const store = window.IE104Proposals;
  const teaching = window.IE104?.services?.teaching;
  const list = document.querySelector('[data-topic-results] .topic-list');
  const template = list?.querySelector('.topic-card')?.cloneNode(true);
  if (!store || !teaching || !template) return;
  const topicTypes = {
    'Đồ án môn học': 'course', 'Đồ án tốt nghiệp': 'graduation', 'Khóa luận': 'thesis', 'Khóa luận tốt nghiệp': 'thesis',
    'do-an-mon-hoc': 'course', 'do-an-tot-nghiep': 'graduation', 'khoa-luan': 'thesis',
  };
  const courses = {
    IE104: 'web', 'internet-va-cong-nghe-web': 'web', 'co-so-du-lieu': 'database', 'cong-nghe-phan-mem': 'software',
  };
  function semesterLabel(semester, year) {
    return semester && year ? `Học kỳ ${semester} • ${year.replace('-', '–')}` : 'Chưa có học kỳ và năm học';
  }

  function createCard(topic, role, course, group, href, action, titleId) {
    const card = template.cloneNode(true);
    const code = topic.topicId || topic.id;
    Object.assign(card.dataset, {
      topicId: code, topicType: topicTypes[topic.topicType || topic.typeLabel] || '',
      role, course: courses[course] || '', status: 'in-progress',
      hocKy: topic.semester && topic.academicYear ? `${topic.academicYear.replace('–', '-')}-${topic.semester}` : '',
    });
    const title = card.querySelector('.topic-card__title');
    title.id = titleId;
    title.textContent = topic.title;
    card.setAttribute('aria-labelledby', title.id);
    card.querySelector('.topic-card__image-placeholder').setAttribute('aria-label', `Chưa có ảnh đại diện cho đề tài ${topic.title}`);
    const meta = card.querySelector('.topic-card__meta');
    meta.setAttribute('aria-label', `Thông tin đề tài ${code}`);
    [code, topic.courseLabel || 'Không áp dụng', semesterLabel(topic.semester, topic.academicYear), group]
      .forEach((value, index) => {
        const field = meta.querySelectorAll('.topic-card__meta-text')[index];
        const label = field.querySelector('.visually-hidden');
        field.replaceChildren(...(label ? [label] : []), document.createTextNode(value));
        if (field.hasAttribute('data-topic-search-term')) field.dataset.topicSearchTerm = value;
      });
    const badge = card.querySelector('.topic-card__status');
    badge.className = `topic-card__status topic-card__status--${role}`;
    badge.replaceChildren(badge.querySelector('.visually-hidden'),
      document.createTextNode(role === 'primary' ? 'Hướng dẫn chính' : 'Đồng hướng dẫn'));
    const link = card.querySelector('.topic-card__detail-link');
    link.href = href;
    link.querySelector('span').textContent = action;
    link.setAttribute('aria-label', `${action} ${topic.title}`);
    return card;
  }

  function render() {
    const projects = teaching.listActiveProjects().map(({ project, role }, index) =>
      createCard(project, role, project.courseId, project.groupName,
        `chi-tiet-de-tai-dang-huong-dan-giang-vien.html?project=${encodeURIComponent(project.id)}`, 'Xem chi tiết', `teaching-topic-${index}`));
    const proposals = store.getAll().filter(proposal => proposal.status === 'approved').map(record =>
      createCard(record, record.supervisionRole === 'dong-huong-dan' ? 'secondary' : 'primary',
        record.course, record.groupName || `${record.studentName} · ${record.studentId}`,
        `chi-tiet-de-xuat-giang-vien.html?ma=${encodeURIComponent(record.id)}&return=danh-sach-de-tai-dang-huong-dan.html`,
        'Xem đề xuất đã duyệt', `approved-${record.id.toLowerCase()}-title`));
    list.replaceChildren(...projects, ...proposals);
    document.dispatchEvent(new Event('ie104:topics-updated'));
  }
  store.subscribe(render);
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  render();
})();
