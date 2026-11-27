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

test('faculty names are recognized and legacy IDs normalize to the current ISE codes', () => {
  const { codes } = setup();
  for (const [faculty, name] of Object.entries(codes.facultyCodes)) {
    assert.equal(codes.facultyCode('Khoa ' + name), faculty);
    assert.equal(codes.formatCode('course', `${faculty}-ĐAMH-001`, faculty), 'ISEDAMH-001');
    assert.equal(codes.formatCode('graduation', `${faculty}-ĐATN-002`, faculty), 'ISEDATN-002');
    assert.equal(codes.formatCode('thesis', `${faculty}-KLTN-003`, faculty), 'ISEKTLN-003');
  }
  assert.equal(codes.facultyCode('Khoa học và kĩ thuật thông tin'), 'ISE');
  assert.equal(codes.facultyCode('KTTT'), 'ISE');
  assert.equal(codes.facultyCode('MMT&TT'), 'MMTT');
  assert.equal(codes.formatCode('course', 'DA001'), 'ISEDAMH-001');
  assert.equal(codes.formatCode('thesis', 'ISEKLTN-003'), 'ISEKTLN-003');
  assert.equal(codes.formatCode('master', 'ISE-008'), 'ISE-008');
});

test('available courses keep their subject faculty and graduation subjects use their type', () => {
  const { service } = setup();
  const web = service.get('created', 'ISEDAMH-001');
  assert.equal(web.displayId, 'ISEDAMH-001');
  assert.equal(web.facultyCode, 'ISE');
  assert.equal(web.courseLabel, 'Internet và công nghệ web');
  const database = service.get('created', 'ISEDAMH-002');
  assert.equal(database.displayId, 'ISEDAMH-002');
  assert.equal(database.facultyCode, 'HTTT');
  assert.equal(database.courseLabel, 'Cơ sở dữ liệu');
  assert.throws(() => service.get('created', 'ISEDAMH-003'), /Không tìm thấy đề tài/);
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

test('new ISE codes share a sequence per topic type and include supervised topics', () => {
  const { context, codes, editor } = setup();
  for (const course of Object.keys(codes.courseCatalog)) {
    assert.equal(editor.nextCode('course', course), 'ISEDAMH-020');
  }
  assert.equal(editor.nextCode('thesis'), 'ISEKTLN-017');
  assert.equal(editor.nextCode('graduation'), 'ISEDATN-006');
  context.IE104.data.currentLecturer.faculty = 'Khoa Khoa học máy tính';
  assert.equal(editor.nextCode('graduation'), 'ISEDATN-006');
  assert.equal(editor.nextCode('thesis'), 'ISEKTLN-017');
  assert.equal(codes.nextCode('thesis', [{ topicCode: 'ISEKLTN-031' }]), 'ISEKTLN-032');
});

test('IDs survive saving and reloading, including existing Unicode IDs, without consuming failed numbers', () => {
  const { context, service, editor } = setup();
  const before = service.list('created').map(topic => [topic.id, topic.displayId]);
  const input = { id: editor.nextCode('course', 'database'), title: 'Đề tài kiểm thử mã khoa', topicType: 'course',
    course: 'database', semester: '1', academicYear: '2026-2027', description: 'Mô tả đề tài',
    objectives: 'Mục tiêu', outcomes: 'Kết quả', requirements: 'Yêu cầu', minMembers: '2', maxMembers: '3', deadline: '2030-12-01T23:59',
    startsAt: '2030-12-02', progressReportDate: '2030-12-10', finalReportDate: '2030-12-20' };
  assert.throws(() => editor.create({ ...input, title: '' }, {}, 'GV001'));
  assert.equal(editor.nextCode('course', 'database'), input.id);
  const record = editor.create(input, {}, 'GV001');
  const repository = context.IE104.services.lecturerTopicRepository;
  assert.equal(repository.read()[0].id, input.id);
  assert.equal(service.get('created', record.id).displayId, input.id);
  for (const [id, code] of before) assert.equal(service.get('created', id).displayId, code);
  assert.notEqual(editor.nextCode('course', 'database'), input.id);

  const legacy = { ...record, id: 'HTTT-ĐAMH-081', title: 'Đề tài đã lưu theo mã cũ' };
  repository.write([record, legacy]);
  assert.equal(service.get('created', legacy.id).displayId, 'ISEDAMH-081');
  assert.equal(service.get('created', 'ISEDAMH-081').id, legacy.id);
  assert.equal(editor.nextCode('course', 'database'), 'ISEDAMH-082');
});

test('workspace IDs stay internal and projects sharing a created topic keep its displayed code', () => {
  const { context, service } = setup();
  const project = { id: 'GV-DT001-N01', topicId: 'DT001', title: 'Website quản lý thư viện', typeLabel: 'Đồ án môn học', courseId: 'IE104' };
  context.IE104.data.lecturerProjects = [project];
  context.IE104.services.teaching = { listSupervisedProjects: () => [{ project }] };
  const decorated = service.projectIdentity(project);
  assert.equal(decorated.id, project.id);
  assert.equal(decorated.displayId, service.get('created', 'DA001').displayId);
  assert.match(decorated.displayId, /^ISEDAMH-\d+$/);
});

test('lecturer topic dates use Vietnam time and preserve existing past dates during other edits', () => {
  const { editor } = setup();
  const now = new Date('2026-11-27T17:01:20Z');
  const input = {
    id: 'ISEDAMH-999', title: 'Kiểm tra thời gian', topicType: 'course', course: 'database',
    semester: '1', academicYear: '2026-2027', minMembers: '1', maxMembers: '3',
    description: 'Mô tả', objectives: 'Mục tiêu', outcomes: 'Kết quả', requirements: 'Yêu cầu',
    startsAt: '2026-11-28', progressReportDate: '2026-11-29', finalReportDate: '2026-11-30',
    deadline: '2026-11-28T00:02',
  };
  assert.equal(editor.validate(input, null, now).errors.length, 0);
  const earlier = { ...input, startsAt: '2026-11-27', deadline: '2026-11-28T00:01' };
  assert.deepEqual(Array.from(editor.validate(earlier, null, now).errors, item => item.field), ['startsAt', 'deadline']);
  const saved = {
    ...editor.validate(earlier, null, now).value,
    registration: { deadline: '2026-11-27T17:01:45Z' },
  };
  const checked = editor.validate(earlier, saved, new Date('2026-12-01T00:00:00+07:00'));
  assert.equal(checked.errors.length, 0);
  assert.equal(checked.value.deadline, '2026-11-27T17:01:45.000Z');
});
