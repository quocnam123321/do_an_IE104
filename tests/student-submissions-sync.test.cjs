const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createTab(storage, globals = {}, withUITCatalog = false) {
  const tab = vm.createContext({
    ...globals,
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  const modules = [
    'data/mock-data.js', 'data/proposal-actors.js', 'data/student-projects.js', 'data/student-web-submissions.js', 'data/student-progress.js',
    'data/student-deadlines.js', 'services/storage.js', 'shared/validation.js', 'services/registration-service.js',
    'services/approved-project-service.js', 'services/project-team-service.js', 'services/project-progress-service.js',
    'data/student-evaluations.js', 'data/teaching-data.js', 'services/evaluation-service.js',
    'services/teaching-service.js', 'services/student-submissions-service.js', 'services/deadline-service.js',
  ];
  if (withUITCatalog) {
    tab.window = tab;
    modules.push('uit-lecturer-catalog.js', 'data/lecturer-topics.js', 'data/lecturer-merge-catalog.js', 'data/student-uit-catalog.js');
  }
  for (const module of modules) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', module), 'utf8'), tab, { filename: module });
  }
  return tab.IE104;
}

test('lịch mẫu tháng 10 và 11 có đủ năm trạng thái từ cùng bộ yêu cầu của giảng viên', async () => {
  const app = createTab(new Map(), { URLSearchParams }, true);
  const { deadlines, studentSubmissions, teaching } = app.services;
  const calendars = await deadlines.getActiveDeadlines();
  assert.ok(calendars.length);
  const expected = ['awaiting', 'overdue', 'pending', 'responded', 'submitted'];
  for (const calendar of calendars) {
    const lecturer = teaching.getState(calendar.id);
    const student = studentSubmissions.forStudent(calendar.id, new Date('2099-01-01T00:00:00Z'));
    const teacherRequirements = new Map(lecturer.requirements.map(item => [`${calendar.id}--${item.id}`, item]));
    const studentRequirements = new Map(student.requirements.map(item => [item.id, item]));

    for (const month of ['2026-10', '2026-11']) {
      const events = calendar.events.filter(event => event.kind === 'submission' && event.date.startsWith(month));
      assert.deepEqual([...new Set(events.map(event => event.status))].sort(), expected);
      for (const event of events) {
        const teacherRequirement = teacherRequirements.get(event.id);
        const studentRequirement = studentRequirements.get(teacherRequirement.id);
        assert.equal(Date.parse(event.due), Date.parse(teacherRequirement.deadline));
        assert.equal(studentRequirement.deadline, teacherRequirement.deadline);
        if (event.status === 'pending' || event.status === 'overdue') {
          assert.equal(studentRequirement.overdue, event.status === 'overdue');
          assert.equal(studentRequirement.submitted, false);
        } else {
          assert.equal(studentRequirement.submitted, true);
          const submission = lecturer.submissions.find(item => item.requirementId === teacherRequirement.id);
          assert.equal(Boolean(submission?.feedback), event.status === 'responded');
          assert.equal(event.submissionId, submission.id);
          assert.equal(Date.parse(event.submitted), Date.parse(submission.submittedAt));
        }
      }
    }
  }
});

test('hạn báo cáo của đề tài đang thực hiện khớp giữa lịch, sinh viên và giảng viên', async () => {
  const { data, services } = createTab(new Map(), { URLSearchParams }, true);
  const projects = data.myTopics.filter(project => project.status === 'dang-thuc-hien');
  const calendars = new Map((await services.deadlines.getActiveDeadlines()).map(calendar => [calendar.id, calendar]));
  assert.ok(projects.length);
  assert.equal(calendars.size, projects.length);
  const progressDates = new Set();
  const finalDates = new Set();
  for (const project of projects) {
    const { id, startsAt, progressReportDate, finalReportDate } = project;
    assert.match(progressReportDate, /^2026-11-\d{2}$/);
    assert.match(finalReportDate, /^2026-12-\d{2}$/);
    assert.ok(startsAt < progressReportDate && progressReportDate < finalReportDate);
    progressDates.add(progressReportDate);
    finalDates.add(finalReportDate);
    const lecturer = data.lecturerTopics.find(topic => topic.kind === 'supervised' && topic.workspaceId === id);
    assert.ok(lecturer?.sharedStudentProject);
    assert.equal(lecturer.progressReportDate, progressReportDate);
    assert.equal(lecturer.finalReportDate, finalReportDate);
    assert.deepEqual(lecturer.milestones, data.studentProjectOverviews[id].milestones);

    const events = calendars.get(id).events.filter(event => event.kind === 'topic');
    assert.equal(events.length, 2);
    for (const [index, name, date] of [
      [0, 'Hạn nộp báo cáo tiến độ', progressReportDate],
      [1, 'Hạn nộp báo cáo cuối cùng', finalReportDate],
    ]) {
      assert.equal(events[index].name, name);
      assert.equal(events[index].date, date);
      assert.equal(events[index].due, date);
      assert.equal(events[index].detailUrl, project.detailUrl);
    }
  }
  assert.equal(progressDates.size, projects.length);
  assert.equal(finalDates.size, projects.length);
});

test('công việc mẫu làm đa dạng tiến độ đang thực hiện và dùng chung giữa giảng viên và sinh viên', () => {
  const { data, services } = createTab(new Map(), { URLSearchParams }, true);
  const percentages = new Set();
  for (const project of data.myTopics) {
    const student = services.projectProgress.getState(project.id);
    const lecturer = services.teaching.getState(project.id).progress;
    assert.deepEqual(student.tasks, lecturer.tasks);
    const additions = student.tasks.filter(task => task.id.startsWith(project.id + '-sample-task-'));
    const summary = services.projectProgress.summarize(student);
    if (project.status === 'hoan-thanh') {
      assert.equal(additions.length, 0);
      assert.equal(summary.percent, 100);
      continue;
    }
    assert.equal(additions.length, 3);
    assert.ok(additions.every(task => task.deadline < project.finalReportDate &&
      student.team.members.some(member => member.code === task.assigneeCode)));
    assert.equal(summary.method, 'task-average');
    percentages.add(summary.percent);
  }
  assert.ok(percentages.size >= 5);
});

test('công việc mẫu được thêm vào bản đã lưu mà vẫn giữ chỉnh sửa và công việc đã xóa', () => {
  const storage = new Map();
  const { data, services, storage: projectStorage } = createTab(storage, { URLSearchParams }, true);
  const { projectProgress } = services;
  const projectId = data.studentUITCatalog.projectId('ISE-003');
  const { tasks } = projectProgress.getState(projectId);
  const sampleTasks = tasks.filter(task => task.id.startsWith(projectId + '-sample-task-'));
  const [removed, edited, ...rest] = tasks.filter(task => !sampleTasks.includes(task));
  const customTask = { ...edited, id: 'CV-custom', title: 'Công việc riêng đã tạo' };
  const existing = [{ ...edited, title: 'Công việc đã sửa' }, ...rest, customTask];
  projectStorage.writeProjectProgress([{ projectId, revision: 2, tasks: existing, history: [] }]);

  const state = projectProgress.getState(projectId);
  assert.equal(state.revision, 2);
  assert.deepEqual(structuredClone(state.tasks), structuredClone([...existing, ...sampleTasks]));
  assert.ok(!state.tasks.some(task => task.id === removed.id));
  const saved = projectProgress.deleteTask(projectId, sampleTasks[0].id, state.revision);
  const reloaded = createTab(storage, { URLSearchParams }, true).services.projectProgress.getState(projectId);
  assert.equal(reloaded.revision, 3);
  assert.deepEqual(structuredClone(reloaded.tasks), structuredClone(saved.tasks));
  assert.ok(!reloaded.tasks.some(task => task.id === sampleTasks[0].id));
});

test('bài nộp mẫu của đề tài đang thực hiện có thể tải tệp lẻ và toàn bộ, kể cả từ bản ghi cũ', () => {
  const app = createTab(new Map(), { URLSearchParams }, true);
  const project = app.data.myTopics.find(item => item.status === 'dang-thuc-hien');
  const submissions = app.services.studentSubmissions.forStudent(project.id).submissions;
  const { attachment } = app.data.studentWebSubmissions;
  const withArchive = submissions.find(item => attachment(project.id, item)?.names.length > 1);
  const singleFile = submissions.find(item => attachment(project.id, item)?.names.length === 1);
  assert.ok(withArchive);
  assert.ok(singleFile);
  const archive = attachment(project.id, withArchive);
  assert.match(archive.path, /\.zip$/);
  assert.ok(fs.existsSync(path.join(__dirname, '../assets/files', archive.path)));
  assert.equal(attachment(project.id, { ...withArchive, submittedAt: '2026-10-02T08:00:00Z' }).path, archive.path);
  assert.equal(attachment(project.id, singleFile).path, 'bai-nop-minh-hoa.pdf');
  assert.equal(attachment(project.id, { ...singleFile, id: 'upload:' + singleFile.requirementId }), null);
  assert.equal(attachment(project.id, { ...singleFile, files: [{}] }), null);
});

test('DA005 shares submissions across roles and locks feedback writes after completion', async () => {
  const storage = new Map();
  const teacher = createTab(storage);
  const student = createTab(storage);
  const projectId = 'DA005';
  const teaching = teacher.services.teaching;
  const forStudent = () => student.services.studentSubmissions.forStudent(projectId);
  const initial = teaching.getState(projectId);
  const ids = entries => Array.from(entries, entry => entry.id).sort();
  assert.equal(initial.requirements.length, 27);
  assert.equal(initial.submissions.length, 18);
  assert.deepEqual(ids(forStudent().requirements), ids(initial.requirements));
  assert.deepEqual(ids(forStudent().submissions), ids(initial.submissions));
  assert.equal(initial.project.status, 'hoan-thanh');
  assert.equal(initial.canManageRequirements, false);
  assert.equal(forStudent().canUpload, false);
  assert.throws(() => teaching.deleteRequirement(projectId, 'requirement-3', initial.revision), /không đang thực hiện/);
  for (const id of ['submission-1', 'submission-2']) {
    assert.throws(() => teaching.saveFeedback(projectId, id, 'Thử thay đổi phản hồi.', initial.revision), /Đề tài đã hoàn thành/);
  }
  await assert.rejects(teacher.services.studentSubmissions.reviewUpload(
    projectId, { requirementId: 'requirement-3' }, 'Thử phản hồi cho tệp đã nộp.',
  ), /Đề tài đã hoàn thành/);
  assert.equal(teaching.getState(projectId).revision, initial.revision);
  assert.equal(teaching.getSubmission(projectId, 'submission-1').feedback,
    initial.submissions.find(item => item.id === 'submission-1').feedback);

  teacher.data.myTopics.find(topic => topic.id === projectId).status = 'dang-thuc-hien';
  const next = teaching.deleteRequirement(projectId, 'requirement-3', initial.revision);
  assert.equal(forStudent().requirements.some(item => item.id === 'requirement-3'), false);
  assert.equal(teaching.getState(projectId).requirements.filter(item => item.id === 'requirement-3').length, 1);
  teaching.saveFeedback(projectId, 'submission-2', 'Đã nhận bài mẫu.', next.revision);
  assert.equal(forStudent().submissions.find(item => item.id === 'submission-2').feedback, 'Đã nhận bài mẫu.');
});

test('publishes the current assessment directly and exposes the result to the student', () => {
  const storage = new Map();
  const { teaching } = createTab(storage).services;
  const { evaluations } = createTab(storage).services;
  const projectId = 'DA005';
  const { revision } = teaching.getState(projectId);
  const assessment = { scores: { TC001: '8', TC002: '9', TC003: '7' }, feedback: 'Nhóm đã hoàn thành báo cáo.' };

  assert.equal(evaluations.getResult(projectId).score, 8.4);
  assert.throws(() => teaching.publish(projectId, { ...assessment, scores: { ...assessment.scores, TC001: '11' } }, revision));
  assert.equal(evaluations.getResult(projectId).score, 8.4);
  const published = teaching.publish(projectId, assessment, revision);
  assert.equal(published.revision, revision + 1);
  assert.equal(published.draft, null);
  assert.throws(() => teaching.publish(projectId, assessment, revision));
  const result = evaluations.getResult(projectId);
  assert.equal(result.status, 'published');
  assert.equal(result.score, 8.1);
  assert.equal(result.feedback, assessment.feedback);
});

test('publishing an assessment preserves, replaces, or removes its attachment across roles', () => {
  const storage = new Map();
  const { teaching } = createTab(storage).services;
  const { evaluations } = createTab(storage).services;
  const projectId = 'DA005';
  const assessment = { scores: { TC001: '8', TC002: '9', TC003: '7' }, feedback: 'Nhóm đã hoàn thành báo cáo.' };
  const initial = teaching.getState(projectId);
  const file = { name: 'Phiếu đánh giá.pdf', fileKey: 'uploaded-assessment', size: 42 };

  assert.equal(evaluations.getResult(projectId).attachment.name, 'Phieu_danh_gia.pdf');
  assert.throws(() => teaching.publish(projectId, { ...assessment, attachment: { ...file, size: 0 } }, initial.revision), /không hợp lệ/);
  const attached = teaching.publish(projectId, { ...assessment, attachment: file }, initial.revision);
  const readAttachment = () => evaluations.getResult(projectId).attachment;
  assert.equal(readAttachment().fileKey, file.fileKey);
  assert.equal(readAttachment().name, file.name);
  assert.equal(readAttachment().size, file.size);
  assert.throws(() => teaching.publish(projectId, { ...assessment, attachment: null }, initial.revision), /đã thay đổi/);
  const preserved = teaching.publish(projectId, assessment, attached.revision);
  assert.equal(readAttachment().fileKey, file.fileKey);
  const removed = teaching.publish(projectId, { ...assessment, attachment: null }, preserved.revision);
  assert.equal(readAttachment(), null);
  teaching.publish(projectId, assessment, removed.revision);
  assert.equal(readAttachment(), null);
});

test('an existing DA005 evaluation keeps its original rubric and takes precedence over the sample', () => {
  const storage = new Map();
  const projectId = 'DA005';
  const prior = createTab(storage);
  prior.data.projectEvaluations = prior.data.projectEvaluations.filter(item => item.projectId !== projectId);
  const assessment = { scores: { TC001: '8', TC002: '9', TC003: '7' }, feedback: 'Nhận xét đã công bố.' };
  prior.services.teaching.publish(projectId, assessment, prior.services.teaching.getState(projectId).revision);

  const { teaching, evaluations } = createTab(storage).services;
  const state = teaching.getState(projectId);
  assert.equal(state.publication.score, 8.2);
  assert.deepEqual(Array.from(state.criteria, item => item.weight), [40, 40, 20]);
  assert.equal(evaluations.getResult(projectId).feedback, assessment.feedback);
  assert.equal(teaching.publish(projectId, assessment, state.revision).publication.score, 8.2);
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
  const activeCalendar = async () => (await deadlines.getActiveDeadlines()).find(item => item.id === projectId);
  const activeReport = async () => (await activeCalendar())?.events.find(event => event.kind === 'submission');
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
  assert.equal((await activeReport()).due, '2099-01-01T00:15:00+07:00');
  assert.equal((await activeReport()).detailUrl.split('#')[1], 'bai-nop');

  state = teaching.saveRequirement(projectId, id, {
    title: 'Báo cáo đã chỉnh', content: 'Nộp bản mới', deadline: '2099-02-02T20:30',
  }, state.revision);
  state = teaching.setLocked(projectId, id, true, state.revision);
  assert.equal(studentSubmissions.forStudent(projectId).requirements[0].locked, true);
  assert.equal(calendar().length, 0);
  assert.equal(calendar('2099-02')[0].title, 'Báo cáo đã chỉnh');
  assert.equal(calendar('2099-02')[0].id, id);
  assert.equal(calendar('2099-02')[0].locked, true);
  assert.equal((await activeReport()).date, '2099-02-02');
  assert.equal((await activeReport()).status, 'locked');

  teaching.deleteRequirement(projectId, id, state.revision);
  assert.equal(studentSubmissions.forStudent(projectId).requirements.length, 0);
  assert.equal(calendar('2099-02').length, 0);
  assert.equal(await activeReport(), undefined);

  student.data.currentStudent = { code: '99999999', name: 'Sinh viên khác' };
  assert.throws(() => studentSubmissions.forStudent(projectId), /không thuộc nhóm/);
  assert.equal(await activeCalendar(), undefined);
});

test('nhãn thời hạn dùng giờ gửi của từng bài và lần gửi gần nhất cho yêu cầu', () => {
  const student = createTab(new Map());
  const projectId = 'DA005';
  student.data.myTopics.find(topic => topic.id === projectId).status = 'dang-thuc-hien';
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
  assert.deepEqual(['late', 'exact', 'early', 'unlinked'].map(id =>
    state.submissions.find(item => item.id === id).late), [true, false, false, null]);
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
  let failWrite = false;
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
              error: new Error('Storage write failed'),
              abort() { aborted = true; this.onabort(); },
              objectStore() {
                return {
                  get(parts) {
                    const request = { result: uploads.get(key(parts)) };
                    queueMicrotask(() => {
                      request.onsuccess();
                      queueMicrotask(() => {
                        if (aborted) return;
                        if (pending && failWrite) { transaction.abort(); return; }
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
  const student = createTab(storage, { indexedDB, File });
  const teacher = createTab(storage, { indexedDB });
  const registration = await student.services.registrations.submit('DT001', {
    members: [{ ...student.data.currentStudent, role: 'nhom-truong' }],
  });
  const projectId = student.services.approvedProjects.projectIdFor(registration.id);
  const teaching = teacher.services.teaching;
  const initial = teaching.getState(projectId);
  assert.equal(initial.project.status, 'dang-thuc-hien');
  const state = teaching.saveRequirement(projectId, null, {
    title: 'Báo cáo thử', content: 'Nộp PDF', deadline: '2099-01-01T10:00',
  }, initial.revision);
  const requirement = state.requirements.at(-1);
  const file = new File(['bao cao'], 'report.pdf');
  const first = await student.services.studentSubmissions.saveUpload(projectId, requirement, [file], '', null);
  const current = teaching.getState(projectId);
  const studentSubmissions = student.services.studentSubmissions;
  const lecturerSubmissions = teacher.services.studentSubmissions;
  const local = uploads.get(key([projectId, requirement.id]));
  const submission = lecturerSubmissions.visibleSubmissions(projectId, current.submissions, [local])[0];
  assert.equal(submission.submittedAt, first.submittedAt);
  assert.equal(await submission.files[0].text(), 'bao cao');

  const legacy = { id: `SV-UP-${requirement.id}`, requirementId: requirement.id,
    submittedAt: first.submittedAt, feedback: 'legacy feedback' };
  const migrated = studentSubmissions.visibleSubmissions(projectId, [legacy], [local]);
  assert.equal(migrated.length, 1);
  assert.equal(migrated[0].feedback, 'legacy feedback');

  await lecturerSubmissions.reviewUpload(projectId, submission, 'test feedback');
  const reviewed = uploads.get(key([projectId, requirement.id]));
  assert.equal(studentSubmissions.visibleSubmissions(projectId, current.submissions, [reviewed])[0].feedback, 'test feedback');

  failWrite = true;
  await assert.rejects(studentSubmissions.saveUpload(projectId, requirement, [new File(['ban moi'], 'new.pdf')], '', first.submittedAt), /Ch\u01b0a l\u01b0u/);
  assert.equal(uploads.get(key([projectId, requirement.id])), reviewed);
  const savedState = teaching.getState(projectId);
  await assert.rejects(lecturerSubmissions.deleteUnsubmittedRequirement(projectId, requirement.id, savedState.revision), /\u0111\u00e3 c\u00f3 b\u00e0i n\u1ed9p/);
  assert.equal(teaching.getState(projectId).requirements.find(item => item.id === requirement.id).deletedAt, undefined);
  const locked = teaching.setLocked(projectId, requirement.id, true, savedState.revision);
  assert.equal(locked.requirements.find(item => item.id === requirement.id).locked, true);
  assert.equal(uploads.get(key([projectId, requirement.id])).files[0].name, 'report.pdf');
});
