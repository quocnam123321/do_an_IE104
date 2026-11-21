(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.data = app.data || {};
  app.data.currentStudent = { code: '24520001', name: 'Nguyễn Minh Anh' };
  app.data.projectLecturers = [
    {
      id: 'GV001',
      name: 'Nguyễn Văn An',
      email: 'an.nguyen@example.com',
      faculty: 'Khoa Khoa học và Kỹ thuật Thông tin',
      department: 'Bộ môn Kỹ thuật phần mềm',
      research: 'Phát triển ứng dụng web và kỹ thuật phần mềm',
    },
    { id: 'GV002', name: 'Trần Thị Bình', email: 'binh.tran@example.com' },
    { id: 'GV003', name: 'Lê Minh Châu', email: 'chau.le@example.com' },
    { id: 'GV004', name: 'Phạm Minh D', email: 'minhd.pham@example.com' },
    { id: 'GV005', name: 'Nguyễn Minh Khang', email: 'khang.nguyen@example.com' },
  ];
  app.data.currentLecturer = app.data.projectLecturers.find(lecturer => lecturer.id === 'GV001');
  const members = [
    { code: '24520001', name: 'Nguyễn Minh Anh', role: 'nhom-truong' },
    { code: '24520002', name: 'Trần Gia Huy', role: 'thanh-vien' },
    { code: '24520003', name: 'Lê Ngọc Linh', role: 'thanh-vien' },
  ];
  const commonOverview = {
    courseLabel: 'IE104 - Internet và Công nghệ Web',
    objectives: [
      'Thiết kế giao diện quản lý rõ ràng.',
      'Hỗ trợ phân công công việc, theo dõi thời hạn và tổng hợp báo cáo của nhóm.',
    ].join('\n'),
    milestones: ['01/10/2026', '15/11/2026', '20/12/2026'],
  };
  const commonOutcomes = ['Mã nguồn và dữ liệu mẫu.', 'Báo cáo kiểm thử và hướng dẫn sử dụng.'];
  const webOverview = {
    ...commonOverview,
    description: 'Xây dựng website tập trung thông tin đề tài, nhóm sinh viên và các mốc thực hiện. Sinh viên theo dõi tiến độ, nộp báo cáo và xem phản hồi của giảng viên.',
    outcomes: ['Website quản lý đồ án.', ...commonOutcomes].join('\n'),
    coSupervisor: 'Trần Thị Bình',
    submissionTemplate: 'sample-submissions-web',
  };
  app.data.studentProjectOverviews = {
    DA001: webOverview,
    DA002: {
      ...commonOverview,
      description: 'Xây dựng website bán sách trực tuyến với danh mục sách, tra cứu, giỏ hàng và quản lý đơn hàng. Nhóm theo dõi tiến độ triển khai và báo cáo cho giảng viên.',
      outcomes: ['Website bán sách.', ...commonOutcomes].join('\n'),
      coSupervisor: 'Lê Minh Châu',
      submissionTemplate: 'sample-submissions-book',
    },
    DA005: webOverview,
  };

  app.data.projectTeams = [
    { projectId: 'DA001', maxMembers: 4, members, supervisorIds: ['GV001', 'GV002'], invitations: [{ id: 'INV-DA001-01', lecturerId: 'GV003', message: '', status: 'pending', createdAt: '2026-10-27T02:00:00.000Z' }] },
    { projectId: 'DA002', maxMembers: 4, members, supervisorIds: ['GV002', 'GV003'], invitations: [{ id: 'INV-DA002-01', lecturerId: 'GV004', message: '', status: 'pending', createdAt: '2026-10-27T02:00:00.000Z' }] },
    { projectId: 'DA005', maxMembers: 4, members, supervisorIds: ['GV001'], invitations: [] },
  ];
})();
