(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.data = app.data || {};
  app.data.projectEvaluations = [
    ['DA001', 'Nguyễn Văn An'],
    ['DA002', 'Trần Thị Bình'],
  ].map(([projectId, lecturerName]) => ({
    projectId,
    published: true,
    score: 8.4,
    resultLabel: 'Đạt yêu cầu',
    criteria: [
      { id: 'TC001', title: 'Chức năng và sản phẩm', weight: 50, score: 8.5, comment: 'Đáp ứng yêu cầu, cần hoàn thiện thêm một số chi tiết.' },
      { id: 'TC002', title: 'Báo cáo và tài liệu', weight: 30, score: 8.0, comment: 'Đáp ứng yêu cầu, cần hoàn thiện thêm một số chi tiết.' },
      { id: 'TC003', title: 'Trình bày và phối hợp', weight: 20, score: 8.8, comment: 'Đáp ứng yêu cầu, cần hoàn thiện thêm một số chi tiết.' },
    ],
    lecturerName,
    evaluatedAt: '2026-11-15',
    feedback: 'Nhóm triển khai được các chức năng chính và phối hợp tốt. Cần bổ sung kiểm thử các trường hợp biên và hoàn thiện tài liệu sử dụng.',
    attachment: { name: 'Phieu_danh_gia.pdf' },
  }));
})();
