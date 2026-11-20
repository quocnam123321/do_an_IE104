(() => {
  const catalog = window.UITLecturerCatalog;
  const data = window.IE104?.data;
  if (!catalog || !data) return;

  const kindOf = record => record.topicType === 'master' ? 'thesis' : record.topicType;
  const shared = record => ({
    id: record.id,
    displayId: catalog.formatCode(record.topicType, record.code),
    ownerId: 'GV001',
    title: record.title,
    topicType: kindOf(record),
    filterType: record.topicType,
    typeLabel: record.type,
    course: record.course || '',
    courseLabel: record.courseLabel || '',
    semester: String(record.semester || ''),
    academicYear: (record.academicYear || '').replace('–', '-'),
    description: record.description,
    objectives: record.objectives || [],
    outcomes: record.outcomes || [],
    requirements: record.requirements || [],
    domain: record.field || '',
    technologies: record.technology || '',
    sourceRecord: record,
  });

  const created = catalog.records.filter(record => catalog.created.includes(record.id)).map(record => ({
    ...shared(record),
    kind: 'created',
    supervisor: { name: 'Nguyễn Văn A', faculty: record.faculty, email: 'giangvien@example.com', research: 'Khoa học dữ liệu và Hệ thống thông tin' },
    status: 'open',
    statusLabel: 'Đang mở đăng ký',
    createdAt: '',
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
  data.lecturerTopics = [
    ...created,
    ...supervised,
    ...(data.lecturerTopics || []).filter(topic => topic.kind === 'created'),
  ];
  data.lecturerRealDefaultTopicId = created[0]?.id;
})();
