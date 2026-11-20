(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const defaultRules = { minMembers: 1, maxMembers: 3 };
  const labels = { 'cho-duyet': 'Chờ duyệt', 'da-dang-ky': 'Đã đăng ký', 'da-duyet': 'Đã duyệt', 'tu-choi': 'Từ chối' };
  const owns = record => record.members.some(member => member.code === app.data.currentStudent?.code);
  const isActive = record => record.status === 'da-dang-ky' || record.status === 'da-duyet';
  const receiptUrl = id => `chi-tiet-dang-ky-da-luu.html?registration=${encodeURIComponent(id)}`;
  const projectUrl = record => isActive(record) && owns(record)
    ? `chi-tiet-de-tai-da-duyet-sinh-vien.html?project=${encodeURIComponent(`DT-${record.id}`)}`
    : null;

  function getTopic(id) {
    const samples = app.data.openTopics || [];
    const topics = globalThis.TeacherTopicStore?.studentTopics(samples) || samples;
    const sample = topics.find(topic => topic.id === id);
    const published = app.services.publishedTopics;
    return published?.get(id) || (sample && (published?.findEdited(sample.title) || sample));
  }

  function getRules(id) {
    return getTopic(id)?.registrationRules || { ...defaultRules };
  }

  function findByTopic(id) {
    const records = app.storage.readRegistrations();
    const exact = records.find(record => record.topic.id === id);
    if (exact) return exact;
    const key = app.topicIdentity?.titleKey(getTopic(id)?.title);
    return key ? records.find(record => app.topicIdentity.titleKey(record.topic.title) === key) : undefined;
  }

  function findById(id) {
    return app.storage.readRegistrations().find(record => record.id === id);
  }

  function validateEnrollment(payload, rules = defaultRules) {
    const checked = app.validation.validateRegistration(payload, { ...rules, groupNameRequired: false });
    if (!owns(checked.value)) checked.errors.push({ field: 'members.0.code', message: 'Nhóm đăng ký cần có MSSV của bạn.' });
    return checked;
  }

  function create(id, payload, expectedRevision) {
    let topic = getTopic(id);
    if (topic?.source === 'lecturer-created') topic = app.services.publishedTopics.requireOpen(topic.id, expectedRevision);
    if (!topic) throw new Error('Không tìm thấy đề tài để đăng ký.');
    if (topic.status === 'closed') throw new Error('Đề tài đã đóng đăng ký.');
    const { record: topicDetails, ...snapshot } = topic;
    const validation = validateEnrollment(payload, topic.registrationRules);
    if (validation.errors.length) {
      const error = new Error('Vui lòng kiểm tra thông tin nhóm.');
      error.fields = validation.errors;
      throw error;
    }
    const records = app.storage.readRegistrations();
    const key = app.topicIdentity?.titleKey(topic.title);
    if (records.some(record => record.topic.id === topic.id || record.topic.id === id || (key && app.topicIdentity.titleKey(record.topic.title) === key))) throw new Error('Đề tài này đã có đăng ký thử trên trình duyệt này.');
    const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const lecturerId = topic.ownerId || topic.lecturerId;
    const record = {
      id: `DK-${suffix}`,
      topic: snapshot,
      ...(topic.source === 'lecturer-created' ? { catalogRevision: topic.revision } : {}),
      ...(lecturerId ? { lecturerId } : {}),
      ...validation.value,
      status: 'da-dang-ky',
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

  function save(records) {
    app.storage.writeRegistrations(records);
    globalThis.dispatchEvent?.(new Event('ie104:registrations-updated'));
  }

  function listForLecturer() {
    return app.storage.readRegistrations().filter(record => record.status !== 'da-dang-ky' && record.lecturerId && record.lecturerId === app.data.currentLecturer?.id).map(record => {
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
    const otherTopics = app.storage.readRegistrations().filter(record => owns(record) && !(isActive(record) && app.services.approvedProjects)).map(record => {
      const topic = record.topic;
      const active = isActive(record);
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
        lecturerLabel: active ? 'Giảng viên hướng dẫn' : 'Giảng viên nhận đăng ký',
        groupName: record.groupName,
        status: active ? 'dang-thuc-hien' : record.status,
        statusLabel: active ? 'Đang thực hiện' : labels[record.status], requestStatusLabel: labels[record.status], feedback: record.decision?.reason || '',
        createdAt: record.createdAt,
        detailUrl: projectUrl(record) || receiptUrl(record.id),
        requestDetailUrl: receiptUrl(record.id),
      };
    });
    return [...otherTopics, ...(app.services.approvedProjects?.list('student') || []).filter(project => project.source === 'approved-registration')];
  }

  app.services.registrations = { getTopic, getRules, findByTopic, findById, validateEnrollment, create, submit, listMyTopics, listForLecturer, decide, labels, owns, receiptUrl, projectUrl };
})();
