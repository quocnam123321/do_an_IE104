(() => {
  const app = globalThis.IE104;
  if (!app?.services?.lecturerTopicFiles) return;
  let generation = 0; const urls = new Set(); const placeholders = new WeakMap();
  const release = () => { for (const url of urls) URL.revokeObjectURL(url); urls.clear(); };
  const notice = document.createElement('p'); notice.className = 'topic-editor-status'; notice.setAttribute('role','status');
  document.querySelector('.topic-attachments')?.append(notice);
  async function render() {
    const current = ++generation; release();
    const catalogOnly = document.body.dataset.topicCatalogOnly === 'true';
    const targets = [];
    if (document.body.dataset.lecturerTopicView === 'detail' && document.body.dataset.topicRouteState === 'ready') targets.push([document.body.dataset.topicId, document.querySelector('.topic-summary__image')]);
    if (document.body.dataset.lecturerList === 'created') document.querySelectorAll('.topic-card').forEach(card => targets.push([card.dataset.topicId,card.querySelector('.topic-card__image-placeholder')]));
    for (const [id,node] of targets) {
      if (!node) continue;
      if (!placeholders.has(node)) placeholders.set(node,[...node.childNodes].map(child => child.cloneNode(true)));
      node.replaceChildren(...placeholders.get(node).map(child => child.cloneNode(true)));
      delete node.dataset.topicImage;
      if (catalogOnly) continue;
      try {
        const topic = app.services.lecturerTopics.get('created',id); if (!topic.imageRef) continue;
        const value = await app.services.lecturerTopicFiles.read(id,'image');
        if (current !== generation || !node.isConnected || !value) continue;
        const url = URL.createObjectURL(value.blob); urls.add(url);
        const image = document.createElement('img'); image.src = url; image.alt = `Ảnh minh họa ${topic.title}`;
        node.replaceChildren(image); node.dataset.topicImage = 'true';
      } catch (failure) { if (current === generation && targets.length === 1) notice.textContent = failure.message; }
    }
    const download = document.querySelector('.topic-attachments__download');
    if (!download) return;
    download.disabled = true;
    download.hidden = catalogOnly;
    if (catalogOnly) { notice.textContent = ''; return; }
    try {
      const value = await app.services.lecturerTopicFiles.read(document.body.dataset.topicId,'attachment');
      if (current !== generation) return;
      download.disabled = !value;
      if (value) download.removeAttribute('title');
    } catch (failure) { if (current === generation) notice.textContent = failure.message; }
  }
  document.querySelector('.topic-attachments__download')?.addEventListener('click', async event => {
    const button = event.currentTarget; button.disabled = true;
    try { const value = await app.services.lecturerTopicFiles.read(document.body.dataset.topicId,'attachment'); if (!value) throw new Error('Chưa có nội dung tệp thật để tải.'); app.ui.downloadFile(value); notice.textContent = 'Đã bắt đầu tải tài liệu.'; }
    catch (failure) { notice.textContent = failure.message; }
    finally { render(); }
  });
  document.addEventListener('ie104:lecturer-topics-rendered',render);
  document.addEventListener('ie104:lecturer-topic-rendered',render);
  window.addEventListener('pageshow',render);
  window.addEventListener('pagehide',release);
  render();
})();
