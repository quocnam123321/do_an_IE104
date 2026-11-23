(() => {
  const app = globalThis.IE104;
  if (!app?.services?.projectTeams || !app.storage?.readTeachingRecords) return;

  function forStudent(projectId, now = new Date()) {
    const team = app.services.projectTeams.getState(projectId);
    const studentCode = app.data.currentStudent?.code;
    if (!studentCode || !team.members.some(member => member.code === studentCode)) {
      throw new Error('Sinh viên hiện tại không thuộc nhóm thực hiện đề tài này.');
    }

    const record = app.storage.readTeachingRecords().find(item => item.projectId === projectId) || app.data.teachingSeeds?.find(item => item.projectId === projectId);
    const completed = team.project.status === 'hoan-thanh';
    const canUpload = team.project.status === 'dang-thuc-hien';
    const submissionsLocked = Boolean(record?.submissionsLocked);
    const activeRequirements = (record?.requirements || []).filter(item => !item.deletedAt);
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
      overdue: !completed && Date.parse(item.deadline) < now.getTime(),
    }));
    requirements.sort((first, second) => Date.parse(first.deadline) - Date.parse(second.deadline));
    return { hasRecord: Boolean(record), completed, canUpload, submissionsLocked, requirements, submissions };
  }

  function localUploads(mode, request) {
    return new Promise((resolve, reject) => {
      const opening = indexedDB.open('ie104.student.submission-uploads', 1);
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

  function readUploads(projectId) {
    return localUploads('readonly', store => store.index('projectId').getAll(projectId));
  }

  async function saveUpload(projectId, requirement, files, note, expectedSavedAt) {
    const state = forStudent(projectId);
    const saved = state.requirements.find(item => item.id === requirement.id);
    const sample = !state.hasRecord && app.data.studentProjectOverviews?.[projectId];
    if (!state.canUpload || state.submissionsLocked || saved?.locked) {
      throw new Error('Đề tài hoặc yêu cầu đang khóa nhận bài.');
    }
    if (!saved && !sample) throw new Error('Không còn tìm thấy yêu cầu bài nộp này.');
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
    const submissionId = `SV-UP-${requirement.id}`;
    const fileName = files.length === 1 ? files[0].name : `bai-nop-${requirement.id}.zip`;
    let fileKey;
    if (saved) {
      const blob = files.length === 1 ? files[0] : await app.ui.createSubmissionZip(files);
      fileKey = `${submissionId}:${globalThis.crypto.randomUUID()}`;
      await app.services.submissionFiles.stage({ projectId, submissionId: fileKey, fileName, submittedAt: record.submittedAt, blob });
    }
    let previousFileKey;
    try {
      await localUploads('readwrite', (store, abort) => {
        const current = store.get([projectId, requirement.id]);
        current.onsuccess = () => {
          if (expectedSavedAt !== undefined && (current.result?.submittedAt ?? null) !== expectedSavedAt) {
            abort(conflict);
            return;
          }
          const write = store.put(record);
          if (!fileKey) return;
          write.onsuccess = () => {
            try {
              const currentState = forStudent(projectId);
              const active = currentState.requirements.find(item => item.id === requirement.id);
              if (!currentState.canUpload || !active || active.locked) {
                throw new Error('Yêu cầu đã thay đổi hoặc bị khóa. Hãy tải lại bài nộp.');
              }
              const records = app.storage.readTeachingRecords();
              const initial = records.find(item => item.projectId === projectId) ||
                app.data.teachingSeeds?.find(item => item.projectId === projectId);
              const teaching = JSON.parse(JSON.stringify(initial));
              const previous = teaching.submissions.find(item => item.id === submissionId);
              previousFileKey = previous?.fileKey;
              const feedbackHistory = [...(previous?.feedbackHistory || [])];
              if (previous?.feedback) feedbackHistory.push({ content: previous.feedback, at: previous.feedbackAt, authorId: previous.feedbackBy });
              teaching.submissions = teaching.submissions.filter(item => item.id !== submissionId);
              teaching.submissions.push({ id: submissionId, requirementId: requirement.id, title: record.title,
                fileName, fileKey, submittedAt: record.submittedAt, studentNote: record.notes, source: 'student-upload',
                feedback: '', feedbackHistory });
              teaching.revision += 1;
              teaching.audit.push({ action: 'student-upload', targetId: submissionId, actorId: app.data.currentStudent.code, at: record.submittedAt });
              app.storage.writeTeachingRecords([...records.filter(item => item.projectId !== projectId), teaching]);
            } catch (failure) { abort(failure); }
          };
        };
        return current;
      });
    } catch (failure) {
      if (fileKey) await app.services.submissionFiles.discard(projectId, fileKey).catch(() => {});
      if (failure === conflict) throw conflict;
      throw new Error('Chưa đồng bộ được bài nộp. Hãy kiểm tra yêu cầu, bộ nhớ trình duyệt và thử lại.', { cause: failure });
    }
    if (previousFileKey) await app.services.submissionFiles.discard(projectId, previousFileKey).catch(() => {});
    return record;
  }

  async function withUploadCheck(projectId, requirementId, operation) {
    let result;
    await localUploads('readwrite', (store, abort) => {
      const request = store.get([projectId, requirementId]);
      request.onsuccess = () => {
        try { result = operation(Boolean(request.result)); }
        catch (failure) { abort(failure); }
      };
      return request;
    });
    return result;
  }

  app.services.studentSubmissions = { forStudent, readUploads, saveUpload, withUploadCheck };
})();
