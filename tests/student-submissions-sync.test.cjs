const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createTab(storage, globals = {}) {
  const tab = vm.createContext({
    ...globals,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  const modules = [
    'data/mock-data.js', 'data/proposal-actors.js', 'data/student-projects.js', 'data/student-progress.js',
    'data/student-deadlines.js', 'services/storage.js', 'shared/validation.js', 'services/registration-service.js',
    'services/approved-project-service.js', 'services/project-team-service.js', 'services/project-progress-service.js',
    'data/student-evaluations.js', 'data/teaching-data.js', 'services/evaluation-service.js',
    'services/teaching-service.js', 'services/student-submissions-service.js', 'services/deadline-service.js',
  ];
  for (const module of modules) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', module), 'utf8'), tab, { filename: module });
  }
  return tab.IE104;
}

test('publishes the current assessment directly and exposes the result to the student', () => {
  const storage = new Map();
  const { teaching } = createTab(storage).services;
  const { evaluations } = createTab(storage).services;
  const projectId = 'DA005';
  const { revision } = teaching.getState(projectId);
  const assessment = { scores: { TC001: '8', TC002: '9', TC003: '7' }, feedback: 'Nhóm đã hoàn thành báo cáo.' };

  assert.equal(evaluations.getResult(projectId).status, 'unpublished');
  assert.throws(() => teaching.publish(projectId, { ...assessment, scores: { ...assessment.scores, TC001: '11' } }, revision));
  assert.equal(evaluations.getResult(projectId).status, 'unpublished');
  const published = teaching.publish(projectId, assessment, revision);
  assert.equal(published.revision, revision + 1);
  assert.equal(published.draft, null);
  assert.throws(() => teaching.publish(projectId, assessment, revision));
  const result = evaluations.getResult(projectId);
  assert.equal(result.status, 'published');
  assert.equal(result.score, 8.2);
  assert.equal(result.feedback, assessment.feedback);
});

test('yêu cầu lưu phía giảng viên cập nhật ở bài nộp và lịch theo giờ Việt Nam', async () => {
  const storage = new Map();
  const teacher = createTab(storage);
  const student = createTab(storage);
  const registration = await student.services.registrations.submit('DT001', {
    members: [{ ...student.data.currentStudent, role: 'nhom-truong' }],
  });
  const projectId = student.services.approvedProjects.projectIdFor(registration.id);
  const { teaching } = teacher.services;
  const { studentSubmissions, deadlines } = student.services;
  const calendar = (month = '2099-01') => deadlines.getState({ projectId, month }).events
    .filter(event => event.kind === 'submission');

  let state = teaching.saveRequirement(projectId, null, {
    title: 'Báo cáo tiến độ', content: 'Nộp bản thử', deadline: '2099-01-01T00:15',
  }, 0);
  const id = state.requirements[0].id;

  assert.equal(studentSubmissions.forStudent(projectId).requirements[0].title, 'Báo cáo tiến độ');
  assert.equal(calendar()[0].date, '2099-01-01');
  assert.equal(calendar()[0].detailUrl.split('#')[1], 'bai-nop');
  assert.equal(calendar('2098-12').length, 0);

  state = teaching.saveRequirement(projectId, id, {
    title: 'Báo cáo đã chỉnh', content: 'Nộp bản mới', deadline: '2099-02-02T20:30',
  }, state.revision);
  state = teaching.setLocked(projectId, id, true, state.revision);
  assert.equal(studentSubmissions.forStudent(projectId).requirements[0].locked, true);
  assert.equal(calendar().length, 0);
  assert.equal(calendar('2099-02')[0].title, 'Báo cáo đã chỉnh');
  assert.equal(calendar('2099-02')[0].id, id);
  assert.equal(calendar('2099-02')[0].locked, true);

  teacher.services.studentSubmissions.withUploadCheck = async (_, __, remove) => remove(false);
  await teaching.deleteRequirement(projectId, id, state.revision);
  assert.equal(studentSubmissions.forStudent(projectId).requirements.length, 0);
  assert.equal(calendar('2099-02').length, 0);

  student.data.currentStudent = { code: '99999999', name: 'Sinh viên khác' };
  assert.throws(() => studentSubmissions.forStudent(projectId), /không thuộc nhóm/);
});

test('nhãn thời hạn dùng giờ gửi của từng bài và lần gửi gần nhất cho yêu cầu', () => {
  const student = createTab(new Map());
  const projectId = 'DA005';
  const deadline = '2026-11-20T17:00:00+07:00';
  const requirement = { id: 'req', title: 'Báo cáo', content: '', deadline, locked: false };
  const file = { title: 'Báo cáo', fileName: 'Bao_cao.pdf', feedback: '', feedbackHistory: [] };
  student.storage.writeTeachingRecords([{
    projectId,
    revision: 0,
    submissionsLocked: false,
    requirements: [requirement, { ...requirement, id: 'pending' }, { ...requirement, id: 'legacy', sourceStage: 'submitted' }],
    submissions: [
      { ...file, id: 'late', requirementId: 'req', fileName: 'Bao_cao_cap_nhat.pdf', submittedAt: '2026-11-20T10:00:01Z', feedback: 'Đã xem' },
      { ...file, id: 'exact', requirementId: 'req', submittedAt: '2026-11-20T10:00:00Z' },
      { ...file, id: 'early', requirementId: 'req', submittedAt: '2026-11-20T09:59:59Z' },
      { ...file, id: 'unlinked', requirementId: null, submittedAt: '2026-11-21T10:00:00Z' },
    ],
    progressReviews: [],
    draft: null,
    publishedEvaluation: null,
    audit: [],
  }]);

  const state = student.services.studentSubmissions.forStudent(projectId, new Date('2026-11-22T00:00:00Z'));
  assert.deepEqual(Array.from(state.submissions, item => item.late), [true, false, false, null]);
  const requirements = new Map(Array.from(state.requirements, item => [item.id, item]));
  assert.equal(requirements.get('req').late, true);
  assert.equal(requirements.get('req').submitted, true);
  assert.equal(requirements.get('req').latestSubmission.fileName, 'Bao_cao_cap_nhat.pdf');
  assert.equal(requirements.get('req').latestSubmission.submittedAt, '2026-11-20T10:00:01Z');
  assert.equal(requirements.get('pending').overdue, true);
  assert.equal(requirements.get('pending').submitted, false);
  assert.equal(requirements.get('pending').late, null);
  assert.equal(requirements.get('legacy').submitted, true);
  assert.equal(requirements.get('legacy').late, null);
  assert.equal(requirements.get('legacy').latestSubmission, null);
});


test('shares a newly uploaded file and the lecturer feedback, and keeps the previous version on failed storage', async () => {
  const storage = new Map();
  const uploads = new Map();
  const staged = new Map();
  const key = parts => parts.join('/');
  const indexedDB = {
    open() {
      const opening = {
        result: {
          close() {},
          transaction() {
            let aborted = false;
            let pending;
            const transaction = {
              abort() { aborted = true; this.onabort(); },
              objectStore() {
                return {
                  get(parts) {
                    const request = { result: uploads.get(key(parts)) };
                    queueMicrotask(() => {
                      request.onsuccess();
                      queueMicrotask(() => {
                        if (aborted) return;
                        if (pending) uploads.set(key([pending.projectId, pending.requirementId]), pending);
                        transaction.oncomplete();
                      });
                    });
                    return request;
                  },
                  put(record) {
                    const request = {};
                    pending = record;
                    queueMicrotask(() => request.onsuccess?.());
                    return request;
                  },
                };
              },
            };
            return transaction;
          },
        },
      };
      queueMicrotask(() => opening.onsuccess());
      return opening;
    },
  };
  const student = createTab(storage, { indexedDB, File, crypto: require('node:crypto').webcrypto });
  const teacher = createTab(storage, { indexedDB });
  student.services.submissionFiles = {
    stage: async record => staged.set(record.submissionId, record),
    discard: async (_, id) => staged.delete(id),
  };
  const projectId = 'DA005';
  const teaching = teacher.services.teaching;
  const state = teaching.saveRequirement(projectId, null, {
    title: 'Báo cáo thử', content: 'Nộp PDF', deadline: '2099-01-01T10:00',
  }, teaching.getState(projectId).revision);
  const requirement = state.requirements.at(-1);
  const file = new File(['bao cao'], 'report.pdf');
  const first = await student.services.studentSubmissions.saveUpload(projectId, requirement, [file], '', null);
  const current = teaching.getState(projectId);
  const submission = current.submissions.find(item => item.id === `SV-UP-${requirement.id}`);
  assert.equal(submission.submittedAt, first.submittedAt);
  assert.equal(await staged.get(submission.fileKey).blob.text(), 'bao cao');
  teaching.saveFeedback(projectId, submission.id, 'Đã xem', current.revision);
  assert.equal(student.services.studentSubmissions.forStudent(projectId).submissions.find(item => item.id === submission.id).feedback, 'Đã xem');

  student.storage.writeTeachingRecords = () => { throw new Error('quota'); };
  await assert.rejects(student.services.studentSubmissions.saveUpload(projectId, requirement, [new File(['ban moi'], 'new.pdf')], '', first.submittedAt), /Chưa đồng bộ/);
  assert.equal(staged.size, 1);
  assert.equal(uploads.get(key([projectId, requirement.id])).submittedAt, first.submittedAt);
  assert.equal(teaching.getSubmission(projectId, submission.id).fileKey, submission.fileKey);
  const savedState = teaching.getState(projectId);
  const records = teacher.storage.readTeachingRecords();
  const legacy = records.find(item => item.projectId === projectId);
  assert.ok(legacy.submissions.some(item => item.id === submission.id));
  legacy.submissions = legacy.submissions.filter(item => item.id !== submission.id);
  teacher.storage.writeTeachingRecords(records);
  await assert.rejects(teaching.deleteRequirement(projectId, requirement.id, savedState.revision), /đã có bài nộp/);
  assert.equal(teaching.getState(projectId).requirements.find(item => item.id === requirement.id).deletedAt, undefined);
  const locked = teaching.setLocked(projectId, requirement.id, true, savedState.revision);
  assert.equal(locked.requirements.find(item => item.id === requirement.id).locked, true);
  assert.equal(uploads.get(key([projectId, requirement.id])).files[0].name, 'report.pdf');
});
