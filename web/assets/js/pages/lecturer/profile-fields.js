(() => {
  'use strict';
  const profile = window.IE104?.data?.currentLecturer;
  const missing = 'Chưa có thông tin';
  const value = key => typeof profile?.[key] === 'string' ? profile[key].trim() : '';

  for (const field of document.querySelectorAll('[data-lecturer-profile-field]')) {
    const key = field.dataset.lecturerProfileField;
    const text = key === 'faculty-department'
      ? [value('faculty') || 'Khoa: chưa có thông tin', value('department') || 'Bộ môn: chưa có thông tin'].join(' · ')
      : value(key) || missing;
    field.textContent = text;
  }
})();
