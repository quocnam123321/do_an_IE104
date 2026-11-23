(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const clone = value => JSON.parse(JSON.stringify(value));
  const newId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  const actor = () => app.data.currentLecturer;

  function context(projectId, checkActor = true) {
    let project = app.data.myTopics.find(item => item.id === projectId) || app.data.lecturerProjects?.find(item => item.id === projectId)
      || app.services.approvedProjects?.get(projectId)?.project;
    if (!project) throw new Error('Không tìm thấy đề tài cần quản lý.');
    if (project.id === 'DA005') project = { ...project, semester: 1 };
    const team = app.services.projectTeams.getState(projectId);
    const canSupervise = app.services.approvedProjects?.canSupervise(project, team.supervisorIds) ??
      team.supervisorIds.includes(actor()?.id);
    if (checkActor && !canSupervise) throw new Error('Giảng viên hiện tại không hướng dẫn đề tài này.');
    const initialEvaluation = app.data.projectEvaluations?.find(item => item.projectId === projectId && item.published);
    const criteria = initialEvaluation?.criteria || app.data.teachingCriteria;
    return { project, team, initialEvaluation, criteria };
  }

  function supervisedProjects() {
    const lecturerId = actor()?.id;
    const initial = [...app.data.myTopics, ...(app.data.lecturerProjects || [])].flatMap(project => {
      const position = app.data.projectTeams.find(team => team.projectId === project.id)?.supervisorIds.indexOf(lecturerId);
      return position >= 0 ? [{ project, role: position === 0 ? 'primary' : 'secondary' }] : [];
    });
    const dynamic = (app.services.approvedProjects?.list('lecturer') || []).map(project => ({ project, role: 'primary' }));
    const projects = [...dynamic, ...initial].filter(entry => !window.UITLecturerCatalog || window.UITLecturerCatalog.isAvailableTopic(entry.project)).map(entry => entry.project.id === 'DA005' ? { ...entry, project: { ...entry.project, semester: 1 } } : entry);
    return app.topicIdentity?.uniqueTitles(projects, entry => entry.project.title) || projects;
  }

  function listProjects() {
    return supervisedProjects().map(({ project }) => ({ id: project.id, title: project.title, label: `${project.topicId || project.id} - ${project.title} - ${project.groupName}` }));
  }

  function listActiveProjects() {
    return listSupervisedProjects().filter(({ project }) => project.status === 'dang-thuc-hien');
  }

  function listSupervisedProjects() {
    return supervisedProjects().map(clone);
  }

  function stateFrom(projectId, records) {
    const source = records.find(item => item.projectId === projectId) || app.data.teachingSeeds?.find(item => item.projectId === projectId) || { projectId, revision: 0, requirements: [], submissions: [], progressReviews: [], draft: null, publishedEvaluation: null, audit: [] };
    const record = clone(source);
    record.submissionsLocked = Boolean(record.submissionsLocked);
    record.submissions.forEach(item => { item.feedbackHistory ||= []; });
    return record;
  }

  function decorate(record, meta) {
    let progress = null;
    let warning = '';
    try { progress = app.services.projectProgress.getState(record.projectId); }
    catch (failure) { warning = failure.message; }
    return { ...clone(record), ...clone(meta), progress, warning, publication: clone(record.publishedEvaluation || meta.initialEvaluation || null), canManageRequirements: meta.project.status === 'dang-thuc-hien' };
  }

  function getState(projectId) {
    const meta = context(projectId);
    return decorate(stateFrom(projectId, app.storage.readTeachingRecords()), meta);
  }

  function getSubmission(projectId, submissionId) {
    context(projectId);
    const record = stateFrom(projectId, app.storage.readTeachingRecords());
    const submission = record.submissions.find(item => item.id === submissionId);
    if (!submission) throw new Error('Không tìm thấy lần nộp của nhóm đang hướng dẫn.');
    return clone(submission);
  }

  function mutate(projectId, revision, action, targetId, change) {
    const meta = context(projectId);
    const records = app.storage.readTeachingRecords();
    const record = stateFrom(projectId, records);
    if (!Number.isInteger(revision) || revision !== record.revision) throw new Error('Dữ liệu đã thay đổi ở tab khác. Hãy đóng hộp thoại và mở lại để xem bản mới.');
    change(record, meta);
    record.revision += 1;
    record.updatedAt = new Date().toISOString();
    record.audit.push({ action, targetId: targetId || null, actorId: actor().id, at: record.updatedAt });
    app.storage.writeTeachingRecords([...records.filter(item => item.projectId !== projectId), record]);
    return decorate(record, meta);
  }

  function active(meta) {
    if (meta.project.status !== 'dang-thuc-hien') throw new Error('Đề tài không đang thực hiện nên không thể thay đổi yêu cầu hoặc mở nhận bài.');
  }

  function validateRequirement(input) {
    const value = { title: String(input.title || '').trim(), content: String(input.content || '').trim() };
    const errors = [];
    if (!value.title || value.title.length > 200) errors.push('Nhập tên yêu cầu từ 1 đến 200 ký tự.');
    if (!value.content || value.content.length > 5000) errors.push('Nhập nội dung yêu cầu từ 1 đến 5000 ký tự.');
    const parts = String(input.deadline || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!parts) errors.push('Chọn ngày và giờ đến hạn hợp lệ.');
    else {
      const [year, month, day, hour, minute] = parts.slice(1).map(Number);
      const date = new Date(0);
      date.setUTCFullYear(year, month - 1, day);
      date.setUTCHours(hour, minute, 0, 0);
      if (year < 1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || hour > 23 || minute > 59) errors.push('Ngày hoặc giờ đến hạn không tồn tại.');
      else value.deadline = new Date(date.getTime() - 7 * 60 * 60 * 1000).toISOString();
    }
    return { value, errors };
  }

  function saveRequirement(projectId, id, input, revision) {
    return mutate(projectId, revision, id ? 'edit-requirement' : 'create-requirement', id, (record, meta) => {
      active(meta);
      const checked = validateRequirement(input);
      if (checked.errors.length) throw new Error(checked.errors.join(' '));
      if (id) {
        const requirement = record.requirements.find(item => item.id === id && !item.deletedAt);
        if (!requirement) throw new Error('Yêu cầu không còn tồn tại.');
        Object.assign(requirement, checked.value);
      } else record.requirements.push({ ...checked.value, id: newId('REQ'), locked: false, sourceStage: 'pending' });
    });
  }

  function deleteRequirement(projectId, id, revision) {
    return mutate(projectId, revision, 'delete-requirement', id, (record, meta) => {
      active(meta);
      const requirement = record.requirements.find(item => item.id === id && !item.deletedAt);
      if (!requirement) throw new Error('Yêu cầu không còn tồn tại.');
      if (record.submissions.some(item => item.requirementId === id) || requirement.sourceStage !== 'pending') throw new Error('Yêu cầu đã có bài nộp. Hãy khóa nhận bài để giữ lịch sử.');
      requirement.deletedAt = new Date().toISOString();
    });
  }

  function setLocked(projectId, id, locked, revision) {
    return mutate(projectId, revision, locked ? 'lock-submissions' : 'unlock-submissions', id, (record, meta) => {
      if (typeof locked !== 'boolean') throw new Error('Trạng thái khóa không hợp lệ.');
      if (!locked) active(meta);
      if (id) {
        const requirement = record.requirements.find(item => item.id === id && !item.deletedAt);
        if (!requirement) throw new Error('Yêu cầu không còn tồn tại.');
        requirement.locked = locked;
      } else record.submissionsLocked = locked;
    });
  }

  function addProgressReview(projectId, input, revision) {
    return mutate(projectId, revision, 'review-progress', input.taskId, record => {
      const progress = app.services.projectProgress.getState(projectId);
      if (input.progressRevision !== progress.revision) throw new Error('Tiến độ đã thay đổi. Hãy mở lại hộp nhận xét để xem bản mới.');
      const content = String(input.content || '').trim();
      if (!content || content.length > 2000) throw new Error('Nhập nhận xét từ 1 đến 2000 ký tự.');
      const task = input.taskId ? progress.tasks.find(item => item.id === input.taskId) : null;
      if (input.taskId && !task) throw new Error('Công việc không còn tồn tại.');
      record.progressReviews.unshift({ id: newId('REVIEW'), taskId: task?.id || null, taskTitle: task?.title || 'Tiến độ tổng thể', progressRevision: progress.revision, content, authorId: actor().id, authorName: actor().name, createdAt: new Date().toISOString() });
    });
  }

  function saveFeedback(projectId, submissionId, content, revision) {
    return mutate(projectId, revision, 'review-submission', submissionId, record => {
      const submission = record.submissions.find(item => item.id === submissionId);
      if (!submission) throw new Error('Lần nộp không còn tồn tại.');
      const text = String(content || '').trim();
      if (!text || text.length > 2000) throw new Error('Nhập phản hồi từ 1 đến 2000 ký tự.');
      if (submission.feedback) submission.feedbackHistory.push({ content: submission.feedback, at: submission.feedbackAt, authorId: submission.feedbackBy });
      submission.feedback = text;
      submission.feedbackAt = new Date().toISOString();
      submission.feedbackBy = actor().id;
    });
  }

  function validateEvaluation(input, criteria, publishing = false) {
    const errors = [];
    const rows = criteria.map(item => {
      const raw = input.scores?.[item.id];
      const score = raw === null || raw === undefined || String(raw).trim() === '' ? NaN : Number(raw);
      if (!Number.isFinite(score) || score < 0 || score > 10 || Math.abs(score * 10 - Math.round(score * 10)) > 0.00001) errors.push(`${item.title}: nhập điểm từ 0 đến 10, tối đa một chữ số thập phân.`);
      return { id: item.id, title: item.title, weight: item.weight, score, comment: String(input.comments?.[item.id] || '').trim() || 'Chưa có nhận xét riêng cho tiêu chí.' };
    });
    if (!rows.length || Math.abs(rows.reduce((sum, item) => sum + item.weight, 0) - 100) > 0.0001) errors.push('Tổng trọng số tiêu chí phải bằng 100%.');
    const feedback = String(input.feedback || '').trim();
    const resultLabel = String(input.resultLabel || '').trim();
    if (feedback.length > 2000 || rows.some(item => item.comment.length > 2000)) errors.push('Nhận xét tối đa 2000 ký tự.');
    if (resultLabel.length > 100) errors.push('Kết quả đánh giá tối đa 100 ký tự.');
    if (publishing && !feedback) errors.push('Nhập nhận xét cho nhóm trước khi công bố.');
    return { errors, value: { criteria: rows, feedback, resultLabel, score: Math.round(rows.reduce((sum, item) => sum + item.score * item.weight / 100, 0) * 10) / 10 } };
  }

  function publish(projectId, input, revision) {
    return mutate(projectId, revision, 'publish-evaluation', null, (record, meta) => {
      const checked = validateEvaluation(input, meta.criteria, true);
      if (checked.errors.length) throw new Error(checked.errors.join(' '));
      const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const date = Object.fromEntries(parts.map(part => [part.type, part.value]));
      record.publishedEvaluation = { ...checked.value, resultLabel: checked.value.resultLabel || 'Đã đánh giá', projectId, published: true, lecturerName: actor().name, evaluatedAt: `${date.year}-${date.month}-${date.day}`, publishedAt: new Date().toISOString(), attachment: record.publishedEvaluation?.attachment ?? meta.initialEvaluation?.attachment ?? null };
      record.draft = null;
    });
  }

  function submissionAccess(projectId, requirementId, studentCode, now = new Date()) {
    const meta = context(projectId, false);
    const record = stateFrom(projectId, app.storage.readTeachingRecords());
    const requirement = record.requirements.find(item => item.id === requirementId && !item.deletedAt);
    if (!requirement) return { allowed: false, late: false, reason: 'Không tìm thấy yêu cầu nộp bài.' };
    if (!meta.team.members.some(member => member.code === studentCode)) return { allowed: false, late: false, reason: 'Sinh viên không thuộc nhóm thực hiện.' };
    if (meta.project.status !== 'dang-thuc-hien' || record.submissionsLocked || requirement.locked) return { allowed: false, late: false, reason: 'Đề tài hoặc yêu cầu đang khóa nhận bài.' };
    return { allowed: true, late: now.getTime() > Date.parse(requirement.deadline), reason: '' };
  }

  app.services.teaching = { listProjects, listActiveProjects, listSupervisedProjects, getState, getSubmission, validateRequirement, saveRequirement, deleteRequirement, setLocked, addProgressReview, saveFeedback, validateEvaluation, publish, submissionAccess };
})();
