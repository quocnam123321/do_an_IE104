const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Minimal DOM fixture for the overview renderer. The application services are
// loaded unchanged, with an isolated localStorage for each test.
class Element {
  constructor(tag) {
    this.tag = tag;
    this.children = [];
    this.attributes = {};
    this.classList = { add: name => { this.className = name; } };
  }

  append(...nodes) {
    for (const node of nodes) if (node instanceof Element) node.parentElement = this;
    this.children.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.children = [];
    this.append(...nodes);
  }

  before(...nodes) {
    const siblings = this.parentElement.children;
    siblings.splice(siblings.indexOf(this), 0, ...nodes);
  }

  after(...nodes) {
    const siblings = this.parentElement.children;
    siblings.splice(siblings.indexOf(this) + 1, 0, ...nodes);
  }

  remove() {
    const siblings = this.parentElement.children;
    siblings.splice(siblings.indexOf(this), 1);
  }

  setAttribute(name, value) { this.attributes[name] = String(value); }

  querySelectorAll(selector) {
    return this.children.filter(node => node instanceof Element &&
      (selector.startsWith('.') ? node.className === selector.slice(1) : node.tag === selector));
  }

  querySelector(selector) {
    if (selector === 'text:nth-of-type(2)') return this.querySelectorAll('text')[1];
    return this.querySelectorAll(selector)[0];
  }
}

function setup(protocol) {
  const data = new Map();
  const events = new Map();
  const labels = ['Đang thực hiện', 'Đang mở đăng ký', 'Hoàn thành', 'Đã đóng đăng ký'];
  const chart = new Element('svg');
  chart.namespaceURI = 'http://www.w3.org/2000/svg';
  const chartContent = new Element('div');
  chartContent.append(chart);
  const segments = labels.map(() => new Element('circle'));
  const legend = labels.map(label => {
    const row = new Element('div');
    const term = new Element('dt');
    term.textContent = label;
    row.append(term, new Element('dd'));
    return row;
  });
  const chartLabels = new Element('g');
  chartLabels.append(new Element('text'), new Element('text'));
  chart.append(...segments, chartLabels);
  const counts = Object.fromEntries(['total', 'created', 'supervised', 'pending'].map(key => [key, new Element('strong')]));
  const progress = new Element('div');
  const pending = new Element('div');
  const empty = new Element('p');
  const warning = new Element('p');
  const nodes = {
    '.topic-status__chart': chart, '.supervised-progress__list': progress,
    '.pending-requests__list': pending, '#overview-storage-warning': warning,
    '#lecturer-overview-status': new Element('p'),
    '#topic-status-empty': empty, '#status-chart-title': new Element('title'),
    '#status-chart-description': new Element('desc'),
  };
  for (const [key, node] of Object.entries(counts)) nodes[`[aria-labelledby="${key}-count-title"] strong`] = node;

  const context = vm.createContext({
    location: protocol && { protocol },
    navigator: {},
    document: {
      querySelector: selector => nodes[selector],
      querySelectorAll: () => legend,
      createElement: tag => new Element(tag),
      createElementNS: (_, tag) => new Element(tag),
    },
    localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) },
    addEventListener(name, listener) {
      if (!events.has(name)) events.set(name, []);
      events.get(name).push(listener);
    },
  });
  context.window = context;
  const files = [
    'shared/topic-identity', 'teacher-topic-store', 'proposal-store', 'data/mock-data', 'data/student-projects',
    'data/student-progress', 'data/teaching-data', 'services/storage', 'services/project-team-service',
    'services/project-progress-service', 'services/teaching-service',
  ];
  if (protocol === 'file:') {
    files.unshift('uit-lecturer-catalog');
    files.push('data/lecturer-topics', 'data/lecturer-merge-catalog', 'services/lecturer-topic-repository',
      'services/proposal-service', 'services/registration-service', 'services/approved-project-service',
      'services/lecturer-topic-service');
  }
  files.push('pages/lecturer/overview');
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', file + '.js'), 'utf8'), context);
  }
  return {
    data, context, counts, chartContent, chartLabels, segments, legend, progress, pending, empty, warning,
    emit(name, event = {}) { for (const listener of events.get(name) || []) listener(event); },
  };
}

test('demo counts, chart slices and on-chart percentages agree', () => {
  const { context, counts, legend, segments, chartLabels } = setup();
  const pending = context.IE104Proposals.getAll().filter(record => record.status === 'pending').length;
  assert.deepEqual(Object.values(counts).map(node => node.textContent), [7, 5, 1, pending]);
  assert.deepEqual(legend.map(row => row.querySelector('dd').textContent), [1, 2, 2, 2]);
  assert.deepEqual(chartLabels.querySelectorAll('.topic-status__percent')
    .map(label => parseFloat(label.textContent.replace(',', '.'))), [14.3, 28.6, 28.6, 28.6]);
  const circumference = segments.reduce((sum, segment) => sum + parseFloat(segment.attributes['stroke-dasharray']), 0);
  assert.ok(Math.abs(circumference - 100) < 1e-8);
});

