window.UITLecturerCatalog = {
  facultyCodes: {
    KHMT: 'Khoa học máy tính', CNPM: 'Công nghệ phần mềm', MMTT: 'Mạng máy tính và truyền thông',
    HTTT: 'Hệ thống thông tin', ISE: 'Khoa học và Kỹ thuật Thông tin', KTMT: 'Kỹ thuật máy tính',
  },
  // Đối chiếu đơn vị quản lý chuyên môn trong danh mục môn học UIT.
  // https://portal.uit.edu.vn/danh-muc-mon-hoc — 21/11/2026.
  // Quy ước của dự án: KTTT → ISE, MMT&TT → MMTT.
  courseCatalog: {
    web: { code: 'IE104', label: 'Internet và công nghệ web', faculty: 'ISE' },
    database: { code: 'IT004', label: 'Cơ sở dữ liệu', faculty: 'HTTT' },
    software: { code: 'SE104', label: 'Nhập môn Công nghệ phần mềm', faculty: 'CNPM' },
    'phan-tich-thiet-ke-he-thong': { code: 'IS201', label: 'Phân tích thiết kế hệ thống', faculty: 'HTTT' },
    'thuong-mai-dien-tu': { code: 'IS334', label: 'Thương mại điện tử', faculty: 'HTTT' },
    'quan-ly-du-an-cntt': { code: 'IS208', label: 'Quản lý dự án công nghệ thông tin', faculty: 'HTTT' },
  },
  typeCodes: { course: 'ĐAMH', graduation: 'ĐATN', thesis: 'KLTN' },
  facultyCode(value) {
    const normalize = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/&/g, ' va ').replace(/\s+/g, ' ').trim();
    const aliases = { KTTT: 'ISE', 'MMT&TT': 'MMTT' };
    const code = String(value || '').trim().toUpperCase();
    if (this.facultyCodes[code]) return code;
    if (aliases[code]) return aliases[code];
    const name = normalize(value).replace(/ki thuat/g, 'ky thuat');
    return Object.keys(this.facultyCodes).find(key => name.endsWith(normalize(this.facultyCodes[key]))) || '';
  },
  facultyFor(topic) {
    const type = topic.filterType || topic.topicType || topic.type;
    const course = topic.course || topic.courseId;
    const subject = this.courseCatalog[course] || Object.values(this.courseCatalog).find(item => item.code === course);
    return (type === 'course' && subject?.faculty) || this.facultyCode(topic.facultyCode || topic.faculty || topic.supervisor?.faculty || topic.sourceRecord?.faculty) || 'ISE';
  },
  formatCode(type, code, faculty) {
    if (!this.typeCodes[type]) return code;
    const raw = String(code || '').normalize('NFC').trim();
    const number = /(?:^|-|DA|DT|KL|KLTN|DATN|DAMH)(\d+)$/i.exec(raw)?.[1];
    if (!number) return code;
    const record = this.records.find(item => item.id === code || item.code === code);
    const existingFaculty = /^(KHMT|CNPM|MMTT|HTTT|ISE|KTMT)-/.exec(raw)?.[1];
    const department = this.facultyCode(faculty) || existingFaculty || (record && this.facultyFor(record)) || 'ISE';
    return `${department}-${this.typeCodes[type]}-${number.padStart(3, '0')}`;
  },
  decorateTopics(topics) {
    const normalized = topics.map(topic => {
      const type = topic.filterType || topic.topicType || topic.type;
      const faculty = this.facultyFor(topic);
      const displayId = this.formatCode(type, topic.displayId || topic.id || topic.code, faculty);
      const courseLabel = type === 'graduation' ? 'Đồ án tốt nghiệp' : type === 'thesis' ? 'Khóa luận tốt nghiệp' : this.courseCatalog[topic.course]?.label || topic.courseLabel;
      return { ...topic, facultyCode: faculty, displayId, courseLabel };
    });
    const largest = new Map();
    normalized.forEach(topic => {
      const match = /^(.*)-(\d+)$/.exec(topic.displayId || '');
      if (match) {
        const number = BigInt(match[2]);
        if (number > (largest.get(match[1]) || 0n)) largest.set(match[1], number);
      }
    });
    const used = new Map(); const byTitle = new Map();
    // Hồ sơ gốc giữ số hiện có; các mã cũ bị trùng được cấp số tiếp theo.
    const ordered = [...normalized].sort((a, b) => Number(Boolean(b.sourceRecord)) - Number(Boolean(a.sourceRecord)));
    ordered.forEach(topic => {
      const title = String(topic.title || topic.name || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
      const match = /^(KHMT|CNPM|MMTT|HTTT|ISE|KTMT)-(ĐAMH|ĐATN|KLTN)-(\d+)$/.exec(topic.displayId || '');
      if (!match) return;
      const family = `${match[1]}-${match[2]}`;
      const key = `${family}:${title}`;
      if (title && byTitle.has(key)) { topic.displayId = byTitle.get(key); return; }
      if (used.has(topic.displayId)) {
        const next = (largest.get(family) || 0n) + 1n;
        largest.set(family, next); topic.displayId = `${family}-${String(next).padStart(3, '0')}`;
      }
      used.set(topic.displayId, key);
      if (title) byTitle.set(key, topic.displayId);
    });
    return normalized;
  },
  nextCode(type, records, faculty) {
    const department = this.facultyCode(faculty);
    if (!department || !this.typeCodes[type]) return '';
    const prefix = `${department}-${this.typeCodes[type]}-`;
    let largest = 0n;
    for (const record of records) {
      const code = this.formatCode(record.filterType || record.topicType || record.type, record.displayId || record.code || record.id, this.facultyFor(record));
      if (code?.startsWith(prefix) && /^\d+$/.test(code.slice(prefix.length))) {
        const number = BigInt(code.slice(prefix.length));
        if (number > largest) largest = number;
      }
    }
    return prefix + String(largest + 1n).padStart(3, '0');
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
        "comment": "Cần kiểm thử trường hợp hai người đặt cùng thiết bị và cách ghi nhận tình trạng khi trả."
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
        "comment": "Cần phân biệt rõ hồ sơ thiếu phiếu đánh giá của doanh nghiệp với hồ sơ chưa được giảng viên tổng hợp."
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
        "comment": "Ưu tiên đo sai số trên các bản scan chất lượng khác nhau và kiểm tra quyền tải tệp qua đường dẫn trực tiếp."
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

// Hồ sơ dưới đây là dữ liệu minh họa, không phải hồ sơ trích từ nguồn UIT.
// Dùng cùng bản ghi cho danh sách, bộ lọc và chi tiết của cả hai ngữ cảnh.
(() => {
  const catalog = window.UITLecturerCatalog;
  catalog.records.forEach(record => {
    if (record.topicType === 'thesis') record.courseLabel = 'Khóa luận tốt nghiệp';
    if (record.topicType === 'graduation') record.courseLabel = 'Đồ án tốt nghiệp';
  });
  const courses = { web: 'Internet và công nghệ Web', database: 'Cơ sở dữ liệu', software: 'Công nghệ phần mềm' };
  const samples = [
    {
      id: 'ISEDATN-004', title: 'Hệ thống điều phối thu gom và phân loại rác tái chế trong khuôn viên trường',
      semester: '2', academicYear: '2025–2026', course: '', start: '2026-02-09', group: 'Nhóm 14',
      authors: ['Trần Minh Quân', 'Nguyễn Ngọc Trâm'], studentIds: ['23525001', '23525002'],
      description: 'Thiết kế hệ thống tiếp nhận yêu cầu thu gom rác tái chế theo điểm tập kết. Nhân viên lập lịch, ghi nhận khối lượng theo vật liệu và theo dõi các yêu cầu chưa xử lý. Báo cáo tổng hợp giúp đánh giá hiệu quả thu gom theo tuần và khu vực.',
      features: ['danh mục điểm tập kết', 'phân loại giấy, nhựa và kim loại', 'biểu mẫu yêu cầu thu gom', 'lịch thu gom theo khu vực', 'phân công nhân viên thu gom', 'ghi nhận khối lượng cân thực tế', 'xử lý yêu cầu bị trùng', 'lịch sử bàn giao vật liệu', 'báo cáo khối lượng theo tuần', 'tra cứu yêu cầu tồn đọng'],
    },
    {
      id: 'ISEDATN-005', title: 'Cổng hỗ trợ sinh viên tìm kiếm và đăng ký hoạt động tình nguyện',
      semester: '1', academicYear: '2025–2026', course: '', start: '2025-09-08', group: 'Nhóm 15', secondary: true,
      authors: ['Lê Hoàng Phúc', 'Phạm Thảo Vy'], studentIds: ['23525003', '23525004'],
      description: 'Xây dựng cổng giới thiệu hoạt động tình nguyện theo địa điểm, thời gian và kỹ năng cần có. Sinh viên đăng ký ca tham gia; ban tổ chức xét danh sách, điểm danh và ghi nhận đóng góp. Các tình huống xử lý bao gồm hoạt động đủ chỗ, ca trùng lịch và trường hợp hủy đăng ký.',
      features: ['danh mục hoạt động tình nguyện', 'tìm hoạt động theo kỹ năng', 'lịch ca tham gia', 'đăng ký và hủy tham gia', 'kiểm tra số chỗ còn lại', 'phát hiện ca trùng lịch', 'xét duyệt danh sách tham gia', 'điểm danh theo ca', 'ghi nhận số giờ đóng góp', 'báo cáo hoạt động theo tháng'],
    },
    {
      id: 'ISEDAMH-001', title: 'Website đặt chỗ phòng tự học theo khung giờ',
      semester: '1', academicYear: '2026–2027', course: 'web', start: '2026-09-07', group: 'Nhóm 16',
      authors: ['Nguyễn Gia Huy', 'Đỗ Khánh Linh'], studentIds: ['23525005', '23525006'],
      description: 'Xây dựng giao diện website tra cứu phòng tự học và đặt chỗ theo khung giờ bằng HTML, CSS và JavaScript. Website hỗ trợ xem lịch phòng, đăng ký chỗ và hủy lịch đặt.',
      features: ['danh sách phòng tự học', 'bộ lọc sức chứa phòng', 'lịch phòng theo ngày', 'chọn khung giờ đặt chỗ', 'biểu mẫu thông tin người đặt', 'kiểm tra trùng lịch phòng', 'xác nhận thông tin đặt chỗ', 'hủy lịch đặt cá nhân', 'thống kê số chỗ còn trống', 'hướng dẫn sử dụng trên điện thoại'],
    },
    {
      id: 'ISEDAMH-002', title: 'Thiết kế cơ sở dữ liệu quản lý kho vật tư phòng thực hành',
      semester: '2', academicYear: '2025–2026', course: 'database', start: '2026-02-09', group: 'Nhóm 17', secondary: true,
      authors: ['Võ Đức Anh', 'Trần Bảo Ngọc'], studentIds: ['23525007', '23525008'],
      description: 'Phân tích và thiết kế cơ sở dữ liệu theo dõi nhập, xuất và kiểm kê vật tư phòng thực hành. Đề tài tập trung vào mô hình quan hệ, ràng buộc toàn vẹn, truy vấn tổng hợp và xử lý trường hợp xuất vượt tồn kho trên bộ dữ liệu giả lập.',
      features: ['mô hình vật tư và đơn vị tính', 'danh mục nhà cung cấp', 'phiếu nhập kho', 'phiếu xuất vật tư', 'ràng buộc số lượng tồn', 'sổ điều chuyển giữa các kho', 'biên bản kiểm kê', 'truy vấn vật tư dưới mức tối thiểu', 'báo cáo nhập xuất tồn', 'chỉ mục cho truy vấn lịch sử kho'],
    },
    {
      id: 'ISEDAMH-003', title: 'Ứng dụng quản lý yêu cầu bảo trì thiết bị trong ký túc xá',
      semester: '3', academicYear: '2025–2026', course: 'software', start: '2026-06-08', group: 'Nhóm 18',
      authors: ['Phan Tuấn Kiệt', 'Bùi Hải Yến'], studentIds: ['23525009', '23525010'],
      description: 'Phân tích yêu cầu và xây dựng bản thử nghiệm theo dõi phiếu bảo trì tại ký túc xá. Nhóm mô tả quy trình tiếp nhận, phân công kỹ thuật viên, cập nhật sửa chữa và xác nhận kết quả; kèm tài liệu yêu cầu và ca kiểm thử cho từng bước.',
      features: ['danh mục thiết bị cần bảo trì', 'phiếu báo hỏng của sinh viên', 'phân loại mức độ ưu tiên', 'phân công kỹ thuật viên', 'lịch hẹn xử lý sự cố', 'nhật ký sửa chữa', 'ghi nhận linh kiện thay thế', 'xác nhận kết quả bảo trì', 'đánh giá sau sửa chữa', 'báo cáo thời gian xử lý phiếu'],
    },
    {
      id: 'ISEDAMH-004', title: 'Website trao đổi giáo trình và sách cũ cho sinh viên',
      semester: '2', academicYear: '2026–2027', course: 'web', start: '2027-02-08', group: 'Nhóm 19', secondary: true,
      authors: ['Đặng Quốc Bảo', 'Mai Phương Anh'], studentIds: ['23525011', '23525012'],
      description: 'Dựng website giới thiệu giáo trình và sách cũ theo môn học. Sinh viên có thể tìm sách, xem tình trạng, lưu danh sách quan tâm và gửi yêu cầu trao đổi mô phỏng. Giao diện ưu tiên khả năng đọc trên điện thoại và kiểm tra biểu mẫu rõ ràng.',
      features: ['danh mục giáo trình theo môn', 'tìm sách theo tên tác giả', 'bộ lọc tình trạng sách', 'trang chi tiết giáo trình', 'biểu mẫu đăng sách trao đổi', 'kiểm tra dữ liệu tin đăng', 'danh sách sách quan tâm', 'yêu cầu trao đổi sách', 'trạng thái sách đã trao đổi', 'bố cục danh sách trên điện thoại'],
    },
    {
      id: 'ISEDAMH-005', title: 'Cơ sở dữ liệu theo dõi đăng ký và kết quả thi chứng chỉ ngoại ngữ',
      semester: '1', academicYear: '2025–2026', course: 'database', start: '2025-09-08', group: 'Nhóm 20',
      authors: ['Huỳnh Anh Khoa', 'Lương Ngọc Mai'], studentIds: ['23525013', '23525014'],
      description: 'Xây dựng mô hình dữ liệu quản lý đợt thi, thí sinh, phòng thi và kết quả chứng chỉ ngoại ngữ. Dùng dữ liệu giả lập để kiểm tra khóa, ràng buộc đăng ký trùng, tổng hợp kết quả và tra cứu chứng chỉ còn hiệu lực.',
      features: ['mô hình thí sinh và chứng chỉ', 'danh mục đợt thi', 'đăng ký dự thi', 'ràng buộc đăng ký trùng', 'xếp phòng thi', 'phân công coi thi', 'nhập kết quả từng kỹ năng', 'kiểm tra hiệu lực chứng chỉ', 'truy vấn kết quả theo đợt', 'báo cáo tỷ lệ đạt chứng chỉ'],
    },
    {
      id: 'ISEDAMH-006', title: 'Phần mềm quản lý lịch sinh hoạt câu lạc bộ học thuật',
      semester: '3', academicYear: '2026–2027', course: 'software', start: '2027-06-07', group: 'Nhóm 21',
      authors: ['Dương Minh Nhật', 'Ngô Thanh Hà'], studentIds: ['23525015', '23525016'],
      description: 'Thiết kế ứng dụng hỗ trợ câu lạc bộ lập kế hoạch sinh hoạt, phân công người phụ trách và theo dõi thành viên tham dự. Sản phẩm áp dụng quy trình phát triển phần mềm từ đặc tả yêu cầu, thiết kế giao diện đến kiểm thử nghiệm thu.',
      features: ['hồ sơ thành viên câu lạc bộ', 'kế hoạch sinh hoạt tháng', 'đăng ký buổi sinh hoạt', 'phân công người phụ trách', 'kiểm tra trùng địa điểm', 'danh sách điểm danh', 'biên bản buổi sinh hoạt', 'ghi nhận tài liệu chia sẻ', 'thống kê số lượt tham dự', 'tổng hợp góp ý thành viên'],
    },
    {
      id: 'ISEDAMH-007', title: 'Website giới thiệu và đăng ký workshop kỹ năng số',
      semester: '1', academicYear: '2026–2027', course: 'web', start: '2026-09-07', group: 'Nhóm 22',
      authors: ['Tạ Hoàng Nam', 'Đinh Thùy Dương'], studentIds: ['23525017', '23525018'],
      description: 'Thiết kế website giới thiệu workshop theo chủ đề, lịch tổ chức và diễn giả. Người học xem chi tiết, đăng ký tham dự và quản lý danh sách quan tâm trên dữ liệu trình duyệt. Các trạng thái hết chỗ, nhập sai và chưa có workshop được xử lý trong sản phẩm.',
      features: ['danh sách workshop theo chủ đề', 'thông tin diễn giả', 'lịch workshop theo tuần', 'trang chi tiết workshop', 'biểu mẫu đăng ký tham dự', 'kiểm tra email người đăng ký', 'trạng thái workshop hết chỗ', 'danh sách workshop quan tâm', 'tra cứu đăng ký đã lưu', 'trạng thái chưa có workshop phù hợp'],
    },
    {
      id: 'ISEDAMH-008', title: 'Thiết kế cơ sở dữ liệu quản lý đặt suất ăn tại căn tin',
      semester: '2', academicYear: '2026–2027', course: 'database', start: '2027-02-08', group: 'Nhóm 23',
      authors: ['Cao Minh Triết', 'Hồ Ngọc Hân'], studentIds: ['23525019', '23525020'],
      description: 'Phân tích dữ liệu thực đơn, suất ăn và đơn đặt trước tại căn tin. Thiết kế mô hình quan hệ và các truy vấn kiểm tra số suất còn lại, hủy đơn trước giờ chốt, đối chiếu lượt nhận và tổng hợp nhu cầu theo ngày bằng dữ liệu giả lập.',
      features: ['danh mục món ăn', 'thực đơn theo ngày', 'đơn đặt suất ăn', 'chi tiết số lượng từng món', 'ràng buộc số suất còn lại', 'quy tắc hủy trước giờ chốt', 'ghi nhận lượt nhận suất', 'truy vấn đơn chưa nhận', 'thống kê nhu cầu theo món', 'báo cáo suất ăn theo ngày'],
    },
  ];
  const dateAt = (start, days) => {
    const date = new Date(`${start}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  samples.forEach((sample, index) => {
    const graduation = sample.id.startsWith('ISEDATN');
    const supervised = index < 7;
    const record = {
      ...sample, code: sample.id, demo: true, source: 'illustrative',
      type: graduation ? 'Đồ án tốt nghiệp' : 'Đồ án môn học', topicType: graduation ? 'graduation' : 'course',
      courseLabel: courses[sample.course] || 'Không áp dụng', faculty: 'Khoa Khoa học và Kỹ thuật Thông tin',
      field: sample.course === 'database' ? 'Cơ sở dữ liệu' : 'Hệ thống thông tin',
      technology: sample.course === 'database' ? 'Mô hình quan hệ, SQL và dữ liệu giả lập' : 'HTML, CSS và JavaScript',
      createdAt: dateAt(sample.start, -21), status: sample.start < '2026-09-01' ? 'closed' : 'open',
      startsAt: sample.start, completesAt: `${dateAt(sample.start, 90)}T23:59:00+07:00`,
      supervisionRole: sample.secondary ? 'secondary' : 'primary',
      supervisionRoleLabel: sample.secondary ? 'Đồng hướng dẫn' : 'Hướng dẫn chính',
      objectives: [
        `Phân tích bài toán và thiết kế ${sample.features[0]}.`,
        `Xây dựng và kiểm tra ${sample.features[3]} cùng ${sample.features[6]}.`,
        `Tổng hợp kết quả qua ${sample.features[9]} và đánh giá các trường hợp ngoại lệ.`,
      ],
      outcomes: [
        `Bản thử nghiệm ${sample.title.charAt(0).toLocaleLowerCase('vi') + sample.title.slice(1)}.`,
        'Tài liệu phân tích, thiết kế, bộ ca kiểm thử và kết quả chạy thử.',
        'Báo cáo tổng kết, mã nguồn và hướng dẫn sử dụng.',
      ],
      requirements: [
        `Vận dụng kiến thức ${courses[sample.course] || 'phân tích hệ thống và lập trình web'}.`,
        'Kiểm tra dữ liệu đầu vào và trình bày cách xử lý các tình huống ngoại lệ.',
        'Chuẩn bị bộ dữ liệu kiểm thử và trình bày giới hạn của sản phẩm trong báo cáo.',
      ],
      registration: { minMembers: 2, maxMembers: graduation ? 2 : 3, opensAt: `${dateAt(sample.start, -21)}T09:00:00+07:00`, deadline: `${dateAt(sample.start, -1)}T23:59:00+07:00` },
    };
    if (supervised) {
      const deliverables = sample.features.flatMap((feature, featureIndex) => {
        const due = dateAt(sample.start, 14 + featureIndex * 2);
        const base = { description: `Trình bày phạm vi, dữ liệu sử dụng và kết quả kiểm tra ${feature}. Nêu các trường hợp còn thiếu và kế hoạch bổ sung.`, due: `${due}T23:59` };
        return [
          { ...base, title: `Kế hoạch kiểm thử ${feature}`, due: `${dateAt(sample.start, 65 + featureIndex * 2)}T23:59` },
          { ...base, title: `Bản thử nghiệm ${feature}`, file: `${sample.id}-thu-nghiem-${featureIndex + 1}.pdf`, submittedAt: `${dateAt(sample.start, 14 + featureIndex * 2 + (featureIndex % 3 === 0 ? 1 : 0))}T09:30` },
          { ...base, title: `Thiết kế ${feature}`, file: `${sample.id}-thiet-ke-${featureIndex + 1}.pdf`, submittedAt: `${due}T16:00`, feedback: `Đã mô tả ${feature}. Bổ sung ví dụ dữ liệu không hợp lệ và đối chiếu kết quả với yêu cầu ban đầu.` },
        ];
      });
      record.supervision = {
        group: sample.group, milestones: [sample.start, dateAt(sample.start, 42), dateAt(sample.start, 90)],
        tasks: {
          notStarted: sample.features.map((feature, i) => [`Kiểm thử ${feature}`, dateAt(sample.start, 65 + i * 2)]),
          inProgress: sample.features.map((feature, i) => [`Hoàn thiện ${feature}`, dateAt(sample.start, 35 + i * 2)]),
          completed: sample.features.map((feature, i) => [`Thiết kế ${feature}`, dateAt(sample.start, 7 + i * 2)]),
        },
        deliverables,
        criteria: ['Mô tả đúng bài toán, mô hình dữ liệu và các tình huống sử dụng.', 'Bản thử nghiệm đáp ứng phạm vi, có kiểm tra dữ liệu và kết quả kiểm thử.', 'Báo cáo rõ ràng; giải thích được thiết kế và giới hạn của sản phẩm.'],
        comment: `Nhóm đã hoàn thành thiết kế. Cần bổ sung kiểm thử cho ${sample.features[6]} và ${sample.features[9]}.`,
      };
      catalog.supervised.push(record.id);
    }
    catalog.records.push(record);
    catalog.created.push(record.id);
  });

  // Bổ sung bài nộp cho ba đồ án minh họa đã có để mỗi cột đều đủ dữ liệu cuộn.
  catalog.records.filter(record => record.supervision).forEach(record => {
    const work = record.supervision;
    const groups = [
      { entries: work.deliverables.filter(item => !item.submittedAt), tasks: work.tasks.notStarted, label: 'Kế hoạch kiểm thử', file: false },
      { entries: work.deliverables.filter(item => item.submittedAt && !item.feedback), tasks: work.tasks.inProgress, label: 'Báo cáo thực hiện', file: true },
      { entries: work.deliverables.filter(item => item.feedback), tasks: work.tasks.completed, label: 'Tài liệu thiết kế', file: true, feedback: true },
    ];
    groups.forEach((group, groupIndex) => {
      for (let index = group.entries.length; index < 10; index++) {
        const [task, due] = group.tasks[index % group.tasks.length];
        work.deliverables.push({
          title: `${group.label}: ${task.charAt(0).toLocaleLowerCase('vi') + task.slice(1)}`,
          description: `Trình bày kết quả công việc “${task}”, dữ liệu dùng để kiểm tra và các nội dung cần bổ sung. `,
          due: `${due}T23:59`,
          ...(group.file ? { file: `${record.code}-bo-sung-${groupIndex}-${index + 1}.pdf`, submittedAt: `${due}T16:00` } : {}),
          ...(group.feedback ? { feedback: `Đã xem tài liệu công việc “${task}”. Bổ sung minh chứng kiểm thử và đối chiếu với mục tiêu đề tài.` } : {}),
        });
      }
    });
  });
  catalog.records.forEach(record => {
    const subject = catalog.courseCatalog[record.course];
    if (subject) { record.courseCode = subject.code; record.courseLabel = subject.label; }
    if (record.topicType === 'graduation') record.courseLabel = 'Đồ án tốt nghiệp';
  });
})();
