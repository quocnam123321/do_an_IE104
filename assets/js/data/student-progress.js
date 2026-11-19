(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.data = app.data || {};
  const names = ['Khảo sát yêu cầu', 'Phân tích chức năng', 'Thiết kế giao diện', 'Xây dựng chức năng', 'Kiểm thử và hoàn thiện báo cáo'];
  app.data.projectProgress = ['DA001', 'DA002'].map(projectId => ({
    projectId,
    revision: 0,
    tasks: [
      ...names.map((title, index) => ({ id: `cv-0${index + 1}`, title, assigneeCode: '24520001', deadline: '2026-11-15', status: index < 2 ? 'da-hoan-thanh' : 'chua-thuc-hien', percent: index < 2 ? 100 : 0 })),
      { id: 'cv-06', title: 'Xây dựng chức năng đăng ký đề tài', assigneeCode: '24520001', deadline: '2026-11-25', status: 'dang-thuc-hien', percent: 50 },
      { id: 'cv-07', title: 'Hoàn thiện giao diện quản lý nhóm', assigneeCode: '24520002', deadline: '2026-11-28', status: 'dang-thuc-hien', percent: 65 },
    ],
    history: [
      { id: 'history-01', taskId: 'cv-02', taskTitle: names[1], content: 'Hoàn tất danh sách chức năng', status: 'da-hoan-thanh', percent: 100, actorCode: '24520001', actorName: 'Nguyễn Minh Anh', createdAt: '2026-11-15T03:00:00.000Z' },
      { id: 'history-02', taskId: 'cv-01', taskTitle: names[0], content: 'Hoàn tất khảo sát', status: 'da-hoan-thanh', percent: 100, actorCode: '24520001', actorName: 'Nguyễn Minh Anh', createdAt: '2026-11-15T02:00:00.000Z' },
      { id: 'history-03', taskId: 'cv-01', taskTitle: names[0], content: 'Tổng hợp yêu cầu ban đầu', status: 'dang-thuc-hien', percent: 50, actorCode: '24520001', actorName: 'Nguyễn Minh Anh', createdAt: '2026-11-15T01:00:00.000Z' },
    ],
  }));
})();
