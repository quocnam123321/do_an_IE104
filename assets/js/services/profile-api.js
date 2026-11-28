(() => {
  const account = document.querySelector('meta[name="ie104-profile-account"]');
  if (!account) return;
  const app = globalThis.IE104 ||= {};
  app.services ||= {};

  async function request(profile) {
    const options = {
      cache: 'no-store', credentials: 'same-origin',
      headers: { 'X-IE104-Role': account.dataset.role, 'X-IE104-Account': account.content }
    };
    if (profile) {
      options.method = 'PATCH';
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(profile);
    }
    let response;
    try { response = await fetch('/api/profile', options); }
    catch { throw new Error('Không kết nối được máy chủ để đọc hoặc lưu hồ sơ.'); }
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.profile) throw new Error(result.error || 'Không thể xử lý hồ sơ. Vui lòng thử lại.');
    return result.profile;
  }

  app.services.databaseProfile = {
    sampleIdentity: account.dataset.sampleIdentity === 'true',
    read: () => request(),
    save: (profile, revision) => request({ ...profile, revision })
  };
})();
