(() => {
  const app = globalThis.IE104;
  const projectId = 'DA005';

  // Các yêu cầu và bài mẫu của Website quản lý hoạt động học tập dùng chung cho hai vai trò.
  const requirements = [
    {
      "id": "requirement-3",
      "title": "Thiết kế cơ sở dữ liệu và kiến trúc hệ thống",
      "content": "Sơ đồ quan hệ thực thể (ERD), thiết kế bảng dữ liệu và kiến trúc ứng dụng web.",
      "deadline": "2026-10-25T23:59:00+07:00",
      "locked": false,
      "sourceStage": "pending"
    },
    {
      "id": "requirement-5",
      "title": "Báo cáo kết quả thử nghiệm và mã nguồn",
      "content": "Báo cáo kết quả kiểm thử đơn vị, kiểm thử tích hợp và toàn bộ mã nguồn nguồn hoàn chỉnh.",
      "deadline": "2026-12-15T23:59:00+07:00",
      "locked": false,
      "sourceStage": "pending"
    },
    {
      "id": "requirement-8",
      "title": "Đặc tả chức năng tìm kiếm",
      "content": "Tài liệu mẫu cho yêu cầu “Đặc tả chức năng tìm kiếm” của nhóm thực hiện đề tài.",
      "deadline": "2026-11-01T23:59:00+07:00",
      "locked": false,
      "sourceStage": "pending"
    },
    {
      "id": "requirement-9",
      "title": "Thiết kế sơ đồ dữ liệu",
      "content": "Tài liệu mẫu cho yêu cầu “Thiết kế sơ đồ dữ liệu” của nhóm thực hiện đề tài.",
      "deadline": "2026-11-12T23:59:00+07:00",
      "locked": false,
      "sourceStage": "pending"
    },
    {
      "id": "requirement-10",
      "title": "Kiểm thử phân quyền người dùng",
      "content": "Tài liệu mẫu cho yêu cầu “Kiểm thử phân quyền người dùng” của nhóm thực hiện đề tài.",
      "deadline": "2026-11-20T23:59:00+07:00",
      "locked": false,
      "sourceStage": "pending"
    },
    {
      "id": "requirement-11",
      "title": "Tài liệu hướng dẫn sử dụng",
      "content": "Tài liệu mẫu cho yêu cầu “Tài liệu hướng dẫn sử dụng” của nhóm thực hiện đề tài.",
      "deadline": "2026-12-05T23:59:00+07:00",
      "locked": false,
      "sourceStage": "pending"
    },
    {
      "id": "requirement-12",
      "title": "Báo cáo tổng kết đề tài",
      "content": "Tài liệu mẫu cho yêu cầu “Báo cáo tổng kết đề tài” của nhóm thực hiện đề tài.",
      "deadline": "2026-12-20T23:59:00+07:00",
      "locked": false,
      "sourceStage": "pending"
    },
    {
      "id": "requirement-sample-login-review",
      "title": "Rà soát quy trình đăng nhập và phân quyền",
      "content": "",
      "deadline": "2026-12-22T23:59:00+07:00",
      "locked": false,
      "sourceStage": "pending"
    },
    {
      "id": "requirement-sample-search-test",
      "title": "Chuẩn bị bộ kiểm thử cho chức năng tra cứu, mượn và trả sách",
      "content": "",
      "deadline": "2026-12-27T23:59:00+07:00",
      "locked": false,
      "sourceStage": "pending"
    },
    {
      "id": "requirement-2",
      "title": "Tài liệu đặc tả yêu cầu phần mềm",
      "content": "Đặc tả yêu cầu phần mềm chi tiết, sơ đồ ca sử dụng và kiến trúc hệ thống quản lý thư viện.",
      "deadline": "2026-11-05T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-4",
      "title": "Báo cáo tiến độ giai đoạn 1",
      "content": "Báo cáo kết quả xây dựng giao diện người dùng và kiểm thử khả năng tương thích.",
      "deadline": "2026-10-20T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-6",
      "title": "Thiết kế giao diện hệ thống",
      "content": "Bản thiết kế giao diện và mô tả các màn hình chính của hệ thống.",
      "deadline": "2026-10-19T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-13",
      "title": "Kiểm thử chức năng mượn trả",
      "content": "Tài liệu mẫu cho yêu cầu “Kiểm thử chức năng mượn trả” của nhóm thực hiện đề tài.",
      "deadline": "2026-10-28T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-14",
      "title": "Thiết kế trang quản lý bạn đọc",
      "content": "Tài liệu mẫu cho yêu cầu “Thiết kế trang quản lý bạn đọc” của nhóm thực hiện đề tài.",
      "deadline": "2026-11-06T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-15",
      "title": "Đánh giá hiệu năng hệ thống",
      "content": "Tài liệu mẫu cho yêu cầu “Đánh giá hiệu năng hệ thống” của nhóm thực hiện đề tài.",
      "deadline": "2026-11-10T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-16",
      "title": "Hoàn thiện báo cáo thực nghiệm",
      "content": "Tài liệu mẫu cho yêu cầu “Hoàn thiện báo cáo thực nghiệm” của nhóm thực hiện đề tài.",
      "deadline": "2026-11-15T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-sample-integration-test",
      "title": "Tổng hợp kết quả kiểm thử tích hợp",
      "content": "",
      "deadline": "2026-11-18T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-sample-responsive-review",
      "title": "Đối chiếu giao diện trên máy tính, máy tính bảng và điện thoại",
      "content": "",
      "deadline": "2026-11-20T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-1",
      "title": "Báo cáo đề cương và kế hoạch thực hiện",
      "content": "Bản kế hoạch chi tiết các giai đoạn, mục tiêu đồ án và phân công trách nhiệm nhóm.",
      "deadline": "2026-10-15T23:59:00+07:00",
      "locked": false,
      "sourceStage": "reviewed"
    },
    {
      "id": "requirement-7",
      "title": "Kết quả kiểm thử phiên bản thử nghiệm",
      "content": "Kết quả kiểm thử và các lỗi cần khắc phục trong phiên bản thử nghiệm.",
      "deadline": "2026-10-21T23:59:00+07:00",
      "locked": false,
      "sourceStage": "reviewed"
    },
    {
      "id": "requirement-17",
      "title": "Khảo sát quy trình thư viện",
      "content": "Tài liệu mẫu cho yêu cầu “Khảo sát quy trình thư viện” của nhóm thực hiện đề tài.",
      "deadline": "2026-10-12T23:59:00+07:00",
      "locked": false,
      "sourceStage": "reviewed"
    },
    {
      "id": "requirement-18",
      "title": "Phân tích yêu cầu người dùng",
      "content": "Tài liệu mẫu cho yêu cầu “Phân tích yêu cầu người dùng” của nhóm thực hiện đề tài.",
      "deadline": "2026-10-14T23:59:00+07:00",
      "locked": false,
      "sourceStage": "reviewed"
    },
    {
      "id": "requirement-19",
      "title": "Thiết kế sơ đồ use case",
      "content": "Tài liệu mẫu cho yêu cầu “Thiết kế sơ đồ use case” của nhóm thực hiện đề tài.",
      "deadline": "2026-10-16T23:59:00+07:00",
      "locked": false,
      "sourceStage": "reviewed"
    },
    {
      "id": "requirement-20",
      "title": "Kế hoạch phân công công việc",
      "content": "Tài liệu mẫu cho yêu cầu “Kế hoạch phân công công việc” của nhóm thực hiện đề tài.",
      "deadline": "2026-10-18T23:59:00+07:00",
      "locked": false,
      "sourceStage": "reviewed"
    },
    {
      "id": "requirement-21",
      "title": "Biên bản họp nhóm",
      "content": "Tài liệu mẫu cho yêu cầu “Biên bản họp nhóm” của nhóm thực hiện đề tài.",
      "deadline": "2026-10-20T23:59:00+07:00",
      "locked": false,
      "sourceStage": "reviewed"
    },
    {
      "id": "requirement-sample-analysis-review",
      "title": "Rà soát báo cáo phân tích hệ thống",
      "content": "",
      "deadline": "2026-10-23T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
    {
      "id": "requirement-sample-feature-diagram",
      "title": "Hoàn thiện sơ đồ chức năng theo góp ý của giảng viên",
      "content": "",
      "deadline": "2026-10-25T23:59:00+07:00",
      "locked": false,
      "sourceStage": "submitted"
    },
  ];
  const submissions = [
    {
      "id": "submission-2",
      "requirementId": "requirement-2",
      "title": "Tài liệu đặc tả yêu cầu phần mềm",
      "fileName": "SRS.pdf",
      "submittedAt": "2026-10-10T09:10:00+07:00",
      "feedback": "",
      "feedbackHistory": []
    },
    {
      "id": "submission-3",
      "requirementId": "requirement-6",
      "title": "Thiết kế giao diện hệ thống",
      "fileName": "Giao_dien.pdf",
      "submittedAt": "2026-10-18T20:45:00+07:00",
      "feedback": "",
      "feedbackHistory": []
    },
    {
      "id": "submission-4",
      "requirementId": "requirement-4",
      "title": "Báo cáo tiến độ giai đoạn 1",
      "fileName": "Tien_do.pdf",
      "submittedAt": "2026-10-19T22:10:00+07:00",
      "feedback": "",
      "feedbackHistory": []
    },
    {
      "id": "submission-6",
      "requirementId": "requirement-13",
      "title": "Kiểm thử chức năng mượn trả",
      "fileName": "Muon_tra.pdf",
      "submittedAt": "2026-10-29T09:15:00+07:00",
      "feedback": "",
      "feedbackHistory": []
    },
    {
      "id": "submission-7",
      "requirementId": "requirement-14",
      "title": "Thiết kế trang quản lý bạn đọc",
      "fileName": "Ban_doc.pdf",
      "submittedAt": "2026-11-01T15:00:00+07:00",
      "feedback": "",
      "feedbackHistory": []
    },
    {
      "id": "submission-8",
      "requirementId": "requirement-15",
      "title": "Đánh giá hiệu năng hệ thống",
      "fileName": "Hieu_nang.pdf",
      "submittedAt": "2026-11-02T10:30:00+07:00",
      "feedback": "",
      "feedbackHistory": []
    },
    {
      "id": "submission-9",
      "requirementId": "requirement-16",
      "title": "Hoàn thiện báo cáo thực nghiệm",
      "fileName": "Thuc_nghiem.pdf",
      "submittedAt": "2026-11-02T11:00:00+07:00",
      "feedback": "",
      "feedbackHistory": []
    },
    {
      "id": "submission-web-sample-8",
      "requirementId": null,
      "title": "Bản tổng hợp kết quả chạy thử",
      "fileName": "Tong_hop_chay_thu.pdf",
      "submittedAt": "2026-11-21T18:00:00+07:00",
      "feedback": "",
      "feedbackHistory": []
    },
    {
      "id": "submission-web-sample-9",
      "requirementId": null,
      "title": "Tài liệu đối chiếu các trường hợp kiểm thử dữ liệu đầu vào",
      "fileName": "Doi_chieu_kiem_thu.pdf",
      "submittedAt": "2026-11-23T20:30:00+07:00",
      "feedback": "",
      "feedbackHistory": []
    },
    {
      "id": "submission-1",
      "requirementId": "requirement-1",
      "title": "Báo cáo đề cương và kế hoạch thực hiện",
      "fileName": "De_cuong.pdf",
      "submittedAt": "2026-10-14T21:30:00+07:00",
      "feedback": "Nhóm đã trình bày rõ mục tiêu và kế hoạch. Cần bổ sung mốc kiểm thử cho từng giai đoạn.",
      "feedbackHistory": []
    },
    {
      "id": "submission-5",
      "requirementId": "requirement-7",
      "title": "Kết quả kiểm thử phiên bản thử nghiệm",
      "fileName": "Kiem_thu.pdf",
      "submittedAt": "2026-10-22T08:00:00+07:00",
      "feedback": "Cần bổ sung kết quả kiểm thử các trường hợp biên và cập nhật danh sách lỗi còn tồn tại.",
      "feedbackHistory": []
    },
    {
      "id": "submission-10",
      "requirementId": "requirement-17",
      "title": "Khảo sát quy trình thư viện",
      "fileName": "Khao_sat.pdf",
      "submittedAt": "2026-10-11T14:00:00+07:00",
      "feedback": "Phản hồi mẫu: tài liệu đã được xem xét. Nhóm cần rà soát nội dung và hoàn thiện theo yêu cầu.",
      "feedbackHistory": []
    },
    {
      "id": "submission-11",
      "requirementId": "requirement-18",
      "title": "Phân tích yêu cầu người dùng",
      "fileName": "Yeu_cau.pdf",
      "submittedAt": "2026-10-13T16:30:00+07:00",
      "feedback": "Phản hồi mẫu: tài liệu đã được xem xét. Nhóm cần rà soát nội dung và hoàn thiện theo yêu cầu.",
      "feedbackHistory": []
    },
    {
      "id": "submission-12",
      "requirementId": "requirement-19",
      "title": "Thiết kế sơ đồ use case",
      "fileName": "Use_case.pdf",
      "submittedAt": "2026-10-15T09:20:00+07:00",
      "feedback": "Phản hồi mẫu: tài liệu đã được xem xét. Nhóm cần rà soát nội dung và hoàn thiện theo yêu cầu.",
      "feedbackHistory": []
    },
    {
      "id": "submission-13",
      "requirementId": "requirement-20",
      "title": "Kế hoạch phân công công việc",
      "fileName": "Ke_hoach.pdf",
      "submittedAt": "2026-10-17T20:00:00+07:00",
      "feedback": "Phản hồi mẫu: tài liệu đã được xem xét. Nhóm cần rà soát nội dung và hoàn thiện theo yêu cầu.",
      "feedbackHistory": []
    },
    {
      "id": "submission-14",
      "requirementId": "requirement-21",
      "title": "Biên bản họp nhóm",
      "fileName": "Hop_nhom.pdf",
      "submittedAt": "2026-10-19T17:00:00+07:00",
      "feedback": "Phản hồi mẫu: tài liệu đã được xem xét. Nhóm cần rà soát nội dung và hoàn thiện theo yêu cầu.",
      "feedbackHistory": []
    },
    {
      "id": "submission-sample-done-1",
      "requirementId": null,
      "title": "Bản hiệu chỉnh báo cáo tiến độ",
      "fileName": "Hieu_chinh_tien_do.pdf",
      "submittedAt": "2026-10-24T17:00:00+07:00",
      "feedback": "Bản hiệu chỉnh đã cập nhật các mốc tiến độ và thống nhất định dạng báo cáo. Nhóm cần rà soát lỗi trình bày trước khi nộp bản cuối.",
      "feedbackHistory": []
    },
    {
      "id": "submission-sample-done-2",
      "requirementId": null,
      "title": "Báo cáo tổng hợp kết quả nghiệm thu các chức năng quản lý thư viện",
      "fileName": "Tong_hop_nghiem_thu.pdf",
      "submittedAt": "2026-10-26T19:30:00+07:00",
      "feedback": "Báo cáo đã tổng hợp các chức năng quản lý thư viện và kết quả kiểm thử. Cần bổ sung minh chứng cho các trường hợp kiểm thử còn thiếu.",
      "feedbackHistory": []
    },
  ];
  const archives = {
    "submission-2": {
      "path": "dac-ta-yeu-cau-mau.zip",
      "name": "dac-ta-yeu-cau-mau.zip",
      "names": [
        "SRS.pdf",
        "Pham_vi.txt",
        "Yeu_cau_chuc_nang.txt",
        "Yeu_cau_chat_luong.txt",
        "Ca_su_dung.md",
        "Du_lieu_mau.csv",
        "Kich_ban_kiem_thu.txt",
        "Ghi_chu.txt"
      ],
      "sizes": [
        30564,
        84,
        72,
        81,
        87,
        73,
        74,
        88
      ]
    },
    "submission-1": {
      "path": "de-cuong-mau.zip",
      "name": "de-cuong-mau.zip",
      "names": [
        "De_cuong.pdf",
        "Ke_hoach.md",
        "Phan_cong.csv"
      ],
      "sizes": [
        30564,
        79,
        50
      ]
    }
  };

  function merge(seed, saved) {
    const entries = new Map(seed.map(item => [item.id, { ...item }]));
    for (const item of saved) entries.set(item.id, item);
    return [...entries.values()];
  }

  function forProject(id, record) {
    if (id !== projectId) return record;
    const current = record ?? {
      projectId, revision: 0, submissionsLocked: false, requirements: [], submissions: [],
      progressReviews: [], draft: null, publishedEvaluation: null, audit: [],
    };
    return { ...current, requirements: merge(requirements, current.requirements),
      submissions: merge(submissions, current.submissions) };
  }

  function attachment(id, submission) {
    if (id !== projectId) {
      const seed = app.data.teachingSeeds?.find(item => item.projectId === id)?.submissions
        ?.find(item => item.id === submission.id && item.fileName === submission.fileName &&
          Date.parse(item.submittedAt) === Date.parse(submission.submittedAt));
      if (!seed || submission.files?.length || !seed.fileName) return null;
      return { path: 'bai-nop-minh-hoa.pdf', name: seed.fileName, names: [seed.fileName], sizes: [30564] };
    }
    const sample = submissions.find(item => item.id === submission.id && item.fileName === submission.fileName &&
      Date.parse(item.submittedAt) === Date.parse(submission.submittedAt));
    if (!sample) return null;
    return archives[sample.id] ?? { path: 'bai-nop-minh-hoa.pdf', name: sample.fileName,
      names: [sample.fileName], sizes: [30564] };
  }

  app.data.studentWebSubmissions = { projectId, forProject, attachment };
})();
