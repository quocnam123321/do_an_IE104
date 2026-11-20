const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scripts = [
  'data/mock-data.js', 'data/proposal-actors.js', 'services/storage.js', 'shared/validation.js',
  'services/registration-service.js', 'services/approved-project-service.js', 'services/topic-service.js',
  'services/published-topic-service.js',
];

function setup(saved = new Map()) {
  const context = vm.createContext({
    localStorage: {
      getItem: key => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
    },
  });
  for (const script of scripts) {
    const source = fs.readFileSync(path.join(__dirname, '../assets/js', script), 'utf8');
    vm.runInContext(source, context, { filename: script });
  }
  return context.IE104;
}

const group = {
  groupName: 'Nhóm kiểm thử',
  members: [
    { code: '24520001', name: 'Nguyễn Minh Anh', role: 'nhom-truong' },
    { code: '24520099', name: 'Thành viên kiểm thử', role: 'thanh-vien' },
  ],
};

test('đăng ký thành công mở đề tài đang thực hiện và không tạo yêu cầu chờ duyệt', async () => {
  const saved = new Map();
  const { registrations } = setup(saved).services;
  const record = await registrations.submit('DT001', group);
  assert.equal(record.status, 'da-dang-ky');
  assert.equal(record.decision, undefined);

  const fresh = setup(saved).services;
  const projectId = fresh.approvedProjects.projectIdFor(record.id);
  const { project, team } = fresh.approvedProjects.forStudent(projectId);
  assert.equal(project.status, 'dang-thuc-hien');
  assert.equal(project.displayId, 'DT001');
  assert.equal(project.requestStatusLabel, 'Đã đăng ký');
  assert.equal(team.members.length, 2);
  assert.equal(fresh.approvedProjects.list('lecturer').find(item => item.id === projectId)?.lecturerId, 'GV001');
  assert.equal(fresh.registrations.listMyTopics().filter(item => item.requestId === record.id).length, 1);
  assert.equal(fresh.registrations.listForLecturer().length, 0);
  assert.equal(fresh.topics.listOpenTopics().items.some(topic => topic.id === 'DT001'), false);
  await assert.rejects(fresh.registrations.decide(record.id, 'approved', '', 0), /đã được xử lý/);
  await assert.rejects(fresh.registrations.submit('DT001', group), /đã có đăng ký/);
});

test('đăng ký chờ duyệt đã lưu vẫn đọc và xử lý được cạnh hồ sơ đăng ký trực tiếp', async () => {
  const { storage, services: { registrations, approvedProjects } } = setup();
  const old = {
    id: 'DK-CU', topic: registrations.getTopic('DT004'), ...group,
    lecturerId: 'GV001', status: 'cho-duyet', revision: 0, createdAt: '2026-10-28T00:00:00Z',
  };
  storage.writeRegistrations([old]);
  await registrations.submit('DT001', group);
  assert.equal(registrations.findById(old.id).status, 'cho-duyet');
  assert.equal(registrations.listForLecturer().find(item => item.id === old.id)?.status, 'pending');
  assert.equal(registrations.projectUrl(registrations.findById(old.id)), null);
  await registrations.decide(old.id, 'approved', '', 0);
  const { project } = approvedProjects.forStudent(approvedProjects.projectIdFor(old.id));
  assert.equal(project.status, 'dang-thuc-hien');
  assert.equal(project.requestStatusLabel, 'Đã duyệt');
});

test('sinh viên có thể đăng ký một mình và lưu tên nhóm trống', async () => {
  const app = setup();
  const { registrations, approvedProjects } = app.services;
  const solo = { groupName: '  ', members: group.members.slice(0, 1) };
  const record = await registrations.submit('DT001', solo);
  const { project, team } = approvedProjects.forStudent(approvedProjects.projectIdFor(record.id));
  assert.equal(registrations.findById(record.id).groupName, '');
  assert.equal(team.members.length, 1);
  assert.equal(team.members[0].role, 'nhom-truong');
  assert.equal(project.groupName, 'Nhóm chưa đặt tên');
  assert.equal(project.status, 'dang-thuc-hien');

  const unnamed = await registrations.submit('DT003', { members: group.members });
  assert.equal(registrations.findById(unnamed.id).groupName, '');
  assert.equal(approvedProjects.forStudent(approvedProjects.projectIdFor(unnamed.id)).project.groupName, 'Nhóm chưa đặt tên');
  assert.ok(app.validation.validateRegistration({ ...group, groupName: '' }).errors.some(error => error.field === 'groupName'));
});

test('đề tài giảng viên đã mở nhận một sinh viên và giữ số thành viên tối đa', async () => {
  const { services } = setup();
  const published = {
    id: 'DT-MOI', ownerId: 'GV001', title: 'Đề tài kiểm thử', topicType: 'course', typeLabel: 'Đồ án môn học',
    course: 'web', semester: '1', academicYear: '2026-2027', createdAt: '2026-10-28T00:00:00Z',
    description: 'Mô tả', objectives: ['Mục tiêu'], outcomes: ['Kết quả'], requirements: ['Yêu cầu'],
    supervisor: { name: 'Nguyễn Văn An' }, status: 'open', revision: 1,
    registration: { minMembers: 2, maxMembers: 2, deadline: '2099-01-01T00:00:00Z' },
  };
  services.lecturerTopics = { allCreated: () => [published] };
  const id = services.publishedTopics.publicId(published);
  const { registrations } = services;
  const rules = registrations.getRules(id);
  assert.equal(rules.minMembers, 1);
  assert.equal(rules.maxMembers, 2);

  const overLimit = {
    members: [...group.members, { code: '24520100', name: 'Thành viên thứ ba', role: 'thanh-vien' }],
  };
  await assert.rejects(registrations.submit(id, overLimit, 1), error => error.fields.some(item => item.field === 'members'));
  const record = await registrations.submit(id, { members: group.members.slice(0, 1) }, 1);
  assert.equal(record.status, 'da-dang-ky');
  assert.equal(record.groupName, '');
  assert.equal(record.topic.registrationRules.maxMembers, 2);
});
