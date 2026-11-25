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

function setup(protocol = 'http:') {
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
    URL, URLSearchParams, location: { protocol },
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
  const page = fs.readFileSync(path.join(__dirname, '../pages/giang-vien/tong-quan-giang-vien.html'), 'utf8');
  const files = Array.from(page.matchAll(/<script\s+src="\.\.\/\.\.\/assets\/js\/([^?"]+\.js)(?:\?[^"]*)?"/g), match => match[1])
    .filter(file => /^(uit-lecturer-catalog|shared\/(topic-identity|validation)|teacher-topic-store|data\/|services\/|proposal-store|pages\/lecturer\/overview)/.test(file));
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/js', file), 'utf8'), context, { filename: file });
  }
  return {
    data, context, counts, chartContent, chartLabels, segments, legend, progress, pending, empty, warning,
    emit(name, event = {}) { for (const listener of events.get(name) || []) listener(event); },
  };
}

test('chart slices match the counts and only larger slices show percentage labels', () => {
  const { context, counts, legend, segments, chartLabels } = setup();
  const { lecturerTopics } = context.IE104.services;
  const created = lecturerTopics.list('created').filter(lecturerTopics.isListedInCreatedTab);
  const pending = context.IE104Proposals.getAll().filter(record => record.status === 'pending').length;
  const categories = legend.map(row => row.querySelector('dd').textContent);
  const total = categories.reduce((sum, count) => sum + count, 0);
  assert.deepEqual(Object.values(counts).map(node => node.textContent), [total, created.length, categories[0], pending]);
  assert.equal(categories[1], created.filter(topic => topic.status === 'open').length);
  assert.equal(categories[3], created.filter(topic => topic.status === 'closed').length);
  assert.ok(categories.every(count => count > 0));
  const labels = chartLabels.querySelectorAll('.topic-status__percent');
  assert.deepEqual(labels.map(label => parseFloat(label.textContent.replace(',', '.'))),
    categories.filter(count => count / total >= 0.08).map(count => Math.round(1000 * count / total) / 10));
  const circumference = segments.reduce((sum, segment) => sum + parseFloat(segment.attributes['stroke-dasharray']), 0);
  assert.ok(Math.abs(circumference - 100) < 1e-8);
});

test('progress cards and the four newest pending cards open the correct records', () => {
  const { context, progress, pending } = setup();
  const { projectProgress, lecturerTopics } = context.IE104.services;
  const projectIds = progress.children.map(card => {
    const url = new URL(card.querySelector('a').href, 'https://example.test/');
    const projectId = url.searchParams.get('project');
    assert.equal(url.hash, '#tien-do');
    const meter = card.querySelector('.topic-progress-card__progress').querySelector('progress');
    assert.equal(meter.value, projectProgress.summarize(projectProgress.getState(projectId)).percent);
    const { project, team } = lecturerTopics.workspaceState(projectId);
    const participants = lecturerTopics.supervisedParticipants(project, team.members);
    const metadata = card.querySelector('.topic-progress-card__summary').querySelector('.topic-progress-card__meta');
    const participantLabel = metadata.children[1].children.at(-1).textContent;
    if (participants.isGroup) {
      assert.equal(participantLabel, participants.label);
    } else {
      assert.match(participants.code, /^\d{8}$/);
      assert.equal(participantLabel, `${participants.name} · ${participants.code}`);
    }
    return projectId;
  });
  assert.deepEqual(projectIds, ['ISE-001', 'ISE-002', 'ISE-003', 'ISE-016', 'ISEDATN-001'].map(id => 'UIT-SV-' + id));
  const ids = pending.children.map(card => new URL(card.querySelector('a').href, 'https://example.test/').searchParams.get('ma'));
  const records = Array.from(context.IE104Proposals.getAll()).filter(record => record.status === 'pending');
  assert.ok(records.length > 4);
  assert.equal(ids.length, 4);
  assert.deepEqual(ids, records.sort((a, b) => Date.parse(b.submittedAt) - Date.parse(a.submittedAt))
    .slice(0, 4).map(record => record.id));
});

test('pending cards show the saved student and submission time and omit unavailable requests', () => {
  const { context, counts, pending, emit } = setup();
  const seedCount = counts.pending.textContent;
  const saved = {
    id: 'DX-QA', status: 'pending', title: 'Đề xuất kiểm thử',
    studentName: 'Nguyễn Văn A', studentId: '22520001', submittedAt: '2026-12-01T17:00:00Z',
  };
  context.IE104.services.proposals.listForLecturer = () => [
    saved,
    { ...saved, id: 'DX-LEGACY', studentId: '', submittedAt: '' },
    { ...saved, id: 'DX-MASTER', topicTypeLabel: 'Luận văn thạc sĩ' },
    { ...saved, id: 'DX-UNAVAILABLE', topicType: 'do-an-mon-hoc', courseId: 'SE104' },
  ];
  emit('ie104:proposals-updated');
  assert.equal(counts.pending.textContent, seedCount + 2);
  const first = pending.children[0];
  assert.match(first.querySelector('a').href, /\?ma=DX-QA$/);
  const [student, date] = first.querySelector('.request-card__meta').children;
  assert.equal(student.children.at(-1).textContent, 'Nguyễn Văn A · 22520001');
  assert.equal(date.querySelector('time').textContent, '02/12/2026 · 00:00');
  assert.equal(date.querySelector('time').dateTime, saved.submittedAt);
  context.IE104.data.currentLecturer = { id: 'GV002' };
  emit('ie104:proposals-updated');
  assert.equal(counts.pending.textContent, 2);
  assert.equal(pending.children.length, 2);
  const legacy = pending.children[1];
  assert.match(legacy.querySelector('a').href, /\?ma=DX-LEGACY$/);
  const [legacyStudent, legacyDate] = legacy.querySelector('.request-card__meta').children;
  assert.equal(legacyStudent.children.at(-1).textContent, 'Nguyễn Văn A');
  assert.equal(legacyDate.children.at(-1).textContent, 'Chưa có thông tin');
});

