(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const clone = value => JSON.parse(JSON.stringify(value));
  const actorId = () => app.data.currentLecturer?.id;
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
    return record.kind === 'created' ? `chi-tiet-de-tai-da-tao-giang-vien.html?topic=${encodeURIComponent(record.id)}` : record.sourceRecord ? `chi-tiet-de-tai-dang-huong-dan-giang-vien.html?topic=${encodeURIComponent(record.id)}`
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
    const position = app.data.projectTeams?.find(team => team.projectId === project.id)?.supervisorIds.indexOf(actorId());
    const role = project.role || (position >= 0 ? position === 0 ? 'primary' : 'secondary' : undefined);
    return { ...project, role, roleLabel: project.roleLabel || ({ primary: 'Hướng dẫn chính', secondary: 'Đồng hướng dẫn' })[role], displayId: project.topicCode || decorated.displayId, courseLabel: decorated.courseLabel, groupName: codes.groupLabel(project) };
  }

  function workspaceState(projectId) {
    const definition = records('supervised').find(record => record.kind === 'supervised' && record.workspaceId === projectId);
    if (!definition) return app.services.teaching.getState(projectId);
    const topic = get('supervised', definition.id);
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

  app.services.lecturerTopics = { list, get, createdStatus, detailUrl, returnUrl, workspaceChoices, workspaceState, projectIdentity, allCreated: () => clone(records('created').filter(topic => topic.kind === 'created')) };
})();
