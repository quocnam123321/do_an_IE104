const assert = require('node:assert/strict');
const { Blob, File } = require('node:buffer');
const { webcrypto } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../web/assets/js/supervision-store.js'), 'utf8');

const teacher = { id: 'giang-vien-1', name: 'TS. Nguyễn Văn Kiệt' };
const draft = { teacher, subject: ' Xin hướng dẫn khóa luận ', message: ' Em muốn trao đổi về ý tưởng. ' };

function setup({ records = new Map(), locks, blocked = false } = {}) {
  const events = new Map();
  const window = {
    get localStorage() {
      if (blocked) throw new Error('Storage blocked');
      return {
        get length() { return records.size; },
        key(index) { return Array.from(records.keys())[index] ?? null; },
        getItem(key) { return records.get(key) ?? null; },
        setItem(key, value) { records.set(key, value); },
      };
    },
    addEventListener(type, callback) { events.set(type, callback); },
  };
  vm.runInNewContext(source, { window, navigator: { locks }, crypto: webcrypto, Event, EventTarget, File, Blob, structuredClone });
  return { store: window.IE104Supervision, events, records };
}

test('bốn lời mời mẫu của sinh viên có bốn người nhận và lưu phản hồi giữa hai vai trò demo', async () => {
  const { store, records } = setup();
  const demo = { demo: true };
  const invitations = store.listForTeacher(demo);
  assert.equal(invitations.length, 7);
  assert.equal(records.size, 0);
  assert.equal(store.getAll().length, 0);
  assert.equal(store.listForTeacher({ teacherIds: [invitations[0].teacher.id] }).length, 0);
  assert.equal(store.listForStudent({ id: 'firebase:other-student' }).length, 0);

  const studentInvitations = store.listForStudent(store.student);
  assert.deepEqual(Array.from(studentInvitations, item => item.id), ['inv-demo-01', 'inv-demo-05', 'inv-demo-06', 'inv-demo-07']);
  assert.equal(new Set(studentInvitations.map(item => item.teacher.id)).size, 4);
  assert.deepEqual(studentInvitations, invitations.filter(item => store.studentCode(item) === store.student.id));

  const first = invitations[0];
  assert.equal(first.id, 'inv-demo-01');
  assert.equal(store.studentCode(first), '24520001');
  assert.equal(store.needsTeacherReply(first), true);
  await store.reply(first.id, { role: 'teacher', id: first.teacher.id }, 'Thầy có thể xem đề cương trước buổi trao đổi.');

  const { store: reloaded } = setup({ records });
  const saved = reloaded.listForTeacher(demo);
  assert.equal(saved.length, 7);
  assert.equal(saved.find(item => item.id === first.id).messages.length, 2);
  assert.equal(reloaded.listForStudent(reloaded.student).find(item => item.id === first.id).messages.length, 2);
  assert.deepEqual(Array.from(saved.filter(reloaded.needsTeacherReply), item => item.id), ['inv-demo-02', 'inv-demo-03', 'inv-demo-04', 'inv-demo-05', 'inv-demo-06', 'inv-demo-07']);
  assert.equal(reloaded.getAll().length, 0);
});

test('các lượt trả lời đồng thời được lưu trước quyết định và chỉ chốt một lần', async () => {
  const records = new Map();
  const queues = new Map();
  const locks = {
    request(key, callback) {
      const result = (queues.get(key) ?? Promise.resolve()).then(callback);
      queues.set(key, result.catch(() => {}));
      return result;
    },
  };
  const { store: studentTab } = setup({ records, locks });
  const { store: teacherTab } = setup({ records, locks });
  const invitation = await studentTab.create(draft);
  const student = { role: 'student', id: studentTab.student.id };
  const lecturer = { role: 'teacher', id: teacher.id };

  await Promise.all([
    teacherTab.reply(invitation.id, lecturer, 'Em dự kiến dùng dữ liệu nào?'),
    studentTab.reply(invitation.id, student, 'Em dự kiến dùng khảo sát ẩn danh ạ.'),
  ]);
  const decisions = await Promise.allSettled([
    teacherTab.decide(invitation.id, teacher.id, 'accepted', ' Thầy đồng ý hướng dẫn. '),
    studentTab.decide(invitation.id, teacher.id, 'rejected'),
  ]);
  assert.equal(decisions[0].status, 'fulfilled');
  assert.equal(decisions[1].status, 'rejected');
  await assert.rejects(studentTab.reply(invitation.id, student, 'Em cảm ơn thầy.'), /đã phản hồi/);

  const [saved] = setup({ records }).store.getAll();
  assert.equal(saved.subject, 'Xin hướng dẫn khóa luận');
  assert.deepEqual(Array.from(saved.messages, (message) => message.role), ['student', 'teacher', 'student']);
  assert.equal(saved.status, 'accepted');
  assert.equal(saved.decision.note, 'Thầy đồng ý hướng dẫn.');
});

test('lời mời kiểm tra người tham gia, nội dung và dữ liệu đã lưu', async () => {
  const { store, records } = setup();
  await assert.rejects(store.create({ ...draft, subject: '   ' }), /nhập tiêu đề/);
  await assert.rejects(store.create({ ...draft, message: 'a'.repeat(2001) }), /2000 ký tự/);
  assert.equal(records.size, 0);

  const invitation = await store.create(draft);
  await assert.rejects(store.reply(invitation.id, { role: 'teacher', id: 'giang-vien-2' }, 'Chào em.'), /đúng vai trò/);
  await assert.rejects(store.decide(invitation.id, 'giang-vien-2', 'accepted'), /giảng viên nhận lời mời/);
  assert.equal(store.getAll()[0].messages.length, 1);
  assert.equal(store.getAll()[0].status, 'pending');

  const key = records.keys().next().value;
  records.set(key, '{broken');
  assert.throws(() => store.getAll(), /không hợp lệ/);
  await assert.rejects(store.decide(invitation.id, teacher.id, 'rejected'), /không hợp lệ/);
  assert.equal(records.get(key), '{broken');
});

