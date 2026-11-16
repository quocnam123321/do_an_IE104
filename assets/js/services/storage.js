(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  const registrationKey = 'ie104.demo.registrations.v1';

  function readRegistrations() {
    if (globalThis.location?.protocol === 'file:') throw new Error('Mở website qua localhost để dùng đăng ký thử giữa các trang.');
    try {
      const value = localStorage.getItem(registrationKey);
      if (value === null) return [];
      const parsed = JSON.parse(value);
      if (parsed.version !== 1 || !Array.isArray(parsed.records)) throw new Error();
      const valid = parsed.records.every(record => record && typeof record.id === 'string' && record.topic && typeof record.topic.id === 'string' && typeof record.topic.title === 'string' && typeof record.groupName === 'string' && typeof record.createdAt === 'string' && Number.isFinite(Date.parse(record.createdAt)) && Array.isArray(record.members) && record.members.every(member => typeof member.code === 'string' && typeof member.name === 'string' && ['nhom-truong', 'thanh-vien'].includes(member.role)));
      if (!valid) throw new Error();
      return parsed.records;
    } catch {
      throw new Error('Không đọc được đăng ký đã lưu trên trình duyệt. Dữ liệu cũ chưa bị thay thế.');
    }
  }

  function writeRegistrations(records) {
    try {
      localStorage.setItem(registrationKey, JSON.stringify({ version: 1, records }));
    } catch {
      throw new Error('Chưa lưu được đăng ký. Trình duyệt có thể đang chặn lưu trữ hoặc đã hết dung lượng.');
    }
  }

  const proposalKey = 'ie104.demo.proposals.v1';

  function isProposalRecord(record) {
    const strings = ['id', 'title', 'type', 'typeLabel', 'courseId', 'courseLabel', 'semester', 'academicYear', 'description', 'objectives', 'outcomes', 'supervisorId', 'supervisorName', 'createdAt'];
    if (!record || !strings.every(key => typeof record[key] === 'string' && record[key].trim())) return false;
    if (!Number.isFinite(Date.parse(record.createdAt)) || !['cho-duyet', 'da-rut'].includes(record.status)) return false;
    if (record.revision !== undefined && (!Number.isInteger(record.revision) || record.revision < 0)) return false;
    if (!['updatedAt', 'withdrawnAt'].every(key => record[key] === undefined || (typeof record[key] === 'string' && Number.isFinite(Date.parse(record[key]))))) return false;
    return record.attachment === null || Boolean(record.attachment && typeof record.attachment.name === 'string' && Number.isFinite(record.attachment.size) && record.attachment.size >= 0);
  }

  function readProposals() {
    if (globalThis.location?.protocol === 'file:') throw new Error('Mở website qua localhost để dùng đề xuất thử giữa các trang.');
    try {
      const raw = localStorage.getItem(proposalKey);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || !Array.isArray(parsed.records)) throw new Error();
      if (!parsed.records.every(isProposalRecord)) throw new Error();
      return parsed.records;
    } catch {
      throw new Error('Không đọc được đề xuất đã lưu. Dữ liệu cũ chưa bị thay thế.');
    }
  }

  function writeProposals(records) {
    try {
      localStorage.setItem(proposalKey, JSON.stringify({ version: 1, records }));
    } catch {
      throw new Error('Chưa lưu được đề xuất. Trình duyệt có thể đang chặn lưu trữ hoặc đã hết dung lượng.');
    }
  }

  const teamKey = 'ie104.demo.project-teams.v1';

  function readProjectTeams() {
    if (globalThis.location?.protocol === 'file:') throw new Error('Mở website qua localhost để dùng thao tác nhóm thử giữa các trang.');
    try {
      const raw = localStorage.getItem(teamKey);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || !Array.isArray(parsed.records)) throw new Error();
      const ids = new Set();
      const valid = parsed.records.every(record => {
        if (!record || typeof record.projectId !== 'string' || ids.has(record.projectId) || !Number.isInteger(record.revision) || record.revision < 0) return false;
        ids.add(record.projectId);
        if (!Array.isArray(record.members) || !record.members.every(member => member && typeof member.code === 'string' && typeof member.name === 'string' && ['nhom-truong', 'thanh-vien'].includes(member.role))) return false;
        return Array.isArray(record.invitations) && record.invitations.every(invite => invite && typeof invite.id === 'string' && typeof invite.lecturerId === 'string' && typeof invite.message === 'string' && ['pending', 'cancelled'].includes(invite.status) && Number.isFinite(Date.parse(invite.createdAt)) && (invite.cancelledAt === undefined || Number.isFinite(Date.parse(invite.cancelledAt))));
      });
      if (!valid) throw new Error();
      return parsed.records;
    } catch {
      throw new Error('Không đọc được dữ liệu nhóm đã lưu. Dữ liệu cũ chưa bị thay thế.');
    }
  }

  function writeProjectTeams(records) {
    try {
      localStorage.setItem(teamKey, JSON.stringify({ version: 1, records }));
    } catch {
      throw new Error('Chưa lưu được thay đổi nhóm. Trình duyệt có thể đang chặn lưu trữ hoặc đã hết dung lượng.');
    }
  }

  const progressKey = 'ie104.demo.project-progress.v1';

  function readProjectProgress() {
    if (globalThis.location?.protocol === 'file:') throw new Error('Mở website qua localhost để dùng tiến độ thử giữa các trang.');
    try {
      const raw = localStorage.getItem(progressKey);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || !Array.isArray(parsed.records)) throw new Error();
      const hasStrings = (value, keys) => value && keys.every(key => typeof value[key] === 'string' && value[key].trim());
      const validProgress = value => Number.isInteger(value.percent) && ((value.status === 'chua-thuc-hien' && value.percent === 0) || (value.status === 'dang-thuc-hien' && value.percent > 0 && value.percent < 100) || (value.status === 'da-hoan-thanh' && value.percent === 100));
      const ids = new Set();
      const valid = parsed.records.every(record => {
        if (!hasStrings(record, ['projectId']) || ids.has(record.projectId) || !Number.isInteger(record.revision) || record.revision < 0) return false;
        ids.add(record.projectId);
        if (!Array.isArray(record.tasks) || !record.tasks.every(task => hasStrings(task, ['id', 'title', 'assigneeCode', 'deadline']) && Number.isFinite(Date.parse(task.deadline)) && (validProgress(task) || (task.status === 'dang-thuc-hien' && task.percent === null)))) return false;
        if (new Set(record.tasks.map(task => task.id)).size !== record.tasks.length) return false;
        return Array.isArray(record.history) && record.history.every(item => hasStrings(item, ['id', 'taskId', 'taskTitle', 'content', 'actorCode', 'actorName', 'createdAt']) && Number.isFinite(Date.parse(item.createdAt)) && validProgress(item));
      });
      if (!valid) throw new Error();
      return parsed.records;
    } catch {
      throw new Error('Không đọc được tiến độ đã lưu. Dữ liệu cũ chưa bị thay thế.');
    }
  }

  function writeProjectProgress(records) {
    try {
      localStorage.setItem(progressKey, JSON.stringify({ version: 1, records }));
    } catch {
      throw new Error('Chưa lưu được tiến độ. Trình duyệt có thể đang chặn lưu trữ hoặc đã hết dung lượng.');
    }
  }

  const profileKey = 'ie104.demo.student-profile.v1';

  function readProfile() {
    if (globalThis.location?.protocol === 'file:') throw new Error('Mở website qua localhost để dùng hồ sơ thử giữa các trang.');
    try {
      const raw = localStorage.getItem(profileKey);
      if (raw === null) return null;
      const parsed = JSON.parse(raw);
      const value = parsed.record;
      if (parsed.version !== 1 || !value || !['code', 'name', 'email', 'phone', 'updatedAt'].every(key => typeof value[key] === 'string') || !value.code || !value.name.trim() || !Number.isInteger(value.revision) || value.revision < 0 || !Number.isFinite(Date.parse(value.updatedAt))) throw new Error();
      return value;
    } catch {
      throw new Error('Không đọc được hồ sơ đã lưu. Dữ liệu cũ chưa bị thay thế.');
    }
  }

  function writeProfile(record) {
    try { localStorage.setItem(profileKey, JSON.stringify({ version: 1, record })); }
    catch { throw new Error('Chưa lưu được hồ sơ. Trình duyệt có thể đang chặn lưu trữ hoặc đã hết dung lượng.'); }
  }

  const requestKey = 'ie104.demo.legacy-requests.v1';

  function readRequests() {
    if (globalThis.location?.protocol === 'file:') throw new Error('Mở website qua localhost để cập nhật yêu cầu thử giữa các trang.');
    try {
      const raw = localStorage.getItem(requestKey);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || !Array.isArray(parsed.records)) throw new Error();
      const ids = new Set();
      const valid = parsed.records.every(record => {
        const strings = ['id', 'title', 'groupName', 'message', 'description', 'objectives', 'scope', 'outcomes', 'lecturerId', 'lecturerName', 'feedback', 'createdAt'];
        if (!record || !strings.every(key => typeof record[key] === 'string') || !record.id || !record.title.trim() || ids.has(record.id)) return false;
        ids.add(record.id);
        if (!['dang-ky', 'de-xuat'].includes(record.kind) || !['nhom', 'ca-nhan'].includes(record.mode) || !['cho-duyet', 'da-duyet', 'yeu-cau-chinh-sua', 'da-rut', 'tu-choi'].includes(record.status) || !Number.isInteger(record.revision) || record.revision < 0) return false;
        if (!Number.isFinite(Date.parse(record.createdAt)) || !['updatedAt', 'withdrawnAt', 'resubmittedAt', 'deletedAt'].every(key => record[key] === undefined || Number.isFinite(Date.parse(record[key])))) return false;
        if (!Array.isArray(record.members) || !record.members.every(member => member && typeof member.code === 'string' && typeof member.name === 'string' && ['nhom-truong', 'thanh-vien'].includes(member.role))) return false;
        return Array.isArray(record.history) && record.history.every(item => item && typeof item.action === 'string' && typeof item.from === 'string' && typeof item.to === 'string' && Number.isFinite(Date.parse(item.at)));
      });
      if (!valid) throw new Error();
      return parsed.records;
    } catch { throw new Error('Không đọc được yêu cầu đã lưu. Dữ liệu cũ chưa bị thay thế.'); }
  }

  function writeRequests(records) {
    try { localStorage.setItem(requestKey, JSON.stringify({ version: 1, records })); }
    catch { throw new Error('Chưa lưu được yêu cầu. Trình duyệt có thể đang chặn lưu trữ hoặc đã hết dung lượng.'); }
  }

  const teachingKey = 'ie104.demo.teaching.v1';

  function readTeachingRecords() {
    if (globalThis.location?.protocol === 'file:') throw new Error('Mở website qua localhost để đọc dữ liệu giảng viên đã lưu.');
    try {
      const raw = localStorage.getItem(teachingKey);
      if (raw === null) return [];
      const parsed = JSON.parse(raw);
      if (parsed.version !== 1 || !Array.isArray(parsed.records)) throw new Error();
      const text = value => typeof value === 'string';
      const date = value => text(value) && Number.isFinite(Date.parse(value));
      const evaluation = value => value === null || (value && Number.isFinite(value.score) && value.score >= 0 && value.score <= 10 && text(value.feedback) && text(value.resultLabel) && Array.isArray(value.criteria) && value.criteria.length && value.criteria.every(item => text(item.id) && text(item.title) && Number.isFinite(item.weight) && Number.isFinite(item.score) && text(item.comment)));
      const ids = new Set();
      const valid = parsed.records.every(record => {
        if (!record || !text(record.projectId) || !record.projectId || ids.has(record.projectId) || !Number.isInteger(record.revision) || record.revision < 0 || typeof record.submissionsLocked !== 'boolean') return false;
        ids.add(record.projectId);
        if (!Array.isArray(record.requirements) || !record.requirements.every(item => item && text(item.id) && text(item.title) && text(item.content) && date(item.deadline) && typeof item.locked === 'boolean' && (item.deletedAt === undefined || date(item.deletedAt)))) return false;
        if (new Set(record.requirements.map(item => item.id)).size !== record.requirements.length) return false;
        if (!Array.isArray(record.submissions) || !record.submissions.every(item => item && text(item.id) && text(item.title) && text(item.fileName) && date(item.submittedAt) && text(item.feedback) && Array.isArray(item.feedbackHistory))) return false;
        if (new Set(record.submissions.map(item => item.id)).size !== record.submissions.length) return false;
        if (!Array.isArray(record.progressReviews) || !record.progressReviews.every(item => item && text(item.id) && text(item.content) && text(item.authorId) && text(item.authorName) && date(item.createdAt))) return false;
        return evaluation(record.draft) && evaluation(record.publishedEvaluation) && Array.isArray(record.audit) && record.audit.every(item => item && text(item.action) && text(item.actorId) && date(item.at));
      });
      if (!valid) throw new Error();
      return parsed.records;
    } catch { throw new Error('Không đọc được dữ liệu giảng viên đã lưu. Dữ liệu cũ chưa bị thay thế.'); }
  }

  function writeTeachingRecords(records) {
    try { localStorage.setItem(teachingKey, JSON.stringify({ version: 1, records })); }
    catch { throw new Error('Chưa lưu được dữ liệu giảng viên. Trình duyệt có thể đang chặn lưu trữ hoặc đã hết dung lượng.'); }
  }

  app.storage = { registrationKey, readRegistrations, writeRegistrations, proposalKey, readProposals, writeProposals, teamKey, readProjectTeams, writeProjectTeams, progressKey, readProjectProgress, writeProjectProgress, profileKey, readProfile, writeProfile, requestKey, readRequests, writeRequests, teachingKey, readTeachingRecords, writeTeachingRecords };
})();
