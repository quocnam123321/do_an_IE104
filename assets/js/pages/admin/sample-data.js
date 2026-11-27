(() => {
  const term = "2026-1";
  const previousTerm = "2025-2";

  const rounds = [
    { id: "DOT-01", term, name: "Đăng ký đồ án môn học", type: "course", start: "2026-11-16T08:00", end: "2026-11-30T23:59", status: "open" },
    { id: "DOT-02", term, name: "Đăng ký khóa luận tốt nghiệp", type: "thesis", start: "2026-11-23T08:00", end: "2026-12-07T23:59", status: "open" },
    { id: "DOT-03", term, name: "Đăng ký bổ sung đồ án", type: "course", start: "2026-12-08T08:00", end: "2026-12-14T23:59", status: "upcoming" },
    { id: "DOT-04", term, name: "Đăng ký đồ án đợt 1", type: "course", start: "2026-09-07T08:00", end: "2026-09-21T23:59", status: "closed" },
    { id: "DOT-05", term: previousTerm, name: "Đăng ký đồ án môn học", type: "course", start: "2026-02-23T08:00", end: "2026-03-09T23:59", status: "closed" },
  ];

  const projects = {
    "ISEDATN-001": { group: "Nhóm 11", groupName: "Thiết bị phòng thí nghiệm", members: ["SV-061", "SV-062"], course: "IE501 – Đồ án tốt nghiệp", dates: ["2026-09-21", "2026-11-10", "2026-12-14"] },
    "DA-026": { group: "Nhóm 07", members: ["SV-043", "SV-044"], dates: ["2026-11-18", "2026-12-04", "2026-12-21"] },
    "DA-021": { members: ["SV-044"], dates: ["2026-11-20", "2026-12-07", "2026-12-23"] },
    "DA-018": { members: ["SV-041"], dates: ["2026-11-21", "2026-12-08", "2026-12-22"] },
    "DA-015": { members: ["SV-045"], dates: ["2026-11-23", "2026-12-09", "2026-12-22"] },
    "DA-012": { group: "Nhóm 05", members: ["SV-041", "SV-042"], dates: ["2026-09-22", "2026-10-26", "2026-11-25"], completedOn: "2026-11-25", publishedOn: "2026-11-26" },
    "DA-009": { members: ["SV-041"], completedOn: "2026-11-24", publishedOn: "2026-11-26" },
    "KL-011": { group: "Nhóm 09", members: ["SV-042", "SV-044"], dates: ["2026-11-24", "2026-12-15", "2027-01-11"] },
    "KL-010": { members: ["SV-045"], dates: ["2026-11-25", "2026-12-16", "2027-01-12"] },
    "KL-008": { members: ["SV-043"], completedOn: "2026-11-20", publishedOn: "2026-11-23" },
    "KL-005": { members: ["SV-042"], completedOn: "2026-11-19" },
    "DA-004": { members: ["SV-044"], completedOn: "2026-06-08", publishedOn: "2026-06-10" },
    "KL-003": { members: ["SV-043"], completedOn: "2026-06-12", publishedOn: "2026-06-15" },
  };

  const sampleMembers = [
    { id: "SV-061", name: "Đặng Minh Khôi", code: "24520001" },
    { id: "SV-062", name: "Lê Ngọc Hà My", code: "24520002" },
  ];

  const topics = [
    { id: "ISEDATN-001", term, name: "Xây dựng hệ thống quản lý mượn và trả thiết bị phòng thí nghiệm", type: "graduation", lecturer: "Lưu Thanh Sơn", status: "active" },
    { id: "DA-026", term, roundId: "DOT-01", name: "Website quản lý thiết bị phòng thực hành", type: "course", lecturer: "Nguyễn Minh Khang", status: "active" },
    { id: "DA-024", term, roundId: "DOT-01", name: "Cổng thông tin câu lạc bộ sinh viên", type: "course", lecturer: "Trần Thảo Nguyên", status: "open" },
    { id: "DA-021", term, roundId: "DOT-01", name: "Ứng dụng theo dõi tiến độ học tập", type: "course", lecturer: "Trần Thảo Nguyên", status: "active" },
    { id: "DA-018", term, roundId: "DOT-01", name: "Hệ thống đặt phòng học nhóm", type: "course", lecturer: "Võ Hoàng Nam", status: "active" },
    { id: "DA-015", term, roundId: "DOT-01", name: "Trang tra cứu tài liệu môn học", type: "course", lecturer: "Võ Hoàng Nam", status: "active" },
    { id: "DA-012", term, roundId: "DOT-01", name: "Cổng góp ý học phần", type: "course", lecturer: "Trần Thảo Nguyên", status: "completed" },
    { id: "DA-009", term, roundId: "DOT-01", name: "Quản lý đăng ký hội thảo", type: "course", lecturer: "Nguyễn Minh Khang", status: "completed" },
    { id: "KL-014", term, roundId: "DOT-02", name: "Phân tích phản hồi học tập tiếng Việt", type: "thesis", lecturer: "Trần Thảo Nguyên", status: "open" },
    { id: "KL-011", term, roundId: "DOT-02", name: "Tra cứu tài liệu học thuật theo ngữ nghĩa", type: "thesis", lecturer: "Nguyễn Minh Khang", status: "active" },
    { id: "KL-010", term, roundId: "DOT-02", name: "Gợi ý học phần từ dữ liệu đào tạo", type: "thesis", lecturer: "Võ Hoàng Nam", status: "active" },
    { id: "KL-008", term, roundId: "DOT-02", name: "Phân loại phản hồi học vụ", type: "thesis", lecturer: "Trần Thảo Nguyên", status: "completed" },
    { id: "KL-005", term, roundId: "DOT-02", name: "Trực quan hóa dữ liệu học tập", type: "thesis", lecturer: "Nguyễn Minh Khang", status: "completed" },
    { id: "DA-004", term: previousTerm, roundId: "DOT-05", name: "Website tra cứu lịch phòng học", type: "course", lecturer: "Võ Hoàng Nam", status: "completed" },
    { id: "KL-003", term: previousTerm, name: "Phân tích dữ liệu đăng ký học phần", type: "thesis", lecturer: "Nguyễn Minh Khang", status: "completed" },
  ].map((topic) => ({ ...topic, ...projects[topic.id] }));

  const requests = [
    { id: "HS-106", term, name: "Cổng thông tin câu lạc bộ sinh viên", topicId: "DA-024", type: "registration", sender: "Lê Minh Anh", senderCode: "SV-041", lecturer: "Trần Thảo Nguyên", date: "2026-11-27T14:30", status: "pending", message: "Em muốn tham gia xây dựng cổng thông tin cho các câu lạc bộ sinh viên." },
    { id: "HS-105", term, name: "Hệ thống quản lý phòng tự học", type: "proposal", sender: "Trần Nhật Minh", senderCode: "SV-042", lecturer: "Nguyễn Minh Khang", date: "2026-11-26T09:15", status: "pending", message: "Em đề xuất ứng dụng đặt chỗ và quản lý lịch sử dụng phòng tự học.", hasSampleOutline: true },
    { id: "HS-104", term, name: "Phân tích phản hồi học tập tiếng Việt", topicId: "KL-014", type: "registration", sender: "Phạm Ngọc Linh", senderCode: "SV-043", lecturer: "Trần Thảo Nguyên", date: "2026-11-25T16:20", status: "pending", message: "Em muốn thực hiện đề tài phân tích phản hồi học tập bằng tiếng Việt." },
    { id: "HS-103", term, name: "Bản đồ tiện ích trong khuôn viên", type: "proposal", sender: "Vũ Gia Hân", senderCode: "SV-044", lecturer: "Võ Hoàng Nam", date: "2026-11-24T10:00", status: "pending", message: "Em đề xuất xây dựng bản đồ tra cứu các tiện ích trong khuôn viên trường." },
    { id: "HS-102", term, name: "Trang tra cứu tài liệu môn học", topicId: "DA-015", type: "registration", sender: "Đỗ Hoài Nam", senderCode: "SV-045", lecturer: "Võ Hoàng Nam", date: "2026-11-23T10:30", status: "approved", message: "Em đăng ký thực hiện trang tra cứu tài liệu theo môn học." },
    { id: "HS-101", term, name: "Quản lý đăng ký hội thảo", topicId: "DA-009", type: "registration", sender: "Lê Minh Anh", senderCode: "SV-041", lecturer: "Nguyễn Minh Khang", date: "2026-11-20T08:45", status: "approved", message: "Em đăng ký phát triển chức năng ghi danh và xác nhận tham dự hội thảo." },
    { id: "HS-100", term, name: "Lịch hoạt động câu lạc bộ", type: "proposal", sender: "Phạm Ngọc Linh", senderCode: "SV-043", lecturer: "Võ Hoàng Nam", date: "2026-11-19T14:00", status: "withdrawn", message: "Em đề xuất lịch chung cho các hoạt động câu lạc bộ." },
    { id: "HS-099", term: previousTerm, name: "Website tra cứu lịch phòng học", type: "proposal", sender: "Phạm Ngọc Linh", senderCode: "SV-043", lecturer: "Võ Hoàng Nam", date: "2026-03-02T09:30", status: "approved", message: "Em đề xuất trang tra cứu lịch phòng học theo ngày và tòa nhà.", hasSampleOutline: true },
    { id: "HS-098", term, name: "Danh bạ phòng thực hành", type: "proposal", sender: "Trần Nhật Minh", senderCode: "SV-042", lecturer: "Nguyễn Minh Khang", date: "2026-11-18T11:00", status: "rejected", message: "Em đề xuất danh bạ các phòng thực hành của khoa.", reason: "Phạm vi đề xuất trùng với đề tài đã có." },
  ];

  const accounts = [
    { id: "SV-041", name: "Lê Minh Anh", username: "minh.anh", email: "", provider: "password", type: "student", status: "enabled" },
    { id: "SV-042", name: "Trần Nhật Minh", username: "", email: "nhat.minh@example.com", provider: "google", type: "student", status: "enabled" },
    { id: "SV-043", name: "Phạm Ngọc Linh", username: "ngoc.linh", email: "ngoc.linh@example.com", provider: "password", type: "student", status: "enabled" },
    { id: "SV-044", name: "Vũ Gia Hân", username: "", email: "gia.han@example.com", provider: "google", type: "student", status: "enabled" },
    { id: "SV-045", name: "Đỗ Hoài Nam", username: "hoai.nam", email: "hoai.nam@example.com", provider: "password", type: "student", status: "locked" },
    { id: "GV-021", name: "Nguyễn Minh Khang", username: "", email: "minh.khang@example.com", provider: "google", type: "lecturer", status: "enabled" },
    { id: "GV-022", name: "Trần Thảo Nguyên", username: "", email: "thao.nguyen@example.com", provider: "google", type: "lecturer", status: "enabled" },
    { id: "GV-023", name: "Võ Hoàng Nam", username: "hoang.nam", email: "hoang.nam@example.com", provider: "password", type: "lecturer", status: "enabled" },
  ];

  const notices = [
    { id: "TB-028", term, name: "Kế hoạch đăng ký đồ án học kỳ I", type: "plan", date: "2026-11-16", status: "published" },
    { id: "TB-027", term, name: "Hướng dẫn nộp báo cáo tiến độ", type: "submissions", date: "2026-11-13", status: "published" },
    { id: "TB-026", term, name: "Lịch bảo vệ khóa luận đợt 1", type: "defense", date: "2026-11-11", status: "draft" },
    { id: "TB-025", term: previousTerm, name: "Lịch bảo vệ khóa luận học kỳ II", type: "defense", date: "2026-05-18", status: "published" },
  ];

  globalThis.IE104AdminSampleData = { accounts, sampleMembers, notices, requests, rounds, topics };
})();
