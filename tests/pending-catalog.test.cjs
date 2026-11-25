const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/uit-lecturer-catalog.js'), 'utf8');
const storeSource = fs.readFileSync(path.join(__dirname, '../assets/js/proposal-store.js'), 'utf8');
const marker = '// Hồ sơ chờ duyệt bổ sung ngày 25/11/2026.';
function setup(storage = new Map(), baseline = false) {
  const ctx = vm.createContext({ navigator: {}, URL });
  ctx.window = ctx;
  ctx.IE104 = { data: { currentLecturer: { id: 'GV001' } } };
  ctx.addEventListener = () => {};
  ctx.localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  vm.runInContext(baseline ? source.split(marker)[0] : source, ctx);
  vm.runInContext(storeSource, ctx);
  return ctx;
}
const plain = value => JSON.parse(JSON.stringify(value));
test('tổng 10 hồ sơ đủ 3 loại, 4 môn; giữ nguyên dữ liệu quản lý đề tài', () => {
  const next = setup(), prev = setup(new Map(), true);
  const before = prev.UITLecturerCatalog, after = next.UITLecturerCatalog;
  assert.deepEqual(plain(after.records), plain(before.records));
  assert.deepEqual(plain(after.created), plain(before.created));
  assert.deepEqual(plain(after.supervised), plain(before.supervised));
  assert.equal(next.IE104Proposals.getAll().filter(item => item.status === 'pending').length, 10);
  const added = after.pending;
  assert.deepEqual(plain(added.reduce((counts, item) => {
    counts[item.topicType] = (counts[item.topicType] || 0) + 1; return counts;
  }, {})), { 'khoa-luan': 3, 'do-an-tot-nghiep': 3, 'do-an-mon-hoc': 4 });
  assert.equal(new Set(added.filter(item => item.course).map(item => item.course)).size, 4);
});
test('giữ quyết định của hồ sơ mẫu cũ khi thay danh sách chờ bằng 10 hồ sơ', async () => {
  const storage = new Map(), previous = setup(storage, true);
  await previous.IE104Proposals.decide('DX-ISE-011', 'approved');
  const current = setup(storage);
  assert.equal(current.IE104Proposals.getApprovedSeed('ISE-011').status, 'approved');
  assert.equal(current.IE104Proposals.getAll().filter(item => item.status === 'pending').length, 10);
});
test('toàn bộ hồ sơ chờ duyệt không trùng mã hoặc tên với danh mục quản lý đề tài', () => {
  const ctx = setup(), catalog = ctx.UITLecturerCatalog;
  const supervised = catalog.records;
  const pending = ctx.IE104Proposals.getAll().filter(item => catalog.isAvailableTopic(item));
  const key = value => value.normalize('NFC').toLocaleLowerCase('vi').replace(/\s+/g, ' ').trim();
  assert.equal(new Set(pending.map(item => item.id)).size, pending.length);
  assert.equal(new Set(pending.map(item => key(item.title))).size, pending.length);
  for (const item of pending) {
    assert.equal(item.supervisionRole, 'huong-dan-chinh');
    assert.equal(item.supervisionRoleLabel, 'Hướng dẫn chính');
    assert.ok(!supervised.some(topic => key(topic.title) === key(item.title)), item.title);
    assert.ok(!supervised.some(topic => topic.id === item.topicId), item.topicId);
  }
});
test('hồ sơ mới mở được từ store, có nội dung, nguồn và nhãn môn học nhất quán', () => {
  const ctx = setup(), catalog = ctx.UITLecturerCatalog;
  for (const item of catalog.pending.filter(item => item.provenance)) {
    const detail = ctx.IE104Proposals.get(item.id);
    for (const field of ['description', 'objectives', 'outcomes', 'studentName']) assert.ok(detail[field].trim());
    assert.match(detail.studentId, /^(2252|2352|2452|2552)\d{4}$/);
    assert.equal(detail.outline.members[0].code, detail.studentId);
    assert.equal(detail.outline.members[0].name, detail.studentName);
    assert.equal(detail.outline.version, 3);
    assert.ok(detail.outline.startDate < detail.outline.progressReportDate);
    assert.ok(detail.outline.progressReportDate < detail.outline.finalReportDate);
    for (const field of ['description', 'objectives', 'outcomes']) assert.ok(detail[field].length >= 150);
    for (const field of ['methodAndScope', 'plan']) assert.ok(detail.outline[field].length >= 150);
    assert.equal(detail.status, 'pending');
    assert.equal(detail.supervisionRoleLabel, 'Hướng dẫn chính');
    assert.equal(detail.attachment, 'De_cuong_de_xuat_mau.pdf');
    assert.equal(detail.attachmentSample, 'proposal-outline');
    assert.ok(Number.isFinite(Date.parse(detail.submittedAt)));
    assert.ok(['1', '2', '3'].includes(detail.semester));
    assert.ok(new URL(detail.sourceUrl).hostname.endsWith('uit.edu.vn'));
    assert.match(catalog.subjectLabel(detail, true), /^(IE\d{3}|IT\d{3}) - /);
    assert.doesNotMatch(catalog.subjectLabel(detail), /^(IE\d{3}|IT\d{3}) - /);
  }
});
test('duyệt hồ sơ mới của cả ba loại và tải lại vẫn đọc được đề tài đã duyệt', async () => {
  const storage = new Map(), ctx = setup(storage);
  for (const type of ['khoa-luan', 'do-an-tot-nghiep', 'do-an-mon-hoc']) {
    const item = ctx.UITLecturerCatalog.pending.find(item => item.provenance && item.topicType === type);
    await ctx.IE104Proposals.decide(item.id, 'approved');
    const reloaded = setup(storage);
    assert.equal(reloaded.IE104Proposals.getApprovedSeed(item.topicId).title, item.title);
    await assert.rejects(reloaded.IE104Proposals.decide(item.id, 'approved'), /đã được xử lý/);
  }
});

