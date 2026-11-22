(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.data ||= {};
  app.data.currentStudent ||= { code: '24520001', name: 'Nguyễn Minh Anh' };
  app.data.currentLecturer ||= { id: 'GV001', name: 'Nguyễn Văn An' };
  // Tài khoản giảng viên mẫu xét duyệt các đề xuất lưu cùng trình duyệt.
  app.data.proposalDemoReviewerId = 'GV001';
  app.data.legacyProposalStudent = { code: '24520001', name: 'Nguyễn Minh Anh' };
  app.data.proposalLecturers = [
    { choiceId: 'placeholder-1', id: 'GV001', name: 'Nguyễn Văn An' },
    { choiceId: 'placeholder-2', id: 'GV002', name: 'Trần Thị Bình' },
    { choiceId: 'placeholder-3', id: 'GV003', name: 'Lê Văn Cường' },
    { choiceId: 'placeholder-4', id: 'GV004', name: 'Phạm Minh Anh' },
    { choiceId: 'placeholder-5', id: 'GV005', name: 'Nguyễn Minh Khang' },
  ];
})();
