const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function createTab(storage) {
  const tab = vm.createContext({
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  });
  const modules = [
    'data/mock-data.js', 'data/proposal-actors.js', 'data/student-projects.js', 'data/student-progress.js',
    'data/student-deadlines.js', 'services/storage.js', 'shared/validation.js', 'services/registration-service.js',
    'services/approved-project-service.js', 'services/project-team-service.js', 'services/project-progress-service.js',
    'services/teaching-service.js', 'services/student-submissions-service.js', 'services/deadline-service.js',
  ];
  for (const module of modules) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', module), 'utf8'), tab, { filename: module });
  }
  return tab.IE104;
}

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

  teaching.deleteRequirement(projectId, id, state.revision);
  assert.equal(studentSubmissions.forStudent(projectId).requirements.length, 0);
  assert.equal(calendar('2099-02').length, 0);

  student.data.currentStudent = { code: '99999999', name: 'Sinh viên khác' };
  assert.throws(() => studentSubmissions.forStudent(projectId), /không thuộc nhóm/);
});
