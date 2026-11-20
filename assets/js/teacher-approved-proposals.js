(() => {
  'use strict';
  const store = window.IE104Proposals;
  const projects = window.IE104?.services?.approvedProjects;
  const list = document.querySelector('[data-topic-results] .topic-list');
  const template = list?.querySelector('.topic-card')?.cloneNode(true);
  if (!store || !projects || !template) return;
  const topicTypes = { 'do-an-mon-hoc': 'course', 'do-an-tot-nghiep': 'graduation', 'khoa-luan': 'thesis' };
  const courses = { IE104: 'web', 'internet-va-cong-nghe-web': 'web', 'co-so-du-lieu': 'database', 'cong-nghe-phan-mem': 'software' };

  function activeRecords() {
    const records = new Map(store.getAll().filter(record => record.status === 'approved').map(record => [record.topicId, record]));
    try {
      for (const project of projects.list('lecturer')) {
        if (project.registrationStatus !== 'da-dang-ky') continue;
        records.set(project.id, {
          ...project, id: project.requestId, topicStatus: 'in-progress',
          topicType: project.type === 'khoa-luan' ? 'khoa-luan' : project.typeLabel === 'Đồ án tốt nghiệp' ? 'do-an-tot-nghiep' : 'do-an-mon-hoc',
          course: project.courseId, supervisionRoleLabel: project.roleLabel,
        });
      }
    } catch {
      // Các đề tài đã duyệt vẫn được hiển thị nếu chưa đọc được đăng ký trực tiếp.
    }
    return records.values();
  }

  function render() {
    for (const card of list.querySelectorAll('[data-approved-proposal]')) card.remove();
    for (const record of activeRecords()) {
      const card = template.cloneNode(true);
      card.hidden = false;
      card.dataset.approvedProposal = record.id;
      card.dataset.createdAt = record.decidedAt || record.submittedAt || record.createdAt || '';
      card.dataset.topicId = record.topicId;
      card.dataset.status = record.topicStatus;
      card.dataset.topicType = topicTypes[record.topicType] || '';
      card.dataset.role = record.supervisionRole === 'dong-huong-dan' ? 'secondary' : 'primary';
      card.dataset.course = courses[record.course] || record.course || '';
      const semester = ['he', 'summer'].includes(record.semester) ? '3' : record.semester;
      card.setAttribute('data-hoc-ky', record.semester && record.academicYear
        ? `${record.academicYear.replace('–', '-')}-${semester}` : '');
      const title = card.querySelector('.topic-card__title');
      title.id = `approved-${record.id.toLowerCase()}-title`;
      title.textContent = record.title;
      card.setAttribute('aria-labelledby', title.id);
      card.querySelector('.topic-card__image-placeholder').setAttribute('aria-label', `Chưa có ảnh đại diện cho đề tài ${record.title}`);
      const meta = card.querySelector('.topic-card__meta');
      const code = record.displayId || record.topicId;
      const participants = record.registrationStatus === 'da-dang-ky' ? record.groupName : [record.studentName, record.studentId].filter(Boolean).join(' · ');
      meta.setAttribute('aria-label', `Thông tin đề tài ${code}`);
      const fields = meta.querySelectorAll('.topic-card__meta-text');
      fields[0].setAttribute('data-topic-search-term', '');
      [code, record.courseLabel,
        semester && record.academicYear ? `Học kỳ ${semester} • ${record.academicYear.replace('-', '–')}` : 'Chưa có học kỳ và năm học',
        [participants, record.supervisionRoleLabel].filter(Boolean).join(' · ')]
        .forEach((value, index) => { fields[index].textContent = value; });
      card.querySelector('.topic-card__status').textContent = 'Đang thực hiện';
      const link = card.querySelector('.topic-card__detail-link');
      const url = new URL(projects.lecturerUrl(record.topicId), location.href);
      url.searchParams.set('return', location.pathname.split('/').pop() + location.search);
      link.href = url.href;
      link.setAttribute('aria-label', `Xem chi tiết ${record.title}`);
      list.append(card);
    }
    document.dispatchEvent(new Event('ie104:topics-updated'));
  }
  store.subscribe(render);
  render();
})();
