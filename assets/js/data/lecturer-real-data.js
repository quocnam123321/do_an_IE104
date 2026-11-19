(() => {
  const app = globalThis.IE104;
  const data = app?.data;
  const source = data?.lecturerSourceCatalog?.records;
  if (!Array.isArray(source) || source.length !== 10 || !source.every(record => record && typeof record.title === 'string' && Array.isArray(record.authors) && Array.isArray(record.advisors) && Array.isArray(record.subjects) && /^https:\/\/ise\.uit\.edu\.vn\/vi\/bai-viet\//.test(record.sourceUrl) && /^ISE-\d{3}$/.test(record.code))) {
    if (data) { data.lecturerRealMode = true; data.lecturerRealDataError = 'Chưa tải đủ bộ đề tài UIT. Hãy tải lại trang hoặc kiểm tra các file dữ liệu vừa copy.'; data.lecturerTopics = []; }
    return;
  }
  const clone = value => JSON.parse(JSON.stringify(value));
  const oldId = 'GV-DT001-N01';
  const team = data.projectTeams?.find(item => item.projectId === oldId);
  const progress = data.projectProgress?.find(item => item.projectId === oldId);
  const teaching = data.teachingSeeds?.find(item => item.projectId === oldId);
  data.lecturerLegacyTopics = data.lecturerTopics || [];
  const subjects = source.map((record, index) => {
    const id = record.code;
    const projectId = `GV-${id}`;
    const completed = index >= 6;
    return { record, index, id, projectId, completed };
  });
  data.lecturerRealMode = true;
  data.lecturerRealDefaultTopicId = subjects[0].id;
  data.lecturerRealDefaultProjectId = subjects[0].projectId;
  data.lecturerTopics = subjects.flatMap(({ record, index, id, projectId, completed }) => {
    const common = {
      id, ownerId: 'GV001', title: record.title, topicType: 'thesis', typeLabel: record.type,
      course: '', courseLabel: 'Không áp dụng', semester: 1, academicYear: '2026-2027', createdAt: '2026-10-28',
      sourceRecord: clone(record), source: 'uit-metadata-demo',
    };
    return [
      { ...common, kind: 'created', status: index < 5 ? 'open' : 'closed', statusLabel: index < 5 ? 'Đang mở đăng ký' : 'Đã đóng đăng ký',
        description: `${record.type}: ${record.title}. Tác giả: ${record.authors.join(', ')}.`,
        objectives: ['khảo sát, thiết kế và thử nghiệm giải pháp theo chủ đề đề tài.'],
        outcomes: ['sản phẩm thử nghiệm và báo cáo tổng kết.'], requirements: ['có kiến thức nền tảng phù hợp và phối hợp làm việc nhóm.'],
        supervisor: { name: record.advisors.join(', ') || 'Chưa công bố trong nguồn', faculty: '', email: '', research: '' },
        registration: { minMembers: 2, maxMembers: 3, deadline: '2026-12-15T23:59:00+07:00' }, attachmentName: '' },
      { ...common, kind: 'supervised', workspaceId: projectId, groupName: `Nhóm ${String(index + 1).padStart(2, '0')}`,
        role: 'primary', roleLabel: 'Hướng dẫn chính', status: completed ? 'hoan-thanh' : 'dang-thuc-hien', statusLabel: completed ? 'Hoàn thành' : 'Đang thực hiện' },
    ];
  });
  if (data.lecturerProjects) data.lecturerProjects = subjects.map(({ record, index, id, projectId, completed }) => ({
    id: projectId, topicId: id, title: record.title, groupName: `Nhóm ${String(index + 1).padStart(2, '0')}`,
    status: completed ? 'hoan-thanh' : 'dang-thuc-hien', statusLabel: completed ? 'Hoàn thành' : 'Đang thực hiện',
    typeLabel: record.type, courseLabel: 'Không áp dụng', semester: 1, academicYear: '2026-2027', sourceRecord: clone(record),
  }));
  if (team) {
    data.projectTeams = data.projectTeams.filter(item => item.projectId !== oldId);
    subjects.forEach(({ record, projectId, id }) => {
      const copy = clone(team); copy.projectId = projectId;
      copy.members = team.members.map((member, index) => ({ code: `MB-${id.slice(4)}-${index + 1}`, name: record.authors[index] || `Thành viên ${index + 1}`, role: index === 0 ? 'nhom-truong' : 'thanh-vien' }));
      data.projectTeams.push(copy);
    });
  }
  const taskNames = ['Khảo sát bài toán', 'Phân tích tài liệu liên quan', 'Xác định phạm vi', 'Thiết kế giải pháp', 'Chuẩn bị dữ liệu thử nghiệm', 'Xây dựng bản thử nghiệm', 'Đánh giá kết quả', 'Kiểm thử và hiệu chỉnh', 'Tổng hợp kết quả', 'Viết báo cáo', 'Chuẩn bị trình bày', 'Hoàn thiện tài liệu', 'Rà soát và bàn giao'];
  if (progress) {
    data.projectProgress = data.projectProgress.filter(item => item.projectId !== oldId);
    subjects.forEach(({ projectId }) => {
      const copy = clone(progress); copy.projectId = projectId;
      const people = data.projectTeams.find(item => item.projectId === projectId)?.members || [];
      const personFor = code => people[team.members.findIndex(member => member.code === code)];
      copy.tasks.forEach((task, index) => {
        task.title = `${taskNames[index % taskNames.length]}`;
        task.assigneeCode = personFor(task.assigneeCode)?.code || task.assigneeCode;
        if (task.assigneeCodes) task.assigneeCodes = task.assigneeCodes.map(code => personFor(code)?.code || code);
        if (task.assignees) task.assignees = task.assignees.map(person => personFor(person.code) || person);
      });
      copy.history.forEach(item => {
        item.taskTitle = copy.tasks.find(task => task.id === item.taskId)?.title || 'Công việc';
        item.content = 'Đã tổng hợp kết quả thực hiện và các nội dung cần bổ sung.';
        const person = personFor(item.actorCode);
        if (person) { item.actorCode = person.code; item.actorName = person.name; }
      });
      data.projectProgress.push(copy);
    });
  }
  if (teaching) {
    data.teachingSeeds = data.teachingSeeds.filter(item => item.projectId !== oldId);
    subjects.forEach(({ projectId }) => {
      const copy = clone(teaching); copy.projectId = projectId;
      copy.requirements.forEach((requirement, index) => {
        requirement.title = `${taskNames[index % taskNames.length]} - Báo cáo`;
        requirement.content = 'Nộp báo cáo nội dung đã thực hiện, kết quả thử nghiệm và kế hoạch tiếp theo.';
      });
      copy.submissions.forEach((submission, index) => {
        submission.title = copy.requirements.find(requirement => requirement.id === submission.requirementId)?.title || 'Báo cáo';
        if (submission.fileName) submission.fileName = `bao-cao-${index + 1}.pdf`;
        if (submission.studentNote) submission.studentNote = 'Kính gửi giảng viên báo cáo để xem xét và góp ý.';
      });
      copy.progressReviews.forEach(review => { if (review.content) review.content = 'cần kiểm tra và bổ sung kết quả thử nghiệm.'; });
      data.teachingSeeds.push(copy);
    });
  }
  data.lecturerRealProposalSeeds = subjects.slice(0, 6).map(({ record, index, id }) => ({
    id: `DX-${id}`, topicId: `DT-DX-${id}`, title: record.title, source: 'uit-demo', sourceRecord: clone(record),
    topicType: 'khoa-luan', topicTypeLabel: record.type, course: 'khoa-luan', courseLabel: 'Khóa luận tốt nghiệp',
    supervisionRole: 'huong-dan-chinh', supervisionRoleLabel: 'Hướng dẫn chính',
    studentName: `Người gửi ${index + 1}`, studentId: `MB-SV-${index + 1}`, semester: '1', academicYear: '2026-2027',
    submittedAt: '2026-11-18T09:00:00+07:00', description: `Đề xuất: ${record.title}.`,
    objectives: 'Khảo sát và xây dựng giải pháp cho bài toán đề xuất.', outcomes: 'Bản thử nghiệm và báo cáo tổng kết.', attachment: '',
  }));
})();
