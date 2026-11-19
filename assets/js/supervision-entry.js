(() => {
  'use strict';

  const sessionKey = 'ie104.supervision.student-session.v1';
  const teacherIdPattern = /^giang-vien-\d+$/;
  const pages = new URL('../../pages/', document.currentScript.src);
  const directory = new URL('chung/huong-nghien-cuu.html', pages);

  function validateTeacherId(id) {
    if (!teacherIdPattern.test(id)) {
      throw new Error('Không tìm thấy giảng viên được chọn. Vui lòng chọn lại từ trang Hướng nghiên cứu.');
    }
  }

  function withQuery(path, key, value) {
    const url = new URL(path, pages);
    url.searchParams.set(key, value);
    return url.href;
  }

  function getComposeUrl(id) {
    validateTeacherId(id);
    return withQuery('sinh-vien/loi-moi-huong-dan.html', 'giang-vien', id);
  }

  function getLoginUrl(id) {
    validateTeacherId(id);
    return withQuery('chung/dang-nhap.html', 'loi-moi', id);
  }

  function getInboxLoginUrl() {
    return withQuery('chung/dang-nhap.html', 'loi-moi', 'da-gui');
  }

  function hasStudentSession() {
    try {
      return sessionStorage.getItem(sessionKey) === 'active';
    } catch {
      return false;
    }
  }

  function startStudentSession() {
    sessionStorage.setItem(sessionKey, 'active');
    if (!hasStudentSession()) throw new Error('Phiên sinh viên mẫu chưa khả dụng.');
  }

  async function getTeacher(id) {
    validateTeacherId(id);
    let source = document;
    if (location.pathname !== directory.pathname) {
      if (location.protocol === 'file:') {
        throw new Error('Mở website qua HTTP, chẳng hạn Live Server, để tải danh sách giảng viên.');
      }
      try {
        const response = await fetch(directory.href, { mode: 'same-origin' });
        if (!response.ok) throw new Error('Không đọc được trang hướng nghiên cứu.');
        const markup = document.createElement('template');
        markup.innerHTML = await response.text();
        source = markup.content;
      } catch {
        throw new Error('Không tải được danh sách giảng viên. Vui lòng tải lại trang để thử lại.');
      }
    }

    const card = source.getElementById(id);
    const name = card?.matches('.research-card') && card.querySelector('h2')?.textContent.trim();
    if (!name) {
      throw new Error('Không tìm thấy giảng viên được chọn. Vui lòng chọn lại từ trang Hướng nghiên cứu.');
    }
    return { id, name };
  }

  window.IE104SupervisionEntry = Object.freeze({
    getComposeUrl, getLoginUrl, getInboxLoginUrl, hasStudentSession, startStudentSession, getTeacher,
  });
})();
