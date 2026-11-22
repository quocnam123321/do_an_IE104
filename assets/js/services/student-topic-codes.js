(() => {
  const app = globalThis.IE104 ||= {};
  const services = app.services ||= {};
  const catalog = globalThis.UITLecturerCatalog;
  const displayCode = /^ISE(?:DAMH|DATN|KTLN|KLTN)-\d{3,}$/;
  const legacyCode = /^(?:DA|DT|DATN|DAMH|KL|KLTN|KTLN|MẪU)-?\d+$/iu;
  const types = {
    'do-an': 'course',
    'do-an-mon-hoc': 'course',
    'do-an-tot-nghiep': 'graduation',
    'khoa-luan': 'thesis',
  };
  const typesByLabel = {
    'Đồ án môn học': 'course',
    'Đồ án tốt nghiệp': 'graduation',
    'Khóa luận tốt nghiệp': 'thesis',
  };

  function typeOf(topic) {
    const type = topic.filterType || topic.topicType || topic.type;
    return typesByLabel[topic.typeLabel] || types[type] || type;
  }

  function titleKey(topic) {
    return `${typeOf(topic)}:${app.topicIdentity.titleKey(topic.title)}`;
  }

  function candidate(topic) {
    const id = topic.displayId || topic.code || topic.id;
    if (!legacyCode.test(id)) return null;
    return { id, title: topic.title, topicType: typeOf(topic) };
  }

  function buildCodes() {
    const { lecturerTopics = [], myTopics = [], openTopics = [], projectTeams = [], currentLecturer } = app.data;
    const supervised = new Set(projectTeams.filter(team => team.supervisorIds.includes(currentLecturer?.id))
      .map(team => team.projectId));
    // Giữ thứ tự cấp mã của các đề tài đã có ở phía giảng viên.
    const sharedProjects = myTopics.filter(topic => supervised.has(topic.id));
    const otherProjects = myTopics.filter(topic => !supervised.has(topic.id));
    const legacy = [...sharedProjects, ...openTopics, ...otherProjects].map(candidate).filter(Boolean);
    const decorated = catalog.decorateTopics([...lecturerTopics, ...legacy]);
    return {
      byTitle: new Map(decorated.map(topic => [titleKey(topic), topic.displayId])),
      samples: decorated.slice(lecturerTopics.length),
    };
  }

  let codes;
  const allocatedSamples = () => (codes ||= buildCodes()).samples;

  function get(topic) {
    const id = topic.displayId || topic.code || topic.id || '';
    if (displayCode.test(id)) return id;
    // Mã hồ sơ hoặc UUID không phải mã đề tài do giảng viên cấp.
    if (!legacyCode.test(id)) return '';
    const { byTitle } = codes ||= buildCodes();
    return byTitle.get(titleKey(topic)) || catalog.formatCode(typeOf(topic), id);
  }

  services.studentTopicCodes = { get, allocatedSamples };
})();
