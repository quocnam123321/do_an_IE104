(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.data = app.data || {};
  app.data.projectMilestones = ['DA001', 'DA002'].map(projectId => ({
    projectId,
    dates: [
      { id: 'progress-report', title: 'Hạn báo cáo tiến độ', date: '2026-11-15' },
      { id: 'final-report', title: 'Hạn báo cáo cuối cùng', date: '2026-12-20' },
    ],
  }));
})();
