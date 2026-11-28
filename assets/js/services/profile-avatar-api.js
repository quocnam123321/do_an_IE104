(() => {
  const account = document.querySelector('meta[name="ie104-profile-account"]');
  if (!account) return;
  const app = globalThis.IE104 ||= {};
  app.services ||= {};

  async function request(file) {
    const options = {
      cache: 'no-store', credentials: 'same-origin',
      headers: { 'X-IE104-Role': account.dataset.role, 'X-IE104-Account': account.content },
    };
    if (file) {
      options.method = 'PUT';
      options.body = new FormData();
      options.body.set('avatar', file);
    }
    let response;
    try { response = await fetch('/api/profile/avatar', options); }
    catch { throw new Error('Không kết nối được máy chủ để đọc hoặc lưu ảnh đại diện.'); }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Không thể xử lý ảnh đại diện. Vui lòng thử lại.');
    }
    if (response.status === 204) return file || null;
    return response.blob();
  }

  app.services.databaseAvatar = { read: () => request(), save: request };
})();
