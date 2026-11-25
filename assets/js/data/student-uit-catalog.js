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
  const reportDeadlines = new Map([
    ['ISE-001', ['2026-11-04', '2026-12-08']],
    ['ISE-002', ['2026-11-05', '2026-12-09']],
    ['ISE-003', ['2026-11-07', '2026-12-11']],
    ['ISE-016', ['2026-11-09', '2026-12-12']],
    ['ISEDATN-001', ['2026-11-10', '2026-12-14']],
    ['ISEDATN-002', ['2026-11-12', '2026-12-15']],
    ['ISEDATN-003', ['2026-11-13', '2026-12-16']],
    ['ISEDATN-005', ['2026-11-15', '2026-12-18']],
    ['ISEDAMH-004', ['2026-11-17', '2026-12-19']],
    ['ISEDAMH-007', ['2026-11-18', '2026-12-20']],
    ['ISEDAMH-008', ['2026-11-20', '2026-12-22']],
    ['ISEDAMH-009', ['2026-11-21', '2026-12-23']],
    ['ISEDAMH-010', ['2026-11-23', '2026-12-24']],
    ['ISEDAMH-011', ['2026-11-24', '2026-12-26']],
    ['ISEDAMH-012', ['2026-11-26', '2026-12-27']],
    ['ISEDAMH-013', ['2026-11-27', '2026-12-28']],
    ['ISEDAMH-014', ['2026-11-29', '2026-12-29']],
    ['ISEDAMH-015', ['2026-11-30', '2026-12-30']],
  ]);
  const sampleTasks = {
    'ISE-001': [
      ['Loại các trận bị hoãn khỏi tập dữ liệu huấn luyện', 100],
      ['Đối chiếu kết quả dự đoán với kết quả vòng đấu gần nhất', 100],
      ['Phân tích các trận hòa mà mô hình dự đoán sai', 40],
    ],
    'ISE-002': [
      ['Bổ sung bình luận mỉa mai có ngữ cảnh vào tập kiểm thử', 60],
      ['Rà soát trường hợp hai người gán nhãn bất đồng', 30],
      ['Đánh giá mô hình trên bình luận chứa tiếng lóng', 0],
    ],
    'ISE-003': [
      ['Loại các đoạn video thiếu khung hình khỏi tập đánh giá', 100],
      ['Kiểm tra nhãn ở điểm chuyển tiếp giữa hai hành động', 100],
      ['So sánh kết quả dự đoán khi thay đổi độ dài chuỗi đầu vào', 70],
    ],
    'ISE-016': [
      ['Kiểm tra mã QR của lô hàng đã thu hồi', 100],
      ['Đo thời gian truy xuất lịch sử qua nhiều điểm giao nhận', 65],
      ['Thử đồng bộ lại giao dịch khi nút mạng mất kết nối', 0],
    ],
    'ISEDATN-001': [
      ['Kiểm thử hai nhóm đặt cùng một thiết bị trong cùng khung giờ', 30],
      ['Bổ sung biên bản cho trường hợp thiết bị trả bị hỏng', 0],
      ['Kiểm tra lịch sử bàn giao khi gia hạn mượn thiết bị', 0],
    ],
    'ISEDATN-002': [
      ['Chuẩn hóa biểu mẫu đánh giá của đơn vị thực tập', 100],
      ['Kiểm thử việc đổi cán bộ phụ trách giữa kỳ', 65],
      ['Đối chiếu điểm đã duyệt với bảng tổng hợp xuất ra', 45],
    ],
    'ISEDATN-003': [
      ['So sánh độ chính xác OCR trên văn bản scan bị nghiêng', 70],
      ['Kiểm tra tìm kiếm số hiệu văn bản có dấu gạch chéo', 40],
      ['Xử lý các tệp scan trùng số hiệu và ngày ban hành', 0],
    ],
    'ISEDATN-005': [
      ['Kiểm tra số chỗ còn lại khi nhiều sinh viên đăng ký đồng thời', 100],
      ['Kiểm tra việc mời người tiếp theo khi có lượt hủy', 80],
      ['Đối chiếu giờ tình nguyện khi một sinh viên đổi ca', 50],
    ],
    'ISEDAMH-004': [
      ['Chuẩn hóa cách ghi tình trạng sách đã qua sử dụng', 100],
      ['Kiểm tra bộ lọc ấn bản khi nhiều sách trùng tên', 60],
      ['Thử mở lại tin sau khi hủy lịch trao đổi', 25],
    ],
    'ISEDAMH-007': [
      ['Kiểm tra số chỗ khi người tham gia hủy sát giờ', 50],
      ['Kiểm thử mã điểm danh cho buổi học đổi lịch', 35],
      ['Đối chiếu danh sách điểm danh và danh sách đăng ký', 25],
    ],
    'ISEDAMH-008': [
      ['Xác định khóa duy nhất cho lượt đặt suất ăn', 100],
      ['Kiểm tra tồn kho khi một đơn đặt suất ăn bị hủy', 100],
      ['Đối soát số suất bán ra với số suất đã nhận', 45],
    ],
    'ISEDAMH-009': [
      ['Cập nhật sơ đồ kết nối giữa các phòng học', 100],
      ['Tính lại băng thông khi hai phòng học trực tuyến đồng thời', 75],
      ['Kiểm tra vùng phủ Wi-Fi ở hành lang cuối tầng', 55],
    ],
    'ISEDAMH-010': [
      ['Ghi nhận số cổng mạng còn trống tại từng tầng thư viện', 100],
      ['So sánh chi phí hai phương án thay thiết bị chuyển mạch', 30],
      ['Sắp xếp lịch chuyển đổi ngoài giờ mở cửa thư viện', 0],
    ],
    'ISEDAMH-011': [
      ['Thống nhất tên trường dữ liệu cho hồ sơ sự kiện câu lạc bộ', 100],
      ['Kiểm tra tra cứu sự kiện theo nhiều nhiệm kỳ', 70],
      ['Rà soát quyền xem biên bản có thông tin thành viên', 35],
    ],
    'ISEDAMH-012': [
      ['Xử lý các thông báo học bổng trùng từ nhiều nguồn', 65],
      ['Kiểm tra định dạng hạn nộp trên dữ liệu nhập', 50],
      ['Đối chiếu thông báo hết hạn sau lần đồng bộ mới', 25],
    ],
    'ISEDAMH-013': [
      ['Lập danh sách quyền khi thành viên chuyển phòng ban', 100],
      ['Kiểm thử thu hồi quyền truy cập được cấp tạm thời', 90],
      ['Đối chiếu quyền kế thừa ở thư mục nhiều cấp', 65],
    ],
    'ISEDAMH-014': [
      ['Kiểm kê các thiết bị đã kết nối vào mạng khách', 100],
      ['Kiểm tra kết nối hợp lệ giữa máy in và máy trạm', 50],
      ['Lập lịch kiểm tra nhật ký cảnh báo mạng', 20],
    ],
    'ISEDAMH-015': [
      ['Xác minh quy tắc khi hai sinh viên chọn cùng giờ tư vấn', 80],
      ['Kiểm tra việc dời lịch khi cố vấn vắng mặt', 50],
      ['Rà soát nội dung thông báo xác nhận tư vấn', 35],
    ],
  };
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
    const [progressReportDate, finalReportDate] = done
      ? (semester === '1' ? ['2024-11-15', '2025-01-10'] : ['2025-04-15', '2025-06-10'])
      : reportDeadlines.get(id) ?? ['2026-11-15', '2027-01-03'];
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
    const additions = !done && sampleTasks[project.topicId];
    (additions || []).forEach(([title, percent], index) => {
      const member = projectPeople[index % projectPeople.length];
      const deadline = percent === 100 ? dayAt('2026-11-25', index - 4) : dayAt(project.finalReportDate, index - 7);
      const status = percent === 100 ? 'da-hoan-thanh' : percent === 0 ? 'chua-thuc-hien' : 'dang-thuc-hien';
      tasks.push({ id: `${project.id}-sample-task-${index + 1}`, title, deadline, assigneeCode: member.code, assigneeCodes: [member.code], status, percent });
    });
    data.projectProgress = data.projectProgress.filter(item => item.projectId !== project.id);
    data.projectProgress.push({ projectId: project.id, revision: 0, tasks, history: [], ...(additions && { sampleTaskVersion: 1 }) });
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
    if (existing) Object.assign(existing, {
      workspaceId: project.id, sharedStudentProject: true, representativeName: project.representativeName,
      lecturer: project.lecturer, role: project.role, roleLabel: project.roleLabel, groupName: project.groupName,
      semester: project.semester, academicYear: project.academicYear, startsAt: project.startsAt,
      progressReportDate: project.progressReportDate, finalReportDate: project.finalReportDate,
      completesAt: project.finalReportDate, milestones: project.milestones,
      status: project.status, statusLabel: project.statusLabel,
    });
  });
  const viewing = projects.find(project => project.id === requestedProjectId);
  if (viewing && data.currentStudent) data.currentStudent = { ...data.currentStudent, name: viewing.representativeName };
  const viewedRecord = rows.get(viewing?.topicId || query.get('topic'));
  if (viewedRecord?.demoSupervisor) Object.assign(lecturer, viewedRecord.demoSupervisor);
})();