test('approval refreshes counts and chart without duplicating labels', async () => {
  const { context, counts, pending, progress, chartLabels, legend } = setup();
  const record = context.IE104Proposals.getAll().find(item => item.status === 'pending' && item.studentVisible);
  assert.ok(record);
  const before = Object.fromEntries(Object.entries(counts).map(([key, node]) => [key, node.textContent]));
  await context.IE104Proposals.decide(record.id, 'approved');
  assert.equal(counts.pending.textContent, before.pending - 1);
  assert.equal(counts.supervised.textContent, before.supervised + 1);
  assert.equal(counts.total.textContent, before.total + 1);
  assert.equal(pending.children.length, Math.min(4, before.pending - 1));
  const approvedCards = progress.children.filter(card => {
    const url = new URL(card.querySelector('a').href, 'https://example.test/');
    return url.searchParams.get('project') === record.topicId && url.hash === '#tien-do';
  });
  assert.equal(approvedCards.length, 1);
  assert.equal(approvedCards[0].querySelector('.topic-progress-card__progress').textContent, 'Chưa có dữ liệu tiến độ.');
  const labels = chartLabels.querySelectorAll('.topic-status__percent');
  const visibleSlices = legend.filter(row => row.querySelector('dd').textContent / counts.total.textContent >= 0.08);
  assert.equal(labels.length, visibleSlices.length);
  assert.equal(legend[0].querySelector('dd').textContent, counts.supervised.textContent);
  assert.equal(parseFloat(labels[0].textContent.replace(',', '.')),
    Math.round(1000 * counts.supervised.textContent / counts.total.textContent) / 10);
});

test('empty data hides the chart and shows separate empty messages', async () => {
  const { context, counts, pending, progress, chartContent, empty } = setup();
  const { lecturerTopics, myTopics, lecturerProjects } = context.IE104.data;
  lecturerTopics.length = myTopics.length = lecturerProjects.length = 0;
  for (const record of context.IE104Proposals.filterPending(context.IE104Proposals.getAll())) {
    await context.IE104Proposals.decide(record.id, 'rejected', 'Lý do từ chối phù hợp.');
  }
  assert.deepEqual(Object.values(counts).map(node => node.textContent), [0, 0, 0, 0]);
  assert.equal(chartContent.hidden, true);
  assert.equal(empty.hidden, false);
  assert.match(empty.textContent, /Chưa có đề tài/);
  assert.equal(progress.children[0].textContent, 'Chưa có đề tài đang hướng dẫn.');
  assert.equal(pending.children[0].textContent, 'Không có yêu cầu chờ duyệt.');
});

test('reopening a topic refreshes the overview and corrupt data is reported', () => {
  const { context, data, emit, counts, legend, warning, chartContent } = setup();
  const { lecturerTopicRepository, lecturerTopics } = context.IE104.services;
  const { id, ownerId, registration, status } = lecturerTopics.get('created', 'ISEDAMH-001');
  assert.equal(status, 'closed');
  const open = legend[1].querySelector('dd');
  const closed = legend[3].querySelector('dd');
  const previousOpen = open.textContent;
  const previousClosed = closed.textContent;
  lecturerTopicRepository.write([{ id, ownerId, kind: 'created', status: 'open', patchOnly: true,
    registration: { ...registration, deadline: '2099-01-01T23:59:00+07:00' },
    revision: 1, updatedAt: '2026-11-25T08:00:00+07:00' }]);
  emit('storage', { key: lecturerTopicRepository.key });
  assert.equal(open.textContent, previousOpen + 1);
  assert.equal(closed.textContent, previousClosed - 1);
  data.set(lecturerTopicRepository.key, 'invalid JSON');
  emit('storage', { key: lecturerTopicRepository.key });
  assert.equal(counts.created.textContent, '—');
  assert.equal(counts.total.textContent, '—');
  assert.equal(warning.hidden, false);
  assert.equal(chartContent.hidden, true);
});

test('opening the overview as a file shows the bundled catalog while saved data is unavailable', () => {
  const { context, counts, chartContent, chartLabels, legend, warning, progress, pending } = setup('file:');
  const { lecturerTopics, projectProgress } = context.IE104.services;
  assert.equal(counts.created.textContent, lecturerTopics.list('created', { catalogOnly: true }).filter(lecturerTopics.isListedInCreatedTab).length);
  assert.equal(counts.supervised.textContent, legend[0].querySelector('dd').textContent);
  assert.equal(counts.pending.textContent, context.IE104Proposals.filterPending(context.IE104Proposals.getAll()).length);
  assert.equal(pending.children.length, Math.min(4, counts.pending.textContent));
  assert.equal(chartContent.hidden, false);
  const total = legend.reduce((sum, row) => sum + row.querySelector('dd').textContent, 0);
  assert.equal(counts.total.textContent, total);
  assert.equal(chartLabels.querySelector('text:nth-of-type(2)').textContent, total);
  assert.match(warning.textContent, /localhost/);
  const first = progress.children[0];
  assert.match(first.querySelector('a').href, /\?topic=ISE-001#tien-do$/);
  assert.equal(first.querySelector('.topic-progress-card__progress').querySelector('progress').value,
    projectProgress.summarize(projectProgress.getState('UIT-SV-ISE-001', { preview: true })).percent);
});
