const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const saved = new Map();
  const context = vm.createContext({
    URL, console, location: { protocol: 'http:' },
    localStorage: { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) },
  });
  context.window = context;
  const scripts = ['uit-lecturer-catalog.js', 'shared/topic-identity.js', 'data/mock-data.js', 'data/proposal-actors.js',
    'data/lecturer-topics.js', 'data/lecturer-merge-catalog.js', 'services/lecturer-topic-repository.js',
    'services/lecturer-topic-service.js', 'services/lecturer-topic-editor-service.js'];
  scripts.forEach(file => vm.runInContext(fs.readFileSync('assets/js/' + file, 'utf8'), context, { filename: file }));
  return { context, codes: context.UITLecturerCatalog, service: context.IE104.services.lecturerTopics, editor: context.IE104.services.lecturerTopicEditor };
}

test('six faculty prefixes, Vietnamese Đ and legacy codes follow the requested format', () => {
  const { codes } = setup();
  for (const [faculty, name] of Object.entries(codes.facultyCodes)) {
    assert.equal(codes.facultyCode('Khoa ' + name), faculty);
    assert.equal(codes.formatCode('course', 'DA001', faculty), `${faculty}-ĐAMH-001`);
    assert.equal(codes.formatCode('graduation', 'ISEDATN-002', faculty), `${faculty}-ĐATN-002`);
    assert.equal(codes.formatCode('thesis', 'KL003', faculty), `${faculty}-KLTN-003`);
  }
  assert.equal(codes.facultyCode('Khoa học và kĩ thuật thông tin'), 'ISE');
  assert.equal(codes.facultyCode('KTTT'), 'ISE');
  assert.equal(codes.facultyCode('MMT&TT'), 'MMTT');
  assert.equal(codes.formatCode('master', 'ISE-008'), 'ISE-008');
});

test('course owner uses verified subject data while graduation subjects use their type', () => {
  const { service } = setup();
  assert.equal(service.get('created', 'ISEDAMH-001').displayId, 'ISE-ĐAMH-001');
  assert.equal(service.get('created', 'ISEDAMH-002').displayId, 'HTTT-ĐAMH-002');
  assert.equal(service.get('created', 'ISEDAMH-003').displayId, 'CNPM-ĐAMH-003');
  assert.equal(service.get('created', 'ISEDATN-004').courseLabel, 'Đồ án tốt nghiệp');
  assert.equal(service.get('created', 'ISE-003').courseLabel, 'Khóa luận tốt nghiệp');
});

test('migrated display codes are unique and both old and displayed IDs open the same topic', () => {
  const { service } = setup();
  const topics = service.list('created');
  assert.equal(new Set(topics.map(topic => topic.displayId)).size, topics.length);
  for (const topic of topics) {
    assert.equal(service.get('created', topic.displayId).id, topic.id);
    assert.ok(service.detailUrl(topic).includes(encodeURIComponent(topic.id)));
  }
});

test('new codes count by faculty and type, including supervised topics not in the created tab', () => {
  const { context, editor } = setup();
  assert.match(editor.nextCode('course', 'web'), /^ISE-ĐAMH-\d+$/);
  assert.match(editor.nextCode('course', 'database'), /^HTTT-ĐAMH-\d+$/);
  assert.match(editor.nextCode('course', 'software'), /^CNPM-ĐAMH-\d+$/);
  assert.equal(editor.nextCode('thesis'), 'ISE-KLTN-017');
  assert.equal(editor.nextCode('graduation'), 'ISE-ĐATN-006');
  context.IE104.data.currentLecturer.faculty = 'Khoa Khoa học máy tính';
  assert.equal(editor.nextCode('graduation'), 'KHMT-ĐATN-001');
  assert.equal(editor.nextCode('thesis'), 'KHMT-KLTN-001');
});

test('Unicode IDs save and reload, without changing existing display codes or consuming failed numbers', () => {
  const { context, service, editor } = setup();
  const before = service.list('created').map(topic => [topic.id, topic.displayId]);
  const input = { id: editor.nextCode('course', 'database'), title: 'Đề tài kiểm thử mã khoa', topicType: 'course',
    course: 'database', semester: '1', academicYear: '2026-2027', description: 'Mô tả đề tài',
    objectives: 'Mục tiêu', outcomes: 'Kết quả', requirements: 'Yêu cầu', minMembers: '2', maxMembers: '3', deadline: '2030-12-01T23:59' };
  assert.throws(() => editor.create({ ...input, title: '' }, {}, 'GV001'));
  assert.equal(editor.nextCode('course', 'database'), input.id);
  const record = editor.create(input, {}, 'GV001');
  assert.equal(context.IE104.services.lecturerTopicRepository.read()[0].id, input.id);
  assert.equal(service.get('created', record.id).displayId, input.id);
  for (const [id, code] of before) assert.equal(service.get('created', id).displayId, code);
  assert.notEqual(editor.nextCode('course', 'database'), input.id);
});

test('workspace IDs stay internal and projects sharing a created topic keep its displayed code', () => {
  const { context, service } = setup();
  const project = { id: 'GV-DT001-N01', topicId: 'DT001', title: 'Website quản lý thư viện', typeLabel: 'Đồ án môn học', courseId: 'IE104' };
  context.IE104.data.lecturerProjects = [project];
  context.IE104.services.teaching = { listSupervisedProjects: () => [{ project }] };
  const decorated = service.projectIdentity(project);
  assert.equal(decorated.id, project.id);
  assert.equal(decorated.displayId, service.get('created', 'DA001').displayId);
  assert.match(decorated.displayId, /^ISE-ĐAMH-\d+$/);
});
