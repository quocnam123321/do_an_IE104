(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};

  function getTopic(id) {
    return (app.data.openTopics || []).find(topic => topic.id === id) || app.services.publishedTopics?.get(id);
  }

  function getRules(id) {
    return getTopic(id)?.registrationRules || { minMembers: 2, maxMembers: 3 };
  }

  function findByTopic(id) {
    return app.storage.readRegistrations().find(record => record.topic.id === id);
  }

  function findById(id) {
    return app.storage.readRegistrations().find(record => record.id === id);
  }

  function create(id, payload, expectedRevision) {
    let topic = getTopic(id);
    if (topic?.source === 'lecturer-created') topic = app.services.publishedTopics.requireOpen(id,expectedRevision);
    if (!topic) throw new Error('Không tìm thấy đề tài để đăng ký.');
    const validation = app.validation.validateRegistration(payload, getRules(id));
    if (validation.errors.length) {
      const error = new Error('Vui lòng kiểm tra thông tin nhóm.');
      error.fields = validation.errors;
      throw error;
    }
    const records = app.storage.readRegistrations();
    if (records.some(record => record.topic.id === id)) throw new Error('Đề tài này đã có đăng ký thử trên trình duyệt này.');
    const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const record = {
      id: `DK-${suffix}`,
      topic: { ...topic },
      ...(topic.source === 'lecturer-created' ? { catalogRevision:topic.revision, lecturerId:topic.ownerId } : {}),
      ...validation.value,
      status: 'cho-duyet',
      revision: 0,
      createdAt: new Date().toISOString(),
    };
    save([...records, record]);
    return record;
  }

  async function submit(id,payload,revision) {
    const commit = () => create(id,payload,revision);
    if (!globalThis.navigator?.locks?.request) return commit();
    const lockRegistration = () => navigator.locks.request(app.storage.registrationKey,commit);
    const topic = getTopic(id);
    return topic?.source === 'lecturer-created' ? navigator.locks.request(app.services.lecturerTopicRepository.key,lockRegistration) : lockRegistration();
  }

  const labels = { 'cho-duyet': 'Chờ duyệt', 'da-duyet': 'Đã duyệt', 'tu-choi': 'Từ chối' };
  const owns = record => record.members.some(member => member.code === app.data.currentStudent?.code);
  const receiptUrl = id => `chi-tiet-dang-ky-da-luu.html?registration=${encodeURIComponent(id)}`;

  function save(records) {
    app.storage.writeRegistrations(records);
    globalThis.dispatchEvent?.(new Event('ie104:registrations-updated'));
  }

  function listForLecturer() {
    return app.storage.readRegistrations().filter(record => record.lecturerId && record.lecturerId === app.data.currentLecturer?.id).map(record => {
      const topic = record.topic;
      const leader = record.members.find(member => member.role === 'nhom-truong');
      const describe = value => Array.isArray(value) ? value.join('\n') : value || '';
      return {
        id: record.id, topicId: `DT-${record.id}`, title: topic.title, source: 'registration', revision: record.revision || 0,
        status: ({ 'cho-duyet': 'pending', 'da-duyet': 'approved', 'tu-choi': 'rejected' })[record.status],
        topicStatus: record.status === 'da-duyet' ? 'in-progress' : record.status,
        topicType: topic.type, topicTypeLabel: topic.typeLabel, courseId: topic.courseId,
        course: topic.courseId === 'IE104' ? 'internet-va-cong-nghe-web' : topic.courseId,
        courseLabel: topic.courseLabel, semester: topic.semester, academicYear: topic.academicYear,
        supervisionRole: 'huong-dan-chinh', supervisionRoleLabel: 'Hướng dẫn chính',
        studentName: leader?.name || '', studentId: leader?.code || '', groupName: record.groupName,
        members: record.members.map(member => ({ ...member })), message: record.message || '', submittedAt: record.createdAt,
        description: describe(topic.description), objectives: describe(topic.objectives), outcomes: describe(topic.outcomes),
        attachment: '', lecturerId: record.lecturerId, reason: record.decision?.reason || '', decidedAt: record.decision?.decidedAt || '',
      };
    });
  }

  async function decide(id, status, reason, revision) {
    const commit = () => {
      const records = app.storage.readRegistrations();
      const previous = records.find(record => record.id === id);
      if (!previous) throw new Error('Không tìm thấy đăng ký.');
      const lecturerId = app.data.currentLecturer?.id;
      if (!lecturerId || previous.lecturerId !== lecturerId) throw new Error('Giảng viên hiện tại không được xử lý đăng ký này.');
      if (previous.status !== 'cho-duyet') throw new Error('Đăng ký đã được xử lý. Hãy tải lại kết quả mới nhất.');
      if (!Number.isInteger(revision) || revision !== (previous.revision || 0)) throw new Error('Đăng ký đã thay đổi ở tab khác. Hãy tải lại trước khi xét duyệt.');
      if (!['approved', 'rejected'].includes(status)) throw new Error('Quyết định không hợp lệ.');
      const trimmed = typeof reason === 'string' ? reason.trim() : '';
      if (status === 'rejected' && trimmed.length < 10) throw new Error('Vui lòng nhập lý do từ chối từ 10 ký tự.');
      const record = { ...previous, status: status === 'approved' ? 'da-duyet' : 'tu-choi', revision: revision + 1,
        decision: { lecturerId, reason: status === 'rejected' ? trimmed : '', decidedAt: new Date().toISOString(), registrationRevision: revision } };
      save(records.map(item => item.id === id ? record : item));
      return listForLecturer().find(item => item.id === id);
    };
    return globalThis.navigator?.locks?.request ? navigator.locks.request(app.storage.registrationKey, commit) : commit();
  }

  function listMyTopics() {
    const pending = app.storage.readRegistrations().filter(record => owns(record) && !(record.status === 'da-duyet' && app.services.approvedProjects)).map(record => {
      const topic = record.topic;
      return {
        id: topic.id,
        requestId: record.id,
        displayId: topic.displayId || topic.id,
        title: topic.title,
        type: topic.type === 'khoa-luan' ? 'khoa-luan' : 'do-an',
        typeLabel: topic.typeLabel,
        courseId: topic.courseId,
        semester: topic.semester,
        academicYear: topic.academicYear || '2026-2027',
        lecturer: topic.lecturer,
        lecturerLabel: 'Giảng viên nhận đăng ký',
        groupName: record.groupName,
        status: record.status,
        statusLabel: labels[record.status], requestStatusLabel: labels[record.status], feedback: record.decision?.reason || '',
        createdAt: record.createdAt,
        detailUrl: `chi-tiet-dang-ky-da-luu.html?registration=${encodeURIComponent(record.id)}`,
      };
    });
    return [...pending, ...(app.services.approvedProjects?.list('student') || []).filter(project => project.source === 'approved-registration').map(project => ({ ...project, requestStatusLabel: 'Đã duyệt', feedback: '' }))];
  }

  app.services.registrations = { getTopic, getRules, findByTopic, findById, create, submit, listMyTopics, listForLecturer, decide, labels, owns, receiptUrl };
})();
