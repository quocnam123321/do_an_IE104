(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const clone = value => JSON.parse(JSON.stringify(value));
  const actorId = () => app.data.currentLecturer?.id;
  const records = kind => {
    const initial = app.data.lecturerTopics || [];
    if (kind !== 'created' || !app.services.lecturerTopicRepository) return initial;
    const saved = app.services.lecturerTopicRepository.read();
    return [...initial.filter(topic => topic.kind !== 'created' || !saved.some(record => record.id === topic.id)), ...saved];
  };

  function list(kind) {
    return clone(records(kind).filter(record => record.kind === kind && record.ownerId === actorId()));
  }

  function get(kind, id) {
    const record = records(kind).find(item => item.kind === kind && item.id === id);
    if (!record) throw new Error('Không tìm thấy đề tài theo mã đã chọn.');
    if (record.ownerId !== actorId()) throw new Error('Giảng viên hiện tại không được xem đề tài này.');
    return clone(record);
  }

  function detailUrl(record) {
    return record.kind === 'created' ? `chi-tiet-de-tai-da-tao-giang-vien.html?topic=${encodeURIComponent(record.id)}` : `chi-tiet-de-tai-dang-huong-dan-giang-vien.html?project=${encodeURIComponent(record.workspaceId)}`;
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
      if (!choices.some(choice => choice.id === project.id)) choices.push({ id: project.id, label: project.label });
    });
    return choices;
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

  app.services.lecturerTopics = { list, get, detailUrl, returnUrl, workspaceChoices, workspaceState };
})();
