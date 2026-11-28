/* Chỉ liên kết loại đề tài với môn học; chưa xử lý gửi đề xuất. */
(() => {
  const form = document.getElementById('proposal-form');
  const topicType = document.getElementById('topic-type');
  const course = document.getElementById('course');
  const fixedCourse = document.getElementById('fixed-course');
  const status = document.getElementById('course-status');
  if (!form || !topicType || !course || !fixedCourse || !status) return;

  const regularOptions = Array.from(course.options, (option) => option.cloneNode(true));
  const graduationCourses = {
    'khoa-luan': { code: 'IE505', label: 'IE505 · Khóa luận tốt nghiệp' },
    'do-an-tot-nghiep': { code: 'IE501', label: 'IE501 · Đồ án tốt nghiệp' },
  };
  let courseIsFixed = false;

  function updateCourse() {
    const fixed = graduationCourses[topicType.value];
    if (fixed) {
      course.replaceChildren(new Option(fixed.label, fixed.code, true, true));
      status.textContent = `${fixed.label}. Môn học được chọn tự động theo loại đề tài và không thể thay đổi.`;
    } else if (courseIsFixed) {
      course.replaceChildren(...regularOptions.map((option) => option.cloneNode(true)));
      course.selectedIndex = 0;
      status.textContent = 'Môn học đã mở khóa. Vui lòng chọn môn học cho đồ án môn học.';
    }

    course.disabled = Boolean(fixed);
    fixedCourse.disabled = !fixed;
    fixedCourse.value = fixed ? fixed.code : '';
    courseIsFixed = Boolean(fixed);
  }

  topicType.addEventListener('change', updateCourse);
  // reset xảy ra trước khi trình duyệt khôi phục giá trị mặc định của các ô.
  form.addEventListener('reset', () => queueMicrotask(updateCourse));
  window.addEventListener('pageshow', updateCourse);
  updateCourse();
})();
