const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createContext, runInContext } = require('node:vm');

function loadStudentServices(context) {
  const files = [
    'data/mock-data.js', 'data/student-projects.js', 'data/student-progress.js',
    'data/student-evaluations.js', 'services/storage.js', 'services/project-team-service.js',
    'services/project-progress-service.js', 'services/evaluation-service.js',
  ];
  for (const file of files) {
    runInContext(readFileSync(join(__dirname, '../assets/js', file), 'utf8'), context);
  }
}

test('file preview shows bundled student project data without reading or writing storage', () => {
  const storageUnavailable = () => { throw new Error('Storage unavailable'); };
  const context = createContext({
    location: { protocol: 'file:' },
    localStorage: { getItem: storageUnavailable, setItem: storageUnavailable },
  });
  loadStudentServices(context);

  const { projectTeams, projectProgress, evaluations } = context.IE104.services;
  const preview = { preview: true };
  const progress = projectProgress.getState('DA005', preview);
  assert.equal(progress.tasks.length, 7);
  assert.equal(projectProgress.summarize(progress).percent, 45);
  assert.equal(projectTeams.getPermission(progress.team).allowed, false);
  assert.equal(projectProgress.getPermissions(progress).manage, false);
  assert.equal(projectProgress.canUpdateTask(progress, progress.tasks[0]), false);
  assert.equal(evaluations.getResult('DA005', preview).status, 'unpublished');
  assert.equal(evaluations.getResult('DA001', preview).score, 8.4);
  assert.throws(() => projectProgress.getState('DA005'), /localhost/);
  assert.throws(() => evaluations.getResult('DA005'), /localhost/);
});

test('new student tasks preserve multiple assignees, description and initial status across edits', () => {
  const values = new Map();
  const context = createContext({
    location: { protocol: 'http:' },
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
  });
  loadStudentServices(context);
  const { data, services: { projectProgress: service } } = context.IE104;
  const projectId = 'DA005';
  const input = {
    title: 'Thử phân công nhiều thành viên',
    deadline: '2099-11-25',
    description: '  Mô tả cần lưu  ',
    assigneeCodes: ['24520001', '24520002'],
    status: 'dang-thuc-hien',
  };

  assert.throws(() => service.saveTask(projectId, null, { ...input, status: 'da-hoan-thanh' }, 0), /Chưa bắt đầu hoặc Đang thực hiện/);
  assert.throws(() => service.saveTask(projectId, null, { ...input, assigneeCodes: [] }, 0), /ít nhất một người phụ trách/);
  assert.throws(() => service.saveTask(projectId, null, { ...input, assigneeCodes: ['24520001', 'ngoai-nhom'] }, 0), /trong nhóm hiện tại/);

  const saved = service.saveTask(projectId, null, input, 0);
  const task = service.getState(projectId).tasks.at(-1);
  assert.equal(task.description, 'Mô tả cần lưu');
  assert.deepEqual(Array.from(task.assigneeCodes), input.assigneeCodes);
  assert.equal(task.status, 'dang-thuc-hien');
  assert.equal(task.percent, null);

  const leader = data.currentStudent;
  data.currentStudent = { name: 'Trần Gia Huy', code: '24520002' };
  assert.equal(service.canUpdateTask(service.getState(projectId), task), true);
  const updated = service.updateProgress(projectId, { taskId: task.id, content: 'Đã làm một phần', status: task.status, percent: 60 }, saved.revision);

  data.currentStudent = leader;
  assert.throws(() => service.saveTask(projectId, task.id, input, saved.revision), /đã thay đổi ở tab khác/);
  service.saveTask(projectId, task.id, { ...input, title: 'Đã đổi tên', status: undefined }, updated.revision);
  const edited = service.getState(projectId).tasks.at(-1);
  assert.equal(edited.title, 'Đã đổi tên');
  assert.equal(edited.percent, 60);
  assert.deepEqual(Array.from(edited.assigneeCodes), input.assigneeCodes);

  let revision = service.getState(projectId).revision;
  assert.throws(() => service.saveTask(projectId, task.id, { ...input, status: 'khong-hop-le' }, revision), /trạng thái hợp lệ/);
  for (const [status, percent] of [
    ['dang-thuc-hien', 60],
    ['da-hoan-thanh', 100],
    ['dang-thuc-hien', null],
    ['chua-thuc-hien', 0],
  ]) {
    const stored = service.saveTask(projectId, task.id, { ...input, status }, revision);
    revision = stored.revision;
    const savedTask = service.getState(projectId).tasks.at(-1);
    assert.equal(savedTask.status, status);
    assert.equal(savedTask.percent, percent);
  }

  const legacy = service.saveTask(projectId, null, {
    title: 'Việc mới mặc định', assigneeCode: '24520001', deadline: input.deadline,
  }, service.getState(projectId).revision).tasks.at(-1);
  assert.equal(legacy.status, 'chua-thuc-hien');
  assert.equal(legacy.percent, 0);
});
