const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function setup() {
  const data = new Map();
  const localStorage = { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
  const context = { window: { localStorage, navigator: {} } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('assets/js/teacher-topic-store.js', 'utf8'), context);
  const store = context.window.TeacherTopicStore;
  const valid = { ...store.read()[0], id: 'new', code: 'NEW001', name: 'Đề tài mới', description: 'Mô tả',
    objectives: 'Mục tiêu', outcomes: 'Kết quả', requirements: 'Yêu cầu', closes: '2026-12-01T10:00',
    opens: '', starts: '', ends: '' };
  return { store, data, localStorage, valid, navigator: context.window.navigator };
}

test('create persists, edit selects exact ID and preserves untouched content and other topics', async () => {
  const { store, valid } = setup();
  const before = JSON.stringify(store.read());
  const created = await store.save(valid, 0, 'create');
  assert.equal(created.code, 'DA006');
  assert.equal(created.revision, 1);
  assert.equal(JSON.stringify(store.read().filter(t => t.id !== 'new')), before);
  const edited = { ...created, name: 'Đã sửa', type: 'thesis', opens: '2026-11-01T10:00', ends: '2027-01-01T10:00' };
  await store.save(edited, 1, 'edit');
  assert.equal(store.read().find(t => t.id === 'new').name, 'Đã sửa');
  assert.equal(store.read().find(t => t.id === 'new').code, 'DA006');
  assert.equal(store.read().find(t => t.id === 'new').outcomes, 'Kết quả');
  assert.equal(JSON.stringify(store.read().filter(t => t.id !== 'new')), before);
});

test('required fields match each existing form; invalid codes, members and dates are rejected', () => {
  const { store, valid } = setup();
  assert.equal(Object.keys(store.validate(valid, store.read(), 'create')).length, 0);
  assert.ok(store.validate(valid, store.read(), 'edit').opens);
  assert.ok(store.validate({ ...valid, code: 'da001' }, store.read(), 'edit').code);
  for (const [patch, key] of [[{ name: '  ' }, 'name'], [{ type: '' }, 'type'],
    [{ minimum: '1.5' }, 'minimum'], [{ minimum: '0' }, 'minimum'], [{ minimum: '4', maximum: '3' }, 'maximum'],
    [{ closes: '2026-02-30T10:00' }, 'closes'], [{ closes: '2026-12-01T25:00' }, 'closes'],
    [{ opens: valid.closes }, 'closes'], [{ ends: valid.closes }, 'ends'],
    [{ starts: '2027-01-02', ends: '2027-01-01T10:00' }, 'starts']]) {
    assert.ok(store.validate({ ...valid, ...patch }, store.read(), 'create')[key], key);
  }
});

test('stale edits, changed read-only codes and full storage cannot overwrite records', async () => {
  const { store, localStorage, valid } = setup();
  const created = await store.save(valid, 0, 'create');
  const edit = { ...created, opens: '2026-11-01T10:00', ends: '2027-01-01T10:00' };
  await store.save({ ...edit, name: 'Tab 1' }, 1, 'edit');
  await assert.rejects(store.save({ ...edit, name: 'Tab 2' }, 1, 'edit'), /tab khác/);
  await assert.rejects(store.save({ ...edit, code: 'CHANGE' }, 2, 'edit'), /mã đề tài/);
  const before = JSON.stringify(store.read());
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(store.save(edit, 2, 'edit'), /Quota/);
  assert.equal(JSON.stringify(store.read()), before);
});

test('corrupted storage is reported and left intact', () => {
  const { store, data } = setup();
  for (const value of ['broken JSON', '{}', '[{"id":"x"}]']) {
    data.set(store.key, value);
    assert.throws(() => store.read());
    assert.equal(data.get(store.key), value);
  }
});

test('codes are allocated separately by type with the latest records inside the write lock', async () => {
  const { store, valid, navigator } = setup();
  let queue = Promise.resolve();
  navigator.locks = { request(key, write) {
    assert.equal(key, store.key);
    const result = queue.then(write);
    queue = result.catch(() => {});
    return result;
  } };
  const types = ['course', 'graduation', 'thesis', 'course', 'thesis'];
  const created = await Promise.all(types.map((type, index) =>
    store.save({ ...valid, id: 'new-' + index, code: undefined, type }, 0, 'create')));
  assert.deepEqual(created.map(topic => topic.code), ['DA006', 'DATN001', 'KL001', 'DA007', 'KL002']);
});

test('legacy codes continue the sequence and a failed save does not consume a number', async () => {
  const { store, data, localStorage, valid } = setup();
  data.set(store.key, JSON.stringify([...store.read(), { ...valid, id: 'legacy', code: ' kl009 ' }]));
  const draft = { ...valid, type: 'thesis', code: 'IGNORED' };
  const before = data.get(store.key);
  await assert.rejects(store.save({ ...draft, type: '' }, 0, 'create'), /Dữ liệu chưa hợp lệ/);
  const write = localStorage.setItem;
  localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
  await assert.rejects(store.save(draft, 0, 'create'), /Quota/);
  assert.equal(data.get(store.key), before);
  localStorage.setItem = write;
  assert.equal((await store.save(draft, 0, 'create')).code, 'KL010');
});

test('creation form exposes a read-only code with an associated hint', () => {
  const html = fs.readFileSync('pages/giang-vien/tao-de-tai-giang-vien.html', 'utf8');
  const field = html.match(/<input\b[^>]*\bid="topic-code"[^>]*>/)?.[0] || '';
  assert.match(field, /\breadonly\b/);
  assert.match(field, /aria-describedby="topic-code-hint"/);
  assert.doesNotMatch(field, /\brequired\b/);
  assert.match(html, /id="topic-code-hint" role="status"/);
});
