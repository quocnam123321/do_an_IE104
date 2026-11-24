(() => {
  const app = globalThis.IE104;
  const catalog = globalThis.UITLecturerCatalog;
  if (!app?.data || !catalog) return;
  const data = app.data;
  const copy = value => JSON.parse(JSON.stringify(value));
  const openIds = ['ISE-001', 'ISE-002', 'ISE-003', 'ISE-004', 'ISE-005', 'ISEDATN-001', 'ISEDATN-002', 'ISEDATN-003', 'ISEDATN-004', 'ISEDATN-005', 'ISEDAMH-004', 'ISEDAMH-002', 'ISEDAMH-009', 'ISEDAMH-011', 'ISEDAMH-013', 'ISEDAMH-015'];
  const myIds = ['ISEDAMH-004', 'ISEDAMH-009', 'ISEDAMH-011', 'ISEDATN-001', 'ISEDATN-002', 'ISEDATN-003', 'ISE-001', 'ISE-002', 'ISE-003', 'ISE-011'];
  const type = { course: 'do-an-mon-hoc', graduation: 'do-an-tot-nghiep', thesis: 'khoa-luan' };
  const rows = new Map(catalog.records.map(record => [record.id, record]));
  const defaultRequirements = ['Có kiến thức nền tảng phù hợp với lĩnh vực đề tài.', 'Thực hiện khảo sát, xây dựng giải pháp và đánh giá kết quả trong phạm vi đã thống nhất.', 'Bàn giao báo cáo, tài liệu và sản phẩm theo yêu cầu của giảng viên.'];
  const projectId = id => `UIT-SV-${id}`;
  data.studentUITCatalog = { openIds, myIds, projectId };
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
    const subject = catalog.courseCatalog[catalog.courseKey(record.course)];
    const displayId = catalog.formatCode(record.topicType, record.code, catalog.facultyFor(record));
    return {
      id: projectId(id), topicId: id, displayId, topicCode: displayId,
      title: record.title, type: type[record.topicType], topicType: record.topicType, typeLabel: record.type,
      courseId: record.course || '', courseCode: subject?.code || '', courseLabel: catalog.subjectLabel(record, true),
      semester: '1', academicYear: '2026-2027', lecturerLabel: 'Sinh viên đại diện', lecturer: record.demoSupervisor.name, lecturerId: lecturer.id,
      representativeName: record.authors?.[0] || 'Chưa có thông tin', representativeCode: 'xxxxxxxx',
      groupName: record.supervision?.group || `Nhóm ${String(index + 30).padStart(2, '0')}`,
      role: 'primary', roleLabel: 'Hướng dẫn chính', status: 'dang-thuc-hien', statusLabel: 'Đang thực hiện',
      createdAt: `2026-11-${String(22 - index).padStart(2, '0')}T09:00:00+07:00`,
      description: record.description, objectives: join(record.objectives), outcomes: join(record.outcomes),
      requirements: join(record.requirements?.length ? record.requirements : defaultRequirements),
      milestones: ['21/09/2026', '15/11/2026', '03/01/2027'], sourceRecord: copy(record),
      detailUrl: `chi-tiet-de-tai-sinh-vien.html?project=${encodeURIComponent(projectId(id))}#tong-quan`,
    };
  });
  const query = new URLSearchParams(globalThis.location?.search || '');
  const requestedProjectId = query.get('project');
  const legacyProject = data.myTopics?.find(project => project.id === requestedProjectId);
  data.myTopics = legacyProject ? [...projects, legacyProject] : projects;
  data.studentProjectOverviews ||= {};
  data.projectTeams ||= [];
  data.projectProgress ||= [];
  data.teachingSeeds ||= [];
  data.teachingCriteria ||= [{ id: 'TC001', title: 'Nội dung', weight: 40 }, { id: 'TC002', title: 'Sản phẩm', weight: 40 }, { id: 'TC003', title: 'Báo cáo', weight: 20 }];
  projects.forEach(project => {
    const record = rows.get(project.topicId);
    data.studentProjectOverviews[project.id] = copy(project);
    data.projectTeams = data.projectTeams.filter(item => item.projectId !== project.id);
    const projectPeople = (record.authors?.length ? record.authors : people.map(person => person.name)).map((name, index) => ({ code: people[index]?.code || `SV-DEMO-${index + 1}`, name, role: index === 0 ? 'nhom-truong' : 'thanh-vien' }));
    data.projectTeams.push({ projectId: project.id, maxMembers: Math.max(3, projectPeople.length), members: projectPeople, supervisorIds: ['GV001'], invitations: [] });
    const tasks = [];
    const fallbackTasks = ['Khảo sát bài toán và phạm vi', 'Tổng hợp tài liệu liên quan', 'Xác định yêu cầu', 'Phân tích dữ liệu đầu vào', 'Thiết kế giải pháp', 'Xây dựng bản thử nghiệm', 'Kiểm thử chức năng', 'Đánh giá kết quả', 'Hoàn thiện báo cáo', 'Chuẩn bị trình bày'];
    const fallback = { tasks: Object.fromEntries(['notStarted', 'inProgress', 'completed'].map((stage, column) => [stage, fallbackTasks.map((title, index) => [`${title}: ${record.title}`, `2026-${column === 0 ? '12' : '11'}-${String(index + 1).padStart(2, '0')}`])])),
      deliverables: Array.from({ length: 30 }, (_, index) => ({ title: `${fallbackTasks[index % 10]} — Báo cáo ${Math.floor(index / 10) + 1}`, description: `Báo cáo nội dung thực hiện cho đề tài “${record.title}”.`, due: '2026-12-15T23:59' })) };
    const work = record.supervision || fallback;
    ['notStarted', 'inProgress', 'completed'].forEach((stage, column) => {
      const entries = work.tasks[stage];
      entries.forEach(([title, deadline], index) => {
        const member = projectPeople[index % projectPeople.length];
        const due = new Date(Date.UTC(2026, column === 0 ? 11 : column === 1 ? 10 : 9, (column === 1 ? 24 : 1) + index)).toISOString().slice(0, 10);
        tasks.push({ id: `${project.id}-task-${column}-${index}`, title, deadline: due,
          assigneeCode: member.code, assigneeCodes: [member.code],
          status: ['chua-thuc-hien', 'dang-thuc-hien', 'da-hoan-thanh'][column], percent: [0, 50, 100][column] });
      });
    });
    data.projectProgress = data.projectProgress.filter(item => item.projectId !== project.id);
    data.projectProgress.push({ projectId: project.id, revision: 0, tasks, history: [] });
    const deliverables = work.deliverables;
    const dueFor = index => new Date(Date.UTC(2026, index < 10 ? 11 : index < 20 ? 10 : 9, index % 10 + 1, 16, 59)).toISOString();
    const requirements = deliverables.map((item, index) => ({ id: `${project.id}-request-${index}`, title: item.title, content: item.description || `Trình bày kết quả thực hiện và minh chứng cho nội dung ${item.title}.`, deadline: dueFor(index), locked: false, sourceStage: index < 10 ? 'pending' : index < 20 ? 'submitted' : 'reviewed' }));
    const submissions = deliverables.flatMap((item, index) => index < 10 ? [] : [{
      id: `${project.id}-submission-${index}`, requirementId: requirements[index].id, title: item.title,
      fileName: item.file || `bao-cao-${index + 1}.pdf`, submittedAt: new Date(Date.parse(dueFor(index)) + (index % 3 === 0 ? 3600000 : -3600000)).toISOString(),
      feedback: index >= 20 ? item.feedback || 'Đã xem báo cáo. Bổ sung minh chứng và đối chiếu với mục tiêu đã thống nhất.' : '',
      feedbackHistory: [], ...(index >= 20 ? { feedbackAt: '2026-11-20T09:00:00+07:00', feedbackBy: 'GV001' } : {}),
    }]);
    data.teachingSeeds = data.teachingSeeds.filter(item => item.projectId !== project.id);
    data.teachingSeeds.push({ projectId: project.id, revision: 0, submissionsLocked: false, requirements, submissions, progressReviews: [], draft: null, publishedEvaluation: null, audit: [] });
    const existing = data.lecturerTopics.find(item => item.kind === 'supervised' && item.id === project.topicId);
    if (existing) Object.assign(existing, { workspaceId: project.id, sharedStudentProject: true, representativeName: project.representativeName, lecturer: project.lecturer, role: project.role, roleLabel: project.roleLabel, groupName: project.groupName, semester: project.semester, academicYear: project.academicYear, status: project.status, statusLabel: project.statusLabel });
  });
  const viewing = projects.find(project => project.id === requestedProjectId);
  if (viewing && data.currentStudent) data.currentStudent = { ...data.currentStudent, name: viewing.representativeName };
  const viewedRecord = rows.get(viewing?.topicId || query.get('topic'));
  if (viewedRecord?.demoSupervisor) Object.assign(lecturer, viewedRecord.demoSupervisor);
})();
