(() => {
  const app = globalThis.IE104;
  if (!app?.services?.projectTeams || !app.storage?.readTeachingRecords) return;
  const databaseName = 'ie104.student.submission-uploads';
  let channel;
  try {
    if (typeof BroadcastChannel === 'function') channel = new BroadcastChannel(databaseName);
  } catch {
    // The boards also recheck uploads when the tab becomes active.
  }

  function forStudent(projectId, now = new Date()) {
    const team = app.services.projectTeams.getState(projectId);
    const studentCode = app.data.currentStudent?.code;
    const isMember = Boolean(studentCode && team.members.some(member => member.code === studentCode));
    if (!isMember && !team.project.isSharedProposalSample) {
      throw new Error('Sinh viên hiện tại không thuộc nhóm thực hiện đề tài này.');
    }

    const saved = app.storage.readTeachingRecords().find(item => item.projectId === projectId);
    const record = app.data.studentWebSubmissions?.forProject(projectId, saved) ?? saved ??
      app.data.teachingSeeds?.find(item => item.projectId === projectId);
    const completed = team.project.status === 'hoan-thanh';
    const canUpload = isMember && team.project.status === 'dang-thuc-hien';
    const submissionsLocked = Boolean(record?.submissionsLocked);
    const activeRequirements = (record?.requirements || []).filter(item => !item.deletedAt);
    const demoReference = item => app.data.studentUITCatalog?.submissionReferenceTime(item);
    const deadlines = new Map(activeRequirements.map(item => [item.id, Date.parse(item.deadline)]));
    const latest = new Map();
    const submissions = (record?.submissions || []).map(submission => {
      const { requirementId } = submission;
      const deadline = deadlines.get(requirementId);
      if (deadline === undefined) return { ...submission, late: null };

      const submittedAt = Date.parse(submission.submittedAt);
      const details = { ...submission, late: submittedAt > deadline };
      const previous = latest.get(requirementId);
      if (!previous || submittedAt > Date.parse(previous.submittedAt)) latest.set(requirementId, details);
      return details;
    });
    const requirements = activeRequirements.map(item => ({
      id: item.id,
      title: item.title,
      content: item.content,
      deadline: item.deadline,
      submitted: latest.has(item.id) || ['submitted', 'reviewed'].includes(item.sourceStage),
      late: latest.get(item.id)?.late ?? null,
      latestSubmission: latest.get(item.id) ?? null,
      locked: submissionsLocked || item.locked,
      overdue: !completed && Date.parse(item.deadline) < (demoReference(item) ?? now.getTime()),
    }));
    requirements.sort((first, second) => Date.parse(first.deadline) - Date.parse(second.deadline));
    return { hasRecord: Boolean(record), completed, canUpload, submissionsLocked, requirements, submissions,
      hasDemoDeadlines: activeRequirements.some(item => demoReference(item) !== undefined) };
  }

  function localUploads(mode, request) {
    return new Promise((resolve, reject) => {
      const opening = indexedDB.open(databaseName, 1);
      opening.onupgradeneeded = () => {
        const store = opening.result.createObjectStore('uploads', { keyPath: ['projectId', 'requirementId'] });
        store.createIndex('projectId', 'projectId');
      };
      opening.onerror = () => reject(opening.error);
      let blocked = false;
      opening.onblocked = () => {
        blocked = true;
        reject(new Error('Kho lưu tệp đang được sử dụng ở tab khác.'));
      };
      opening.onsuccess = () => {
        const database = opening.result;
        if (blocked) { database.close(); return; }
        try {
          const transaction = database.transaction('uploads', mode);
          let reason;
          const result = request(transaction.objectStore('uploads'), error => {
            reason = error;
            transaction.abort();
          });
          transaction.oncomplete = () => { database.close(); resolve(result.result); };
          transaction.onabort = () => { database.close(); reject(reason ?? transaction.error); };
        } catch (error) {
          database.close();
          reject(error);
        }
      };
    });
  }

  function readUploads(projectId, role = 'student') {
    if (role === 'lecturer') app.services.teaching.getState(projectId);
    else forStudent(projectId);
    return localUploads('readonly', store => store.index('projectId').getAll(projectId));
  }

  function onUploadsChanged(callback) {
    channel?.addEventListener('message', event => callback(event.data?.projectId));
  }

  function legacyCopy(upload, savedById) {
    const copy = savedById.get(`SV-UP-${upload.requirementId}`);
    return copy?.submittedAt === upload.submittedAt ? copy : null;
  }

  function withLegacyFeedback(upload, copy) {
    if (!copy || upload.feedbackAt || !copy.feedback) return upload;
    return { ...upload, feedback: copy.feedback, feedbackAt: copy.feedbackAt,
      feedbackBy: copy.feedbackBy, feedbackHistory: copy.feedbackHistory };
  }

  function visibleSubmissions(projectId, saved, uploads) {
    const savedById = new Map(saved.map(item => [item.id, item]));
    const replaced = new Set(uploads.map(item => item.requirementId));
    const duplicates = new Set();
    const local = uploads.map(upload => {
      const copy = legacyCopy(upload, savedById);
      if (copy) duplicates.add(copy.id);
      return withLegacyFeedback(upload, copy);
    });
    return [...local, ...saved.filter(item => !duplicates.has(item.id) &&
      (!replaced.has(item.requirementId) || !app.data.studentWebSubmissions?.attachment(projectId, item)))];
  }

  function uploadRequirement(projectId, requirementId) {
    const state = forStudent(projectId);
    const saved = state.requirements.find(item => item.id === requirementId);
    const sample = !state.hasRecord && app.data.studentProjectOverviews?.[projectId];
    if (!state.canUpload || state.submissionsLocked || saved?.locked) {
      throw new Error('Đề tài hoặc yêu cầu đang khóa nhận bài.');
    }
    if (!saved && !sample) throw new Error('Không còn tìm thấy yêu cầu bài nộp này.');
    return saved;
  }

  async function saveUpload(projectId, requirement, files, note, expectedSavedAt) {
    const saved = uploadRequirement(projectId, requirement.id);
    if (!files.length || files.some(file => !(file instanceof File) || !file.size)) {
      throw new Error('Hãy chọn ít nhất một tệp có nội dung.');
    }

    const record = {
      projectId,
      requirementId: requirement.id,
      title: saved?.title ?? requirement.title,
      submittedAt: new Date(Math.max(Date.now(), (Date.parse(expectedSavedAt) + 1) || 0)).toISOString(),
      notes: note.trim(),
      files,
    };
    const conflict = new Error('Bài nộp đã được lưu ở một tab khác. Hãy tải lại trang trước khi cập nhật.');
    let requirementError;
    try {
      await localUploads('readwrite', (store, abort) => {
        const current = store.get([projectId, requirement.id]);
        current.onsuccess = () => {
          try {
            record.title = uploadRequirement(projectId, requirement.id)?.title ?? requirement.title;
          } catch (failure) {
            requirementError = failure;
            abort(failure);
            return;
          }
          if (expectedSavedAt !== undefined && (current.result?.submittedAt ?? null) !== expectedSavedAt) {
            abort(conflict);
            return;
          }
          store.put(record);
        };
        return current;
      });
    } catch (failure) {
      if (failure === conflict || failure === requirementError) throw failure;
      throw new Error('Chưa lưu được bài nộp. Hãy kiểm tra dung lượng trình duyệt và thử lại.');
    }
    channel?.postMessage({ projectId });
    return record;
  }

  function deleteUnsubmittedRequirement(projectId, requirementId, revision) {
    const teaching = app.services.teaching;
    teaching.getState(projectId);
    return localUploads('readwrite', (store, abort) => {
      const request = store.get([projectId, requirementId]);
      request.onsuccess = () => {
        if (request.result) {
          abort(new Error('Yêu cầu đã có bài nộp nên không thể xóa.'));
          return;
        }
        try {
          teaching.deleteRequirement(projectId, requirementId, revision);
        } catch (failure) {
          abort(failure);
        }
      };
      return request;
    });
  }

  async function reviewUpload(projectId, upload, feedback) {
    const teaching = app.services.teaching;
    const state = teaching.getState(projectId);
    teaching.assertFeedbackAllowed(state.project);
    if (!state.requirements.some(item => item.id === upload.requirementId && !item.deletedAt)) {
      throw new Error('Không còn tìm thấy yêu cầu của bài nộp này.');
    }
    const lecturer = app.data.currentLecturer;
    const text = String(feedback || '').trim();
    if (!text || text.length > 2000) throw new Error('Nhập phản hồi từ 1 đến 2000 ký tự.');
    const savedById = new Map(state.submissions.map(item => [item.id, item]));

    await localUploads('readwrite', (store, abort) => {
      const request = store.get([projectId, upload.requirementId]);
      request.onsuccess = () => {
        try {
          teaching.assertFeedbackAllowed(teaching.getState(projectId).project);
        } catch (failure) {
          abort(failure);
          return;
        }
        const raw = request.result;
        const current = raw && withLegacyFeedback(raw, legacyCopy(raw, savedById));
        if (!current || current.submittedAt !== upload.submittedAt ||
            (current.feedbackAt ?? null) !== (upload.feedbackAt ?? null)) {
          abort(new Error('Bài nộp hoặc phản hồi đã thay đổi. Hãy mở lại bài nộp.'));
          return;
        }
        const history = current.feedbackHistory ?? [];
        if (current.feedback) history.push({ content: current.feedback, at: current.feedbackAt, authorId: current.feedbackBy });
        store.put({ ...current, feedback: text, feedbackBy: lecturer.id, feedbackHistory: history,
          feedbackAt: new Date(Math.max(Date.now(), (Date.parse(current.feedbackAt) + 1) || 0)).toISOString() });
      };
      return request;
    });
    channel?.postMessage({ projectId });
  }

  app.services.studentSubmissions = {
    forStudent, readUploads, saveUpload, onUploadsChanged, reviewUpload, visibleSubmissions, deleteUnsubmittedRequirement,
  };
})();
