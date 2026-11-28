(() => {
  const catalog = window.UITLecturerCatalog;
  const data = window.IE104?.data;
  if (!catalog || !data) return;

  const kindOf = record => record.topicType === 'master' ? 'thesis' : record.topicType;
  const shared = record => ({
    id: record.id,
    displayId: catalog.formatCode(record.topicType, record.code, catalog.facultyFor(record)),
    ownerId: 'GV001',
    title: record.title,
    topicType: kindOf(record),
    filterType: record.topicType,
    typeLabel: record.type,
    course: record.course || '',
    courseLabel: record.courseLabel || '',
    courseCode: record.courseCode || '',
    semester: String(record.semester || ''),
    academicYear: (record.academicYear || '').replace('–', '-'),
    description: record.description,
    objectives: record.objectives || [],
    outcomes: record.outcomes || [],
    requirements: record.requirements || [],
    domain: record.field || '',
    technologies: record.technology || '',
    sourceRecord: record,
    demo: Boolean(record.demo),
    startsAt: record.startsAt,
    completesAt: record.completesAt,
  });

  const created = catalog.records.filter(record => catalog.created.includes(record.id)).map(record => ({
    ...shared(record),
    kind: 'created',
    supervisor: { ...(record.demoSupervisor || { name: 'Chưa có thông tin', faculty: record.faculty, email: '', research: '' }) },
    status: record.status || 'open',
    statusLabel: record.status === 'closed' ? 'Đã đóng đăng ký' : 'Đang mở đăng ký',
    createdAt: record.createdAt || '',
    ...(record.demo ? { registration: record.registration, attachmentName: '' } : {}),
  }));
  const supervised = catalog.records.filter(record => catalog.supervised.includes(record.id)).map(record => ({
    ...shared(record),
    kind: 'supervised',
    workspaceId: record.id,
    role: record.supervisionRole || 'primary',
    roleLabel: record.supervisionRoleLabel || 'Hướng dẫn chính',
    groupName: record.supervision?.group || '',
    status: 'dang-thuc-hien',
    statusLabel: 'Đang thực hiện',
  }));
  data.lecturerTopics = catalog.decorateTopics([
    ...created,
    ...supervised,
    ...(data.lecturerTopics || []).filter(topic => topic.kind === 'created').map(topic => {
      const guide = topic.topicType === 'course' && catalog.courseGuidance?.[catalog.courseKey(topic.course)];
      return guide ? { ...topic, objectives: [...guide.objectives], outcomes: [...guide.outcomes], technologies: guide.technology } : topic;
    }),
  ]);
  data.lecturerRealDefaultTopicId = created[0]?.id;
})();
