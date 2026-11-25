(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const clone = value => JSON.parse(JSON.stringify(value));
  const actorId = () => app.data.currentLecturer?.id;
  // Tên và MSSV hiển thị bổ sung cho các hồ sơ mẫu còn thiếu dữ liệu.
  const sampleGroupNames = {
    'ISE-005': 'Quản lý công việc',
    'ISE-015': 'Gợi ý phim',
    'ISE-016': 'Truy xuất thực phẩm',
    'ISEDATN-001': 'Thiết bị phòng thí nghiệm',
    'ISEDATN-002': 'Kết nối thực tập',
    'ISEDATN-003': 'Số hóa văn bản',
    'ISEDATN-004': 'Khuôn viên xanh',
    'ISEDATN-005': 'Kết nối tình nguyện',
    'ISEDAMH-002': 'Kho vật tư',
    'ISEDAMH-004': 'Trao đổi sách UIT',
    'ISEDAMH-005': 'Quản lý thi ngoại ngữ',
    'ISEDAMH-007': 'Kỹ năng số',
    'ISEDAMH-008': 'Suất ăn căn tin',
    'ISEDAMH-009': 'Hạ tầng đào tạo',
    'ISEDAMH-010': 'Hạ tầng thư viện',
    'ISEDAMH-011': 'Hồ sơ câu lạc bộ',
    'ISEDAMH-012': 'Kết nối học bổng',
    'ISEDAMH-013': 'Phân quyền tài liệu',
    'ISEDAMH-014': 'An toàn mạng nội bộ',
    'ISEDAMH-015': 'Lịch tư vấn học tập',
  };
  const sampleStudentCodes = {
    'ISE-001': '22528341',
    'ISE-002': '23527358',
    'ISE-003': '24526493',
    'ISE-005': '25528127',
    'ISE-015': '22526704',
    'ISE-016': '23528269',
    'ISEDAMH-009': '24527219',
    'ISEDAMH-010': '25526354',
    'ISEDAMH-011': '22527931',
    'ISEDAMH-012': '23526835',
    'ISEDAMH-013': '24528346',
    'ISEDAMH-014': '25527762',
    'ISEDAMH-015': '24527219',
  };
  const excludedCreatedTopicIds = new Set([
    'DA001', 'DA002', 'DA004', 'DA005',
    'ISE-004', 'ISE-006', 'ISE-007',
    'ISEDAMH-007', 'ISEDAMH-008', 'ISEDAMH-012',
  ]);
  const isListedInCreatedTab = ({ id, title }) =>
    !excludedCreatedTopicIds.has(id) && app.topicIdentity?.titleKey(title) !== 'web bán quần áo';
  const excludedSupervisedTopicIds = new Set(['DA005', 'ISE-011', 'ISE-004', 'ISE-006', 'ISE-007', 'DT001']);
  const isListedInSupervisedTab = ({ id, topicId }) =>
    !excludedSupervisedTopicIds.has(id) && !excludedSupervisedTopicIds.has(topicId);

  function additionalSupervisedTopics(projects, proposals) {
    const byId = new Map(projects.map(({ project, role }) => [project.id, {
      project,
      record: {
        id: project.id, topicId: project.topicId || project.id, projectId: project.id,
        title: project.title,
        topicType: project.type || ({ 'Đồ án môn học': 'do-an-mon-hoc', 'Đồ án tốt nghiệp': 'do-an-tot-nghiep', 'Khóa luận tốt nghiệp': 'khoa-luan' })[project.typeLabel],
        course: project.courseId, courseLabel: project.courseLabel,
        sortDate: project.startsAt || project.createdAt,
        semester: project.semester, academicYear: project.academicYear,
        supervisionRole: role === 'secondary' ? 'dong-huong-dan' : 'huong-dan-chinh',
        supervisionRoleLabel: role === 'secondary' ? 'Đồng hướng dẫn' : 'Hướng dẫn chính',
        topicStatus: project.status, statusLabel: project.statusLabel,
      },
    }]));
    for (const record of proposals) {
      if (record.status === 'approved' && !byId.has(record.topicId)) {
        byId.set(record.topicId, { record });
      }
    }
    return [...byId.values()].filter(({ record }) => isListedInSupervisedTab(record) &&
      !['master', 'luan-van-thac-si'].includes(record.topicType));
  }

  const decorate = topics => window.UITLecturerCatalog?.decorateTopics(topics.filter(topic => window.UITLecturerCatalog.isAvailableTopic(topic))) || topics;
  const records = kind => {
    const initial = app.data.lecturerTopics || [];
    if (kind !== 'created' || !app.services.lecturerTopicRepository) return decorate(initial);
    const saved = app.services.lecturerTopicRepository.read();
    const merged = initial.map(topic => {
      const changed = topic.kind === 'created' && saved.find(record => record.id === topic.id);
      if (changed && changed.ownerId !== topic.ownerId) throw new Error('Dữ liệu người sở hữu đề tài đã lưu không hợp lệ.');
      return changed ? { ...topic, ...changed, displayId: topic.displayId } : topic;
    });
    for (const topic of saved) if (!initial.some(seed => seed.kind === 'created' && seed.id === topic.id)) {
      if (app.data.lecturerRealMode && topic.patchOnly && app.data.lecturerLegacyTopics?.some(seed => seed.kind === 'created' && seed.id === topic.id && seed.ownerId === topic.ownerId)) continue;
      if (topic.patchOnly) throw new Error('Không tìm thấy nguồn của trạng thái đăng ký đã lưu.');
      merged.push(topic);
    }
    return decorate(merged);
  };

  function registeredTopicIds() {
    const registrations = app.storage?.readRegistrations() || [];
    const ids = new Set();
    const publicId = app.services.publishedTopics?.publicId;
    for (const record of registrations) {
      if (record.status !== 'da-dang-ky' && record.status !== 'da-duyet') continue;
      const { topic } = record;
      if (topic.id.startsWith('GV:')) ids.add(topic.id);
      const ownerId = topic.ownerId || record.lecturerId;
      const legacyId = topic.catalogId || (!topic.id.startsWith('GV:') ? topic.id : '');
      if (publicId && ownerId && legacyId) ids.add(publicId({ ownerId, id: legacyId }));
    }
    return ids;
  }

  function createdStatus(topic, registeredIds = registeredTopicIds()) {
    const publicId = app.services.publishedTopics?.publicId;
    const matches = publicId && [topic.id, topic.displayId].some(id =>
      id && registeredIds.has(publicId({ ...topic, id })));
    return matches
      ? { status: 'registered', statusLabel: 'Đã có nhóm đăng ký' }
      : { status: topic.status, statusLabel: topic.statusLabel };
  }

  function list(kind, { catalogOnly = false } = {}) {
    const available = catalogOnly ? decorate(app.data.lecturerTopics || []).filter(topic => topic.sourceRecord) : records(kind);
    if (kind === 'supervised' && !catalogOnly && app.services.projectTeams) {
      const projects = [...(app.data.myTopics || []), ...(app.services.approvedProjects?.list('student') || [])];
      for (const project of projects) {
        const team = app.services.projectTeams.getState(project.id);
        if (!team.invitations.some(item => item.status === 'accepted' && item.lecturerId === actorId())) continue;
        available.push({ ...project, id: project.topicId || project.id, workspaceId: project.id,
          ownerId: actorId(), kind: 'supervised', sharedStudentProject: true, role: 'secondary', roleLabel: 'Đồng hướng dẫn',
          topicType: ({ 'khoa-luan': 'thesis', 'do-an-tot-nghiep': 'graduation' })[project.type] || 'course',
          displayId: project.displayId || project.topicCode || project.topicId, courseLabel: window.UITLecturerCatalog.subjectLabel(project),
          course: project.courseId || project.course, semester: project.semester, academicYear: project.academicYear });
      }
    }
    const owned = available.filter(record => record.kind === kind && record.ownerId === actorId() && record.sourceRecord?.type !== 'Luận văn thạc sĩ' && record.topicType !== 'master');
    const registeredIds = kind === 'created' && !catalogOnly ? registeredTopicIds() : new Set();
    const visible = kind === 'created' ? owned.map(topic => ({ ...topic, ...createdStatus(topic, registeredIds) })) : owned;
    return clone(app.topicIdentity?.uniqueTitles(visible) || visible);
  }

  function get(kind, id, { onSourceError } = {}) {
    const matches = item => item.kind === kind && (item.id === id || item.displayId === id);
    let record;
    try {
      record = records(kind).find(matches);
    } catch (failure) {
      if (!onSourceError) throw failure;
      record = decorate(app.data.lecturerTopics || []).find(matches);
      if (!record) throw failure;
      onSourceError(failure);
    }
    if (!record) throw new Error('Không tìm thấy đề tài theo mã đã chọn.');
    if (record.ownerId !== actorId()) throw new Error('Giảng viên hiện tại không được xem đề tài này.');
    return clone(record);
  }

  function detailUrl(record) {
    return record.kind === 'created' ? `chi-tiet-de-tai-da-tao-giang-vien.html?topic=${encodeURIComponent(record.id)}` : record.sourceRecord && !record.sharedStudentProject ? `chi-tiet-de-tai-dang-huong-dan-giang-vien.html?topic=${encodeURIComponent(record.id)}`
      : `chi-tiet-de-tai-dang-huong-dan-giang-vien.html?project=${encodeURIComponent(record.workspaceId)}`;
  }

  function returnUrl(kind, value, base) {
    const filename = kind === 'created' ? 'danh-sach-de-tai-da-tao.html' : 'danh-sach-de-tai-dang-huong-dan.html';
    const expected = new URL(filename, base);
    if (!value) return filename;
    try {
      const candidate = new URL(value, base);
      if (candidate.origin === expected.origin && candidate.protocol === expected.protocol && candidate.pathname === expected.pathname) return filename + candidate.search;
    } catch {}
    return filename;
  }

  function workspaceChoices() {
    const catalog = list('supervised');
    const choices = catalog.map(record => ({ id: record.workspaceId, label: `${record.id} - ${record.title} - ${record.groupName}` }));
    app.services.teaching.listProjects().forEach(project => {
      if (app.data.lecturerRealMode && app.data.myTopics.some(topic => topic.id === project.id)) return;
      if (!choices.some(choice => choice.id === project.id)) choices.push({ id: project.id, label: project.label });
    });
    return choices;
  }

  function supervisedParticipants(topic, members = []) {
    const source = topic.sourceRecord || (topic.authors ? topic : null);
    const leader = members.find(member => member.role === 'nhom-truong') || members[0];
    const name = topic.representativeName || source?.authors?.[0] || leader?.name || topic.studentName;
    const code = [topic.representativeCode, source?.studentIds?.[0], source?.studentId,
      sampleStudentCodes[source?.id], leader?.code, topic.studentId]
      .find(value => value && value !== 'xxxxxxxx');
    const studentLabel = [name, code].filter(Boolean).join(' · ');
    const memberCount = members.length || source?.authors?.length || 0;
    const numberedGroup = /^Nhóm\s+(\d+)\b/iu;
    const catalogGroup = source?.supervision?.group || '';
    const saved = (topic.groupName || topic.group || catalogGroup).trim();
    if (memberCount < 2 && (memberCount === 1 || !numberedGroup.test(saved))) {
      return { isGroup: false, label: studentLabel || 'Chưa có thông tin', studentLabel, name, code };
    }

    const prefix = numberedGroup.exec(saved);
    const number = prefix?.[1] || numberedGroup.exec(catalogGroup)?.[1] || '01';
    const savedName = (prefix ? saved.slice(prefix[0].length).replace(/^\s*[-–—]?\s*/u, '') : saved);
    const placeholder = !savedName || ['Nhóm chưa đặt tên', 'Chưa có nhóm thực hiện', 'Chưa xác nhận'].includes(savedName)
      || (topic.source === 'approved-proposal' && savedName === `Nhóm của ${name}`);
    const groupName = placeholder ? sampleGroupNames[source?.id] || name || topic.title : savedName;
    return { isGroup: true, label: `Nhóm ${number.padStart(2, '0')} - ${groupName}`, studentLabel };
  }

  function projectIdentity(project) {
    const codes = window.UITLecturerCatalog;
    if (!codes) return project;
    const adapt = item => ({ ...item,
      topicType: ({ 'do-an-mon-hoc': 'course', 'do-an': 'course', 'do-an-tot-nghiep': 'graduation', 'khoa-luan': 'thesis' })[item.type] || item.topicType ||
        ({ 'Đồ án môn học': 'course', 'Đồ án tốt nghiệp': 'graduation', 'Khóa luận tốt nghiệp': 'thesis' })[item.typeLabel] || item.type,
      course: item.course || item.courseId,
      displayId: item.displayId || item.topicId || item.id,
    });
    const initial = app.data.lecturerTopics || [];
    const staticIds = new Set([...(app.data.myTopics || []), ...(app.data.lecturerProjects || [])].map(item => item.id));
    const projects = app.services.teaching?.listSupervisedProjects().filter(entry => staticIds.has(entry.project.id)).map(entry => adapt(entry.project)) || [];
    const decorated = codes.decorateTopics([...initial, ...projects, adapt(project)]).at(-1);
    const position = app.services.projectTeams?.getState(project.id).supervisorIds.indexOf(actorId());
    const role = project.role || (position >= 0 ? position === 0 ? 'primary' : 'secondary' : undefined);
    return { ...project, role, roleLabel: project.roleLabel || ({ primary: 'Hướng dẫn chính', secondary: 'Đồng hướng dẫn' })[role], displayId: project.topicCode || decorated.displayId, courseLabel: decorated.courseLabel, groupName: codes.groupLabel(project) };
  }

  function workspaceState(projectId) {
    const definition = list('supervised').find(record => record.workspaceId === projectId);
    if (!definition) return app.services.teaching.getState(projectId);
    const topic = definition;
    const project = { ...topic, id: projectId, topicId: topic.id };
    if (app.data.projectTeams.some(team => team.projectId === projectId)) {
      const state = app.services.teaching.getState(projectId);
      const statusLabel = state.project.statusLabel || ({ 'dang-thuc-hien': 'Đang thực hiện', 'hoan-thanh': 'Hoàn thành' })[state.project.status] || 'Chưa có thông tin trạng thái';
      return { ...state, project: { ...state.project, ...project, status: state.project.status, statusLabel }, catalogTopic: topic };
    }
    return {
      projectId, project, catalogTopic: topic, revision: 0, readOnly: true,
      warning: 'Đã mở đúng đề tài. Chưa có dữ liệu thành viên, tiến độ và bài nộp của nhóm này.',
      team: { members: [], supervisorIds: [actorId()] }, progress: null,
      requirements: [], submissions: [], progressReviews: [], criteria: [],
      draft: null, publication: null, submissionsLocked: false, canManageRequirements: false,
    };
  }

  app.services.lecturerTopics = { list, get, isListedInCreatedTab, isListedInSupervisedTab, additionalSupervisedTopics, createdStatus, detailUrl, returnUrl, workspaceChoices, workspaceState, projectIdentity, supervisedParticipants, allCreated: () => clone(records('created').filter(topic => topic.kind === 'created')) };
})();
