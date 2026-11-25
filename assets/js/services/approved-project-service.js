(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.services ||= {};
  const clone = value => JSON.parse(JSON.stringify(value));
  const projectIdFor = proposalId => `DT-${proposalId}`;
  const studentUrl = projectId => `chi-tiet-de-tai-sinh-vien.html?project=${encodeURIComponent(projectId)}`;
  const lecturerUrl = projectId => `chi-tiet-de-tai-dang-huong-dan-giang-vien.html?project=${encodeURIComponent(projectId)}`;

  function proposalContent(record) {
    const outline = record.outline;
    return {
      outline: outline ? clone(outline) : null,
      startsAt: outline?.startDate || record.startsAt || '',
      progressReportDate: outline?.progressReportDate || record.progressReportDate || '',
      finalReportDate: outline?.finalReportDate || outline?.endDate || record.finalReportDate || '',
      methodAndScope: outline?.methodAndScope || [outline?.method, outline?.scope].filter(Boolean).join('\n\n') || record.methodAndScope || '',
      plan: outline?.plan || record.plan || '',
      attachment: record.attachment ? clone(record.attachment) : null,
      attachmentSize: record.attachmentSize,
      attachmentFileKey: record.attachmentFileKey,
      attachmentSample: record.attachmentSample,
    };
  }

  function definitions() {
    const proposals = app.storage.readProposals().filter(record => record.status === 'da-duyet').map(record => {
      const student = record.student || app.data.legacyProposalStudent;
      const id = projectIdFor(record.id);
      const project = {
        id, topicId: id, requestId: record.id, source: 'approved-proposal', topicCode: record.topicCode, displayId: record.topicCode,
        coverImage: record.coverImage,
        title: record.title, type: record.type === 'khoa-luan' ? 'khoa-luan' : 'do-an', typeLabel: record.typeLabel,
        courseId: record.courseId, courseLabel: record.courseLabel, semester: record.semester, academicYear: record.academicYear,
        status: 'dang-thuc-hien', statusLabel: 'Đang thực hiện', groupName: `Nhóm của ${student.name}`,
        lecturer: record.supervisorName, lecturerLabel: 'Giảng viên hướng dẫn', roleLabel: 'Hướng dẫn chính',
        lecturerId: record.decision.lecturerId, createdAt: record.decision.decidedAt,
        description: record.description, objectives: record.objectives, outcomes: record.outcomes, ...proposalContent(record),
        detailUrl: studentUrl(id), requestDetailUrl: `chi-tiet-de-tai-cho-duyet-sinh-vien.html?proposal=${encodeURIComponent(record.id)}`,
      };
      return {
        project,
        team: { projectId: id, maxMembers: 4, members: record.outline ? clone(record.outline.members) : [{ ...student, role: 'nhom-truong' }], supervisorIds: [record.decision.lecturerId], invitations: [] },
        progress: { projectId: id, revision: 0, tasks: [], history: [] },
      };
    });
    const registrations = app.storage.readRegistrations().filter(record => ['da-dang-ky', 'da-duyet'].includes(record.status)).map(record => {
      const id = projectIdFor(record.id);
      const topic = record.topic;
      const lecturerId = record.lecturerId || record.decision?.lecturerId;
      const groupName = record.groupName.trim() || 'Nhóm chưa đặt tên';
      const describe = value => Array.isArray(value) ? value.join('\n') : value || '';
      return {
        project: {
          id, topicId: id, requestId: record.id, source: 'approved-registration', displayId: topic.displayId || topic.id,
          registrationStatus: record.status, requestStatusLabel: record.status === 'da-dang-ky' ? 'Đã đăng ký' : 'Đã duyệt',
          title: topic.title, type: topic.type === 'khoa-luan' ? 'khoa-luan' : 'do-an', typeLabel: topic.typeLabel,
          courseId: topic.courseId, courseLabel: topic.courseLabel, semester: topic.semester, academicYear: topic.academicYear,
          status: 'dang-thuc-hien', statusLabel: 'Đang thực hiện', groupName,
          lecturer: topic.lecturer, lecturerLabel: 'Giảng viên hướng dẫn', roleLabel: 'Hướng dẫn chính',
          lecturerId, createdAt: record.decision?.decidedAt || record.createdAt,
          startsAt: topic.startsAt, progressReportDate: topic.progressReportDate, finalReportDate: topic.finalReportDate,
          description: describe(topic.description), objectives: describe(topic.objectives), outcomes: describe(topic.outcomes),
          requirements: describe(topic.requirements),
          methodAndScope: describe(topic.methodAndScope), plan: describe(topic.plan),
          detailUrl: studentUrl(id), requestDetailUrl: `chi-tiet-dang-ky-da-luu.html?registration=${encodeURIComponent(record.id)}`,
        },
        team: { projectId: id, maxMembers: topic.registrationRules?.maxMembers || 3, members: clone(record.members), supervisorIds: lecturerId ? [lecturerId] : [], invitations: [] },
        progress: { projectId: id, revision: 0, tasks: [], history: [] },
      };
    });
    return [...proposals, ...registrations];
  }

  function get(projectId) {
    const existing = definitions().find(item => item.project.id === projectId);
    if (existing) return clone(existing);
    const lecturerId = app.data.currentLecturer?.id;
    const record = lecturerId && globalThis.IE104Proposals?.getApprovedSeed(projectId);
    if (!record) return null;
    return clone({
      project: {
        id: projectId, topicId: record.topicId, requestId: record.id, source: 'approved-proposal',
        topicCode: record.topicCode, displayId: record.topicCode,
        isSharedProposalSample: Boolean(record.studentVisible),
        title: record.title, type: record.topicType, typeLabel: record.topicTypeLabel,
        courseLabel: record.courseLabel, semester: record.semester, academicYear: record.academicYear,
        status: 'dang-thuc-hien', statusLabel: 'Đang thực hiện',
        groupName: record.groupName || '', roleLabel: record.supervisionRoleLabel,
        lecturer: record.supervisorName || record.supervisor || app.data.currentLecturer.name, lecturerId, createdAt: record.decidedAt,
        description: record.description, objectives: record.objectives, outcomes: record.outcomes, ...proposalContent(record),
        sourceRecord: record.sourceRecord,
      },
      team: {
        projectId,
        maxMembers: 4,
        members: record.outline?.members ? clone(record.outline.members) : record.studentId && record.studentName ? [{ code: record.studentId, name: record.studentName, role: 'nhom-truong' }] : [],
        supervisorIds: [lecturerId], invitations: [],
      },
      progress: { projectId, revision: 0, tasks: [], history: [] },
    });
  }

  function studentCanView(definition, savedTeams) {
    const members = savedTeams.find(team => team.projectId === definition.project.id)?.members || definition.team.members;
    return members.some(member => member.code === app.data.currentStudent?.code);
  }

  function forStudent(projectId) {
    const definition = get(projectId);
    if (!definition) throw new Error('Không tìm thấy đề tài đang thực hiện.');
    if (!definition.project.isSharedProposalSample && !studentCanView(definition, app.storage.readProjectTeams())) throw new Error('Sinh viên hiện tại không thuộc nhóm thực hiện đề tài này.');
    return definition;
  }

  function canSupervise(project, supervisorIds) {
    if (supervisorIds.includes(app.data.currentLecturer?.id)) return true;
    return project.source === 'approved-proposal' && supervisorIds.includes(project.lecturerId) &&
      Boolean(app.services.proposals?.canReview(project.lecturerId));
  }

  function list(role) {
    const all = definitions();
    if (role === 'lecturer') return clone(all.filter(({ project, team }) => canSupervise(project, team.supervisorIds)).map(item => item.project));
    if (role !== 'student') throw new Error('Chọn vai trò hợp lệ để xem đề tài.');
    const savedTeams = app.storage.readProjectTeams();
    return clone(all.filter(item => studentCanView(item, savedTeams)).map(item => item.project));
  }

  app.services.approvedProjects = { get, forStudent, list, canSupervise, projectIdFor, studentUrl, lecturerUrl };
})();