test('chỉ báo thay đổi sau khi lưu và khi tab nhận thông báo dữ liệu', async () => {
  const { store, events, records } = setup();
  let updates = 0;
  const unsubscribe = store.subscribe(() => updates++);
  await store.create(draft);
  assert.equal(updates, 1);
  events.get('storage')({ key: 'khong-lien-quan' });
  assert.equal(updates, 1);
  events.get('storage')({ key: records.keys().next().value });
  events.get('pageshow')();
  assert.equal(updates, 3);
  unsubscribe();
  events.get('storage')({ key: null });
  assert.equal(updates, 3);

  const denied = setup({ blocked: true });
  denied.store.subscribe(() => { updates++; });
  assert.throws(() => denied.store.getAll(), /quyền lưu trữ/);
  await assert.rejects(denied.store.create(draft), /Không lưu được/);
  assert.equal(updates, 3);
});

test('tệp trống, quá dung lượng hoặc không lưu được đều không tạo lời mời', async () => {
  const { store, records } = setup();
  let updates = 0;
  store.subscribe(() => updates++);
  const empty = new File([], 'trong.pdf');
  const oversized = new File([new Uint8Array(store.attachmentLimit + 1)], 'lon.pdf');
  const valid = new File(['Nội dung'], 'de-cuong.pdf');

  await assert.rejects(store.create({ ...draft, attachment: empty }), /đang trống/);
  await assert.rejects(store.create({ ...draft, attachment: oversized }), /vượt quá 10 MB/);
  await assert.rejects(store.create({ ...draft, attachment: valid }), /Không lưu được tệp đính kèm/);
  assert.equal(records.size, 0);
  assert.equal(updates, 0);

  const record = await store.create(draft);
  await assert.rejects(store.reply(record.id, { role: 'teacher', id: teacher.id }, 'Xem nhận xét.', valid), /Không lưu được tệp đính kèm/);
  assert.equal(store.getAll()[0].messages.length, 1);
  assert.equal(updates, 1);
});

test('sinh viên chỉ đánh dấu phản hồi đã hiện trong bản lời mời đang xem', async () => {
  const { store, records } = setup();
  const lecturer = { role: 'teacher', id: teacher.id };
  const student = { role: 'student', id: store.student.id };
  const invitation = await store.create(draft);
  assert.equal(store.getUnreadResponses(invitation), 0);
  assert.equal(store.needsTeacherReply(invitation), true);

  const first = await store.reply(invitation.id, lecturer, 'Em dự định khảo sát bao nhiêu người?');
  assert.equal(store.getUnreadResponses(first), 1);
  assert.equal(store.needsTeacherReply(first), false);
  const followUp = await store.reply(invitation.id, student, 'Em dự định khảo sát 50 người.');
  assert.equal(store.getUnreadResponses(followUp), 1);
  assert.equal(store.needsTeacherReply(followUp), true);
  const second = await store.reply(invitation.id, lecturer, 'Em gửi thêm bộ câu hỏi dự kiến nhé.');
  assert.equal(store.getUnreadResponses(second), 2);

  assert.equal(await store.markResponsesRead(first), true);
  assert.equal(store.getUnreadResponses(second), 1);
  const decided = await store.decide(invitation.id, teacher.id, 'accepted');
  assert.equal(store.getUnreadResponses(decided), 2);
  assert.equal(store.needsTeacherReply(decided), false);

  const { store: reloaded } = setup({ records });
  assert.equal(reloaded.getAll().length, 1);
  const [saved] = reloaded.getAll();
  assert.equal(reloaded.getUnreadResponses(saved), 2);
  assert.equal(await reloaded.markResponsesRead(saved), true);
  assert.equal(await store.markResponsesRead(second), false);
  assert.equal(store.getUnreadResponses(saved), 0);
});

test('trạng thái đã xem cập nhật giữa các tab và không phát lại khi không đổi', async () => {
  const { store, records } = setup();
  const invitation = await store.create(draft);
  const rejected = await store.decide(invitation.id, teacher.id, 'rejected');
  const requestedLocks = [];
  const locks = { request(key, advance) { requestedLocks.push(key); return Promise.resolve().then(advance); } };
  const { store: firstTab } = setup({ records, locks });
  const { store: secondTab, events } = setup({ records });
  let localUpdates = 0;
  const observed = [];
  firstTab.subscribe(() => localUpdates++);
  secondTab.subscribe(() => observed.push(secondTab.getUnreadResponses(rejected)));

  assert.equal(secondTab.getUnreadResponses(rejected), 1);
  assert.equal(await firstTab.markResponsesRead(invitation), false);
  assert.deepEqual(await Promise.all([firstTab.markResponsesRead(rejected), firstTab.markResponsesRead(rejected)]), [true, false]);
  assert.equal(localUpdates, 1);
  assert.equal(requestedLocks.length, 2);
  assert.equal(requestedLocks[0], requestedLocks[1]);
  events.get('storage')({ key: requestedLocks[0] });
  assert.deepEqual(observed, [0]);

  const blocked = setup({ records, blocked: true }).store;
  assert.throws(() => blocked.getUnreadResponses(rejected), /quyền lưu trữ/);
  await assert.rejects(blocked.markResponsesRead(rejected), /quyền lưu trữ/);
});
