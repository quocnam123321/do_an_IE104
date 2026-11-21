(() => {
  const app = globalThis.IE104;
  if (!app?.services?.projectTeams || !app.storage?.readTeachingRecords) return;

  function forStudent(projectId, now = new Date()) {
    const team = app.services.projectTeams.getState(projectId);
    const studentCode = app.data.currentStudent?.code;
    if (!studentCode || !team.members.some(member => member.code === studentCode)) {
      throw new Error('Sinh viên hiện tại không thuộc nhóm thực hiện đề tài này.');
    }

    const record = app.storage.readTeachingRecords().find(item => item.projectId === projectId);
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
    try {
      await localUploads('readwrite', (store, abort) => {
        if (expectedSavedAt === undefined) return store.put(record);
        const current = store.get([projectId, requirement.id]);
        current.onsuccess = () => {
          if ((current.result?.submittedAt ?? null) === expectedSavedAt) store.put(record);
          else abort(conflict);
        };
        return current;
      });
    } catch (failure) {
      if (failure === conflict) throw conflict;
      throw new Error('Chưa lưu được bài nộp. Hãy kiểm tra dung lượng trình duyệt và thử lại.');
    }
    return record;
  }

  app.services.studentSubmissions = { forStudent, readUploads, saveUpload };
})();
