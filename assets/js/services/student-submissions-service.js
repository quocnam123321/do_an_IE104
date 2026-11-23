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
    const submissions = app.storage.readTeachingRecords();
    const initial = submissions.find(item => item.projectId === projectId) || app.data.teachingSeeds?.find(item => item.projectId === projectId);
    if (initial) {
      let teaching = JSON.parse(JSON.stringify(initial));
      const submissionId = `SV-UP-${requirement.id}`;
      let previous = teaching.submissions.find(item => item.id === submissionId);
      const fileName = files.length === 1 ? files[0].name : `bai-nop-${requirement.id}.zip`;
      const blob = files.length === 1 ? files[0] : await app.ui.createSubmissionZip(files);
      await new Promise((resolve, reject) => {
        const opening = indexedDB.open('ie104.demo.submission-files', 1);
        opening.onupgradeneeded = () => opening.result.createObjectStore('files', { keyPath: ['projectId', 'submissionId'] });
        opening.onerror = () => reject(new Error('Chưa lưu được tệp để giảng viên tải xuống.'));
        opening.onblocked = () => reject(new Error('Kho tệp đang được sử dụng ở tab khác.'));
        opening.onsuccess = () => {
          const db = opening.result;
          const transaction = db.transaction('files', 'readwrite');
          transaction.objectStore('files').put({ projectId, submissionId, fileName, submittedAt: record.submittedAt, blob });
          transaction.oncomplete = () => { db.close(); resolve(); };
          transaction.onerror = () => { db.close(); reject(new Error('Chưa lưu được nội dung tệp.')); };
        };
      });
      const latestRecords = app.storage.readTeachingRecords();
      const latest = latestRecords.find(item => item.projectId === projectId);
      if (latest) teaching = JSON.parse(JSON.stringify(latest));
      const currentState = forStudent(projectId);
      const currentRequirement = currentState.requirements.find(item => item.id === requirement.id);
      if (!currentState.canUpload || currentState.submissionsLocked || !currentRequirement || currentRequirement.locked) throw new Error('Yêu cầu đã thay đổi hoặc bị khóa. Hãy tải lại bài nộp.');
      previous = teaching.submissions.find(item => item.id === submissionId);
      teaching.submissions = teaching.submissions.filter(item => item.id !== submissionId);
      teaching.submissions.push({ id: submissionId, requirementId: requirement.id, title: record.title,
        fileName, submittedAt: record.submittedAt, studentNote: record.notes, source: 'student-upload',
        feedback: '', feedbackHistory: [...(previous?.feedbackHistory || []), ...(previous?.feedback ? [{ content: previous.feedback, at: previous.feedbackAt, authorId: previous.feedbackBy }] : [])] });
      teaching.revision += 1;
      teaching.audit.push({ action: 'student-upload', targetId: submissionId, actorId: app.data.currentStudent.code, at: record.submittedAt });
      app.storage.writeTeachingRecords([...latestRecords.filter(item => item.projectId !== projectId), teaching]);
    }
    return record;
  }

  app.services.studentSubmissions = { forStudent, readUploads, saveUpload };
})();
