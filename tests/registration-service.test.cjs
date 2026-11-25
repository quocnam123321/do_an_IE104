const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const scripts = [
  'shared/topic-identity.js', 'data/mock-data.js', 'data/proposal-actors.js', 'services/storage.js', 'shared/validation.js',
  'services/registration-service.js', 'services/approved-project-service.js', 'services/topic-service.js',
  'services/published-topic-service.js', 'services/lecturer-topic-repository.js', 'services/lecturer-topic-service.js',
];

function setup(saved = new Map(), withLecturerCatalog = false) {
  const context = vm.createContext({
    localStorage: {
      getItem: key => saved.get(key) ?? null,
      setItem: (key, value) => saved.set(key, value),
    },
  });
  context.window = context;
  const catalogScripts = withLecturerCatalog
    ? ['uit-lecturer-catalog.js', 'data/lecturer-topics.js', 'data/lecturer-merge-catalog.js'] : [];
  for (const script of [...scripts, ...catalogScripts]) {
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

test('ISEDAMH-017 updates the created-topic badge from current and legacy registrations', async () => {
  const saved = new Map();
  const { services, storage } = setup(saved, true);
  const topics = services.lecturerTopics;
  const original = topics.get('created', 'DA002');
  assert.equal(original.displayId, 'ISEDAMH-017');
  assert.equal(original.title, 'Hệ thống quản lý bán hàng');
  services.lecturerTopicRepository.write([{
    ...original,
    semester: '1',
    description: 'Quản lý bán hàng',
    requirements: ['Xây dựng hệ thống bán hàng'],
    supervisor: { name: 'Nguyễn Văn An' },
    registration: { minMembers: 1, maxMembers: 3, deadline: '2099-01-01T00:00:00Z' },
    updatedAt: '2026-10-28T00:00:00Z',
    revision: 1,
  }]);

  const record = await services.registrations.submit('GV:GV001:DA002', group, 1);
  const badge = () => setup(saved, true).services.lecturerTopics.list('created').find(topic => topic.id === 'DA002')?.statusLabel;
  assert.equal(badge(), 'Đã có nhóm đăng ký');
  for (const id of ['DA002', 'ISEDAMH-017']) {
    storage.writeRegistrations([{ ...record, topic: { id, title: original.title } }]);
    assert.equal(badge(), 'Đã có nhóm đăng ký');
  }
  storage.writeRegistrations([{ ...record, lecturerId: 'GV002', topic: { id: 'DA002', title: original.title } }]);
  assert.equal(badge(), 'Đang mở đăng ký');
});

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
  const listed = fresh.registrations.listMyTopics().filter(item => item.requestId === record.id);
  assert.equal(listed.length, 1);
  assert.equal(listed[0].detailUrl, fresh.registrations.projectUrl(record));
  assert.equal(listed[0].requestDetailUrl, undefined);
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
  assert.equal(registrations.listMyTopics().find(item => item.requestId === old.id)?.detailUrl, 'chi-tiet-de-tai-mo-dang-ky.html?topic=DT004');
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
  const saved = new Map();
  const { services, storage } = setup(saved);
  const published = {
    id: 'DT-MOI', kind: 'created', ownerId: 'GV001', title: 'Đề tài kiểm thử', topicType: 'course', typeLabel: 'Đồ án môn học',
    course: 'web', courseLabel: 'Internet và Công nghệ Web', semester: '1', academicYear: '2026-2027',
    createdAt: '2026-10-28T00:00:00Z', updatedAt: '2026-10-28T00:00:00Z',
    description: 'Mô tả', objectives: ['Mục tiêu'], outcomes: ['Kết quả'], requirements: ['Yêu cầu'],
    supervisor: { name: 'Nguyễn Văn An' }, status: 'open', revision: 1,
    registration: { minMembers: 2, maxMembers: 2, deadline: '2099-01-01T00:00:00Z' },
  };
  services.lecturerTopicRepository.write([published]);
  const id = services.publishedTopics.publicId(published);
  const { registrations } = services;
  const rules = registrations.getRules(id);
  assert.equal(services.lecturerTopics.list('created')[0]?.id, published.id);
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
  assert.equal(services.lecturerTopics.list('created')[0]?.status, 'registered');
  const refreshed = setup(saved).services.lecturerTopics.list('created')[0];
  assert.equal(refreshed?.status, 'registered');
  assert.equal(refreshed?.statusLabel, 'Đã có nhóm đăng ký');
  assert.equal(services.approvedProjects.list('lecturer')[0]?.requestId, record.id);
  assert.equal(services.lecturerTopics.get('created', published.id).id, published.id);
  assert.equal(services.lecturerTopics.get('created', published.id).status, 'open');
  services.lecturerTopicRepository.write([{ ...published, title: 'Đề tài kiểm thử đã đổi tên', revision: 2 }]);
  assert.equal(services.lecturerTopics.list('created')[0]?.status, 'registered');

  const olderSnapshot = { ...record, topic: { ...record.topic, id: published.id } };
  storage.writeRegistrations([olderSnapshot]);
  assert.equal(services.lecturerTopics.list('created')[0]?.status, 'registered');

  storage.writeRegistrations([{ ...olderSnapshot, status: 'cho-duyet' }]);
  assert.equal(services.lecturerTopics.list('created')[0]?.status, 'open');
  await registrations.decide(record.id, 'approved', '', 0);
  assert.equal(services.lecturerTopics.list('created')[0]?.status, 'registered');
  assert.equal(services.approvedProjects.list('lecturer')[0]?.requestId, record.id);
});

test('đề tài cùng tên chỉ hiện một lần và không đăng ký lại qua mã cũ', async () => {
  const { services, data } = setup();
  const topic = {
    id: 'DA001', ownerId: 'GV001', title: '  Website   quản lý thư viện  ',
    topicType: 'course', typeLabel: 'Đồ án môn học', course: 'web', semester: '1',
    academicYear: '2026-2027', createdAt: '2026-10-28', description: 'Mô tả',
    objectives: ['Mục tiêu'], outcomes: ['Kết quả'], requirements: ['Yêu cầu'],
    supervisor: { name: 'Nguyễn Văn An' }, status: 'open', revision: 1,
    registration: { minMembers: 1, maxMembers: 3, deadline: '2099-01-01T00:00:00Z' },
  };
  services.lecturerTopics = { allCreated: () => [topic] };
  const id = services.publishedTopics.publicId(topic);
  const key = title => title.trim().replace(/\s+/g, ' ');
  const entries = () => services.topics.listOpenTopics({}, { pageSize: 20 }).items
    .filter(item => key(item.title) === data.openTopics[0].title);

  assert.deepEqual(Array.from(entries(), item => item.id), [id]);
  topic.status = 'closed';
  assert.equal(entries().length, 0);
  await assert.rejects(services.registrations.submit('DT001', group, 1), /đóng đăng ký/);

  topic.status = 'open';
  const saved = await services.registrations.submit(id, group, 1);
  assert.equal(services.registrations.findByTopic('DT001').id, saved.id);
  await assert.rejects(services.registrations.submit('DT001', group, 1), /đã có đăng ký/);
  assert.equal(entries().length, 0);
});
