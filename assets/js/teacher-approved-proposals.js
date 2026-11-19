(() => {
  'use strict';
  const store = window.IE104Proposals;
  const list = document.querySelector('[data-topic-results] .topic-list');
  const template = list?.querySelector('.topic-card')?.cloneNode(true);
  if (!store || !template) return;

  function render() {
    for (const card of list.querySelectorAll('[data-approved-proposal]')) card.remove();
    for (const record of store.getAll().filter((proposal) => proposal.status === 'approved')) {
      const card = template.cloneNode(true);
      card.hidden = false;
      card.dataset.approvedProposal = record.id;
      card.dataset.createdAt = record.decidedAt || record.submittedAt || "";
      card.dataset.topicId = record.topicId;
      card.dataset.status = record.topicStatus;
      card.dataset.topicType = { 'do-an-mon-hoc': 'course', 'do-an-tot-nghiep': 'graduation', 'khoa-luan': 'thesis' }[record.topicType];
      card.dataset.role = record.supervisionRole === 'dong-huong-dan' ? 'secondary' : 'primary';
      card.dataset.course = { 'internet-va-cong-nghe-web': 'web', 'co-so-du-lieu': 'database', 'cong-nghe-phan-mem': 'software' }[record.course] || '';
      card.setAttribute('data-hoc-ky', record.semester && record.academicYear
        ? `${record.academicYear.replace('–', '-')}-${record.semester}` : '');
      const title = card.querySelector('.topic-card__title');
      title.id = `approved-${record.id.toLowerCase()}-title`;
      title.textContent = record.title;
      card.setAttribute('aria-labelledby', title.id);
      card.querySelector('.topic-card__image-placeholder').setAttribute('aria-label', `Chưa có ảnh đại diện cho đề tài ${record.title}`);
      const meta = card.querySelector('.topic-card__meta');
      meta.setAttribute('aria-label', `Thông tin đề tài ${record.topicId}`);
      [record.topicId, record.courseLabel,
        record.semester ? `Học kỳ ${record.semester} • ${record.academicYear.replace('-', '–')}` : 'Chưa có học kỳ và năm học',
        `${record.studentName} · ${record.studentId} · ${record.supervisionRoleLabel}`]
        .forEach((value, index) => { meta.querySelectorAll('.topic-card__meta-text')[index].textContent = value; });
      card.querySelector('.topic-card__status').textContent = 'Đang thực hiện';
      const link = card.querySelector('.topic-card__detail-link');
      link.href = ['student', 'registration'].includes(record.source) && window.IE104?.services?.approvedProjects ? window.IE104.services.approvedProjects.lecturerUrl(record.topicId) : `chi-tiet-de-xuat-giang-vien.html?ma=${encodeURIComponent(record.id)}`;
      link.querySelector('span').textContent = ['student', 'registration'].includes(record.source) && window.IE104?.services?.approvedProjects ? 'Xem chi tiết' : 'Xem đề xuất đã duyệt';
      list.append(card);
    }
    document.dispatchEvent(new Event('ie104:topics-updated'));
  }
  store.subscribe(render);
  render();
})();
