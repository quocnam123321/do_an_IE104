(() => {
  const app = globalThis.IE104;
  const catalog = globalThis.UITLecturerCatalog;
  if (!app?.data || !catalog) return;
  const data = app.data;
  const copy = value => JSON.parse(JSON.stringify(value));
  const openIds = ['ISE-001', 'ISE-002', 'ISE-003', 'ISE-004', 'ISE-005', 'ISEDATN-001', 'ISEDATN-002', 'ISEDATN-003', 'ISEDATN-004', 'ISEDATN-005', 'ISEDAMH-004', 'ISEDAMH-002', 'ISEDAMH-009', 'ISEDAMH-011', 'ISEDAMH-013', 'ISEDAMH-015'];
  const excludedSupervised = new Set(['DA005', 'ISE-011', 'ISE-004', 'ISE-006', 'ISE-007', 'DT001']);
  const supervised = (data.lecturerTopics || []).filter(topic => topic.kind === 'supervised' && topic.ownerId === 'GV001' && !excludedSupervised.has(topic.id) && topic.topicType !== 'master');
  const definitions = new Map(supervised.map(topic => [topic.id, topic]));
  const myIds = [...definitions.keys()];
  const completedIds = ['ISE-005', 'ISE-015', 'ISEDATN-004', 'ISEDAMH-002', 'ISEDAMH-005'];
  const completed = new Set(completedIds);
  const type = { course: 'do-an-mon-hoc', graduation: 'do-an-tot-nghiep', thesis: 'khoa-luan' };
  const rows = new Map(catalog.records.map(record => [record.id, record]));
  const defaultRequirements = ['Có kiến thức nền tảng phù hợp với lĩnh vực đề tài.', 'Thực hiện khảo sát, xây dựng giải pháp và đánh giá kết quả trong phạm vi đã thống nhất.', 'Bàn giao báo cáo, tài liệu và sản phẩm theo yêu cầu của giảng viên.'];
  const projectId = id => `UIT-SV-${id}`;
  const demoDeadlines = new Map();
  const submissionSamples = new Map();
  function submissionReferenceTime(requirement) {
    const sample = demoDeadlines.get(requirement.id);
    return sample && sample.deadline === requirement.deadline ? sample.referenceTime : undefined;
  }
  function submissionSample(projectId, submission) {
    const sample = submissionSamples.get(submission.id);
    if (sample?.projectId === projectId && sample.fileName === submission.fileName) return sample;
    return null;
  }
  data.studentUITCatalog = { openIds, myIds, completedIds, projectId, submissionReferenceTime, submissionSample };
  data.openTopics = [];
  data.projectLecturers ||= [];
  if (!data.projectLecturers.some(item => item.id === 'GV001')) data.projectLecturers.push({ id: 'GV001', name: 'Nguyễn Văn A', email: 'giangvien@example.com' });
  const lecturer = data.projectLecturers.find(item => item.id === 'GV001');
  Object.assign(lecturer, { name: 'Nguyễn Văn A', email: 'giangvien@example.com', faculty: 'Khoa Khoa học và Kỹ thuật Thông tin', department: 'Khoa Khoa học và Kỹ thuật Thông tin' });
  data.currentLecturer = lecturer;
  const people = [
    { code: data.currentStudent?.code || '24520001', name: data.currentStudent?.name || 'Nguyễn Minh Anh', role: 'nhom-truong' },
    { code: '24520002', name: 'Trần Gia Huy', role: 'thanh-vien' },
    { code: '24520003', name: 'Lê Ngọc Linh', role: 'thanh-vien' },
  ];
  const selected = new Set(openIds);
  data.lecturerTopics = (data.lecturerTopics || []).map(topic => {
    if (topic.kind !== 'created' || !selected.has(topic.id)) return topic;
    const record = rows.get(topic.id);
    return { ...topic, studentListed: true, semester: '1', academicYear: '2026-2027',
      supervisor: { ...record.demoSupervisor },
      status: 'open', statusLabel: 'Đang mở đăng ký',
      createdAt: '2026-11-20T09:00:00+07:00',
      requirements: record.requirements?.length ? copy(record.requirements) : [...defaultRequirements],
      objectives: record.objectives?.length ? copy(record.objectives) : ['Khảo sát bài toán, thiết kế và đánh giá giải pháp phù hợp với phạm vi đề tài.'],
      outcomes: record.outcomes?.length ? copy(record.outcomes) : ['Báo cáo kết quả nghiên cứu, sản phẩm thử nghiệm và tài liệu sử dụng.'],
      registration: { minMembers: 1, maxMembers: 3, deadline: '2026-12-31T23:59:00+07:00' },
      startsAt: '2026-09-21', progressReportDate: '2026-11-15', finalReportDate: '2027-01-03',
    };
  });
  const join = value => Array.isArray(value) ? value.join('\n') : value || '';
  const projects = myIds.map((id, index) => {
    const record = rows.get(id);
    const definition = definitions.get(id);
    const done = completed.has(id);
    const completedIndex = completedIds.indexOf(id);
    const semester = done ? String(completedIndex % 2 + 1) : '1';
    const academicYear = done ? '2024-2025' : '2026-2027';
    const startsAt = done ? semester === '1' ? '2024-09-09' : '2025-02-10' : '2026-09-21';
    const finalReportDate = done ? semester === '1' ? '2025-01-10' : '2025-06-10' : '2027-01-03';
    const progressReportDate = done ? semester === '1' ? '2024-11-15' : '2025-04-15' : '2026-11-15';
    const subject = catalog.courseCatalog[catalog.courseKey(record.course)];
    const displayId = catalog.formatCode(record.topicType, record.code, catalog.facultyFor(record));
    return {
      id: projectId(id), topicId: id, displayId, topicCode: displayId,
      title: record.title, type: type[record.topicType], topicType: record.topicType, typeLabel: record.type,
      courseId: record.course || '', courseCode: subject?.code || '', courseLabel: catalog.subjectLabel(record, true),
      semester, academicYear, startsAt, progressReportDate, finalReportDate, lecturerLabel: 'Sinh viên đại diện', lecturer: record.demoSupervisor.name, lecturerId: lecturer.id,
      representativeName: record.authors?.[0] || 'Chưa có thông tin', representativeCode: 'xxxxxxxx',
      groupName: record.supervision?.group || `Nhóm ${String(index + 30).padStart(2, '0')}`,
      role: definition.role || 'primary', roleLabel: definition.roleLabel || 'Hướng dẫn chính',
      status: done ? 'hoan-thanh' : 'dang-thuc-hien', statusLabel: done ? 'Hoàn thành' : 'Đang thực hiện',
      createdAt: `${startsAt}T09:00:00+07:00`,
      description: record.description, objectives: join(record.objectives), outcomes: join(record.outcomes),
      requirements: join(record.requirements?.length ? record.requirements : defaultRequirements),
      milestones: [startsAt, progressReportDate, finalReportDate].map(value => value.split('-').reverse().join('/')), sourceRecord: { ...copy(record), semester, academicYear },
      detailUrl: `chi-tiet-de-tai-sinh-vien.html?project=${encodeURIComponent(projectId(id))}#tong-quan`,
    };
  });
  const query = new URLSearchParams(globalThis.location?.search || '');
  const requestedProjectId = query.get('project');
  data.myTopics = projects;
  data.projectEvaluations ||= [];
  const evaluationTemplate = copy(data.projectEvaluations.find(item => item.projectId === 'DA005') || {
    criteria: [
      { id: 'TC001', title: 'Chức năng và sản phẩm', weight: 50, score: 8.5, comment: 'Đáp ứng yêu cầu đã thống nhất.' },
      { id: 'TC002', title: 'Báo cáo và tài liệu', weight: 30, score: 8, comment: 'Đã bàn giao tài liệu và báo cáo.' },
      { id: 'TC003', title: 'Trình bày và phối hợp', weight: 20, score: 8.8, comment: 'Trình bày rõ kết quả và phối hợp tốt.' },
    ],
  });
  const dayAt = (start, offset) => new Date(Date.parse(start + 'T00:00:00Z') + offset * 86400000).toISOString().slice(0, 10);
  const hour = 3_600_000;
  const submissionStages = ['pending', 'overdue', 'submitted', 'awaiting', 'responded'];
  const submissionMonths = {
    '10': { referenceDay: 30, pastDays: [5, 8, 12, 15, 19, 21, 25, 28], upcomingDays: [30, 31] },
    '11': { referenceDay: 24, pastDays: [4, 6, 9, 12, 14, 17, 20, 22], upcomingDays: [25, 27, 29, 30] },
  };

  function submissionSchedule(index, projectIndex, start, done) {
    if (done) return { stage: 'responded', deadline: `${dayAt(start, 20 + index * 2)}T16:59:00.000Z` };
    if (index < 10) {
      return { stage: 'pending', deadline: new Date(Date.UTC(2026, 11, index + 1, 16, 59)).toISOString() };
    }

    const month = index < 20 ? '11' : '10';
    const { referenceDay, pastDays, upcomingDays } = submissionMonths[month];
    const stage = submissionStages[(index + projectIndex) % submissionStages.length];
    const days = stage === 'pending' ? upcomingDays : pastDays;
    const day = String(days[(index + projectIndex * 3) % days.length]).padStart(2, '0');
    const deadline = new Date(`2026-${month}-${day}T23:59:00+07:00`).toISOString();
    const referenceTime = Date.parse(`2026-${month}-${referenceDay}T12:00:00+07:00`);
    return { stage, deadline, referenceTime };
  }

  data.studentProjectOverviews ||= {};
  data.projectTeams ||= [];
  data.projectProgress ||= [];
  data.teachingSeeds ||= [];
  data.teachingCriteria ||= [{ id: 'TC001', title: 'Nội dung', weight: 40 }, { id: 'TC002', title: 'Sản phẩm', weight: 40 }, { id: 'TC003', title: 'Báo cáo', weight: 20 }];
  projects.forEach((project, projectIndex) => {
    const record = rows.get(project.topicId);
    const done = completed.has(project.topicId);
    const start = project.startsAt;
    const evaluatedAt = done ? project.semester === '1' ? '2025-01-15' : '2025-06-15' : null;
    let evaluation = null;
    if (done) {
      const score = [8.4, 8.8, 9.0, 8.6, 8.2][completedIds.indexOf(project.topicId)];
      evaluation = { ...copy(evaluationTemplate), projectId: project.id, published: true, score,
        resultLabel: 'Đạt yêu cầu', lecturerName: project.lecturer, evaluatedAt,
        criteria: evaluationTemplate.criteria.map(criterion => ({ ...criterion, score })),
        feedback: `Nhóm đã hoàn thành đề tài “${project.title}”, bàn giao kết quả và báo cáo theo phạm vi đã thống nhất.`, attachment: { name: 'Phieu_danh_gia.pdf' } };
      data.projectEvaluations = data.projectEvaluations.filter(item => item.projectId !== project.id);
      data.projectEvaluations.push(evaluation);
    }
    data.studentProjectOverviews[project.id] = copy(project);
    data.projectTeams = data.projectTeams.filter(item => item.projectId !== project.id);
    const projectPeople = (record.authors?.length ? record.authors : people.map(person => person.name)).map((name, index) => ({ code: people[index]?.code || `SV-DEMO-${index + 1}`, name, role: index === 0 ? 'nhom-truong' : 'thanh-vien' }));
    data.projectTeams.push({ projectId: project.id, maxMembers: Math.max(3, projectPeople.length), members: projectPeople, supervisorIds: project.role === 'secondary' ? ['GV002', 'GV001'] : ['GV001'], invitations: [] });
    const tasks = [];
    const fallbackTasks = ['Khảo sát bài toán và phạm vi', 'Tổng hợp tài liệu liên quan', 'Xác định yêu cầu', 'Phân tích dữ liệu đầu vào', 'Thiết kế giải pháp', 'Xây dựng bản thử nghiệm', 'Kiểm thử chức năng', 'Đánh giá kết quả', 'Hoàn thiện báo cáo', 'Chuẩn bị trình bày'];
    const fallback = { tasks: Object.fromEntries(['notStarted', 'inProgress', 'completed'].map((stage, column) => [stage, fallbackTasks.map((title, index) => [`${title}: ${record.title}`, `2026-${column === 0 ? '12' : '11'}-${String(index + 1).padStart(2, '0')}`])])),
      deliverables: Array.from({ length: 30 }, (_, index) => ({ title: `${fallbackTasks[index % 10]} — Báo cáo ${Math.floor(index / 10) + 1}`, description: `Báo cáo nội dung thực hiện cho đề tài “${record.title}”.`, due: '2026-12-15T23:59' })) };
    const work = record.supervision || fallback;
    ['notStarted', 'inProgress', 'completed'].forEach((stage, column) => {
      const entries = work.tasks[stage];
      entries.forEach(([title, deadline], index) => {
        const member = projectPeople[index % projectPeople.length];
        const due = done ? dayAt(start, 7 + column * 20 + index) : new Date(Date.UTC(2026, column === 0 ? 11 : column === 1 ? 10 : 9, (column === 1 ? 24 : 1) + index)).toISOString().slice(0, 10);
        tasks.push({ id: `${project.id}-task-${column}-${index}`, title, deadline: due,
          assigneeCode: member.code, assigneeCodes: [member.code],
          status: done ? 'da-hoan-thanh' : ['chua-thuc-hien', 'dang-thuc-hien', 'da-hoan-thanh'][column], percent: done ? 100 : [0, 50, 100][column] });
      });
    });
    data.projectProgress = data.projectProgress.filter(item => item.projectId !== project.id);
    data.projectProgress.push({ projectId: project.id, revision: 0, tasks, history: [] });
    const requirements = [];
    const submissions = [];
    work.deliverables.forEach((item, index) => {
      const { stage, deadline, referenceTime } = submissionSchedule(index, projectIndex, start, done);
      const id = `${project.id}-request-${index}`;
      const submissionId = `${project.id}-submission-${index}`;
      const fileName = item.file || `bao-cao-${index + 1}.pdf`;
      const reviewed = stage === 'responded';
      const submitted = stage === 'submitted';
      const sourceStage = reviewed ? 'reviewed' : submitted || stage === 'awaiting' ? 'submitted' : 'pending';
      const archive = submitted && index % 10 < 5
        ? (index < 20 ? 'de-cuong-mau' : 'dac-ta-yeu-cau-mau') : undefined;
      // Preserve the file source when a browser record still uses an older sample schedule.
      submissionSamples.set(submissionId, { projectId: project.id, fileName, archive });
      if (referenceTime !== undefined) demoDeadlines.set(id, { deadline, referenceTime });
      requirements.push({
        id, title: item.title, deadline, locked: done, sourceStage,
        content: item.description || `Trình bày kết quả thực hiện và minh chứng cho nội dung ${item.title}.`,
      });
      if (sourceStage === 'pending') return;
      const submittedAt = Date.parse(deadline) + (index % 3 === 0 ? hour : -hour);
      const feedbackAt = done ? `${evaluatedAt}T09:00:00+07:00` : new Date(submittedAt + 3 * hour).toISOString();
      submissions.push({
        id: submissionId, requirementId: id, title: item.title,
        fileName, submittedAt: new Date(submittedAt).toISOString(),
        feedback: reviewed ? item.feedback || 'Đã xem báo cáo. Bổ sung minh chứng và đối chiếu với mục tiêu đã thống nhất.' : '',
        feedbackHistory: [], ...(reviewed && { feedbackAt, feedbackBy: 'GV001' }),
        ...(submitted && { calendarStatus: 'submitted' }),
      });
    });
    data.teachingSeeds = data.teachingSeeds.filter(item => item.projectId !== project.id);
    data.teachingSeeds.push({ projectId: project.id, revision: 0, submissionsLocked: done, requirements, submissions, progressReviews: [], draft: null, publishedEvaluation: evaluation, audit: [] });
    const existing = data.lecturerTopics.find(item => item.kind === 'supervised' && item.id === project.topicId);
    if (existing) Object.assign(existing, { workspaceId: project.id, sharedStudentProject: true, representativeName: project.representativeName, lecturer: project.lecturer, role: project.role, roleLabel: project.roleLabel, groupName: project.groupName, semester: project.semester, academicYear: project.academicYear, startsAt: project.startsAt, completesAt: project.finalReportDate, milestones: project.milestones, status: project.status, statusLabel: project.statusLabel });
  });
  const viewing = projects.find(project => project.id === requestedProjectId);
  if (viewing && data.currentStudent) data.currentStudent = { ...data.currentStudent, name: viewing.representativeName };
  const viewedRecord = rows.get(viewing?.topicId || query.get('topic'));
  if (viewedRecord?.demoSupervisor) Object.assign(lecturer, viewedRecord.demoSupervisor);
})();
