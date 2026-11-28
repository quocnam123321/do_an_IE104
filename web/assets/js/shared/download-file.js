(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.ui ||= {};
  const urls = new Set();
  function release(url) {
    if (urls.delete(url)) URL.revokeObjectURL(url);
  }
  app.ui.downloadFile = ({ blob, fileName }) => {
    if (!(blob instanceof Blob) || !blob.size) throw new Error('Không có nội dung tệp để tải xuống.');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.hidden = true;
    urls.add(url);
    document.body.append(link);
    try { link.click(); }
    catch (failure) { release(url); throw failure; }
    finally { link.remove(); }
    setTimeout(() => release(url), 60000);
  };
  window.addEventListener('pagehide', event => { if (!event.persisted) [...urls].forEach(release); });
})();