test('progress and pending cards open the correct project and proposal IDs', () => {
  const { context, progress, pending } = setup();
  const project = progress.children.find(card => card.querySelector('a').href.includes('project=GV-DT001-N01'));
  assert.match(project.querySelector('a').href, /\?project=GV-DT001-N01#tien-do$/);
  const service = context.IE104.services.projectProgress;
  const meter = project.querySelectorAll('p').flatMap(node => node.querySelectorAll('progress'))[0];
  assert.equal(meter.value, service.summarize(service.getState('GV-DT001-N01')).percent);
  const ids = pending.children.map(card => new URL(card.querySelector('a').href, 'https://example.test/').searchParams.get('ma'));
  assert.equal(new Set(ids).size, pending.children.length);
  assert.deepEqual(ids.sort(), Array.from(context.IE104Proposals.getAll(), record => record.id).sort());
});

test('approval refreshes counts and chart without duplicating labels', async () => {
  const { context, counts, pending, progress, chartLabels } = setup();
  const record = context.IE104Proposals.get('DX-GV002');
  const initialPending = pending.children.length;
  await context.IE104Proposals.decide(record.id, 'approved');
  assert.equal(counts.pending.textContent, initialPending - 1);
  assert.equal(counts.supervised.textContent, 2);
  assert.equal(counts.total.textContent, 8);
  assert.equal(pending.children.length, initialPending - 1);
  const approvedCard = progress.children.find(card => card.querySelector('a').href.includes('ma=' + record.id));
  assert.match(approvedCard.querySelector('a').href, new RegExp('ma=' + record.id + '&'));
  assert.ok(approvedCard.querySelectorAll('p').some(node => node.textContent === 'Chưa có dữ liệu tiến độ.'));
  const labels = chartLabels.querySelectorAll('.topic-status__percent');
  assert.equal(labels.length, 4);
  assert.equal(parseFloat(labels[0].textContent.replace(',', '.')), 25);
});

test('empty data hides the chart and shows separate empty messages', async () => {
  const { context, counts, pending, progress, chartContent, empty } = setup();
  context.localStorage.setItem(context.TeacherTopicStore.key, '[]');
  context.IE104.data.projectTeams.length = 0;
  for (const record of context.IE104Proposals.getAll()) {
    await context.IE104Proposals.decide(record.id, 'rejected', 'Lý do từ chối phù hợp.');
  }
  assert.deepEqual(Object.values(counts).map(node => node.textContent), [0, 0, 0, 0]);
  assert.equal(chartContent.hidden, true);
  assert.equal(empty.hidden, false);
  assert.match(empty.textContent, /Chưa có đề tài/);
  assert.equal(progress.children[0].textContent, 'Chưa có đề tài đang hướng dẫn.');
  assert.equal(pending.children[0].textContent, 'Không có yêu cầu chờ duyệt.');
});

test('a storage change refreshes the overview and corrupt data is reported', () => {
  const { context, data, emit, counts, warning, chartContent } = setup();
  const store = context.TeacherTopicStore;
  data.set(store.key, JSON.stringify(store.read().slice(0, 1)));
  emit('storage', { key: store.key });
  assert.equal(counts.created.textContent, 1);
  data.set(store.key, 'invalid JSON');
  emit('storage', { key: store.key });
  assert.equal(counts.created.textContent, '—');
  assert.equal(counts.total.textContent, '—');
  assert.equal(warning.hidden, false);
  assert.equal(chartContent.hidden, true);
});

test('opening the overview as a file shows the bundled catalog while saved data is unavailable', () => {
  const { context, counts, chartContent, chartLabels, legend, warning, progress, pending } = setup('file:');
  const catalog = context.UITLecturerCatalog;
  assert.equal(counts.created.textContent, catalog.created.length);
  assert.equal(counts.supervised.textContent, catalog.supervised.length);
  assert.equal(counts.pending.textContent, pending.children.length);
  assert.equal(chartContent.hidden, false);
  const total = legend.reduce((sum, row) => sum + row.querySelector('dd').textContent, 0);
  assert.equal(counts.total.textContent, total);
  assert.equal(chartLabels.querySelector('text:nth-of-type(2)').textContent, total);
  assert.match(warning.textContent, /localhost/);
  assert.match(progress.children.find(card => card.querySelector('a').href.includes('ISEDATN-001')).querySelector('a').href,
    /\?topic=ISEDATN-001#tien-do$/);
});
