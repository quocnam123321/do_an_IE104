(() => {
  const fileLimits = { maxFiles: 10, maxBytes: 20 * 1024 * 1024 };
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = fileLimits;
    return;
  }
  const app = globalThis.IE104;
  if (!app?.services?.projectTeams || !app.storage?.readTeachingRecords) return;
  const databaseName = 'ie104.student.submission-uploads';
  const inDatabase = project => project.isDatabaseProject || project.isDatabaseProposal;
  const usesDatabase = projectId => Boolean(app.proposalDatabase?.demoTeam?.(projectId)?.submissionBoard ||
    app.proposalDatabase?.projects?.().some(item => item.project.id === projectId));
  let channel;
  try {
    if (typeof BroadcastChannel === 'function') channel = new BroadcastChannel(databaseName);
  } catch {
    // The boards also recheck uploads when the tab becomes active.
  }

  function forStudent(projectId, now = new Date()) {
    const team = app.services.projectTeams.getState(projectId);
    const studentCode = app.data.currentStudent?.code;
    const demo = app.proposalDatabase?.demoTeam?.(projectId);
    const isDatabaseProject = inDatabase(team.project) || Boolean(demo?.submissionBoard);
    const isMember = demo?.submissionBoard ? Boolean(team.viewerMemberKey) : isDatabaseProject
      ? Boolean(app.services.approvedProjects.forStudent(projectId))
      : Boolean(studentCode && team.members.some(member => member.code === studentCode));
    if (!isMember && !team.project.isSharedProposalSample) {
      throw new Error('Sinh viên hiện tại không thuộc nhóm thực hiện đề tài này.');
    }

    let record;
    if (isDatabaseProject) {
      record = app.proposalDatabase.submissionBoard(projectId);
      if (!record) throw new Error('Máy chủ hiện chưa hỗ trợ bài nộp dùng chung. Hãy tải lại bản Express mới.');
    } else {
      const saved = app.storage.readTeachingRecords().find(item => item.projectId === projectId);
      record = app.data.studentWebSubmissions?.forProject(projectId, saved) ?? saved ??
        app.data.teachingSeeds?.find(item => item.projectId === projectId);
    }
    const status = record?.projectStatus || team.project.status;
    const completed = status === 'hoan-thanh';
    const canUpload = isMember && status === 'dang-thuc-hien';
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
    return { hasRecord: Boolean(record), isDatabaseProject, completed, canUpload, submissionsLocked, requirements, submissions };
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
    if (usesDatabase(projectId)) return Promise.resolve([]);
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
    if (usesDatabase(projectId)) {
      if (files.length > fileLimits.maxFiles) throw new Error('Mỗi lần nộp tối đa 10 tệp.');
      if (files.reduce((total, file) => total + file.size, 0) > fileLimits.maxBytes) {
        throw new Error('Tổng dung lượng tệp của một lần nộp tối đa 20 MiB.');
      }
      return app.proposalDatabase.submitFiles(projectId, requirement.id, files, note.trim(), expectedSavedAt);
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
    if (usesDatabase(projectId)) return teaching.deleteRequirement(projectId, requirementId, revision);
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
    if (upload.isDatabaseSubmission) {
      return app.proposalDatabase.saveSubmissionFeedback(projectId, upload.id, feedback, upload.feedbackRevision);
    }
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

  async function readFiles(projectId, submission, fileIndex, signal) {
    const files = fileIndex === undefined ? submission.files : [submission.files?.[fileIndex]];
    if (!files?.length || files.some(file => !file)) throw new Error('Không tìm thấy tệp bài nộp.');
    if (!submission.isDatabaseSubmission) return files;
    return Promise.all(files.map(async file => {
      const blob = await app.proposalDatabase.readSubmissionFile(projectId, submission.id, file.id, signal);
      return new File([blob], file.name, { type: blob.type });
    }));
  }

  app.services.studentSubmissions = {
    forStudent, readUploads, saveUpload, onUploadsChanged, reviewUpload, visibleSubmissions, deleteUnsubmittedRequirement,
    readFiles, usesDatabase, fileLimits,
  };
})();
