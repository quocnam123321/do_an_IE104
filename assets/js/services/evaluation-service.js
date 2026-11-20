(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services = app.services || {};
  const hasText = value => typeof value === 'string' && Boolean(value.trim());
  const validScore = value => Number.isFinite(value) && value >= 0 && value <= 10;

  function getResult(projectId) {
    if (!app.data.myTopics.some(project => project.id === projectId) && !app.services.approvedProjects?.forStudent(projectId)) throw new Error('Không tìm thấy đề tài cần xem đánh giá.');
    const saved = app.storage?.readTeachingRecords?.().find(item => item.projectId === projectId);
    const record = saved?.publishedEvaluation || app.data.projectEvaluations.find(item => item.projectId === projectId);
    if (!record || record.published === false) return { projectId, status: 'unpublished' };
    const invalid = () => { throw new Error('Không thể hiển thị kết quả vì dữ liệu đánh giá chưa hợp lệ.'); };
    if (record.published !== true || !validScore(record.score) || !['resultLabel', 'lecturerName', 'feedback'].every(key => hasText(record[key]))) invalid();
    if (!Array.isArray(record.criteria) || !record.criteria.length) invalid();
    if (!record.criteria.every(item => item && hasText(item.id) && hasText(item.title) && hasText(item.comment) && validScore(item.score) && Number.isFinite(item.weight) && item.weight >= 0 && item.weight <= 100)) invalid();
    if (new Set(record.criteria.map(item => item.id)).size !== record.criteria.length || Math.abs(record.criteria.reduce((sum, item) => sum + item.weight, 0) - 100) > 0.0001) invalid();
    if (!hasText(record.evaluatedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(record.evaluatedAt)) invalid();
    const date = new Date(`${record.evaluatedAt}T00:00:00.000Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== record.evaluatedAt) invalid();
    if (record.attachment !== null && (!record.attachment || !hasText(record.attachment.name))) invalid();
    return {
      projectId, status: 'published', score: record.score, resultLabel: record.resultLabel,
      criteria: record.criteria.map(item => ({ id: item.id, title: item.title, weight: item.weight, score: item.score, comment: item.comment })),
      lecturerName: record.lecturerName, evaluatedAt: record.evaluatedAt, feedback: record.feedback,
      attachment: record.attachment ? { name: record.attachment.name, downloadAvailable: false } : null,
    };
  }

  app.services.evaluations = { getResult };
})();
