(() => {
  const app = globalThis.IE104 ||= {};
  app.services ||= {};
  const prefix = 'ie104.demo.password.v1.';
  const iterations = 210000;
  const hex = bytes => Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
  const unhex = value => Uint8Array.from(value.match(/../g), part => parseInt(part, 16));
  function key(role) {
    if (!['student', 'lecturer'].includes(role)) throw new Error('Phiên đăng nhập không hợp lệ.');
    return prefix + role;
  }
  function read(role) {
    const raw = localStorage.getItem(key(role));
    if (raw === null) return null;
    try {
      const record = JSON.parse(raw);
      if (record.version !== 1 || record.iterations !== iterations || !/^[a-f0-9]{32}$/.test(record.salt) || !/^[a-f0-9]{64}$/.test(record.hash)) throw new Error();
      return record;
    } catch { throw new Error('Không đọc được mật khẩu mẫu đã lưu. Dữ liệu cũ chưa bị thay thế.'); }
  }
  async function hash(password, salt) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(salt), iterations }, material, 256));
  }
  async function verifyDemo(role, password, initial = 'IE104@2026') {
    const record = read(role);
    return record ? (await hash(password, record.salt)) === record.hash : password === initial;
  }
  function validate(input) {
    const errors = [];
    if (!input.current) errors.push({ field: 'current', message: 'Nhập mật khẩu hiện tại.' });
    if (typeof input.next !== 'string' || input.next.length < 8 || input.next.length > 128) errors.push({ field: 'next', message: 'Mật khẩu mới cần từ 8 đến 128 ký tự.' });
    if (input.next && input.next === input.current) errors.push({ field: 'next', message: 'Mật khẩu mới phải khác mật khẩu hiện tại.' });
    if (!input.confirm || input.confirm !== input.next) errors.push({ field: 'confirm', message: 'Xác nhận mật khẩu mới chưa khớp.' });
    return errors;
  }
  async function change(role, input) {
    const errors = validate(input);
    if (errors.length) throw new Error(errors[0].message);
    const mode = localStorage.getItem('ie104.website.session.v2.' + role);
    if (mode === 'demo') {
      const commit = async () => {
        if (!await verifyDemo(role, input.current)) throw new Error('Mật khẩu hiện tại không đúng.');
        const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
        const record = { version: 1, iterations, salt, hash: await hash(input.next, salt) };
        if (localStorage.getItem('ie104.website.session.v2.' + role) !== mode) throw new Error('Phiên đăng nhập đã thay đổi. Hãy đăng nhập lại.');
        try { localStorage.setItem(key(role), JSON.stringify(record)); }
        catch { throw new Error('Chưa lưu được mật khẩu mới. Kiểm tra quyền lưu trữ của trình duyệt.'); }
        return { mode: 'demo' };
      };
      return globalThis.navigator?.locks?.request ? navigator.locks.request(key(role), commit) : commit();
    }
    if (!['firebase', 'emulator'].includes(mode)) throw new Error('Hãy đăng nhập lại trước khi đổi mật khẩu.');
    const { getWebsiteSession } = await import('../website-session.js');
    const session = await getWebsiteSession(role);
    if (!session?.user) throw new Error('Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.');
    if (!session.user.providerData.some(provider => provider.providerId === 'password')) throw new Error('Tài khoản đăng nhập bằng Google. Hãy đổi mật khẩu trong tài khoản Google của bạn.');
    const { getFirebaseAuth } = await import('../firebase-client.js?v=20261119-otp');
    const { auth, sdk } = await getFirebaseAuth(mode === 'emulator', role);
    const user = auth.currentUser;
    if (!user || user.uid !== session.user.uid) throw new Error('Phiên đăng nhập đã thay đổi. Hãy đăng nhập lại.');
    await sdk.reauthenticateWithCredential(user, sdk.EmailAuthProvider.credential(user.email, input.current));
    if (auth.currentUser?.uid !== user.uid || localStorage.getItem('ie104.website.session.v2.' + role) !== mode) throw new Error('Phiên đăng nhập đã thay đổi. Hãy đăng nhập lại.');
    await sdk.updatePassword(user, input.next);
    return { mode };
  }
  app.services.accountPassword = { verifyDemo, validate, change };
})();
