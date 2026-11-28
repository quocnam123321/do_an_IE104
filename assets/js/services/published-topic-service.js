(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const publicId = topic => topic.legacyCatalogId ? `GV:GV001:${topic.legacyCatalogId}` : `GV:${topic.ownerId}:${topic.id}`;
  const hasText = value => typeof value === 'string' && Boolean(value.trim());
  function complete(topic) {
    return topic && ['id','ownerId','title','typeLabel','topicType','academicYear','createdAt','description'].every(field => hasText(topic[field])) && ['course','graduation','thesis'].includes(topic.topicType) && (topic.topicType !== 'course' || hasText(topic.course)) && ['objectives','outcomes','requirements'].every(field => Array.isArray(topic[field]) && topic[field].length && topic[field].every(hasText)) && hasText(topic.supervisor?.name) && ['1','2','summer'].includes(String(topic.semester)) && Number.isFinite(Date.parse(topic.createdAt)) && topic.registration && Number.isInteger(topic.registration.minMembers) && topic.registration.minMembers > 0 && Number.isInteger(topic.registration.maxMembers) && topic.registration.maxMembers >= topic.registration.minMembers && topic.registration.maxMembers <= 100 && Number.isFinite(Date.parse(topic.registration.deadline)) && (!topic.registration.opensAt || (Number.isFinite(Date.parse(topic.registration.opensAt)) && Date.parse(topic.registration.opensAt) < Date.parse(topic.registration.deadline)));
  }
  function availability(topic, now = new Date()) {
    if (!complete(topic)) return { allowed:false, reason:'Đề tài chưa có đủ thông tin để nhận đăng ký.', label:'Chưa đủ thông tin' };
    if (app.proposalDatabase && !topic.isDatabaseTopic && app.data?.studentUITCatalog?.openIds.includes(topic.id)) {
      return { allowed: false, reason: 'Đề tài mẫu chỉ nhận đăng ký trong chế độ minh họa.', label: 'Chưa mở đăng ký' };
    }
    if (topic.registered) return { allowed: false, reason: 'Đề tài đã có nhóm đăng ký.', label: 'Đã có nhóm đăng ký' };
    if (topic.registration.roundId) {
      const round = globalThis.IE104AdminAcademic?.forTopic(topic, now.getTime());
      if (round?.status !== 'open') {
        const reason = round?.status === 'upcoming' ? 'Đợt đăng ký chưa mở.' :
          round ? 'Đợt đăng ký đã đóng.' : 'Không tìm thấy đợt đăng ký.';
        return { allowed:false, reason, label: reason.slice(0, -1) };
      }
      return topic.status === 'open' ? { allowed:true, reason:'', label:'Mở đăng ký' } :
        { allowed:false, reason:'Giảng viên đã đóng đăng ký đề tài này.', label:'Đã đóng đăng ký' };
    }
    if (topic.status !== 'open') return { allowed:false, reason:'Giảng viên đã đóng đăng ký đề tài này.', label:'Đã đóng đăng ký' };
    if (Date.parse(topic.registration.deadline) <= now.getTime()) return { allowed:false, reason:'Đề tài đã hết hạn đăng ký.', label:'Đã hết hạn' };
    if (topic.registration.opensAt && Date.parse(topic.registration.opensAt) > now.getTime()) return { allowed:false, reason:'Chưa đến thời điểm mở đăng ký đề tài.', label:'Chưa mở đăng ký' };
    return { allowed:true, reason:'', label:'Mở đăng ký' };
  }
  function project(topic, now) {
    return {
      studentListed: Boolean(topic.studentListed), id:publicId(topic), displayId:topic.displayId || topic.id, catalogId:topic.id, source:'lecturer-created', ownerId:topic.ownerId,
      title:topic.title, type:({course:'do-an-mon-hoc',graduation:'do-an-tot-nghiep',thesis:'khoa-luan'})[topic.topicType], typeLabel:topic.typeLabel,
      isDatabaseTopic: topic.isDatabaseTopic, registrationId: topic.registrationId, registered: topic.registered,
      courseId:topic.courseId || ({web:'IE104',database:'co-so-du-lieu',software:'cong-nghe-phan-mem'})[topic.course] || topic.course, courseLabel:topic.courseLabel || 'Không áp dụng',
      semester:topic.semester === 'summer' ? 'he' : topic.semester, academicYear:topic.academicYear, lecturer:topic.supervisor.name,
      createdAt:topic.createdAt, revision:topic.revision || 0, description:topic.description,
      objectives:[...topic.objectives], outcomes:[...topic.outcomes], requirements:[...topic.requirements], supervisor:{...topic.supervisor},
      methodAndScope:topic.methodAndScope || '', plan:topic.plan || '',
      registrationRules:{minMembers:topic.isDatabaseTopic ? topic.registration.minMembers : 1,maxMembers:topic.registration.maxMembers},
      registration:{...(topic.isDatabaseTopic ? topic : globalThis.IE104AdminAcademic?.withRegistration(topic, now.getTime()) || topic).registration},
      startsAt:topic.startsAt, progressReportDate:topic.progressReportDate, finalReportDate:topic.finalReportDate, completesAt:topic.completesAt,
      availability:availability(topic,now), imageRef:topic.imageRef || null, attachmentRef:topic.attachmentRef, attachmentName:topic.attachmentName || '',
      detailUrl:`chi-tiet-de-tai-gv-mo-dang-ky.html?topic=${encodeURIComponent(publicId(topic))}`,
    };
  }
  function get(id, now = new Date()) {
    const topic = (app.services.lecturerTopics?.allCreated() || []).find(item => publicId(item) === id);
    return complete(topic) ? project(topic,now) : null;
  }
  function list(now = new Date()) {
    return (app.services.lecturerTopics?.allCreated() || []).filter(topic => (!app.data.studentUITCatalog || topic.studentListed || topic.revision > 0) && availability(topic,now).allowed).map(topic => project(topic,now));
  }
  function findEdited(title, now = new Date()) {
    const key = app.topicIdentity?.titleKey;
    if (!key || !title) return null;
    const record = (app.services.lecturerTopics?.allCreated() || []).find(topic =>
      topic.revision && key(topic.title) === key(title));
    if (!record) return null;
    if (complete(record)) return project(record, now);
    return { title: record.title, id: publicId(record), source: 'lecturer-created', availability: availability(record, now) };
  }

  function requireOpen(id, revision, now = new Date()) {
    const topic = get(id,now);
    if (!topic) throw new Error('Không tìm thấy đề tài GV có đủ thông tin để đăng ký.');
    if (!topic.availability.allowed) throw new Error(topic.availability.reason);
    if (!Number.isInteger(revision) || revision !== topic.revision) throw new Error('Thông tin hoặc điều kiện đăng ký đã thay đổi. Hãy đọc lại trước khi xác nhận.');
    return topic;
  }
  app.services.publishedTopics = { get, list, findEdited, requireOpen, complete, availability, publicId };
})();
