(() => {
  const data = document.getElementById('ie104-proposal-data');
  if (!data) return;
  const { account, student, records: initial, projects: initialProjects = [], topics: initialTopics = [],
    demoEvaluations: initialDemoEvaluations = {}, demoTeams: initialDemoTeams = {}, demoWorkspace,
    topicCodeFormId, invitations: initialInvitations } = JSON.parse(data.textContent);
  data.remove();
  const app = globalThis.IE104 = globalThis.IE104 || {};
  const root = '/api/proposals';
  const projectsPath = '/api/projects' + (demoWorkspace ? '?demoWorkspace=' + encodeURIComponent(demoWorkspace) : '');
  const topicsRoot = '/api/lecturer-topics';
  const supervisionRoot = '/api/supervision-invitations';
  const topicPath = code => topicsRoot + '/' + encodeURIComponent(code);
  const invitationPath = id => supervisionRoot + '/' + encodeURIComponent(id);
  const memberPath = (id, key) => '/api/projects/' + encodeURIComponent(id) + '/team/members' + (key ? '/' + encodeURIComponent(key) : '');
  const pathFor = (id, suffix = '') => root + '/' + encodeURIComponent(id) + suffix;
  const taskPath = (projectId, taskId) => '/api/projects/' + encodeURIComponent(projectId) + '/tasks'
    + (taskId ? '/' + encodeURIComponent(taskId) : '');
  const boardPath = projectId => '/api/projects/' + encodeURIComponent(projectId) + '/submission-board';
  const requirementPath = (projectId, id) => boardPath(projectId) + '/requirements' + (id ? '/' + encodeURIComponent(id) : '');
  const submissionPath = (projectId, id) => boardPath(projectId) + '/submissions/' + encodeURIComponent(id);
  const evaluationPath = projectId => '/api/projects/' + encodeURIComponent(projectId) + '/evaluation';
  const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('ie104-proposals') : null;
  let records = initial;
  let projects = initialProjects;
  let topics = initialTopics;
  let demoEvaluations = initialDemoEvaluations;
  let demoTeams = initialDemoTeams;
  let invitations = initialInvitations;
  let version = 0;
  let refreshing;
  let readError = '';
  const reservedCodes = new Map();

  const notify = () => window.dispatchEvent(new Event('ie104:proposals-updated'));
  function notifyTopics() {
    window.dispatchEvent(new Event('ie104:lecturer-topics-updated'));
    window.dispatchEvent(new Event('ie104:published-topics-updated'));
  }

  async function request(path = root, method = 'GET', body, { binary = false, signal } = {}) {
    const headers = { 'X-IE104-Account': account.id, 'X-IE104-Role': account.role,
      Accept: binary ? 'application/octet-stream' : 'application/json' };
    const options = { method, headers, cache: 'no-store', credentials: 'same-origin' };
    if (signal) options.signal = signal;
    if (body instanceof FormData) {
      options.body = body;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    let response;
    try {
      response = await fetch(path, options);
    } catch {
      throw new Error('Không kết nối được máy chủ IE104. Vui lòng thử lại.');
    }
    if (binary && response.ok) return response.blob();
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw Object.assign(new Error(result.error || 'Không thể xử lý yêu cầu lúc này.'), { status: response.status });
    }
    return result;
  }

  async function refresh() {
    refreshing ||= (async () => {
      const started = version;
      try {
        const [proposalState, projectState, topicState, supervisionState] = await Promise.all([
          request(), request(projectsPath), request(topicsRoot), invitations && request(supervisionRoot),
        ]);
        if (started !== version) return;
        const nextDemoEvaluations = projectState.demoEvaluations ?? {};
        const nextDemoTeams = projectState.demoTeams ?? {};
        const changed = readError || JSON.stringify(records) !== JSON.stringify(proposalState.records)
          || JSON.stringify(projects) !== JSON.stringify(projectState.projects)
          || JSON.stringify(demoEvaluations) !== JSON.stringify(nextDemoEvaluations)
          || JSON.stringify(demoTeams) !== JSON.stringify(nextDemoTeams)
          || JSON.stringify(invitations) !== JSON.stringify(supervisionState?.invitations);
        const topicsChanged = JSON.stringify(topics) !== JSON.stringify(topicState.topics);
        records = proposalState.records;
        projects = projectState.projects;
        demoEvaluations = nextDemoEvaluations;
        demoTeams = nextDemoTeams;
        invitations = supervisionState?.invitations;
        topics = topicState.topics;
        readError = '';
        if (changed) notify();
        if (topicsChanged) notifyTopics();
      } catch (error) {
        if (started !== version) return;
        if (error.status === 401 || error.status === 409) {
          window.location.reload();
          return;
        }
        if (readError !== error.message) {
          readError = error.message;
          notify();
        }
      } finally {
        refreshing = undefined;
      }
    })();
    return refreshing;
  }

  async function write(path, method, body) {
    const { record, project } = await request(path, method, body);
    version += 1;
    const index = records.findIndex(item => item.id === record.id);
    if (index === -1) records.unshift(record);
    else records[index] = record;
    if (project) projects = [project, ...projects.filter(item => item.project.id !== project.project.id)];
    readError = '';
    notify();
    channel?.postMessage('updated');
    return record;
  }

  async function writeTopic(path, method, body) {
    const { topic, record, project } = await request(path, method, body);
    version += 1;
    const index = topics.findIndex(item => item.id === topic.id);
    if (index < 0) topics.unshift(topic);
    else topics[index] = topic;
    if (project) {
      projects = [project, ...projects.filter(item => item.project.id !== project.project.id)];
      notify();
    }
    notifyTopics();
    channel?.postMessage('updated');
    return record || topic;
  }

  async function writeProjectSection(projectId, section, path, method, body) {
    try {
      const result = await request(path, method, body);
      version += 1;
      const update = item => {
        if (item.project.id !== projectId || (item[section]?.revision ?? -1) > result[section].revision) return item;
        const updated = { ...item, [section]: result[section] };
        if (result.projectStatus === 'hoan-thanh') {
          updated.project = { ...item.project, status: result.projectStatus, statusLabel: 'Hoàn thành' };
        }
        if (updated.submissionBoard && (section === 'submissionBoard' || result.projectStatus)) {
          updated.submissionBoard = { ...updated.submissionBoard, projectStatus: updated.project.status };
        }
        return updated;
      };
      if (section === 'evaluation' && Object.hasOwn(demoEvaluations, projectId)) {
        if (demoEvaluations[projectId].revision <= result.evaluation.revision) {
          demoEvaluations[projectId] = result.evaluation;
          if (Object.hasOwn(demoTeams, projectId)) demoTeams[projectId] = update(demoTeams[projectId]);
        }
      } else if (Object.hasOwn(demoTeams, projectId)) demoTeams[projectId] = update(demoTeams[projectId]);
      else projects = projects.map(update);
      notify();
      channel?.postMessage('updated');
      return result.record || result[section];
    } catch (error) {
      if (error.status === 409) await refresh();
      throw error;
    }
  }
  const writeProgress = (projectId, path, method, body) => writeProjectSection(projectId, 'progress', path, method, body);
  const writeSubmissions = (projectId, path, method, body) => writeProjectSection(projectId, 'submissionBoard', path, method, body);

  function supervisionForm(values, attachment) {
    const form = new FormData();
    for (const [key, value] of Object.entries(values)) {
      if (value !== undefined) form.set(key, value);
    }
    if (attachment) form.set('attachment', attachment);
    return form;
  }

  function recordForm(payload, files) {
    const entries = Object.entries(files || {});
    if (!entries.length) return payload;
    const form = new FormData();
    form.set('payload', JSON.stringify({ ...payload, removeFiles: entries.filter(([, file]) => file === null).map(([field]) => field) }));
    for (const [field, file] of entries) if (file) form.set(field, file);
    return form;
  }

  async function writeSupervision(path, method, body, cancelledId) {
    try {
      const { record, project } = await request(path, method, body);
      version += 1;
      if (invitations && cancelledId) invitations = invitations.filter(item => item.id !== cancelledId);
      if (invitations && record) {
        const previous = invitations.find(item => item.id === record.id);
        if (!previous || (Date.parse(record.updatedAt) >= Date.parse(previous.updatedAt)
          && record.messages.length >= previous.messages.length
          && (record.decision || !previous.decision)
          && (record.readCount ?? 0) >= (previous.readCount ?? 0))) {
          invitations = [record, ...invitations.filter(item => item.id !== record.id)]
            .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
        }
      }
      if (project && Object.hasOwn(demoTeams, project.project.id)) {
        const current = demoTeams[project.project.id];
        if (project.team.revision >= current.team.revision) {
          demoTeams[project.project.id] = { ...current, team: project.team,
            progress: current.progress && project.progress?.revision > current.progress.revision ? project.progress : current.progress };
        }
      } else if (project) projects = projects.map(item => {
        if (item.project.id !== project.project.id || item.team.revision > project.team.revision) return item;
        const { outline } = project.project;
        return { ...item, team: project.team,
          project: outline ? { ...item.project, outline } : item.project,
          progress: project.progress.revision > item.progress.revision ? project.progress : item.progress };
      });
      notify();
      channel?.postMessage('updated');
      return record || project;
    } catch (error) {
      if (error.status === 409) await refresh();
      throw error;
    }
  }

  function reserveTopicCode(type) {
    if (!reservedCodes.has(type)) {
      const reservation = request('/api/topic-codes', 'POST', { type, formId: topicCodeFormId })
        .then(result => result.code).catch(error => {
          reservedCodes.delete(type);
          throw error;
        });
      reservedCodes.set(type, reservation);
    }
    return reservedCodes.get(type);
  }

  app.proposalDatabase = {
    account, student,
    refresh,
    records: () => records,
    projects: () => projects,
    demoTeam: id => Object.hasOwn(demoTeams, id) ? demoTeams[id] : undefined,
    topics: () => topics,
    error: () => readError,
    listSupervisors: async () => (await request(root + '/lecturers')).lecturers,
    supervisionInvitations: () => invitations ?? [],
    sendSupervision({ teacher, subject, message, attachment, projectId, revision }) {
      return writeSupervision(supervisionRoot, 'POST',
        supervisionForm({ teacherId: teacher.id, subject, message, projectId, revision }, attachment));
    },
    replySupervision: (id, message, attachment) => writeSupervision(invitationPath(id) + '/messages', 'POST', supervisionForm({ message }, attachment)),
    decideSupervision: (id, status, note) => writeSupervision(invitationPath(id) + '/decision', 'PATCH', { status, note }),
    readSupervisionAttachment: (id, fileId) => request(invitationPath(id) + '/attachments/' + encodeURIComponent(fileId), 'GET', undefined, { binary: true }),
    markSupervisionRead: (id, count) => writeSupervision(invitationPath(id) + '/receipt', 'PATCH', { count }),
    cancelSupervision: (id, projectId, revision) => writeSupervision(invitationPath(id) + '/cancellation', 'PATCH', { projectId, revision }, id),
    saveProjectMember: (projectId, key, member, revision) => writeSupervision(memberPath(projectId, key), key ? 'PATCH' : 'POST', { member, revision }),
    removeProjectMember: (projectId, key, revision) => writeSupervision(memberPath(projectId, key), 'DELETE', { revision }),
    reserveTopicCode,
    create: (proposal, files) => write(root, 'POST', recordForm({ ...proposal, topicCodeFormId }, files)),
    update: (id, proposal, revision, files) => write(pathFor(id), 'PATCH', recordForm({ revision, proposal }, files)),
    readProposalFile: (id, fileId) => request(pathFor(id, '/files/' + encodeURIComponent(fileId)), 'GET', undefined, { binary: true }),
    readProjectCover: (id, fileId) => request('/api/projects/' + encodeURIComponent(id) + '/cover/' + encodeURIComponent(fileId), 'GET', undefined, { binary: true }),
    readLecturerTopicFile: (code, fileId) => request(topicPath(code) + '/files/' + encodeURIComponent(fileId), 'GET', undefined, { binary: true }),
    withdraw: (id, revision) => write(pathFor(id, '/withdrawal'), 'PATCH', { revision }),
    decide: (id, decision, reason, revision) => write(pathFor(id, '/decision'), 'PATCH', { decision, reason, revision }),
    saveTopic: (topic, code, revision, files) => writeTopic(code ? topicPath(code) : topicsRoot,
      code ? 'PATCH' : 'POST', recordForm({ topic, revision, topicCodeFormId: code ? undefined : topicCodeFormId }, files)),
    setTopicRegistration: (code, open, deadline, revision) => writeTopic(topicsRoot + '/' + encodeURIComponent(code) + '/registration',
      'PATCH', { open, deadline, revision }),
    registerTopic: (code, enrollment, revision) => writeTopic(topicsRoot + '/' + encodeURIComponent(code) + '/registrations',
      'POST', { enrollment, revision }),
    saveTask: (projectId, taskId, task, revision) => writeProgress(projectId, taskPath(projectId, taskId),
      taskId ? 'PATCH' : 'POST', { task, revision }),
    deleteTasks: (projectId, taskIds, revision) => writeProgress(projectId, taskPath(projectId), 'DELETE', { taskIds, revision }),
    updateProgress: (projectId, update, revision) => writeProgress(projectId, taskPath(projectId, update.taskId) + '/updates',
      'POST', { update, revision }),
    readTaskComments: (projectId, taskId) => request(taskPath(projectId, taskId) + '/comments'),
    addTaskComment: async (projectId, taskId, content, parentId) =>
      (await request(taskPath(projectId, taskId) + '/comments', 'POST', { content, parentId })).comment,
    submissionBoard: projectId => demoTeams[projectId]?.submissionBoard ?? projects.find(item => item.project.id === projectId)?.submissionBoard,
    saveRequirement: (projectId, id, requirement, revision) => writeSubmissions(projectId, requirementPath(projectId, id),
      id ? 'PATCH' : 'POST', { requirement, revision }),
    deleteRequirement: (projectId, id, revision) => writeSubmissions(projectId, requirementPath(projectId, id), 'DELETE', { revision }),
    lockRequirements: (projectId, id, locked, revision) => writeSubmissions(projectId,
      (id ? requirementPath(projectId, id) : boardPath(projectId)) + '/lock', 'PATCH', { locked, revision }),
    submitFiles(projectId, id, files, notes, expectedSubmissionId) {
      const form = new FormData();
      form.set('notes', notes);
      form.set('expectedSubmissionId', expectedSubmissionId ?? '');
      files.forEach(file => form.append('files', file));
      return writeSubmissions(projectId, requirementPath(projectId, id) + '/submissions', 'POST', form);
    },
    saveSubmissionFeedback: (projectId, id, content, revision) => writeSubmissions(projectId,
      submissionPath(projectId, id) + '/feedback', 'POST', { content, revision }),
    readSubmissionFile: (projectId, id, fileId, signal) => request(
      submissionPath(projectId, id) + '/files/' + encodeURIComponent(fileId), 'GET', undefined, { binary: true, signal }),
    demoEvaluation: projectId => Object.hasOwn(demoEvaluations, projectId) ? demoEvaluations[projectId] : undefined,
    evaluation: projectId => projects.find(item => item.project.id === projectId)?.evaluation,
    publishEvaluation(projectId, input, revision) {
      const { attachment, scores, comments, feedback } = input;
      const attachmentAction = attachment === undefined ? 'keep' : attachment ? 'replace' : 'remove';
      const form = new FormData();
      form.set('assessment', JSON.stringify({ revision, scores, comments, feedback, attachmentAction }));
      if (attachment) form.set('attachment', attachment);
      return writeProjectSection(projectId, 'evaluation', evaluationPath(projectId), 'POST', form);
    },
    readEvaluationAttachment: (projectId, id) => request(
      evaluationPath(projectId) + '/attachments/' + encodeURIComponent(id), 'GET', undefined, { binary: true }),
  };

  channel?.addEventListener('message', () => { void refresh(); });
  window.addEventListener('storage', (event) => {
    if (event.key === 'ie104.website.session.v2.database' || event.key === null) void refresh();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void refresh();
  });
  window.addEventListener('pageshow', (event) => { if (event.persisted) void refresh(); });
})();
