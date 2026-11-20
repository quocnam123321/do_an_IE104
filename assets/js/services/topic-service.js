(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const nameOrder = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });
  const projectTypeByLabel = new Map([
    ['Đồ án môn học', 'do-an-mon-hoc'],
    ['Đồ án tốt nghiệp', 'do-an-tot-nghiep'],
  ]);

  function normalizeText(value) {
    return String(value ?? '')
      .toLocaleLowerCase('vi')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function listTopics(source, filters = {}, pagination = {}) {
    const keyword = normalizeText(filters.keyword);
    const lecturer = normalizeText(filters.lecturer);
    const types = filters.types || [];
    const courses = filters.courses || [];
    const statuses = filters.statuses || [];
    const semesters = filters.semesters || [];
    const results = source.filter(topic => {
      const matchesKeyword = !keyword || normalizeText(`${topic.id} ${topic.title}`).includes(keyword);
      const matchesLecturer = !lecturer || normalizeText(topic.lecturer) === lecturer;
      const matchesType = !types.length || types.includes(topic.type);
      const matchesCourse = !courses.length || courses.includes(topic.courseId);
      const matchesStatus = !statuses.length || statuses.includes(topic.status);
      const matchesSemester = !semesters.length || semesters.includes(`${topic.academicYear}-${topic.semester}`);
      return matchesKeyword && matchesLecturer && matchesType && matchesCourse && matchesStatus && matchesSemester;
    });

    results.sort((first, second) => {
      if (filters.sort === 'ten-a-z') return nameOrder.compare(first.title, second.title) || nameOrder.compare(first.id, second.id);
      const dateOrder = first.createdAt.localeCompare(second.createdAt);
      return (filters.sort === 'cu-nhat' ? dateOrder : -dateOrder) || nameOrder.compare(first.id, second.id);
    });

    const pageSize = Number.isInteger(pagination.pageSize) && pagination.pageSize > 0 ? pagination.pageSize : 5;
    const requestedPage = Number.isInteger(pagination.page) && pagination.page > 0 ? pagination.page : 1;
    const total = results.length;
    const pageCount = Math.ceil(total / pageSize);
    const page = Math.min(requestedPage, Math.max(1, pageCount));
    const startIndex = (page - 1) * pageSize;
    return {
      items: results.slice(startIndex, startIndex + pageSize),
      total,
      totalAvailable: source.length,
      page,
      pageCount,
      pageSize,
      rangeStart: total ? startIndex + 1 : 0,
      rangeEnd: Math.min(startIndex + pageSize, total),
    };
  }

  function listOpenTopics(filters, pagination) {
    let published = [];
    let registered = new Set();
    const warnings = [];
    try { published = app.services.publishedTopics?.list() || []; }
    catch (failure) { warnings.push(failure.message); }
    try {
      registered = new Set((app.storage?.readRegistrations() || [])
        .filter(record => ['da-dang-ky', 'da-duyet'].includes(record.status)).map(record => record.topic.id));
    } catch (failure) { warnings.push(failure.message); }
    const openTopics = [...(app.data?.openTopics || []), ...published].filter(topic => !registered.has(topic.id));
    return { ...listTopics(openTopics, filters, pagination), warning: warnings.join(' ') };
  }

  function normalizeMyTopic(topic) {
    const type = topic.type === 'do-an' ? projectTypeByLabel.get(topic.typeLabel) || topic.type : topic.type;
    const semester = String(topic.semester ?? '').trim();
    // Các nguồn đã lưu dùng "he" hoặc "summer" cho kỳ thứ ba. Kỳ ngoài 1–3 chưa có thông tin để quy đổi.
    const academicSemester = ['he', 'summer'].includes(semester) ? '3' : (/^[1-3]$/.test(semester) ? semester : '');
    const academicYear = String(topic.academicYear ?? '').trim().replace(/\s*[-–]\s*/g, '-');
    return { ...topic, type, semester: academicSemester, academicYear };
  }

  function listMyTopics(filters, pagination) {
    const saved = [];
    const warnings = [];
    [app.services.registrations, app.services.proposals].forEach(service => {
      try { saved.push(...(service?.listMyTopics() || [])); }
      catch (error) { warnings.push(error.message); }
    });
    let initial = app.data?.myTopics || [];
    try { if (app.services.requests) initial = app.services.requests.applyToTopics(initial); }
    catch (error) { warnings.push(error.message); }
    const topics = [...initial, ...saved].map(normalizeMyTopic);
    return { ...listTopics(topics, filters, pagination), warning: warnings.join(' ') };
  }

  app.services.topics = { listOpenTopics, listMyTopics, normalizeText };
})();
