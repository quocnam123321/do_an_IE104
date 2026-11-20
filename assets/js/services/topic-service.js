(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const nameOrder = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });

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
      const matchesKeyword = !keyword || normalizeText(`${topic.code || topic.id} ${topic.title}`).includes(keyword);
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
    const samples = app.data?.openTopics || [];
    try {
      const topics = globalThis.TeacherTopicStore?.studentTopics(samples) || samples;
      return listTopics(topics.filter(topic => topic.status !== 'closed'), filters, pagination);
    } catch (error) {
      return { ...listTopics([], filters, pagination), warning: 'Không đọc được trạng thái đăng ký. ' + error.message };
    }
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
    return { ...listTopics([...initial, ...saved], filters, pagination), warning: warnings.join(' ') };
  }

  app.services.topics = { listOpenTopics, listMyTopics, normalizeText };
})();
