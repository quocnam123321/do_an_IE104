(() => {
  'use strict';

  const teacherIdPattern = /^giang-vien-\d+$/;
  const pages = new URL('../../pages/', document.currentScript.src);
  const directory = new URL('chung/huong-nghien-cuu.html', pages);
  const normalizeSearch = value => value.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim();

  function departmentLabel(value = '') {
    const department = value.trim().replace(/^Bộ môn(?:\s*:\s*|\s+|$)/i, '');
    return !department || normalizeSearch(department).startsWith('chua ')
      ? 'Chưa cập nhật bộ môn'
      : department;
  }

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

  async function getStudent() {
    const { getWebsiteSession } = await import('./website-session.js');
    const session = await getWebsiteSession();
    if (session?.role !== 'student') return null;
    if (!session.user) return window.IE104Supervision.student;
    const { uid, displayName, email } = session.user;
    return {
      id: `firebase:${uid}`,
      name: displayName?.trim() || email || 'Sinh viên',
    };
  }

  let directoryRequest;

  async function getDirectory() {
    if (location.pathname === directory.pathname) return document;
    if (location.protocol === 'file:') {
      throw new Error('Mở website qua HTTP, chẳng hạn Live Server, để tải danh sách giảng viên.');
    }

    directoryRequest ||= fetch(directory.href, { mode: 'same-origin' }).then(async response => {
      if (!response.ok) throw new Error();
      const markup = document.createElement('template');
      markup.innerHTML = await response.text();
      return markup.content;
    }).catch(() => {
      directoryRequest = undefined;
      throw new Error('Không tải được danh sách giảng viên. Vui lòng thử lại.');
    });
    return directoryRequest;
  }

  async function getTeachers() {
    const source = await getDirectory();
    const teachers = Array.from(source.querySelectorAll('.research-card[id]'), card => {
      const affiliations = Array.from(card.querySelectorAll('.research-affiliations > div'));
      const originalText = node => node ? window.IE104Language?.sourceText(node) ?? node.textContent : '';
      const department = affiliations.find(row => originalText(row.querySelector('dt')).trim() === 'Bộ môn');
      return {
        id: card.id,
        name: card.querySelector('h2')?.textContent.trim(),
        department: originalText(department?.querySelector('dd')).trim(),
        email: card.querySelector('.research-email span')?.textContent.trim() || '',
      };
    }).filter(teacher => teacher.name && teacherIdPattern.test(teacher.id));
    if (!teachers.length) {
      directoryRequest = undefined;
      throw new Error('Trang Hướng nghiên cứu chưa có danh sách giảng viên.');
    }
    return teachers;
  }

  async function getTeacherInboxSession() {
    const { getWebsiteSession } = await import('./website-session.js');
    const session = await getWebsiteSession();
    if (session?.role !== 'lecturer') return null;
    if (!session.user) return { demo: true };
    const email = session.user.email?.trim().toLowerCase();
    const teachers = email ? await getTeachers() : [];
    return { teacherIds: teachers.filter(teacher => teacher.email.toLowerCase() === email).map(teacher => teacher.id) };
  }

  async function getTeacher(id) {
    validateTeacherId(id);
    const source = await getDirectory();
    const card = source.getElementById(id);
    const name = card?.matches('.research-card') && card.querySelector('h2')?.textContent.trim();
    if (!name) {
      throw new Error('Không tìm thấy giảng viên được chọn. Vui lòng chọn lại từ trang Hướng nghiên cứu.');
    }
    return { id, name };
  }

  window.IE104SupervisionEntry = Object.freeze({
    getComposeUrl, getLoginUrl, getInboxLoginUrl, getStudent, getTeacher, getTeachers,
    normalizeSearch, departmentLabel, getTeacherInboxSession,
  });
})();
