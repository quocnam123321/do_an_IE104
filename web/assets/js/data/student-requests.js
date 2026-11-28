(() => {
  const app = globalThis.IE104 = globalThis.IE104 || {};
  app.data = app.data || {};
  app.data.requestLecturers = [{ id: 'legacy-a', name: 'Nguyễn Văn A' }, { id: 'legacy-b', name: 'Trần Thị B' }];
  const members = [
    { code: '24520001', name: 'Nguyễn Minh Anh', role: 'nhom-truong' },
    { code: '24520002', name: 'Trần Gia Bảo', role: 'thanh-vien' },
    { code: '24520003', name: 'Lê Hoàng Chi', role: 'thanh-vien' },
  ];
  const shared = { revision: 0, type: 'do-an', typeLabel: 'Đồ án môn học', courseId: 'IE104', courseLabel: 'IE104 - Internet và Công nghệ Web', semester: 6, academicYear: '2026-2027', groupName: 'Web UIT', members, message: '', description: '', objectives: '', scope: '', outcomes: '', attachmentName: '', history: [], allowedModes: ['nhom'] };
  const withdrawnProposal = {
    ...shared, kind: 'de-xuat', status: 'da-rut', revision: 1, showInMyTopics: true, semester: 2,
    mode: 'ca-nhan', allowedModes: ['ca-nhan'], groupName: '', members: [members[0]], feedback: '',
    attachmentSample: 'proposal-summary',
  };
  app.data.initialRequests = [
    { ...shared, id: 'DK001', kind: 'dang-ky', title: 'Website quản lý thư viện', mode: 'nhom', status: 'cho-duyet', lecturerId: 'legacy-a', lecturerName: 'Nguyễn Văn A', createdAt: '2026-10-12T09:00:00+07:00', feedback: 'Chưa có kết quả xét duyệt.' },
    { ...shared, id: 'DK002', kind: 'dang-ky', title: 'Website quản lý câu lạc bộ sinh viên', mode: 'ca-nhan', allowedModes: ['ca-nhan'], groupName: '', members: [members[0]], status: 'da-duyet', lecturerId: 'legacy-b', lecturerName: 'Trần Thị B', createdAt: '2026-10-08T14:00:00+07:00', feedback: 'Bổ sung kế hoạch thực hiện và các mốc báo cáo.' },
    { ...shared, id: 'DX001', kind: 'de-xuat', title: 'Cổng thông tin nghiên cứu sinh viên', mode: 'nhom', status: 'cho-duyet', lecturerId: 'legacy-a', lecturerName: 'Nguyễn Văn A', createdAt: '2026-10-11T16:00:00+07:00', feedback: 'Chưa có kết quả xét duyệt.', description: 'Xây dựng cổng thông tin giúp sinh viên tra cứu công trình nghiên cứu, tìm đề tài quan tâm và tìm nhóm cùng thực hiện nghiên cứu.', objectives: 'Tập trung thông tin công trình nghiên cứu và hỗ trợ sinh viên tìm nhóm theo lĩnh vực quan tâm.', scope: 'Trình bày danh sách công trình, tìm kiếm theo tên hoặc lĩnh vực, xem chi tiết công trình và thông tin nhóm nghiên cứu.', outcomes: 'Cổng thông tin có chức năng tra cứu nghiên cứu, tìm nhóm theo lĩnh vực, kèm mã nguồn, dữ liệu mẫu và báo cáo.', attachmentName: 'de-cuong-de-tai-mau.txt' },
    { ...shared, id: 'DX002', kind: 'de-xuat', title: 'Website tìm nhóm học tập', mode: 'nhom', allowedModes: ['nhom', 'ca-nhan'], status: 'yeu-cau-chinh-sua', lecturerId: 'legacy-b', lecturerName: 'Trần Thị B', createdAt: '2026-10-07T10:00:00+07:00', feedback: 'Bổ sung tiêu chí ghép nhóm, phạm vi môn học và kế hoạch kiểm thử.', description: 'Xây dựng website giúp sinh viên đăng nhu cầu học tập, tìm bạn cùng môn học và tổ chức nhóm học tập phù hợp.', objectives: 'Giúp sinh viên tìm nhóm theo môn học và nhu cầu học tập; tạo giao diện giới thiệu nhóm, danh sách thành viên và lịch học dự kiến.', scope: 'Đăng nhu cầu tìm nhóm, xem danh sách nhóm, tìm kiếm theo môn học và xem thông tin nhóm. Tiêu chí ghép nhóm, phạm vi môn học và kế hoạch kiểm thử sẽ được bổ sung theo phản hồi.' },
    {
      ...withdrawnProposal, id: 'DX003', title: 'Cổng đăng ký hoạt động tình nguyện sinh viên',
      topicCode: 'ISEDATN-098', type: 'do-an-tot-nghiep', typeLabel: 'Đồ án tốt nghiệp',
      courseId: 'IE501', courseLabel: 'IE501 - Đồ án tốt nghiệp',
      lecturerId: 'giang-vien-3', lecturerName: 'PGS.TS. Nguyễn Tấn Cầm',
      attachmentName: 'De-cuong-ISEDATN-098.txt',
      createdAt: '2026-11-18T09:00:00+07:00', withdrawnAt: '2026-11-20T14:20:00+07:00',
      description: 'Xây dựng cổng thông tin để sinh viên tìm hoạt động tình nguyện và đăng ký theo ca.',
      objectives: 'Giúp ban tổ chức theo dõi số người đăng ký, phân ca và thông báo khi lịch thay đổi.',
      outcomes: 'Bản thử nghiệm website và tài liệu hướng dẫn dành cho sinh viên và ban tổ chức.',
      outline: {
        version: 3, members: [members[0]],
        startDate: '2027-02-15', progressReportDate: '2027-04-12', finalReportDate: '2027-06-14',
        methodAndScope: 'Khảo sát quy trình đăng ký tình nguyện, mô hình hóa luồng đăng ký và kiểm thử trên dữ liệu mẫu. Phạm vi gồm tìm hoạt động theo ngày, đăng ký theo ca, thông báo thay đổi và xuất danh sách người tham gia.',
        plan: 'Nguyễn Minh Anh khảo sát yêu cầu và thiết kế dữ liệu trong giai đoạn đầu. Đến mốc báo cáo tiến độ, hoàn thành bản thử nghiệm đăng ký theo ca. Giai đoạn cuối kiểm thử tình huống trùng lịch, hoàn thiện tài liệu và báo cáo.',
      },
      history: [{ action: 'withdraw', from: 'cho-duyet', to: 'da-rut', at: '2026-11-20T14:20:00+07:00' }],
    },
    {
      ...withdrawnProposal, id: 'DX004', title: 'Website quản lý đồ thất lạc trong khuôn viên trường',
      topicCode: 'ISEKLTN-098', type: 'khoa-luan', typeLabel: 'Khóa luận tốt nghiệp',
      courseId: 'IE505', courseLabel: 'IE505 - Khóa luận tốt nghiệp',
      lecturerId: 'giang-vien-5', lecturerName: 'TS. Lưu Thanh Sơn',
      attachmentName: 'De-cuong-ISEKLTN-098.txt',
      createdAt: '2026-11-19T13:30:00+07:00', withdrawnAt: '2026-11-21T10:10:00+07:00',
      description: 'Xây dựng website để sinh viên đăng tin tìm đồ và tra cứu vật dụng được bàn giao cho bộ phận tiếp nhận.',
      objectives: 'Giúp sinh viên tìm lại đồ theo khu vực, thời gian và loại vật dụng.',
      outcomes: 'Bản thử nghiệm website, dữ liệu minh họa và kịch bản kiểm thử quy trình nhận lại đồ.',
      outline: {
        version: 3, members: [members[0]],
        startDate: '2027-02-22', progressReportDate: '2027-04-19', finalReportDate: '2027-06-21',
        methodAndScope: 'Xây dựng tập tin báo mất và nhặt được giả lập. So sánh cách ghép tin theo loại vật dụng với cách kết hợp mô tả, khu vực và thời gian. Phạm vi gồm tìm kiếm, gửi yêu cầu nhận lại và theo dõi bàn giao trong khuôn viên trường.',
        plan: 'Nguyễn Minh Anh chuẩn hóa biểu mẫu và tạo tập dữ liệu mẫu. Trước báo cáo tiến độ, triển khai hai cách ghép tin và giao diện tra cứu. Giai đoạn cuối đo độ chính xác, kiểm thử quy trình nhận lại và viết báo cáo.',
      },
      history: [{ action: 'withdraw', from: 'cho-duyet', to: 'da-rut', at: '2026-11-21T10:10:00+07:00' }],
    },
    {
      ...withdrawnProposal, id: 'DX005', title: 'Website đăng ký tham gia ngày hội đổi đồ dùng học tập',
      topicCode: 'ISEDAMH-098', type: 'do-an-mon-hoc',
      lecturerId: 'giang-vien-1', lecturerName: 'TS. Nguyễn Văn Kiệt',
      attachmentName: 'De-cuong-ISEDAMH-098.txt',
      createdAt: '2026-11-22T09:00:00+07:00', withdrawnAt: '2026-11-24T14:30:00+07:00',
      description: 'Xây dựng website giúp sinh viên đăng ký khung giờ tham gia ngày hội và khai báo đồ dùng học tập muốn trao đổi.',
      objectives: 'Giúp ban tổ chức theo dõi số lượt đăng ký và phân bổ chỗ theo từng khung giờ.',
      outcomes: 'Bản thử nghiệm website, bộ dữ liệu mẫu và kịch bản kiểm thử đăng ký và hủy chỗ.',
      outline: {
        version: 3, members: [members[0]],
        startDate: '2027-02-15', progressReportDate: '2027-04-12', finalReportDate: '2027-06-14',
        methodAndScope: 'Mô phỏng luồng đăng ký, đổi khung giờ và kiểm tra sức chứa bằng dữ liệu giả lập. Ban tổ chức có thể xem danh sách người tham gia theo từng ca.',
        plan: 'Nguyễn Minh Anh thiết kế biểu mẫu và dữ liệu trước khi dựng giao diện. Sau báo cáo tiến độ, kiểm thử các trường hợp hết chỗ, đổi ca và hủy đăng ký.',
      },
      history: [{ action: 'withdraw', from: 'cho-duyet', to: 'da-rut', at: '2026-11-24T14:30:00+07:00' }],
    },
  ];
})();
