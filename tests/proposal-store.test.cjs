const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/proposal-store.js'), 'utf8');

function setup({ storage = new Map(), blocked = false, locks, data } = {}) {
  const events = new Map();
  const window = {
    IE104: { data },
    localStorage: {
      getItem(key) { if (blocked) throw new Error('Storage blocked'); return storage.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('Storage blocked'); storage.set(key, value); },
    },
    addEventListener(type, callback) { events.set(type, callback); },
  };
  vm.runInNewContext(source, { window, navigator: { locks } });
  return { store: window.IE104Proposals, storage, events };
}

test('mã demo không trùng hồ sơ sinh viên; dữ liệu trả về không làm thay đổi seed', () => {
  const { store } = setup();
  const all = store.getAll();
  assert.equal(all.length, 6);
  assert.equal(new Set(all.map(record => record.id)).size, 6);
  assert.equal(store.get('DX001').title, 'Cổng thông tin nghiên cứu sinh viên');
  all[0].title = 'Changed';
  assert.equal(store.get('DX-GV001').title, 'Website quản lý thư viện');
});

test('duyệt cập nhật đúng đề tài, tải lại vẫn giữ kết quả, không xử lý lần hai', async () => {
  const { store, storage } = setup();
  let updates = 0;
  store.subscribe(() => updates++);
  const result = await store.decide('DX001', 'approved');
  assert.equal(result.topicStatus, 'in-progress');
  assert.equal(result.topicId, 'DT-DX001');
  assert.equal(updates, 1);
  assert.equal(setup({ storage }).store.get('DX001').status, 'approved');
  await assert.rejects(store.decide('DX001', 'rejected', 'Lý do từ chối hợp lệ'), /đã được xử lý/);
  assert.equal(store.get('DX-GV001').status, 'pending');
});

test('đề tài demo đã duyệt vẫn mở được sau khi chuyển sang danh mục UIT', async () => {
  const { store: original, storage } = setup();
  await original.decide('DX-GV005', 'approved');
  await original.decide('DX-GV002', 'rejected', 'Cần bổ sung mục tiêu và phạm vi.');
  const data = {
    currentLecturer: { id: 'GV001' },
    lecturerRealProposalSeeds: [{ id: 'DX-ISE-001', topicId: 'DT-DX-ISE-001' }],
  };
  const { store } = setup({ storage, data });
  assert.deepEqual(Array.from(store.getAll(), record => record.id), ['DX-ISE-001', 'DX-GV005']);
  assert.equal(store.getApprovedSeed('DT-GV005').id, 'DX-GV005');
  assert.equal(store.getApprovedSeed('DT-GV002'), null);
  assert.equal(store.getApprovedSeed('DT-GV004'), null);
  assert.equal(store.getApprovedSeed('DT-UNKNOWN'), null);
  await store.decide('DX-ISE-001', 'approved');
  assert.equal(store.getApprovedSeed('DT-DX-ISE-001').id, 'DX-ISE-001');
  data.currentLecturer = { id: 'GV002' };
  assert.equal(store.getApprovedSeed('DT-GV005'), null);
});

test('từ chối kiểm tra lý do đã trim và chỉ ghi khi đủ điều kiện', async () => {
  const { store, storage } = setup();
  for (const reason of ['', '     ', '  ngắn  ']) {
    await assert.rejects(store.decide('DX-GV002', 'rejected', reason), /10 ký tự/);
    assert.equal(storage.size, 0);
  }
  await store.decide('DX-GV002', 'rejected', '  Cần bổ sung mục tiêu và phạm vi.  ');
  assert.equal(store.get('DX-GV002').reason, 'Cần bổ sung mục tiêu và phạm vi.');
  assert.equal(store.get('DX-GV002').topicStatus, 'rejected');
});

test('mã, quyết định, dữ liệu hỏng và quyền lưu trữ không tạo kết quả giả', async () => {
  const { store, storage } = setup();
  await assert.rejects(store.decide('DX404', 'approved'), /Không tìm thấy/);
  await assert.rejects(store.decide('DX001', 'other'), /không hợp lệ/);
  assert.equal(storage.size, 0);
  storage.set('ie104.proposal-decision.v1.DX001', '{broken');
  assert.equal(store.get('DX001').status, 'pending');
  assert.ok(store.getError());
  await assert.rejects(store.decide('DX001', 'approved'));
  assert.equal(storage.get('ie104.proposal-decision.v1.DX001'), '{broken');
  const denied = setup({ blocked: true });
  await assert.rejects(denied.store.decide('DX001', 'approved'));
  assert.equal(denied.store.get('DX001').status, 'pending');
});

test('khóa dùng chung ngăn hai tab ghi hai quyết định cho cùng hồ sơ', async () => {
  const storage = new Map();
  let queue = Promise.resolve();
  const locks = { request: (_, callback) => {
    const result = queue.then(callback);
    queue = result.catch(() => {});
    return result;
  } };
  const first = setup({ storage, locks }).store;
  const second = setup({ storage, locks }).store;
  const results = await Promise.allSettled([
    first.decide('DX001', 'approved'),
    second.decide('DX001', 'rejected', 'Cần bổ sung phạm vi thực hiện.'),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(second.get('DX001').status, 'approved');
});
