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
  app.data.initialRequests = [
    { ...shared, id: 'DK001', kind: 'dang-ky', title: 'Website quản lý thư viện', mode: 'nhom', status: 'cho-duyet', lecturerId: 'legacy-a', lecturerName: 'Nguyễn Văn A', createdAt: '2026-10-12T09:00:00+07:00', feedback: 'Chưa có kết quả xét duyệt.' },
    { ...shared, id: 'DK002', kind: 'dang-ky', title: 'Website quản lý câu lạc bộ sinh viên', mode: 'ca-nhan', allowedModes: ['ca-nhan'], groupName: '', members: [members[0]], status: 'da-duyet', lecturerId: 'legacy-b', lecturerName: 'Trần Thị B', createdAt: '2026-10-08T14:00:00+07:00', feedback: 'Bổ sung kế hoạch thực hiện và các mốc báo cáo.' },
    { ...shared, id: 'DX001', kind: 'de-xuat', title: 'Cổng thông tin nghiên cứu sinh viên', mode: 'nhom', status: 'cho-duyet', lecturerId: 'legacy-a', lecturerName: 'Nguyễn Văn A', createdAt: '2026-10-11T16:00:00+07:00', feedback: 'Chưa có kết quả xét duyệt.', description: 'Xây dựng cổng thông tin giúp sinh viên tra cứu công trình nghiên cứu, tìm đề tài quan tâm và tìm nhóm cùng thực hiện nghiên cứu.', objectives: 'Tập trung thông tin công trình nghiên cứu và hỗ trợ sinh viên tìm nhóm theo lĩnh vực quan tâm.', scope: 'Trình bày danh sách công trình, tìm kiếm theo tên hoặc lĩnh vực, xem chi tiết công trình và thông tin nhóm nghiên cứu.', outcomes: 'Cổng thông tin có chức năng tra cứu nghiên cứu, tìm nhóm theo lĩnh vực, kèm mã nguồn, dữ liệu mẫu và báo cáo.', attachmentName: 'De_cuong_de_tai.pdf' },
    { ...shared, id: 'DX002', kind: 'de-xuat', title: 'Website tìm nhóm học tập', mode: 'nhom', allowedModes: ['nhom', 'ca-nhan'], status: 'yeu-cau-chinh-sua', lecturerId: 'legacy-b', lecturerName: 'Trần Thị B', createdAt: '2026-10-07T10:00:00+07:00', feedback: 'Bổ sung tiêu chí ghép nhóm, phạm vi môn học và kế hoạch kiểm thử.', description: 'Xây dựng website giúp sinh viên đăng nhu cầu học tập, tìm bạn cùng môn học và tổ chức nhóm học tập phù hợp.', objectives: 'Giúp sinh viên tìm nhóm theo môn học và nhu cầu học tập; tạo giao diện giới thiệu nhóm, danh sách thành viên và lịch học dự kiến.', scope: 'Đăng nhu cầu tìm nhóm, xem danh sách nhóm, tìm kiếm theo môn học và xem thông tin nhóm. Tiêu chí ghép nhóm, phạm vi môn học và kế hoạch kiểm thử sẽ được bổ sung theo phản hồi.' },
  ];
})();
