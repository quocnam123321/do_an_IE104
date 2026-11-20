window.UITLecturerCatalog = {
  formatCode(type, code) {
    const prefixes = { course: 'ISEDAMH', graduation: 'ISEDATN', thesis: 'ISEKLTN' };
    const number = /^ISE-(\d+)$/.exec(code)?.[1];
    return prefixes[type] && number ? `${prefixes[type]}-${number.padStart(3, '0')}` : code;
  },
  "records": [
    {
      "title": "Xây dựng mô hình dự đoán kết quả thi đấu bóng đá",
      "authors": [
        "Văn Cặp Hùng"
      ],
      "advisors": [],
      "year": "",
      "cohort": "2017",
      "type": "Khóa luận tốt nghiệp",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "summaryUrl": "https://tinyurl.com/4bsx856k",
      "sourceScore": "8.36",
      "id": "ISE-001",
      "code": "ISE-001",
      "sourceId": "ise-table-001",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "Nghiên cứu mô hình học máy dự báo thắng, hòa hoặc thua trong các trận bóng đá dựa trên dữ liệu trước trận.",
      "objectives": [
        "Khảo sát các yếu tố như đối đầu, phong độ, sân nhà, thứ hạng và thời tiết.",
        "Chọn đặc trưng bằng phân tích khám phá và so sánh mô hình qua kiểm chứng chéo."
      ],
      "outcomes": [
        "Mô hình dự báo được chọn theo độ chính xác trung bình.",
        "Trang web trình bày dự đoán cho các trận sắp diễn ra."
      ],
      "abstractVerified": true,
      "topicType": "thesis",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "xxxxxxxx",
      "adviser": "Chưa công bố trong nguồn",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính"
    },
    {
      "title": "Nhận diện tính xây dựng và tính độc hại của bình luận Tiếng Việt",
      "authors": [
        "Nguyễn Thành Luân"
      ],
      "advisors": [],
      "year": "",
      "cohort": "2017",
      "type": "Khóa luận tốt nghiệp",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "summaryUrl": "https://tinyurl.com/3we9x3xb",
      "sourceScore": "9.64",
      "id": "ISE-002",
      "code": "ISE-002",
      "sourceId": "ise-table-002",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "Nghiên cứu nhận diện hai đặc tính của bình luận tiếng Việt trên mạng xã hội: tính xây dựng và tính độc hại.",
      "objectives": [
        "Xây dựng tập dữ liệu UIT-ViCTSD với quy trình gán nhãn và kiểm tra chất lượng.",
        "Đánh giá mô hình truyền thống, học sâu và học chuyển tiếp cho hai nhiệm vụ."
      ],
      "outcomes": [
        "Tập dữ liệu phục vụ nghiên cứu xử lý tiếng Việt.",
        "Kết quả so sánh mô hình và bản trình diễn nhận diện bình luận."
      ],
      "abstractVerified": true,
      "topicType": "thesis",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "xxxxxxxx",
      "adviser": "Chưa công bố trong nguồn",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính"
    },
    {
      "title": "Dự đoán chuỗi hành động liên quan tới nhau của con người",
      "authors": [
        "Bùi Thị Ngọc Mai"
      ],
      "advisors": [],
      "year": "",
      "cohort": "2017",
      "type": "Khóa luận tốt nghiệp",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "summaryUrl": "https://tinyurl.com/4eadvrdp",
      "sourceScore": "8.5",
      "id": "ISE-003",
      "code": "ISE-003",
      "sourceId": "ise-table-003",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "Nghiên cứu dự báo hành động cá nhân tiếp theo cùng thời điểm xảy ra, phục vụ việc xây dựng lộ trình sinh hoạt phù hợp.",
      "objectives": [
        "Dùng TIPAS để mô hình hóa và dự đoán chuỗi hành động.",
        "Kết hợp K-Nearest Neighbor để ước lượng thời điểm hành động."
      ],
      "outcomes": [
        "Mô hình dự báo hành động và thời điểm được đánh giá trên dữ liệu người dùng.",
        "Báo cáo thực nghiệm về chất lượng dự đoán và thời gian xử lý."
      ],
      "abstractVerified": true,
      "topicType": "thesis",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "xxxxxxxx",
      "adviser": "Chưa công bố trong nguồn",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính"
    },
    {
      "title": "Phát triển ứng dụng di động gợi ý phim cho người dùng",
      "authors": [
        "Vũ Cao Nguyên"
      ],
      "advisors": [],
      "year": "",
      "cohort": "2017",
      "type": "Khóa luận tốt nghiệp",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "summaryUrl": "https://tinyurl.com/a8m7n3m8",
      "sourceScore": "8.4",
      "id": "ISE-004",
      "code": "ISE-004",
      "sourceId": "ise-table-004",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "Phát triển ứng dụng Android có chức năng gợi ý phim, kế thừa mô hình khuyến nghị từ nghiên cứu trước đó.",
      "objectives": [
        "Xây dựng giao diện di động bằng Flutter và Web API bằng Django REST Framework.",
        "Cung cấp gợi ý cho cả tài khoản mới và người dùng đã có lịch sử."
      ],
      "outcomes": [
        "Ứng dụng có đăng ký, đăng nhập, bình luận, đánh giá và giới thiệu phim.",
        "API trao đổi dữ liệu với PostgreSQL và chức năng khuyến nghị phim."
      ],
      "abstractVerified": true,
      "topicType": "thesis",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "xxxxxxxx",
      "adviser": "Chưa công bố trong nguồn",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính"
    },
    {
      "title": "Xây dựng hệ thống phân công và đánh giá công việc trong cơ quan",
      "authors": [
        "Nguyễn Tiến Khang",
        "Phạm Nhật Duy"
      ],
      "advisors": [],
      "year": "",
      "cohort": "2017",
      "type": "Khóa luận tốt nghiệp",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "summaryUrl": "https://tinyurl.com/5c6ezerp",
      "sourceScore": "8.71",
      "id": "ISE-005",
      "code": "ISE-005",
      "sourceId": "ise-table-005",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "Nghiên cứu hệ thống hỗ trợ giao việc trực tuyến và đánh giá công việc trong cơ quan, xuất phát từ nhu cầu quản lý tại trường đại học.",
      "objectives": [
        "Khảo sát hiện trạng và nhu cầu của người giao việc, người thực hiện.",
        "Phân tích, thiết kế hệ thống giúp theo dõi kế hoạch, tiến độ và chất lượng công việc."
      ],
      "outcomes": [
        "Hệ thống hỗ trợ phân công, giám sát và báo cáo tiến độ.",
        "Cơ sở hỗ trợ đánh giá công việc, nhân sự và cải thiện quản lý."
      ],
      "abstractVerified": true,
      "topicType": "thesis",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "xxxxxxxx",
      "adviser": "Chưa công bố trong nguồn",
      "supervisionRole": "secondary",
      "supervisionRoleLabel": "Đồng hướng dẫn"
    },
    {
      "title": "Xây dựng hệ thống bán vé cho bến xe Miền Đông",
      "authors": [
        "Lê Bảo Lâm",
        "Trần Nguyên Lợi"
      ],
      "advisors": [],
      "year": "",
      "cohort": "2017",
      "type": "Khóa luận tốt nghiệp",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "summaryUrl": "https://tinyurl.com/8deh6b7a",
      "sourceScore": "8.07",
      "id": "ISE-006",
      "code": "ISE-006",
      "sourceId": "ise-table-006",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "Xây dựng website phục vụ việc mua và bán vé trực tuyến cho bến xe Miền Đông.",
      "objectives": [
        "Khảo sát bến xe và các website vé xe, vé tàu để xác định yêu cầu.",
        "Phân tích, thiết kế và triển khai với Laravel, Vue.js và MySQL."
      ],
      "outcomes": [
        "Hệ thống bán vé trực tuyến đáp ứng nhu cầu được khảo sát.",
        "Kết quả kiểm thử và báo cáo quá trình xây dựng hệ thống."
      ],
      "abstractVerified": true,
      "topicType": "thesis",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "xxxxxxxx",
      "adviser": "Chưa công bố trong nguồn",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính"
    },
    {
      "title": "Website quản lý bán hàng tích hợp đồng bộ đa sàng thương mại điện tử",
      "authors": [
        "Đặng Quang Huy",
        "Trần Vũ Lộc"
      ],
      "advisors": [],
      "year": "",
      "cohort": "2017",
      "type": "Khóa luận tốt nghiệp",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "summaryUrl": "https://tinyurl.com/mvxwh8w6",
      "sourceScore": "8.54",
      "id": "ISE-007",
      "code": "ISE-007",
      "sourceId": "ise-table-007",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "Nghiên cứu website quản lý bán hàng đa kênh có khả năng liên kết nhiều sàn thương mại điện tử.",
      "objectives": [
        "Khảo sát nghiệp vụ và các phần mềm quản lý bán hàng hiện có.",
        "Thiết kế đồng bộ sản phẩm, đơn hàng giữa các sàn và triển khai với ReactJS, NodeJS."
      ],
      "outcomes": [
        "Website hỗ trợ quản lý bán hàng tập trung.",
        "Khả năng đồng bộ dữ liệu sản phẩm và đơn hàng giữa nhiều sàn."
      ],
      "abstractVerified": true,
      "topicType": "thesis",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "xxxxxxxx",
      "adviser": "Chưa công bố trong nguồn",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính"
    },
    {
      "title": "Phân tích các yếu tố ảnh hưởng đến tiến độ và tỉ lệ nộp chứng chỉ tiếng Anh của sinh viên Trường Đại học Công nghệ Thông tin.",
      "authors": [
        "Nguyễn Thị Hoài"
      ],
      "advisors": [
        "PGS.TS. Lê Đình Duy"
      ],
      "year": "2023",
      "cohort": "",
      "type": "Luận văn thạc sĩ",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/d-tai-lu-n-van-th-c-si-cac-nam",
      "sourceStudentId": "CH1802042",
      "defensePeriod": "06/2023",
      "advisorSourceText": "PGS.TS. Lê Đình Duy Trường ĐHCNTT- ĐHQG-HCM",
      "id": "ISE-008",
      "code": "ISE-008",
      "sourceId": "ise-table-008",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "[Mô tả đề tài]",
      "objectives": [
        "[Mục tiêu đề tài]"
      ],
      "outcomes": [
        "[Kết quả dự kiến]"
      ],
      "abstractVerified": false,
      "topicType": "master",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "CH1802042",
      "adviser": "PGS.TS. Lê Đình Duy",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính"
    },
    {
      "title": "Phát hiện lỗ hổng trên ứng dụng web sử dụng kỹ thuật phân tích động và thuật giải di truyền",
      "authors": [
        "Ngô Khánh Khoa"
      ],
      "advisors": [
        "TS. Phạm Văn Hậu"
      ],
      "year": "2023",
      "cohort": "",
      "type": "Luận văn thạc sĩ",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/d-tai-lu-n-van-th-c-si-cac-nam",
      "sourceStudentId": "CH1802047",
      "defensePeriod": "06/2023",
      "advisorSourceText": "TS. Phạm Văn Hậu Trường ĐHCNTT- ĐHQG-HCM",
      "id": "ISE-009",
      "code": "ISE-009",
      "sourceId": "ise-table-009",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "[Mô tả đề tài]",
      "objectives": [
        "[Mục tiêu đề tài]"
      ],
      "outcomes": [
        "[Kết quả dự kiến]"
      ],
      "abstractVerified": false,
      "topicType": "master",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "CH1802047",
      "adviser": "TS. Phạm Văn Hậu",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính"
    },
    {
      "title": "Rút trích quan hệ giữa các thực thể trong văn bản tiếng Việt",
      "authors": [
        "Phạm Minh Mẫn"
      ],
      "advisors": [
        "TS. Nguyễn Lưu Thùy Ngân"
      ],
      "year": "2023",
      "cohort": "",
      "type": "Luận văn thạc sĩ",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/d-tai-lu-n-van-th-c-si-cac-nam",
      "sourceStudentId": "CH1802054",
      "defensePeriod": "06/2023",
      "advisorSourceText": "TS. Nguyễn Lưu Thùy Ngân Trường ĐHCNTT- ĐHQG-HCM",
      "id": "ISE-010",
      "code": "ISE-010",
      "sourceId": "ise-table-010",
      "subjects": [],
      "otherContributors": [],
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "publisher": "Trường Đại học Công nghệ Thông tin",
      "verifiedOn": "2026-11-18",
      "hasAbstractInSource": false,
      "description": "[Mô tả đề tài]",
      "objectives": [
        "[Mục tiêu đề tài]"
      ],
      "outcomes": [
        "[Kết quả dự kiến]"
      ],
      "abstractVerified": false,
      "topicType": "master",
      "semester": "1",
      "academicYear": "2026–2027",
      "studentId": "CH1802054",
      "adviser": "TS. Nguyễn Lưu Thùy Ngân",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính"
    },
    {
      "code": "ISE-011",
      "id": "ISE-011",
      "title": "Ứng dụng điểm danh lớp học bằng bluetooth",
      "authors": [
        "Trương Đức Nghĩa",
        "Nguyễn Phương Phi"
      ],
      "cohort": "2017",
      "summaryUrl": "https://tinyurl.com/4mmtacdp",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "type": "Khóa luận tốt nghiệp",
      "topicType": "thesis",
      "advisors": [],
      "abstractVerified": false,
      "studentId": "xxxxxxxx",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "description": "[Mô tả đề tài]",
      "objectives": [
        "[Mục tiêu đề tài]"
      ],
      "outcomes": [
        "[Kết quả dự kiến]"
      ]
    },
    {
      "code": "ISE-012",
      "id": "ISE-012",
      "title": "Nghiên cứu mô hình thống kê để phát triển hệ thống tự động tạo đề thi và đánh giá kết quả thi",
      "authors": [
        "Nguyễn Ngọc Phong"
      ],
      "cohort": "2016",
      "summaryUrl": "https://bit.ly/31M8YHO",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "type": "Khóa luận tốt nghiệp",
      "topicType": "thesis",
      "advisors": [],
      "abstractVerified": false,
      "studentId": "xxxxxxxx",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "description": "[Mô tả đề tài]",
      "objectives": [
        "[Mục tiêu đề tài]"
      ],
      "outcomes": [
        "[Kết quả dự kiến]"
      ]
    },
    {
      "code": "ISE-013",
      "id": "ISE-013",
      "title": "Ứng dụng quản lý dữ liệu người dùng trên nhiều tài khoản đám mây",
      "authors": [
        "Hoàng Trọng Nghĩa",
        "Võ Thị Ngọc Huyên"
      ],
      "cohort": "2016",
      "summaryUrl": "https://bit.ly/3jwrha0",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "type": "Khóa luận tốt nghiệp",
      "topicType": "thesis",
      "advisors": [],
      "abstractVerified": false,
      "studentId": "xxxxxxxx",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "description": "[Mô tả đề tài]",
      "objectives": [
        "[Mục tiêu đề tài]"
      ],
      "outcomes": [
        "[Kết quả dự kiến]"
      ]
    },
    {
      "code": "ISE-014",
      "id": "ISE-014",
      "title": "Xây dựng ứng dụng thương mại điện tử tích hợp hệ thống gợi ý sản phẩm",
      "authors": [
        "Bùi Văn Thuận",
        "Nguyễn Văn Tài"
      ],
      "cohort": "2016",
      "summaryUrl": "https://bit.ly/2Tu6Hwo",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "type": "Khóa luận tốt nghiệp",
      "topicType": "thesis",
      "advisors": [],
      "abstractVerified": false,
      "studentId": "xxxxxxxx",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "description": "[Mô tả đề tài]",
      "objectives": [
        "[Mục tiêu đề tài]"
      ],
      "outcomes": [
        "[Kết quả dự kiến]"
      ]
    },
    {
      "code": "ISE-015",
      "id": "ISE-015",
      "title": "Xây dựng hệ thống khuyến nghị cho người dùng xem phim trên điện thoại di động",
      "authors": [
        "Quách Phú Quốc",
        "Nguyễn Tiến Đạt"
      ],
      "summaryUrl": "https://bit.ly/3ou7z2o",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "cohort": "2016",
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "type": "Khóa luận tốt nghiệp",
      "topicType": "thesis",
      "studentId": "xxxxxxxx",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "advisors": [],
      "abstractVerified": false,
      "description": "[Mô tả đề tài]",
      "objectives": [
        "[Mục tiêu đề tài]"
      ],
      "outcomes": [
        "[Kết quả dự kiến]"
      ]
    },
    {
      "code": "ISE-016",
      "id": "ISE-016",
      "title": "Xây dựng hệ thống quản lý và truy xuất nguồn gốc thực phẩm trên nền tảng website áp dụng công nghệ blockchain",
      "authors": [
        "Lê Trung Kiên",
        "Trần Ngọc Duy"
      ],
      "summaryUrl": "https://bit.ly/3oG0D2q",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien",
      "cohort": "2016",
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "type": "Khóa luận tốt nghiệp",
      "topicType": "thesis",
      "studentId": "xxxxxxxx",
      "supervisionRole": "primary",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "advisors": [],
      "abstractVerified": false,
      "description": "[Mô tả đề tài]",
      "objectives": [
        "[Mục tiêu đề tài]"
      ],
      "outcomes": [
        "[Kết quả dự kiến]"
      ]
    },
    {
      "id": "ISEDATN-001",
      "code": "ISEDATN-001",
      "title": "Xây dựng hệ thống quản lý mượn và trả thiết bị phòng thí nghiệm",
      "type": "Đồ án tốt nghiệp",
      "topicType": "graduation",
      "semester": "1",
      "academicYear": "2026–2027",
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "field": "Hệ thống thông tin",
      "technology": "HTML/CSS/JavaScript, Node.js và PostgreSQL",
      "description": "Xây dựng hệ thống quản lý thiết bị phòng thí nghiệm. Sinh viên xem lịch sử dụng và gửi yêu cầu mượn theo khung giờ. Cán bộ duyệt yêu cầu, kiểm tra tình trạng khi bàn giao và nhận trả, đồng thời theo dõi các lượt mượn quá hạn. Quản trị viên quản lý danh mục thiết bị và xem thống kê sử dụng.",
      "objectives": [
        "Quản lý danh mục, vị trí, tình trạng và lịch sử sử dụng của từng thiết bị.",
        "Kiểm tra trùng khung giờ, xử lý yêu cầu và ghi nhận quá trình bàn giao, trả thiết bị.",
        "Nhắc hạn trả và tổng hợp số lượt mượn, trả trễ, hư hỏng theo phòng thí nghiệm."
      ],
      "outcomes": [
        "Ứng dụng web có giao diện cho sinh viên, cán bộ phòng thí nghiệm và quản trị viên.",
        "Bộ dữ liệu mẫu và kịch bản kiểm thử cho đặt trùng giờ, trả trễ và ghi nhận hư hỏng.",
        "Báo cáo thiết kế, hướng dẫn cài đặt và hướng dẫn thao tác mượn, trả."
      ],
      "requirements": [
        "Có kiến thức lập trình web, cơ sở dữ liệu quan hệ và kiểm thử chức năng.",
        "Kiểm tra quyền theo vai trò và tránh duyệt hai lượt mượn trùng giờ cho cùng một thiết bị.",
        "Dùng dữ liệu minh họa để trình diễn và trình bày kết quả kiểm thử."
      ],
      "authors": [
        "Đặng Minh Khôi",
        "Lê Ngọc Hà My"
      ],
      "studentIds": [
        "22520862",
        "22520947"
      ],
      "supervision": {
        "group": "Nhóm 11",
        "milestones": [
          "2026-11-02",
          "2026-11-27",
          "2027-01-24"
        ],
        "tasks": {
          "notStarted": [
            ["Kiểm thử đặt trùng khung giờ và trả trễ", "2026-12-18"],
            ["Thử nghiệm khôi phục lịch mượn từ bản sao lưu", "2026-12-23"],
            ["Đối chiếu số liệu sử dụng với lịch bàn giao", "2027-01-05"],
            ["Chạy thử quy trình mượn, trả với dữ liệu mẫu", "2027-01-08"],
            ["Hoàn thiện hướng dẫn mượn, trả thiết bị", "2027-01-15"],
            ["Kiểm tra biên bản bàn giao khi thiết bị hư hỏng", "2027-01-16"],
            ["Rà soát khả năng thao tác bằng bàn phím", "2027-01-18"],
            ["Đo thời gian tải lịch đặt khi có nhiều yêu cầu", "2027-01-19"],
            ["Chạy thử kịch bản chuyển thiết bị giữa hai phòng", "2027-01-20"],
            ["Đóng gói bản cài đặt và dữ liệu trình diễn", "2027-01-21"],
            ["Đối chiếu hướng dẫn sử dụng với bản chạy cuối", "2027-01-22"],
            ["Chuẩn bị báo cáo và kịch bản bảo vệ", "2027-01-24"]
          ],
          "inProgress": [
            ["Xây dựng màn hình đặt thiết bị theo khung giờ", "2026-11-25"],
            ["Triển khai luồng duyệt và bàn giao", "2026-11-28"],
            ["Ghi nhận tình trạng thiết bị khi nhận trả", "2026-12-01"],
            ["Xây dựng báo cáo sử dụng theo phòng", "2026-12-04"],
            ["Thiết lập nhắc hạn trả và danh sách quá hạn", "2026-12-09"],
            ["Xây dựng chức năng hủy yêu cầu đặt mượn", "2026-12-11"],
            ["Thêm bộ lọc thiết bị theo phòng và tình trạng", "2026-12-15"],
            ["Cho phép cán bộ khóa lịch khi thiết bị bảo trì", "2026-12-16"],
            ["Bổ sung lịch sử thay đổi người phụ trách bàn giao", "2026-12-17"],
            ["Tạo phiếu xác nhận trả thiết bị để in", "2026-12-20"],
            ["Bổ sung thông báo khi yêu cầu mượn bị từ chối", "2026-12-22"],
            ["Xuất danh sách lượt mượn theo khoảng ngày", "2026-12-24"]
          ],
          "completed": [
            ["Khảo sát quy trình mượn, trả thiết bị", "2026-11-06"],
            ["Lập danh sách thiết bị và phòng mẫu", "2026-11-08"],
            ["Chốt các trạng thái của yêu cầu mượn", "2026-11-10"],
            ["Thiết kế danh mục và lịch đặt thiết bị", "2026-11-13"],
            ["Dựng sơ đồ dữ liệu cho lượt mượn và phiếu bàn giao", "2026-11-16"],
            ["Thống nhất khung giờ và thời lượng mượn tối đa", "2026-11-17"],
            ["Tạo mẫu biên bản bàn giao và nhận trả", "2026-11-17"],
            ["Lập bảng quyền sinh viên và cán bộ phòng thí nghiệm", "2026-11-18"],
            ["Vẽ sơ đồ xử lý lượt mượn quá hạn", "2026-11-18"],
            ["Nhập dữ liệu thiết bị thử nghiệm", "2026-11-19"],
            ["Chuẩn bị tài khoản mẫu cho từng vai trò", "2026-11-19"],
            ["Thống nhất tiêu chí nghiệm thu danh mục thiết bị", "2026-11-20"]
          ]
        },
        "deliverables": [
          {
            "title": "Bản thử nghiệm quy trình đặt mượn và bàn giao",
            "description": "Nộp bản chạy thử và hướng dẫn tái hiện từ đặt lịch đến duyệt yêu cầu, kiểm tra thiết bị và ký nhận bàn giao.",
            "due": "2026-11-30T23:59"
          },
          {
            "title": "Kết quả kiểm thử đặt trùng giờ và trả trễ",
            "description": "Nộp bảng ca kiểm thử kèm kết quả thực tế cho đặt trùng giờ, hủy lượt mượn, trả trễ và trả thiết bị hư hỏng.",
            "due": "2026-12-18T23:59"
          },
          {
            "title": "Hướng dẫn sử dụng và cài đặt hệ thống",
            "description": "Nộp hướng dẫn nạp dữ liệu mẫu và thao tác theo vai trò sinh viên, cán bộ phòng thí nghiệm và quản trị viên.",
            "due": "2027-01-15T23:59"
          },
          {
            "title": "Báo cáo cuối kỳ và bản trình diễn mượn, trả thiết bị",
            "description": "Nộp báo cáo, mã nguồn và kịch bản trình diễn đặt mượn, bàn giao, trả thiết bị và xử lý quá hạn.",
            "due": "2027-01-24T23:59"
          },
          {
            "title": "Bảng phân quyền phòng thí nghiệm",
            "description": "Liệt kê quyền gửi, duyệt, bàn giao, nhận trả và sửa danh mục thiết bị theo từng vai trò.",
            "file": "ISEDATN-001-phan-quyen.pdf",
            "due": "2026-11-19T23:59",
            "submittedAt": "2026-11-19T15:10"
          },
          {
            "title": "Mẫu giao diện đặt mượn theo khung giờ",
            "description": "Trình bày cách chọn thiết bị, xem giờ còn trống và xử lý khi khung giờ vừa được người khác đặt.",
            "file": "ISEDATN-001-giao-dien-dat-muon.pdf",
            "due": "2026-11-17T23:59",
            "submittedAt": "2026-11-18T09:25"
          },
          {
            "title": "Thiết kế danh mục và lịch đặt thiết bị",
            "description": "Trình bày mô hình dữ liệu và quy tắc kiểm tra trùng lịch.",
            "file": "ISEDATN-001-thiet-ke-lich-dat.pdf",
            "due": "2026-11-16T23:59",
            "submittedAt": "2026-11-15T16:20"
          },
          {
            "title": "Sơ đồ quy trình duyệt và bàn giao",
            "description": "Diễn giải các trạng thái từ lúc sinh viên gửi yêu cầu đến khi bàn giao hoặc hủy lượt mượn.",
            "file": "ISEDATN-001-quy-trinh-ban-giao.pdf",
            "feedback": "Bổ sung bước cán bộ xác nhận tình trạng thiết bị ngay trước khi bàn giao.",
            "due": "2026-11-12T23:59",
            "submittedAt": "2026-11-12T15:45"
          },
          {
            "title": "Báo cáo khảo sát phòng thí nghiệm",
            "description": "Ghi lại vai trò, bước bàn giao và cách xử lý thiết bị hư hỏng.",
            "file": "ISEDATN-001-khao-sat.pdf",
            "feedback": "Đã mô tả quy trình mượn, trả. Bổ sung trường hợp người mượn không đến nhận thiết bị.",
            "due": "2026-11-09T23:59",
            "submittedAt": "2026-11-07T10:30"
          }
        ],
        "criteria": [
          "Mô tả đủ quy trình mượn, duyệt, bàn giao, trả và xử lý quá hạn.",
          "Kiểm tra trùng lịch và quyền của sinh viên, cán bộ, quản trị viên.",
          "Trình diễn trọn quy trình và giải thích các tình huống kiểm thử."
        ],
        "comment": "Nhận xét tiến độ mẫu: Cần kiểm thử trường hợp hai người đặt cùng thiết bị và cách ghi nhận tình trạng khi trả."
      }
    },
    {
      "id": "ISEDATN-002",
      "code": "ISEDATN-002",
      "title": "Xây dựng cổng quản lý thực tập và đánh giá sinh viên",
      "type": "Đồ án tốt nghiệp",
      "topicType": "graduation",
      "semester": "1",
      "academicYear": "2026–2027",
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "field": "Hệ thống thông tin",
      "technology": "HTML/CSS/JavaScript, Node.js và PostgreSQL",
      "description": "Xây dựng cổng theo dõi thực tập từ lúc nộp hồ sơ đến khi tổng hợp đánh giá. Sinh viên cập nhật nhật ký và báo cáo theo tuần. Người hướng dẫn tại doanh nghiệp gửi nhận xét theo đợt. Giảng viên theo dõi hồ sơ được phân công, phản hồi nhật ký và tổng hợp kết quả theo tiêu chí của đợt thực tập.",
      "objectives": [
        "Quản lý đợt thực tập, doanh nghiệp, hồ sơ sinh viên và phân công giảng viên.",
        "Theo dõi nhật ký, hạn nộp, phản hồi và trạng thái hoàn thành của từng hồ sơ.",
        "Thiết lập phiếu đánh giá và tổng hợp nhận xét của doanh nghiệp với kết quả của giảng viên."
      ],
      "outcomes": [
        "Cổng web có ba luồng thao tác cho sinh viên, doanh nghiệp và giảng viên.",
        "Bảng theo dõi hồ sơ và tệp kết quả xuất theo đợt thực tập.",
        "Dữ liệu demo và báo cáo kiểm thử luồng nộp hồ sơ, phản hồi, đánh giá và phân quyền."
      ],
      "requirements": [
        "Có kiến thức phân tích quy trình nghiệp vụ, lập trình web và thiết kế cơ sở dữ liệu.",
        "Chỉ cho phép người được phân công truy cập hồ sơ, nhật ký và nhận xét của sinh viên.",
        "Dùng hồ sơ giả lập để trình diễn và kiểm thử các trường hợp nộp trễ hoặc thiếu đánh giá."
      ],
      "authors": [
        "Trần Gia Phúc",
        "Nguyễn Thảo An"
      ],
      "studentIds": [
        "23520871",
        "23520936"
      ],
      "supervision": {
        "group": "Nhóm 12",
        "milestones": [
          "2026-11-02",
          "2026-11-27",
          "2027-01-24"
        ],
        "tasks": {
          "notStarted": [
            ["Kiểm thử hạn nộp và thiếu phiếu đánh giá", "2026-12-18"],
            ["Kiểm tra phân quyền với hồ sơ của từng sinh viên", "2026-12-23"],
            ["Kiểm thử khi sinh viên đổi đơn vị thực tập", "2026-12-29"],
            ["Đối chiếu bảng điểm xuất với phiếu đánh giá", "2027-01-05"],
            ["Chạy thử cổng với một đợt thực tập giả lập", "2027-01-08"],
            ["Kiểm thử mở lại nhật ký sau khi đã khóa đợt", "2027-01-11"],
            ["Rà soát nhắc hạn khi lịch thực tập thay đổi", "2027-01-13"],
            ["Viết hướng dẫn cho giảng viên và doanh nghiệp", "2027-01-15"],
            ["Kiểm tra tệp xuất khi hồ sơ còn thiếu đánh giá", "2027-01-18"],
            ["Thử sử dụng các biểu mẫu trên điện thoại", "2027-01-20"],
            ["Đóng gói dữ liệu và tài khoản dùng khi bảo vệ", "2027-01-22"],
            ["Chuẩn bị kịch bản trình diễn và báo cáo", "2027-01-24"]
          ],
          "inProgress": [
            ["Xây dựng màn hình nộp và bổ sung hồ sơ", "2026-11-25"],
            ["Xây dựng nhật ký và phản hồi theo tuần", "2026-11-28"],
            ["Nhắc hạn nộp nhật ký cho từng đợt thực tập", "2026-12-01"],
            ["Triển khai phiếu đánh giá của doanh nghiệp", "2026-12-04"],
            ["Tổng hợp điểm và xuất kết quả theo đợt", "2026-12-11"],
            ["Bổ sung luồng yêu cầu chỉnh sửa hồ sơ", "2026-12-14"],
            ["Xây dựng bộ lọc hồ sơ theo trạng thái", "2026-12-16"],
            ["Xây dựng danh sách giảng viên phụ trách theo đợt", "2026-12-17"],
            ["Bổ sung nhật ký thay đổi người hướng dẫn", "2026-12-19"],
            ["Thiết lập tính năng khóa phiếu sau khi xác nhận", "2026-12-21"],
            ["Hiển thị hồ sơ thiếu giấy xác nhận thực tập", "2026-12-23"],
            ["Bổ sung thông báo khi nhật ký cần nộp lại", "2026-12-25"]
          ],
          "completed": [
            ["Khảo sát quy trình thực tập", "2026-11-06"],
            ["Thu thập cấu trúc nhật ký và phiếu đánh giá mẫu", "2026-11-08"],
            ["Xác định các bước tiếp nhận hồ sơ sinh viên", "2026-11-10"],
            ["Thiết kế hồ sơ và phân công giảng viên", "2026-11-13"],
            ["Dựng dữ liệu doanh nghiệp và sinh viên giả lập", "2026-11-16"],
            ["Dựng bản nháp màn hình theo dõi theo tuần", "2026-11-17"],
            ["Lập bảng trạng thái của hồ sơ thực tập", "2026-11-17"],
            ["Thống nhất tiêu chí chấm và thang điểm thực tập", "2026-11-18"],
            ["Thống nhất danh sách giấy tờ bắt buộc", "2026-11-18"],
            ["Hoàn thiện sơ đồ vai trò của ba bên", "2026-11-19"],
            ["Tạo vài nhật ký thực tập minh họa theo tuần", "2026-11-19"],
            ["Chốt các cột trong bảng tổng hợp kết quả", "2026-11-20"]
          ]
        },
        "deliverables": [
          {
            "title": "Bản thử nghiệm nộp hồ sơ và nhật ký thực tập",
            "description": "Nộp bản chạy thử với một hồ sơ giả lập, nhật ký theo tuần và luồng giảng viên phản hồi.",
            "due": "2026-11-30T23:59"
          },
          {
            "title": "Bộ kiểm thử hạn nộp và tổng hợp đánh giá",
            "description": "Nộp kết quả kiểm thử hồ sơ nộp trễ, thiếu đánh giá doanh nghiệp và đối chiếu điểm tổng hợp.",
            "due": "2026-12-18T23:59"
          },
          {
            "title": "Hướng dẫn vận hành một đợt thực tập",
            "description": "Nộp tài liệu cấu hình đợt thực tập, phân công giảng viên, mời doanh nghiệp và xuất bảng điểm.",
            "due": "2027-01-15T23:59"
          },
          {
            "title": "Báo cáo cuối kỳ và bản trình diễn cổng thực tập",
            "description": "Nộp báo cáo, mã nguồn, hồ sơ giả lập và kịch bản đánh giá từ doanh nghiệp tới giảng viên.",
            "due": "2027-01-24T23:59"
          },
          {
            "title": "Bảng tiêu chí và thang điểm thực tập",
            "description": "Nêu thang điểm của doanh nghiệp và giảng viên, trọng số tổng hợp và cách xử lý khi thiếu một phiếu.",
            "file": "ISEDATN-002-tieu-chi-thuc-tap.pdf",
            "due": "2026-11-19T23:59",
            "submittedAt": "2026-11-18T14:50"
          },
          {
            "title": "Mẫu giao diện nhật ký thực tập theo tuần",
            "description": "Trình bày các trường nhật ký, thời gian nộp, phản hồi của giảng viên và trạng thái nộp lại.",
            "file": "ISEDATN-002-giao-dien-nhat-ky.pdf",
            "due": "2026-11-17T23:59",
            "submittedAt": "2026-11-18T08:40"
          },
          {
            "title": "Thiết kế hồ sơ, nhật ký và phiếu đánh giá",
            "description": "Mô tả dữ liệu, tiêu chí chấm và quyền của từng vai trò.",
            "file": "ISEDATN-002-thiet-ke-ho-so.pdf",
            "due": "2026-11-16T23:59",
            "submittedAt": "2026-11-15T16:20"
          },
          {
            "title": "Sơ đồ phân công và theo dõi hồ sơ",
            "description": "Mô tả cách phân công giảng viên, chuyển hồ sơ và xác nhận đơn vị thực tập.",
            "file": "ISEDATN-002-phan-cong-ho-so.pdf",
            "feedback": "Thể hiện rõ ai xác nhận việc chuyển đơn vị thực tập và lịch sử điều chỉnh phân công.",
            "due": "2026-11-12T23:59",
            "submittedAt": "2026-11-12T14:30"
          },
          {
            "title": "Báo cáo khảo sát quy trình thực tập",
            "description": "Tóm tắt các bước nộp hồ sơ, ghi nhật ký, phản hồi và tổng hợp đánh giá.",
            "file": "ISEDATN-002-khao-sat.pdf",
            "feedback": "Luồng nghiệp vụ rõ. Bổ sung trường hợp sinh viên đổi đơn vị thực tập giữa đợt.",
            "due": "2026-11-09T23:59",
            "submittedAt": "2026-11-07T10:30"
          }
        ],
        "criteria": [
          "Bao quát hồ sơ, nhật ký, phản hồi và đánh giá của hai bên.",
          "Kiểm tra phân quyền theo hồ sơ và tổng hợp đúng dữ liệu của từng đợt.",
          "Trình diễn với dữ liệu giả lập và giải thích cách xử lý hồ sơ thiếu đánh giá."
        ],
        "comment": "Nhận xét tiến độ mẫu: Cần phân biệt rõ hồ sơ thiếu phiếu đánh giá của doanh nghiệp với hồ sơ chưa được giảng viên tổng hợp."
      }
    },
    {
      "id": "ISEDATN-003",
      "code": "ISEDATN-003",
      "title": "Xây dựng hệ thống số hóa và tra cứu văn bản nội bộ",
      "type": "Đồ án tốt nghiệp",
      "topicType": "graduation",
      "semester": "1",
      "academicYear": "2026–2027",
      "faculty": "Khoa Khoa học và Kỹ thuật Thông tin",
      "field": "Quản lý tài liệu và truy xuất thông tin",
      "technology": "Python, Tesseract OCR và PostgreSQL",
      "description": "Xây dựng hệ thống lưu trữ và tra cứu văn bản nội bộ từ PDF hoặc ảnh scan. Hệ thống nhận dạng chữ tiếng Việt để lập chỉ mục, cho phép người phụ trách hiệu chỉnh kết quả nhận dạng và hỗ trợ tìm theo nội dung, số hiệu, ngày ban hành hoặc phòng ban. Quyền xem và tải tài liệu được kiểm soát theo phòng ban.",
      "objectives": [
        "Nhập văn bản, lưu bản gốc và trích xuất văn bản tiếng Việt bằng OCR.",
        "Cho phép hiệu chỉnh kết quả nhận dạng và tìm theo nội dung hoặc thông tin văn bản.",
        "Phân quyền xem, cập nhật và tải tài liệu theo phòng ban, kèm nhật ký thao tác."
      ],
      "outcomes": [
        "Ứng dụng web có quy trình tải lên, nhận dạng, hiệu chỉnh và tìm kiếm văn bản.",
        "Bộ văn bản giả lập và báo cáo đo độ chính xác OCR trên bản scan rõ và bản scan chất lượng thấp.",
        "Tài liệu cài đặt, hướng dẫn sử dụng và bộ kiểm thử quyền truy cập tài liệu."
      ],
      "requirements": [
        "Có kiến thức lập trình web, xử lý tệp và cơ sở dữ liệu.",
        "Chọn công cụ OCR có hỗ trợ tiếng Việt và công bố cách đo sai số nhận dạng.",
        "Kiểm tra quyền truy cập ở cả kết quả tìm kiếm và đường dẫn tải tệp. Chỉ dùng văn bản giả lập hoặc được phép sử dụng."
      ],
      "authors": [
        "Phạm Hải Đăng",
        "Võ Khánh Linh"
      ],
      "studentIds": [
        "24520854",
        "24520973"
      ],
      "supervision": {
        "group": "Nhóm 13",
        "milestones": [
          "2026-11-02",
          "2026-11-27",
          "2027-01-24"
        ],
        "tasks": {
          "notStarted": [
            ["Đo độ chính xác OCR trên bản scan mờ", "2026-12-18"],
            ["Kiểm thử quyền tải tệp theo phòng ban", "2026-12-23"],
            ["Thử nhập hàng loạt văn bản nhiều trang", "2026-12-29"],
            ["Kiểm tra tra cứu văn bản thay thế và đính chính", "2027-01-05"],
            ["Đánh giá kết quả tìm kiếm trên bộ tài liệu mẫu", "2027-01-08"],
            ["Đo thời gian lập chỉ mục khi nhập văn bản hàng loạt", "2027-01-11"],
            ["Kiểm thử tra cứu tiếng Việt có dấu và không dấu", "2027-01-13"],
            ["Viết hướng dẫn sao lưu và khôi phục kho văn bản", "2027-01-15"],
            ["Chạy thử khôi phục chỉ mục từ bản sao lưu", "2027-01-18"],
            ["Rà soát kết quả tìm kiếm sau khi thu hồi quyền xem", "2027-01-20"],
            ["Chuẩn bị bộ văn bản mẫu cho buổi bảo vệ", "2027-01-22"],
            ["Hoàn thiện báo cáo và kịch bản trình diễn", "2027-01-24"]
          ],
          "inProgress": [
            ["Xây dựng màn hình tải lên và xem bản scan", "2026-11-25"],
            ["Tích hợp nhận dạng chữ tiếng Việt", "2026-11-28"],
            ["Xây dựng màn hình hiệu chỉnh kết quả OCR", "2026-12-02"],
            ["Triển khai tìm theo nội dung và số hiệu", "2026-12-04"],
            ["Ghi nhật ký xem, sửa và tải văn bản", "2026-12-10"],
            ["Bổ sung bộ lọc theo ngày ban hành và phòng ban", "2026-12-14"],
            ["Tự động xoay và làm rõ ảnh scan trước khi OCR", "2026-12-16"],
            ["Hiển thị trạng thái nhận dạng cho từng văn bản", "2026-12-17"],
            ["Đánh dấu nội dung trùng khi tải lên", "2026-12-19"],
            ["Cho phép nhận dạng lại từng trang có lỗi", "2026-12-21"],
            ["Tô sáng từ khóa trong đoạn trích kết quả", "2026-12-23"],
            ["Bổ sung liên kết giữa văn bản gốc và bản thay thế", "2026-12-25"]
          ],
          "completed": [
            ["Chuẩn bị bộ văn bản scan giả lập", "2026-11-06"],
            ["Phân nhóm bản scan theo độ rõ và độ nghiêng", "2026-11-08"],
            ["Thử Tesseract trên tài liệu tiếng Việt có dấu", "2026-11-10"],
            ["Thiết kế thông tin văn bản và phân quyền", "2026-11-13"],
            ["Thống nhất quy ước số hiệu văn bản", "2026-11-16"],
            ["Thống nhất các trường bắt buộc khi tải văn bản", "2026-11-17"],
            ["Ghi lại cấu hình OCR tiếng Việt dùng cho bản mẫu", "2026-11-17"],
            ["Chuẩn bị văn bản đối chiếu để đo sai số OCR", "2026-11-18"],
            ["Chọn tiêu chí đánh giá chất lượng tìm kiếm", "2026-11-18"],
            ["Kiểm tra đọc tệp PDF và ảnh scan mẫu", "2026-11-19"],
            ["Tạo danh sách phòng ban và quyền xem mẫu", "2026-11-19"],
            ["Chuẩn bị tập truy vấn mẫu theo số hiệu và nội dung", "2026-11-20"]
          ]
        },
        "deliverables": [
          {
            "title": "Bản thử nghiệm nhập liệu và hiệu chỉnh OCR",
            "description": "Nộp phiên bản cho phép tải bản scan, xem văn bản nhận dạng và lưu phần hiệu chỉnh.",
            "due": "2026-12-04T23:59"
          },
          {
            "title": "Báo cáo đo sai số OCR và kiểm thử phân quyền",
            "description": "So sánh kết quả OCR giữa các mức chất lượng scan và ghi lại kết quả thử xem, tìm, tải văn bản theo từng quyền.",
            "due": "2026-12-23T23:59"
          },
          {
            "title": "Hướng dẫn vận hành kho văn bản số",
            "description": "Nộp hướng dẫn cấu hình OCR, chuẩn bị dữ liệu, hiệu chỉnh kết quả và phân quyền theo phòng ban.",
            "due": "2027-01-15T23:59"
          },
          {
            "title": "Báo cáo cuối kỳ và bản trình diễn số hóa văn bản",
            "description": "Nộp mã nguồn, báo cáo độ chính xác OCR, bộ văn bản giả lập và kịch bản kiểm thử phân quyền.",
            "due": "2027-01-24T23:59"
          },
          {
            "title": "Bộ văn bản đối chiếu để đánh giá OCR",
            "description": "Nộp danh mục bản scan kèm văn bản gõ lại và quy tắc tính sai số ký tự.",
            "file": "ISEDATN-003-van-ban-doi-chieu.pdf",
            "due": "2026-11-19T23:59",
            "submittedAt": "2026-11-19T16:20"
          },
          {
            "title": "Mẫu giao diện tìm kiếm và hiệu chỉnh văn bản",
            "description": "Trình bày màn hình đối chiếu bản scan với kết quả OCR và cách lọc kết quả theo số hiệu, ngày và phòng ban.",
            "file": "ISEDATN-003-giao-dien-tra-cuu.pdf",
            "due": "2026-11-17T23:59",
            "submittedAt": "2026-11-18T11:05"
          },
          {
            "title": "Thiết kế chỉ mục và quyền truy cập văn bản",
            "description": "Mô tả chỉ mục tìm kiếm, dữ liệu nhận dạng và quyền theo phòng ban.",
            "file": "ISEDATN-003-thiet-ke-chi-muc.pdf",
            "due": "2026-11-16T23:59",
            "submittedAt": "2026-11-15T16:20"
          },
          {
            "title": "Quy ước đặt số hiệu và phân loại văn bản",
            "description": "Nêu cách lưu số hiệu, loại văn bản, ngày ban hành và phòng phụ trách để hỗ trợ tra cứu.",
            "file": "ISEDATN-003-quy-uoc-van-ban.pdf",
            "feedback": "Bổ sung cách tìm theo số hiệu gốc khi văn bản đính chính hoặc thay thế một bản trước đó.",
            "due": "2026-11-12T23:59",
            "submittedAt": "2026-11-12T16:45"
          },
          {
            "title": "Bộ văn bản scan giả lập và phương án OCR",
            "description": "Trình bày bộ dữ liệu kiểm thử tiếng Việt và kế hoạch đo chất lượng nhận dạng.",
            "file": "ISEDATN-003-phuong-an-ocr.pdf",
            "feedback": "Bộ mẫu phù hợp để thử nghiệm. Thêm nhóm bản scan bị nghiêng và ghi rõ cách chấm sai số.",
            "due": "2026-11-09T23:59",
            "submittedAt": "2026-11-07T10:30"
          }
        ],
        "criteria": [
          "Trình bày đầy đủ luồng nhập, OCR, hiệu chỉnh, lập chỉ mục và tìm kiếm.",
          "Kiểm tra quyền xem và tải tệp, ghi nhận sai số OCR theo chất lượng scan.",
          "Giải thích phương pháp đo và trình diễn kết quả tra cứu trên bộ tài liệu mẫu."
        ],
        "comment": "Nhận xét tiến độ mẫu: Ưu tiên đo sai số trên các bản scan chất lượng khác nhau và kiểm tra quyền tải tệp qua đường dẫn trực tiếp."
      }
    }
  ],
  "created": [
    "ISE-001",
    "ISE-002",
    "ISE-003",
    "ISE-004",
    "ISE-005",
    "ISE-006",
    "ISE-007",
    "ISE-008",
    "ISE-009",
    "ISE-010"
  ],
  "supervised": [
    "ISE-001",
    "ISE-002",
    "ISE-003",
    "ISE-004",
    "ISE-005",
    "ISE-006",
    "ISE-007",
    "ISE-008",
    "ISE-015",
    "ISE-016",
    "ISEDATN-001",
    "ISEDATN-002",
    "ISEDATN-003"
  ],
  "pending": [
    {
      "id": "DX-ISE-009",
      "topicId": "ISE-009",
      "title": "Phát hiện lỗ hổng trên ứng dụng web sử dụng kỹ thuật phân tích động và thuật giải di truyền",
      "studentName": "Ngô Khánh Khoa",
      "studentId": "CH1802047",
      "topicType": "luan-van-thac-si",
      "topicTypeLabel": "Luận văn thạc sĩ",
      "course": "",
      "courseLabel": "Không áp dụng",
      "supervisionRole": "huong-dan-chinh",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "semester": "1",
      "academicYear": "2026–2027",
      "submittedAt": "2026-11-20T09:00:00+07:00",
      "description": "[Mô tả đề tài]",
      "objectives": "[Mục tiêu đề tài]",
      "outcomes": "[Kết quả dự kiến]",
      "attachment": "[Tệp đính kèm]",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/d-tai-lu-n-van-th-c-si-cac-nam"
    },
    {
      "id": "DX-ISE-010",
      "topicId": "ISE-010",
      "title": "Rút trích quan hệ giữa các thực thể trong văn bản tiếng Việt",
      "studentName": "Phạm Minh Mẫn",
      "studentId": "CH1802054",
      "topicType": "luan-van-thac-si",
      "topicTypeLabel": "Luận văn thạc sĩ",
      "course": "",
      "courseLabel": "Không áp dụng",
      "supervisionRole": "huong-dan-chinh",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "semester": "1",
      "academicYear": "2026–2027",
      "submittedAt": "2026-11-20T09:00:00+07:00",
      "description": "[Mô tả đề tài]",
      "objectives": "[Mục tiêu đề tài]",
      "outcomes": "[Kết quả dự kiến]",
      "attachment": "[Tệp đính kèm]",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/d-tai-lu-n-van-th-c-si-cac-nam"
    },
    {
      "id": "DX-ISE-011",
      "topicId": "ISE-011",
      "title": "Ứng dụng điểm danh lớp học bằng bluetooth",
      "studentName": "Trương Đức Nghĩa · Nguyễn Phương Phi",
      "studentId": "xxxxxxxx",
      "topicType": "khoa-luan",
      "topicTypeLabel": "Khóa luận tốt nghiệp",
      "course": "",
      "courseLabel": "Không áp dụng",
      "supervisionRole": "huong-dan-chinh",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "semester": "1",
      "academicYear": "2026–2027",
      "submittedAt": "2026-11-20T09:00:00+07:00",
      "description": "[Mô tả đề tài]",
      "objectives": "[Mục tiêu đề tài]",
      "outcomes": "[Kết quả dự kiến]",
      "attachment": "[Tệp đính kèm]",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien"
    },
    {
      "id": "DX-ISE-012",
      "topicId": "ISE-012",
      "title": "Nghiên cứu mô hình thống kê để phát triển hệ thống tự động tạo đề thi và đánh giá kết quả thi",
      "studentName": "Nguyễn Ngọc Phong",
      "studentId": "xxxxxxxx",
      "topicType": "khoa-luan",
      "topicTypeLabel": "Khóa luận tốt nghiệp",
      "course": "",
      "courseLabel": "Không áp dụng",
      "supervisionRole": "huong-dan-chinh",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "semester": "1",
      "academicYear": "2026–2027",
      "submittedAt": "2026-11-20T09:00:00+07:00",
      "description": "[Mô tả đề tài]",
      "objectives": "[Mục tiêu đề tài]",
      "outcomes": "[Kết quả dự kiến]",
      "attachment": "[Tệp đính kèm]",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien"
    },
    {
      "id": "DX-ISE-013",
      "topicId": "ISE-013",
      "title": "Ứng dụng quản lý dữ liệu người dùng trên nhiều tài khoản đám mây",
      "studentName": "Hoàng Trọng Nghĩa · Võ Thị Ngọc Huyên",
      "studentId": "xxxxxxxx",
      "topicType": "khoa-luan",
      "topicTypeLabel": "Khóa luận tốt nghiệp",
      "course": "",
      "courseLabel": "Không áp dụng",
      "supervisionRole": "huong-dan-chinh",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "semester": "1",
      "academicYear": "2026–2027",
      "submittedAt": "2026-11-20T09:00:00+07:00",
      "description": "[Mô tả đề tài]",
      "objectives": "[Mục tiêu đề tài]",
      "outcomes": "[Kết quả dự kiến]",
      "attachment": "[Tệp đính kèm]",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien"
    },
    {
      "id": "DX-ISE-014",
      "topicId": "ISE-014",
      "title": "Xây dựng ứng dụng thương mại điện tử tích hợp hệ thống gợi ý sản phẩm",
      "studentName": "Bùi Văn Thuận · Nguyễn Văn Tài",
      "studentId": "xxxxxxxx",
      "topicType": "khoa-luan",
      "topicTypeLabel": "Khóa luận tốt nghiệp",
      "course": "",
      "courseLabel": "Không áp dụng",
      "supervisionRole": "huong-dan-chinh",
      "supervisionRoleLabel": "Hướng dẫn chính",
      "semester": "1",
      "academicYear": "2026–2027",
      "submittedAt": "2026-11-20T09:00:00+07:00",
      "description": "[Mô tả đề tài]",
      "objectives": "[Mục tiêu đề tài]",
      "outcomes": "[Kết quả dự kiến]",
      "attachment": "[Tệp đính kèm]",
      "sourceUrl": "https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien"
    }
  ]
};
