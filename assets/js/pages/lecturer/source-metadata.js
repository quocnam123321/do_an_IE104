(() => {
  const app = globalThis.IE104;
  if (!app?.data?.lecturerRealMode) return;
  if (app.data.lecturerRealDataError) {
    const container = document.querySelector('main .page-container');
    if (container) {
      const title = document.createElement('h1'); title.textContent = 'Chưa tải được đề tài';
      const error = document.createElement('p'); error.setAttribute('role', 'alert'); error.textContent = app.data.lecturerRealDataError;
      const back = document.createElement('a'); back.href = 'tong-quan-giang-vien.html'; back.textContent = 'Quay lại Tổng quan';
      container.replaceChildren(title, error, back);
    }
    return;
  }
  function defaultImages() {
    document.querySelectorAll('.topic-card__image-placeholder, .topic-summary__image, .request-topic__image, .topic-image__placeholder, .topic-image-placeholder').forEach(node => {
      if (node.querySelector('img')) return;
      const image = document.createElement('img'); image.src = '../../assets/images/uit-logo.png'; image.alt = 'Ảnh UIT mặc định'; image.className = 'gv-default-image'; node.replaceChildren(image);
    });
  }
  function render() {
    defaultImages();
    try {
      const supervised = new Set(app.services.lecturerTopics.list('supervised').map(topic => topic.workspaceId));
      for (const record of globalThis.IE104Proposals?.getAll() || []) {
        if (record.status === 'approved') supervised.add(record.topicId);
      }
      for (const project of app.services.approvedProjects?.list('lecturer') || []) {
        if (project.registrationStatus === 'da-dang-ky') supervised.add(project.id);
      }
      const counts = {
        'danh-sach-de-tai-da-tao.html': app.services.lecturerTopics.list('created').length,
        'danh-sach-de-tai-dang-huong-dan.html': supervised.size,
      };
      document.querySelectorAll('.topic-tabs__link').forEach(link => {
        const name = new URL(link.href).pathname.split('/').pop();
        const badge = link.querySelector('.topic-tabs__count');
        if (badge && counts[name] !== undefined) badge.textContent = `(${counts[name]})`;
      });
    } catch {}
    let record;
    const mode = document.body.dataset.lecturerTopicView;
    try {
      if (mode) record = app.services.lecturerTopics.get('created', new URLSearchParams(location.search).get('topic') || app.data.lecturerRealDefaultTopicId).sourceRecord;
      else if (app.ui?.lecturerWorkspace) record = app.ui.lecturerWorkspace.state?.project?.sourceRecord;
      else if (document.querySelector('.request-detail')) record = globalThis.IE104Proposals?.get(new URLSearchParams(location.search).get('ma') || app.data.lecturerRealProposalSeeds[0].id)?.sourceRecord;
    } catch { return; }
    let panel = document.querySelector('[data-gv-source-panel]');
    if (!record) { if (panel) panel.hidden = true; return; }
    if (!panel) {
      panel = document.createElement('details');
      panel.dataset.gvSourcePanel = '';
      panel.className = 'gv-source-panel';
      const anchor = document.querySelector('.topic-summary, .request-topic, #tong-quan .teaching-card') || header;
      anchor?.after(panel);
    }
    panel.hidden = false;
    panel.replaceChildren();
    const summary = document.createElement('summary'); summary.textContent = 'Thông tin đề tài theo hồ sơ UIT';
    const list = document.createElement('dl');
    for (const [label, value] of [['Tác giả', record.authors.join(', ')], ['GVHD theo nguồn', record.advisors.join(', ')], ['Loại đề tài', record.type], ['Khóa / Năm', record.cohort ? 'Khóa ' + record.cohort : record.year], ['Đơn vị', record.faculty], ['Người đóng góp khác theo nguồn', record.otherContributors.join(', ') || 'Không ghi nhận']]) {
      const row = document.createElement('div'); const term = document.createElement('dt'); const text = document.createElement('dd');
      term.textContent = label; text.textContent = value || 'Chưa công bố trong nguồn'; row.append(term, text); list.append(row);
    }
    const link = document.createElement('a'); link.href = record.sourceUrl; link.textContent = 'Xem bảng gốc tại Khoa ISE ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer';
    panel.append(summary, list, link);
  }
  document.addEventListener('ie104:lecturer-topic-rendered', render);
  document.addEventListener('ie104:lecturer-topics-rendered', render);
  if (document.querySelector('.topic-tabs__count')) globalThis.IE104Proposals?.subscribe(render);
  app.ui?.lecturerWorkspace?.subscribe(render);
  window.addEventListener('pageshow', render);
  const observer = new MutationObserver(defaultImages);
  observer.observe(document.querySelector('main'), { childList: true, subtree: true });
  render();
})();
