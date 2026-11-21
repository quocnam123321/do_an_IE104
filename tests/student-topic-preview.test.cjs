const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createContext, runInContext } = require('node:vm');

test('file preview shows bundled student project data without reading or writing storage', () => {
  const storageUnavailable = () => { throw new Error('Storage unavailable'); };
  const context = createContext({
    location: { protocol: 'file:' },
    localStorage: { getItem: storageUnavailable, setItem: storageUnavailable },
  });
  const files = [
    'data/mock-data.js', 'data/student-projects.js', 'data/student-progress.js',
    'data/student-evaluations.js', 'services/storage.js', 'services/project-team-service.js',
    'services/project-progress-service.js', 'services/evaluation-service.js',
  ];
  for (const file of files) {
    runInContext(readFileSync(join(__dirname, '../assets/js', file), 'utf8'), context);
  }

  const { projectTeams, projectProgress, evaluations } = context.IE104.services;
  const preview = { preview: true };
  const progress = projectProgress.getState('DA005', preview);
  assert.equal(progress.tasks.length, 7);
  assert.equal(projectProgress.summarize(progress).percent, 45);
  assert.equal(projectTeams.getPermission(progress.team).allowed, false);
  assert.equal(projectProgress.getPermissions(progress).manage, false);
  assert.equal(projectProgress.canUpdateTask(progress, progress.tasks[0]), false);
  assert.equal(evaluations.getResult('DA005', preview).status, 'unpublished');
  assert.equal(evaluations.getResult('DA001', preview).score, 8.4);
  assert.throws(() => projectProgress.getState('DA005'), /localhost/);
  assert.throws(() => evaluations.getResult('DA005'), /localhost/);
});
