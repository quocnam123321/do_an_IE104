(() => {
  'use strict';
  const store = window.IE104Proposals;
  const list = document.querySelector('[data-topic-results] .topic-list');
  const template = list?.querySelector('.topic-card')?.cloneNode(true);
  if (!store || !template) return;

  function render() {
    for (const card of list.querySelectorAll('[data-approved-proposal]')) card.remove();
    const entries = store.getAll().filter(proposal => proposal.status === 'approved');
    const teaching = window.IE104.services.teaching;
    let projects = [];
    try { projects = teaching.listSupervisedProjects(); } catch { /* Keep the available proposal records. */ }
    const byId = new Map(projects.map(({ project, role }) => [project.id, {
      id: project.id, topicId: project.topicId || project.id, projectId: project.id,
      title: project.title, topicType: project.type || ({ 'Đồ án môn học': 'do-an-mon-hoc', 'Đồ án tốt nghiệp': 'do-an-tot-nghiep', 'Khóa luận tốt nghiệp': 'khoa-luan' })[project.typeLabel], course: project.courseId, courseLabel: project.courseLabel,
      sortDate: project.startsAt || project.createdAt,
      semester: project.semester, academicYear: project.academicYear, groupName: project.groupName,
      supervisionRole: role === 'secondary' ? 'dong-huong-dan' : 'huong-dan-chinh',
      supervisionRoleLabel: role === 'secondary' ? 'Đồng hướng dẫn' : 'Hướng dẫn chính',
      topicStatus: project.status === 'hoan-thanh' ? 'completed' : 'in-progress', statusLabel: project.statusLabel,
    }]));
    for (const record of entries) if (!byId.has(record.topicId)) byId.set(record.topicId, record);
    for (const record of byId.values()) {
      const card = template.cloneNode(true);
      card.hidden = false;
      card.dataset.approvedProposal = record.id;
      card.dataset.topicId = record.topicId;
      card.dataset.sortDate = record.sortDate || record.decidedAt || '';
      card.dataset.status = record.topicStatus;
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
      const project = projects.find(entry => entry.project.id === record.projectId)?.project;
      const code = project ? window.IE104.services.lecturerTopics.projectIdentity(project).displayId
        : window.UITLecturerCatalog.formatCode(card.dataset.topicType, record.topicId);
      meta.setAttribute('aria-label', `Thông tin đề tài ${code}`);
      const courseLabel = card.dataset.topicType === 'graduation' ? 'Đồ án tốt nghiệp' : card.dataset.topicType === 'thesis' ? 'Khóa luận tốt nghiệp' : record.courseLabel || 'Không áp dụng';
      [code, courseLabel,
        record.semester ? `Học kỳ ${record.semester} • ${record.academicYear.replace('-', '–')}` : 'Chưa có học kỳ và năm học',
        [record.groupName || record.studentName, record.studentId, record.supervisionRoleLabel].filter(Boolean).join(' · ')]
        .forEach((value, index) => { meta.querySelectorAll('.topic-card__meta-text')[index].textContent = value; });
      const badge = card.querySelector('.topic-card__status');
      badge.textContent = record.supervisionRoleLabel || record.statusLabel || 'Đang thực hiện';
      badge.className = 'topic-card__status topic-card__status--' + card.dataset.role;
      const link = card.querySelector('.topic-card__detail-link');
      link.href = record.projectId
        ? `chi-tiet-de-tai-dang-huong-dan-giang-vien.html?project=${encodeURIComponent(record.projectId)}`
        : `chi-tiet-de-xuat-giang-vien.html?ma=${encodeURIComponent(record.id)}`;
      link.querySelector('span').textContent = record.projectId ? 'Xem chi tiết' : 'Xem đề xuất đã duyệt';
      list.append(card);
    }
    document.dispatchEvent(new Event('ie104:topics-updated'));
  }
  store.subscribe(render);
  render();
})();
