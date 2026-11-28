(() => {
  const app = globalThis.IE104 ||= {};
  const ui = app.ui ||= {};
  const catalog = globalThis.UITLecturerCatalog;
  const courseCodePattern = /^[A-Z]{2,}\d{3}$/i;

  ui.studentCourseLabel = (topic, withCode = false) => {
    const subject = String(topic.courseId || topic.course || '').trim();
    const label = String(topic.courseLabel || '').trim();
    const prefixed = /^([A-Z]{2,}\d{3})\s*[-–—·:]\s*(.+)$/i.exec(label);
    const code = topic.courseCode || prefixed?.[1] ||
      (courseCodePattern.test(subject) ? subject : courseCodePattern.test(label) ? label : '');
    const name = prefixed?.[2] || (courseCodePattern.test(label) || label === 'Không áp dụng' ? '' : label);
    return catalog.subjectLabel({
      ...topic,
      course: subject || code,
      courseCode: code,
      courseLabel: name,
    }, withCode);
  };
})();
