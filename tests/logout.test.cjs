const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../assets/js/shared/logout.js'), 'utf8');

function setup() {
  const events = [];
  const controls = Array.from({ length: 2 }, () => ({
    textContent: 'Đăng xuất', disabled: true, attributes: new Map([['aria-controls', 'logout-dialog'], ['aria-haspopup', 'dialog']]),
    listeners: [],
    setAttribute(key, value) { this.attributes.set(key, value); },
    removeAttribute(key) { this.attributes.delete(key); },
    addEventListener(name, handler) { if (name === 'click') this.listeners.push(handler); },
    focus() { this.focused = true; },
  }));
  const dialog = { remove() { this.removed = true; }, showModal() { throw Error('Không được mở xác nhận'); } };
  let feedback, fail = false;
  const document = {
    currentScript: { src: 'file:///C:/site/assets/js/shared/logout.js' },
    getElementById: () => dialog,
    querySelectorAll: () => controls,
    querySelector: () => feedback || null,
    createElement: () => ({ setAttribute() {}, hidden: true }),
    body: { append(node) { feedback = node; } },
  };
  const context = vm.createContext({ document, URL,
    location: { protocol: 'file:', replace(url) { events.push(['redirect', url]); } },
    sessionStorage: { removeItem(key) { events.push(['clear', key]); if (fail) throw Error('Storage blocked'); } },
  });
  context.window = context;
  vm.runInContext(source, context);
  return { context, controls, dialog, events, feedback: () => feedback,
    fail(value) { fail = value; },
    click: (index = 0) => controls[index].listeners[0]({ preventDefault() {} }),
  };
}

test('đăng xuất ngay bằng một lần bấm, không mở hộp thoại, chỉ chuyển trang sau khi dọn trạng thái', async () => {
  const app = setup();
  assert.ok(app.dialog.removed);
  assert.ok(app.controls.every(button => !button.disabled && !button.attributes.has('aria-haspopup')));
  await app.click();
  assert.deepEqual(app.events, [['clear', 'ie104-calendar-selection'], ['redirect', 'file:///C:/site/pages/chung/dang-nhap.html']]);
  assert.ok(app.controls.every(button => button.disabled));
  await app.click(1);
  assert.equal(app.events.length, 2);
});

test('lỗi đăng xuất không chuyển trang, khôi phục cả hai nút và cho phép thử lại', async () => {
  const app = setup();
  app.fail(true);
  await app.click();
  assert.ok(app.events.every(event => event[0] !== 'redirect'));
  assert.match(app.feedback().textContent, /Không thể đăng xuất/);
  assert.equal(app.feedback().hidden, false);
  assert.ok(app.controls.every(button => !button.disabled && button.textContent === 'Đăng xuất' && !button.attributes.has('aria-busy')));
  assert.ok(app.controls[0].focused);
  app.fail(false);
  await app.click();
  assert.equal(app.feedback().hidden, true);
  assert.equal(app.events.at(-1)[0], 'redirect');
});

test('menu công khai gắn lại không nhân đôi xử lý và vẫn hoạt động nếu thiếu dialog cũ', async () => {
  const app = setup();
  app.context.IE104BindLogout(null, app.controls, new URL('file:///C:/site/pages/chung/dang-nhap.html'));
  assert.ok(app.controls.every(button => button.listeners.length === 1));
  await app.click();
  assert.equal(app.events.filter(event => event[0] === 'redirect').length, 1);
});
