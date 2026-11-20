(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};

  function getTopic(id) {
    const samples = app.data.openTopics;
    const sample = samples.find(topic => topic.id === id);
    if (sample && id !== 'DT001') return sample;
    const topics = globalThis.TeacherTopicStore?.studentTopics(samples) || samples;
    return topics.find(topic => topic.id === id);
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

  function create(id, payload) {
    const topic = getTopic(id);
    if (!topic) throw new Error('Không tìm thấy đề tài để đăng ký.');
    if (topic.status === 'closed') throw new Error('Đề tài đã đóng đăng ký.');
    const { record: topicDetails, ...snapshot } = topic;
    const validation = app.validation.validateRegistration(payload, topic.registrationRules);
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
      topic: snapshot,
      ...validation.value,
      status: 'cho-duyet',
      createdAt: new Date().toISOString(),
    };
    app.storage.writeRegistrations([...records, record]);
    return record;
  }

  function listMyTopics() {
    return app.storage.readRegistrations().map(record => {
      const topic = record.topic;
      return {
        id: topic.id,
        requestId: record.id,
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
        statusLabel: 'Chờ duyệt',
        createdAt: record.createdAt,
        detailUrl: `chi-tiet-dang-ky-da-luu.html?registration=${encodeURIComponent(record.id)}`,
      };
    });
  }

  app.services.registrations = { getTopic, getRules, findByTopic, findById, create, listMyTopics };
})();
