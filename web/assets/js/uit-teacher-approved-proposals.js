(() => {
  'use strict';
  const store = window.IE104Proposals;
  const { lecturerTopics: topics, approvedProjects } = window.IE104.services;
  const list = document.querySelector('[data-topic-results] .topic-list');
  const template = list?.querySelector('.topic-card')?.cloneNode(true);
  if (!store || !template) return;

  function render() {
    for (const card of list.querySelectorAll('[data-approved-proposal]')) card.remove();
    const teaching = window.IE104.services.teaching;
    let projects = [];
    try { projects = teaching.listSupervisedProjects(); } catch { /* Keep the available proposal records. */ }
    for (const { record, project } of topics.additionalSupervisedTopics(projects, store.getAll())) {
      const card = template.cloneNode(true);
      card.hidden = false;
      card.dataset.approvedProposal = record.id;
      card.dataset.topicId = record.topicId;
      card.dataset.sortDate = record.sortDate || record.decidedAt || '';
      card.dataset.status = record.topicStatus || '';
      card.dataset.topicType = { 'do-an-mon-hoc': 'course', 'do-an-tot-nghiep': 'graduation', 'khoa-luan': 'thesis', 'luan-van-thac-si': 'master', 'do-an': 'course' }[record.topicType] || '';
      card.dataset.role = record.supervisionRole === 'dong-huong-dan' ? 'secondary' : 'primary';
      card.dataset.course = { 'internet-va-cong-nghe-web': 'web', 'co-so-du-lieu': 'database', 'cong-nghe-phan-mem': 'software' }[record.course] || (record.course === 'IE104' ? 'web' : record.course || '');
      card.setAttribute('data-hoc-ky', record.semester && record.academicYear
        ? `${record.academicYear.replace('–', '-')}-${record.semester}` : '');
      const title = card.querySelector('.topic-card__title');
      title.id = `approved-${record.id.toLowerCase()}-title`;
      title.textContent = record.title;
      card.setAttribute('aria-labelledby', title.id);
      card.querySelector('.topic-card__image-placeholder').setAttribute('aria-label', `Chưa có ảnh đại diện cho đề tài ${record.title}`);
      const meta = card.querySelector('.topic-card__meta');
      let members = record.members || record.outline?.members || [];
      if (project) {
        try {
          members = window.IE104.services.projectTeams.getState(project.id).members;
        } catch { /* Dùng dữ liệu danh mục khi chưa đọc được thành viên đã lưu. */ }
      }
      const participants = topics.supervisedParticipants(project || record, members);
      card.dataset.participantSearch = participants.studentLabel;
      const code = project ? topics.projectIdentity(project).displayId
        : record.topicCode || window.UITLecturerCatalog.formatCode(card.dataset.topicType, record.topicId);
      meta.setAttribute('aria-label', `Thông tin đề tài ${code}`);
      const courseLabel = card.dataset.topicType === 'graduation' ? 'Đồ án tốt nghiệp' : card.dataset.topicType === 'thesis' ? 'Khóa luận tốt nghiệp' : record.courseLabel || 'Không áp dụng';
      [code, courseLabel,
        record.semester ? `Học kỳ ${record.semester} • ${record.academicYear.replace('-', '–')}` : 'Chưa có học kỳ và năm học',
        participants.label]
        .forEach((value, index) => { meta.querySelectorAll('.topic-card__meta-text')[index].textContent = value; });
      const badge = card.querySelector('.topic-card__status');
      badge.textContent = record.supervisionRoleLabel || record.statusLabel || 'Đang thực hiện';
      badge.className = 'topic-card__status topic-card__status--' + card.dataset.role;
      const link = card.querySelector('.topic-card__detail-link');
      link.href = approvedProjects.lecturerUrl(record.projectId || record.topicId);
      link.querySelector('span').textContent = 'Xem chi tiết';
      list.append(card);
    }
    document.dispatchEvent(new Event('ie104:topics-updated'));
  }
  store.subscribe(render);
  window.addEventListener('storage', event => {
    if (event.key === window.IE104.storage.teamKey) render();
  });
  render();
})();
