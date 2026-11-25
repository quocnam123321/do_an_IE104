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
    assert.equal(detail.studentId, 'xxxxxxxx');
    assert.equal(detail.status, 'pending');
    assert.equal(detail.supervisionRoleLabel, 'Hướng dẫn chính');
    assert.equal(detail.attachment, '');
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