function loadStudentServices(ctx) {
  for (const file of ['data/proposal-actors.js', 'services/storage.js', 'shared/validation.js', 'services/proposal-service.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', file), 'utf8'), ctx, { filename: file });
  }
  return ctx.IE104.services.proposals;
}
test('hai hồ sơ mẫu ở SV dùng cùng dữ liệu và phản ánh quyết định GV', async () => {
  const ctx = setup(), service = loadStudentServices(ctx);
  const seeds = ctx.UITLecturerCatalog.pending.filter(item => item.studentVisible);
  assert.equal(seeds.length, 2);
  assert.deepEqual(plain(seeds.map(item => item.topicType).sort()), ['do-an-tot-nghiep', 'khoa-luan']);
  assert.equal(new Set(ctx.UITLecturerCatalog.pending.map(item => item.studentId)).size, 10);
  for (const seed of seeds) {
    const student = service.listMyTopics().find(item => item.id === seed.id);
    const lecturer = ctx.IE104Proposals.get(seed.id);
    assert.equal(student.status, 'cho-duyet');
    assert.equal(student.title, lecturer.title);
    assert.equal(student.displayId, lecturer.topicCode);
    assert.equal(student.representativeCode, lecturer.studentId);
    assert.equal(student.representativeName, lecturer.studentName);
    assert.deepEqual(plain(student.outline), plain(lecturer.outline));
    assert.ok(service.nextTopicCode(seed.topicType).endsWith('104'));
  }
  await ctx.IE104Proposals.decide(seeds[0].id, 'rejected', 'Cần bổ sung nội dung đánh giá.');
  const updated = service.listMyTopics().find(item => item.id === seeds[0].id);
  assert.equal(updated.status, 'tu-choi');
  assert.equal(updated.feedback, 'Cần bổ sung nội dung đánh giá.');
});
test('đề xuất SV giữ nội dung, ba ngày và tham chiếu tệp khi GV đọc lại sau tải trang', async () => {
  const storage = new Map(), ctx = setup(storage), service = loadStudentServices(ctx);
  ctx.IE104SupervisionEntry = { getTeachers: async () => [{ id: 'placeholder-1', name: 'Nguyễn Văn An' }] };
  await service.listSupervisors();
  const pdf = fs.readFileSync(path.join(__dirname, '../assets/documents/de-cuong-de-xuat-mau.pdf'));
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  const input = {
    title: 'Kiểm thử đồng bộ đề cương và tài liệu đính kèm', type: 'khoa-luan', courseId: 'IE505',
    semester: '1', academicYear: '2026-2027', supervisorId: 'placeholder-1',
    description: 'Mô tả kiểm thử nội dung từ phía sinh viên.', objectives: 'Kiểm tra hồ sơ khớp giữa hai bên.', outcomes: 'Hồ sơ có thể đọc lại đầy đủ.',
    outline: { version: 3, startDate: '2026-12-01', progressReportDate: '2027-01-12', finalReportDate: '2027-02-02',
      methodAndScope: 'Đối chiếu dữ liệu đã lưu và dữ liệu gửi đến giảng viên.', plan: 'Sinh viên chuẩn bị đề cương, giảng viên xem và phản hồi.' },
    attachment: { fileKey: 'qa-uploaded-pdf', name: 'De_cuong_kiem_thu.pdf', type: 'application/pdf', size: pdf.length },
  };
  const created = service.create(input);
  const reloaded = setup(storage), reader = loadStudentServices(reloaded);
  const lecturer = reader.listForLecturer().find(item => item.id === created.id);
  const student = reader.findById(created.id);
  assert.equal(lecturer.status, 'pending');
  for (const field of ['title', 'description', 'objectives', 'outcomes']) assert.equal(lecturer[field], student[field]);
  assert.deepEqual(plain(lecturer.outline), plain(student.outline));
  assert.equal(lecturer.studentId, student.student.code);
  assert.equal(lecturer.attachmentFileKey, student.attachment.fileKey);
  assert.equal(lecturer.attachmentSize, pdf.length);
  assert.equal(lecturer.attachment, student.attachment.name);
});

