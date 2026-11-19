(() => {
  const app = globalThis.IE104;
  if (!app?.services?.publishedTopics || !app.services.lecturerTopicFiles) return;
  const urls = new Set(); let generation = 0;
  const release = () => { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); };
  const detail = document.querySelector('[data-published-content]');
  const download = detail?.querySelector('[data-published-download]');
  const status = detail?.querySelector('[data-published-file-status]');
  async function render() {
    const current = ++generation; release();
    const targets = detail ? [[document.body.dataset.publishedTopic,detail.querySelector('.topic-image img')]] : [...document.querySelectorAll('[data-published-topic]')].map(card => [card.dataset.publishedTopic,card.querySelector('.topic-card__image img')]);
    for (const [id,image] of targets) {
      if (!id || !image) continue;
      image.src = '../../assets/images/uit-logo.png';
      try {
        const topic = app.services.publishedTopics.get(id);
        if (!topic?.imageRef) continue;
        const file = await app.services.lecturerTopicFiles.readPublished(id,'image');
        if (current !== generation || !image.isConnected || !file) continue;
        const url = URL.createObjectURL(file.blob); urls.add(url); image.src = url; image.alt = `Ảnh minh họa ${topic.title}`;
      } catch (failure) { if (status && current === generation) status.textContent = failure.message; }
    }
    if (!download) return;
    download.disabled = true;
    try { const file = await app.services.lecturerTopicFiles.readPublished(document.body.dataset.publishedTopic,'attachment'); if (current === generation) download.disabled = !file; }
    catch (failure) { if (current === generation) status.textContent = failure.message; }
  }
  download?.addEventListener('click',async () => {
    download.disabled = true;
    try { const file = await app.services.lecturerTopicFiles.readPublished(document.body.dataset.publishedTopic,'attachment'); if (!file) throw new Error('Chưa có nội dung tài liệu thật để tải.'); app.ui.downloadFile(file); status.textContent = 'Đã bắt đầu tải tài liệu.'; }
    catch (failure) { status.textContent = failure.message; }
    finally { render(); }
  });
  document.addEventListener('ie104:student-topics-rendered',render);
  document.addEventListener('ie104:published-topic-rendered',render);
  let tick;
  const startClock = () => { clearInterval(tick); tick = setInterval(() => { if (!document.hidden) window.dispatchEvent(new Event('ie104:published-topics-updated')); },30000); };
  window.addEventListener('pageshow',startClock);
  window.addEventListener('pagehide',() => { generation++; release(); clearInterval(tick); });
  startClock();
  render();
})();
