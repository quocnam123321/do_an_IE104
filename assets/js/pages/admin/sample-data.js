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

  const topics = [
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
  ];

  const requests = [
    { id: "HS-106", term, name: "Cổng thông tin câu lạc bộ sinh viên", type: "registration", sender: "Lê Minh Anh", lecturer: "Trần Thảo Nguyên", date: "2026-11-27", status: "pending" },
    { id: "HS-105", term, name: "Hệ thống quản lý phòng tự học", type: "proposal", sender: "Trần Nhật Minh", lecturer: "Nguyễn Minh Khang", date: "2026-11-26", status: "pending" },
    { id: "HS-104", term, name: "Phân tích phản hồi học tập tiếng Việt", type: "registration", sender: "Phạm Ngọc Linh", lecturer: "Trần Thảo Nguyên", date: "2026-11-25", status: "pending" },
    { id: "HS-103", term, name: "Bản đồ tiện ích trong khuôn viên", type: "proposal", sender: "Vũ Gia Hân", lecturer: "Võ Hoàng Nam", date: "2026-11-24", status: "pending" },
    { id: "HS-102", term, name: "Trang tra cứu tài liệu môn học", type: "registration", sender: "Đỗ Hoài Nam", lecturer: "Võ Hoàng Nam", date: "2026-11-23", status: "approved" },
    { id: "HS-101", term, name: "Quản lý đăng ký hội thảo", type: "registration", sender: "Lê Minh Anh", lecturer: "Nguyễn Minh Khang", date: "2026-11-20", status: "approved" },
    { id: "HS-099", term: previousTerm, name: "Website tra cứu lịch phòng học", type: "proposal", sender: "Phạm Ngọc Linh", lecturer: "Võ Hoàng Nam", date: "2026-03-02", status: "approved" },
  ];

  const accounts = [
    { id: "SV-041", name: "Lê Minh Anh", email: "minh.anh@example.com", type: "student", status: "enabled" },
    { id: "SV-042", name: "Trần Nhật Minh", email: "nhat.minh@example.com", type: "student", status: "enabled" },
    { id: "SV-043", name: "Phạm Ngọc Linh", email: "ngoc.linh@example.com", type: "student", status: "enabled" },
    { id: "SV-044", name: "Vũ Gia Hân", email: "gia.han@example.com", type: "student", status: "enabled" },
    { id: "SV-045", name: "Đỗ Hoài Nam", email: "hoai.nam@example.com", type: "student", status: "locked" },
    { id: "GV-021", name: "Nguyễn Minh Khang", email: "minh.khang@example.com", type: "lecturer", status: "enabled" },
    { id: "GV-022", name: "Trần Thảo Nguyên", email: "thao.nguyen@example.com", type: "lecturer", status: "enabled" },
    { id: "GV-023", name: "Võ Hoàng Nam", email: "hoang.nam@example.com", type: "lecturer", status: "enabled" },
  ];

  const notices = [
    { id: "TB-028", term, name: "Kế hoạch đăng ký đồ án học kỳ I", type: "plan", date: "2026-11-16", status: "published" },
    { id: "TB-027", term, name: "Hướng dẫn nộp báo cáo tiến độ", type: "submissions", date: "2026-11-13", status: "published" },
    { id: "TB-026", term, name: "Lịch bảo vệ khóa luận đợt 1", type: "defense", date: "2026-11-11", status: "draft" },
    { id: "TB-025", term: previousTerm, name: "Lịch bảo vệ khóa luận học kỳ II", type: "defense", date: "2026-05-18", status: "published" },
  ];

  globalThis.IE104AdminSampleData = { accounts, notices, requests, rounds, topics };
})();