function loadApprovedView(ctx) {
  for (const file of ['services/approved-project-service.js', 'shared/proposal-outline.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', file), 'utf8'), ctx, { filename: file });
  }
  return ctx.IE104.services.approvedProjects;
}
test('SV gửi → GV duyệt → hai bên đọc đúng ba ngày, phương pháp, kế hoạch và tài liệu sau tải lại', async () => {
  const storage = new Map(), ctx = setup(storage), proposals = loadStudentServices(ctx);
  const approved = loadApprovedView(ctx);
  ctx.IE104SupervisionEntry = { getTeachers: async () => [{ id: 'placeholder-1', name: 'Nguyễn Văn An' }] };
  await proposals.listSupervisors();
  const input = {
    title: 'Kiểm thử thời gian sau duyệt đề xuất', type: 'khoa-luan', courseId: 'IE505',
    semester: '1', academicYear: '2026-2027', supervisorId: 'placeholder-1',
    description: 'Mô tả đề xuất kiểm thử.', objectives: 'Đối chiếu thông tin SV GV.', outcomes: 'Đề tài đã duyệt giữ nguyên nội dung.',
    outline: { version: 3, startDate: '2026-05-13', progressReportDate: '2026-11-20', finalReportDate: '2026-11-27',
      methodAndScope: 'Khảo sát và đối chiếu dữ liệu của hai vai trò.', plan: 'Nhóm trưởng chuẩn bị đề cương và phân công kiểm thử.' },
    attachment: { fileKey: 'uploaded-outline', name: 'De_cuong.pdf', size: 34057, type: 'application/pdf' },
  };
  const request = proposals.create(input);
  const projectId = approved.projectIdFor(request.id);
  assert.equal(approved.get(projectId), null);
  await proposals.decide(request.id, 'approved', '', request.revision);
  const reloaded = setup(storage), reloadedProposals = loadStudentServices(reloaded), reader = loadApprovedView(reloaded);
  const student = reader.forStudent(projectId).project;
  const lecturer = reader.list('lecturer').find(item => item.id === projectId);
  assert.deepEqual(plain(student), plain(lecturer));
  assert.deepEqual(plain(reloaded.IE104.shared.proposalOutline.milestones(student)), ['13/05/2026', '20/11/2026', '27/11/2026']);
  assert.equal(student.methodAndScope, input.outline.methodAndScope);
  assert.equal(student.plan, input.outline.plan);
  assert.equal(student.attachment.fileKey, input.attachment.fileKey);
  assert.equal(student.status, 'dang-thuc-hien');
  const card = reloadedProposals.listMyTopics().find(item => item.id === projectId);
  assert.equal(card.detailUrl, reader.studentUrl(projectId));
  assert.deepEqual(plain(reloaded.IE104.shared.proposalOutline.fields(student)), []);
  const panel = { hidden: false, replaceChildren() {} };
  reloaded.IE104.shared.proposalOutline.render(panel, student);
  assert.equal(panel.hidden, true);
  reloaded.IE104.data.currentStudent = { name: 'Sinh viên khác', code: '25529999' };
  assert.throws(() => reader.forStudent(projectId), /không thuộc nhóm/);
});
test('hồ sơ mẫu SV chuyển đúng trang đang thực hiện khi GV duyệt, không mất đề cương', async () => {
  const ctx = setup(), proposals = loadStudentServices(ctx), approved = loadApprovedView(ctx);
  ctx.IE104.services.projectTeams = { getState: id => { const value = approved.get(id); return { ...value.team, project: value.project }; } };
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js/services/student-submissions-service.js'), 'utf8'), ctx);
  for (const seed of ctx.UITLecturerCatalog.pending.filter(item => item.studentVisible)) {
    await ctx.IE104Proposals.decide(seed.id, 'approved');
    const card = proposals.listMyTopics().find(item => item.requestId === seed.id);
    assert.equal(card.status, 'dang-thuc-hien');
    assert.equal(card.detailUrl, approved.studentUrl(seed.topicId));
    const { project, team } = approved.forStudent(seed.topicId);
    assert.equal(project.displayId, seed.topicCode);
    assert.equal(project.startsAt, seed.outline.startDate);
    assert.equal(project.progressReportDate, seed.outline.progressReportDate);
    assert.equal(project.finalReportDate, seed.outline.finalReportDate);
    assert.equal(project.methodAndScope, seed.outline.methodAndScope);
    assert.equal(team.members[0].code, seed.studentId);
    assert.equal(team.members[0].role, 'nhom-truong');
    const submissions = ctx.IE104.services.studentSubmissions.forStudent(seed.topicId);
    assert.equal(submissions.requirements.length, 0);
    assert.equal(submissions.canUpload, false);
  }
});
test('không dùng ngày duyệt làm ngày bắt đầu, giữ ba ngày riêng từ đăng ký và đề tài cũ', () => {
  const ctx = setup(); loadStudentServices(ctx); loadApprovedView(ctx);
  const view = ctx.IE104.shared.proposalOutline;
  assert.deepEqual(plain(view.milestones({ source: 'approved-proposal', createdAt: '2026-11-25T09:00:00Z' })),
    ['Chưa có mốc thời gian', 'Chưa có mốc thời gian', 'Chưa có mốc thời gian']);
  assert.deepEqual(plain(view.milestones({ startsAt: '2026-05-13', progressReportDate: '2026-11-20', finalReportDate: '2026-11-27' })),
    ['13/05/2026', '20/11/2026', '27/11/2026']);
  assert.deepEqual(plain(view.milestones({ milestones: ['01/10/2026', '15/11/2026', '20/12/2026'] })),
    ['01/10/2026', '15/11/2026', '20/12/2026']);
  const legacy = { outline: { version: 1, startDate: '2026-05-13', endDate: '2026-11-27', englishTitle: 'Legacy title' } };
  assert.deepEqual(plain(view.milestones(legacy)), ['13/05/2026', 'Chưa có mốc thời gian', '27/11/2026']);
  assert.deepEqual(plain(view.fields(legacy)), [['Tên đề tài tiếng Anh', 'Legacy title']]);
});
