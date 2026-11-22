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
    'phan-tich-thiet-ke-phan-mem': { code: 'IE108', label: 'Phân tích thiết kế phần mềm', faculty: 'ISE' },
    // IE101, IE103, IE105: https://student.uit.edu.vn/danh-muc-mon-hoc-dai-hoc
    IE101: { code: 'IE101', label: 'Cơ sở hạ tầng công nghệ thông tin', faculty: 'ISE' },
    IE103: { code: 'IE103', label: 'Quản lý thông tin', faculty: 'ISE' },
    IE105: { code: 'IE105', label: 'Nhập môn bảo đảm và an ninh thông tin', faculty: 'ISE' },
  },
  typeCodes: { course: 'DAMH', graduation: 'DATN', thesis: 'KTLN' },
  groupLabel(topic) {
    if (typeof topic === 'string') {
      const match = /^Nhóm\s*(\d+)/i.exec(topic.trim());
      return match ? `Nhóm ${match[1].padStart(2, '0')}` : topic;
    }
    const record = this.records.find(item => item.id === topic.id || item.id === topic.topicId || item.id === topic.workspaceId || item.title === topic.title);
    return this.groupLabel(record?.supervision?.group || topic.sourceRecord?.supervision?.group || topic.groupName || topic.group || 'Chưa có nhóm thực hiện');
  },
  courseKey(value) {
    const aliases = { SE104: 'software', IS334: 'thuong-mai-dien-tu', IS208: 'quan-ly-du-an-cntt', 'phan-tich-thiet-ke-he-thong': 'phan-tich-thiet-ke-phan-mem', IS201: 'phan-tich-thiet-ke-phan-mem', 'internet-va-cong-nghe-web': 'web', 'co-so-du-lieu': 'database', 'cong-nghe-phan-mem': 'software' };
    return aliases[value] || Object.keys(this.courseCatalog).find(key => this.courseCatalog[key].code === value) || value || '';
  },
  isAvailableTopic(topic) {
    const type = topic.filterType || topic.topicType || topic.type;
    const courseTopic = ['course', 'do-an-mon-hoc', 'do-an'].includes(type) || topic.typeLabel === 'Đồ án môn học';
    return !courseTopic || !['software', 'thuong-mai-dien-tu', 'quan-ly-du-an-cntt'].includes(this.courseKey(topic.course || topic.courseId));
  },
  subjectLabel(topic, detail = false) {
    const type = topic.filterType || topic.topicType || topic.type;
    if (['thesis', 'khoa-luan'].includes(type) || topic.typeLabel === 'Khóa luận tốt nghiệp') return 'Khóa luận tốt nghiệp';
    if (['graduation', 'do-an-tot-nghiep'].includes(type) || topic.typeLabel === 'Đồ án tốt nghiệp') return 'Đồ án tốt nghiệp';
    const key = this.courseKey(topic.course || topic.courseId);
    const subject = this.courseCatalog[key] || Object.values(this.courseCatalog).find(item => item.code === key);
    const name = subject?.label || String(topic.courseLabel || '').replace(/^[A-Z]{2,}\d{3}\s*[-–·:]\s*/, '') || 'Chưa có thông tin';
    const code = subject?.code || topic.courseCode;
    return detail && code ? `${code} - ${name}` : name;
  },
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
    const department = 'ISE';
    return `${department}${this.typeCodes[type]}-${number.padStart(3, '0')}`;
  },
  decorateTopics(topics) {
    const normalized = topics.map(topic => {
      const type = topic.filterType || topic.topicType || topic.type;
      const faculty = this.facultyFor(topic);
      const displayId = this.formatCode(type, topic.displayId || topic.id || topic.code, faculty);
      const courseLabel = this.subjectLabel(topic);
      return { ...topic, facultyCode: faculty, displayId, courseLabel, ...(topic.kind === 'supervised' || topic.groupName ? { groupName: this.groupLabel(topic) } : {}), ...(topic.kind === 'created' ? { status: topic.status === 'closed' ? 'closed' : 'open', statusLabel: topic.status === 'closed' ? 'Đã đóng đăng ký' : 'Đang mở đăng ký' } : {}) };
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
      const match = /^(KHMT|CNPM|MMTT|HTTT|ISE|KTMT)(DAMH|DATN|KTLN)-(\d+)$/.exec(topic.displayId || '');
      if (!match) return;
      const family = `${match[1]}${match[2]}`;
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
    const department = 'ISE';
    if (!department || !this.typeCodes[type]) return '';
    const prefix = `${department}${this.typeCodes[type]}-`;
    let largest = 0n;
    for (const record of records) {
      const code = record.topicCode?.replace(/^ISEKLTN-/, 'ISEKTLN-') ||
        this.formatCode(record.filterType || record.topicType || record.type, record.displayId || record.code || record.id, this.facultyFor(record));
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
      "studentName": "Trương Đức Nghĩa",
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
      "studentName": "Hoàng Trọng Nghĩa",
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
      "studentName": "Bùi Văn Thuận",
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
  const courses = Object.fromEntries(Object.entries(catalog.courseCatalog).map(([key, item]) => [key, item.label]));
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
      id: 'ISEDAMH-001', title: 'Website đặt chỗ phòng tự học theo khung giờ', createdOnly: true,
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
  samples.push(...[
  {
    "id": "ISEDAMH-009",
    "title": "Thiết kế hạ tầng công nghệ thông tin cho trung tâm đào tạo quy mô nhỏ",
    "course": "IE101",
    "semester": "1",
    "academicYear": "2026–2027",
    "start": "2026-09-07",
    "group": "Nhóm 24",
    "authors": [
      "Nguyễn Văn A",
      "Trần Thị B"
    ],
    "studentIds": [
      "xxxxxxxx",
      "xxxxxxxx"
    ],
    "description": "Khảo sát nhu cầu máy trạm, kết nối mạng, lưu trữ và dịch vụ dùng chung của một trung tâm đào tạo. Đề xuất kiến trúc hạ tầng, ước tính chi phí và xây dựng phương án vận hành, sao lưu, phục hồi khi có sự cố.",
    "features": [
      "khảo sát số lượng người dùng",
      "kiểm kê máy trạm và thiết bị",
      "sơ đồ kết nối mạng nội bộ",
      "phân vùng mạng theo bộ phận",
      "lựa chọn dịch vụ dùng chung",
      "ước tính nhu cầu lưu trữ",
      "phương án sao lưu dữ liệu",
      "quy trình xử lý sự cố",
      "so sánh chi phí các phương án",
      "báo cáo thiết kế hạ tầng"
    ],
    "syllabusUrl": "https://fit.uit.edu.vn/attachments/article/4872/IE101%20-%20Co%20so%20ha%20tang%20cong%20nghe%20thong%20tin.pdf",
    "secondary": false
  },
  {
    "id": "ISEDAMH-010",
    "title": "Khảo sát và đề xuất phương án nâng cấp hạ tầng CNTT cho thư viện trường học",
    "course": "IE101",
    "semester": "1",
    "academicYear": "2026–2027",
    "start": "2026-09-07",
    "group": "Nhóm 25",
    "authors": [
      "Nguyễn Văn A",
      "Trần Thị B"
    ],
    "studentIds": [
      "xxxxxxxx",
      "xxxxxxxx"
    ],
    "description": "Đánh giá hiện trạng thiết bị, phần mềm, mạng và lưu trữ của một thư viện giả định. Xác định điểm nghẽn và lập kế hoạch nâng cấp theo nhu cầu tra cứu, quản lý tài nguyên và phục vụ bạn đọc.",
    "features": [
      "mô tả quy trình phục vụ bạn đọc",
      "khảo sát tài nguyên phần cứng",
      "đánh giá phần mềm hiện có",
      "sơ đồ mạng và điểm truy cập",
      "ước tính tải truy cập",
      "phân tích điểm nghẽn lưu trữ",
      "so sánh triển khai tại chỗ và đám mây",
      "lập kế hoạch nâng cấp theo giai đoạn",
      "quy trình bảo trì và phục hồi",
      "báo cáo đánh giá hiệu quả đầu tư"
    ],
    "syllabusUrl": "https://fit.uit.edu.vn/attachments/article/4872/IE101%20-%20Co%20so%20ha%20tang%20cong%20nghe%20thong%20tin.pdf",
    "secondary": true
  },
  {
    "id": "ISEDAMH-011",
    "title": "Hệ thống tổ chức và tra cứu hồ sơ hoạt động câu lạc bộ sinh viên",
    "course": "IE103",
    "semester": "1",
    "academicYear": "2026–2027",
    "start": "2026-09-07",
    "group": "Nhóm 26",
    "authors": [
      "Nguyễn Văn A",
      "Trần Thị B"
    ],
    "studentIds": [
      "xxxxxxxx",
      "xxxxxxxx"
    ],
    "description": "Xây dựng mô hình quản lý thông tin hoạt động, thành viên và tài liệu của câu lạc bộ. Thực hiện thu thập, chuẩn hóa, lưu trữ, tra cứu và trình bày thông tin; kiểm soát quyền đọc, sửa hồ sơ trên bộ dữ liệu giả lập.",
    "features": [
      "thu thập hồ sơ hoạt động",
      "xây dựng từ điển dữ liệu",
      "chuẩn hóa thông tin thành viên",
      "mô hình lưu trữ hồ sơ",
      "chuyển đổi dữ liệu từ bảng tính",
      "tra cứu theo chủ đề và thời gian",
      "phân quyền đọc và sửa hồ sơ",
      "kiểm tra chất lượng thông tin",
      "trình bày báo cáo hoạt động",
      "đánh giá mô hình quản lý thông tin"
    ],
    "syllabusUrl": "https://fit.uit.edu.vn/attachments/article/4872/IE103%20-%20Quan%20ly%20Thong%20tin.pdf",
    "secondary": false
  },
  {
    "id": "ISEDAMH-012",
    "title": "Tích hợp và quản lý thông tin học bổng từ nhiều nguồn dữ liệu",
    "course": "IE103",
    "semester": "1",
    "academicYear": "2026–2027",
    "start": "2026-09-07",
    "group": "Nhóm 27",
    "authors": [
      "Nguyễn Văn A",
      "Trần Thị B"
    ],
    "studentIds": [
      "xxxxxxxx",
      "xxxxxxxx"
    ],
    "description": "Thiết kế quy trình tiếp nhận danh mục học bổng từ các tệp dữ liệu giả lập, chuẩn hóa tên đơn vị và tiêu chí, nhận diện bản ghi trùng và xây dựng bộ tra cứu. So sánh phương án lưu trữ quan hệ với mô hình tài liệu.",
    "features": [
      "khảo sát cấu trúc các nguồn dữ liệu",
      "mô hình thông tin học bổng",
      "chuẩn hóa đơn vị và tiêu chí",
      "chuyển đổi dữ liệu CSV và JSON",
      "phát hiện bản ghi trùng",
      "quản lý phiên bản dữ liệu",
      "truy vấn điều kiện học bổng",
      "phân quyền cập nhật thông tin",
      "so sánh mô hình quan hệ và tài liệu",
      "báo cáo chất lượng dữ liệu"
    ],
    "syllabusUrl": "https://fit.uit.edu.vn/attachments/article/4872/IE103%20-%20Quan%20ly%20Thong%20tin.pdf",
    "secondary": true
  },
  {
    "id": "ISEDAMH-013",
    "title": "Xây dựng mô hình phân quyền và kiểm soát truy cập tài liệu nội bộ",
    "course": "IE105",
    "semester": "1",
    "academicYear": "2026–2027",
    "start": "2026-09-07",
    "group": "Nhóm 28",
    "authors": [
      "Nguyễn Văn A",
      "Trần Thị B"
    ],
    "studentIds": [
      "xxxxxxxx",
      "xxxxxxxx"
    ],
    "description": "Phân tích rủi ro đối với tài liệu nội bộ và thiết kế ma trận quyền cho các vai trò trong tổ chức giả định. Dựng môi trường thử nghiệm cô lập để kiểm tra truy cập hợp lệ, truy cập bị từ chối và khả năng truy vết thao tác.",
    "features": [
      "phân loại mức độ nhạy cảm tài liệu",
      "nhận diện nguy cơ lộ lọt thông tin",
      "xây dựng ma trận quyền truy cập",
      "mô hình tài khoản và nhóm quyền",
      "cấu hình chính sách truy cập",
      "nguyên tắc quyền tối thiểu",
      "kiểm tra truy cập được phép",
      "kiểm tra truy cập bị từ chối",
      "ghi nhận nhật ký thao tác",
      "đánh giá rủi ro còn lại"
    ],
    "syllabusUrl": "https://fit.uit.edu.vn/attachments/article/4872/IE105_Nhap%20Mon%20Bao%20Dam%20va%20An%20Ninh%20Thong%20Tin-CDIO_v1-05122016.pdf",
    "secondary": false
  },
  {
    "id": "ISEDAMH-014",
    "title": "Thiết kế phương án bảo vệ mạng nội bộ cho văn phòng nhỏ",
    "course": "IE105",
    "semester": "1",
    "academicYear": "2026–2027",
    "start": "2026-09-07",
    "group": "Nhóm 29",
    "authors": [
      "Nguyễn Văn A",
      "Trần Thị B"
    ],
    "studentIds": [
      "xxxxxxxx",
      "xxxxxxxx"
    ],
    "description": "Phân tích tài sản và nguy cơ đối với mạng văn phòng giả định. Đề xuất phân vùng mạng, chính sách tường lửa, bảo vệ máy trạm và sao lưu. Kiểm tra chính sách trong môi trường thực hành cô lập bằng các tình huống kết nối hợp lệ và bị chặn.",
    "features": [
      "kiểm kê tài sản thông tin",
      "đánh giá nguy cơ mạng nội bộ",
      "thiết kế phân vùng mạng",
      "chính sách tường lửa theo dịch vụ",
      "bảo vệ thiết bị đầu cuối",
      "cấu hình an toàn mạng không dây",
      "quản lý cập nhật hệ điều hành",
      "phương án sao lưu và phục hồi",
      "kiểm tra các tình huống truy cập",
      "báo cáo đánh giá an toàn mạng"
    ],
    "syllabusUrl": "https://fit.uit.edu.vn/attachments/article/4872/IE105_Nhap%20Mon%20Bao%20Dam%20va%20An%20Ninh%20Thong%20Tin-CDIO_v1-05122016.pdf",
    "secondary": true
  },
  {
    "id": "ISEDAMH-015",
    "title": "Phân tích và thiết kế phần mềm quản lý lịch tư vấn học tập",
    "course": "phan-tich-thiet-ke-phan-mem",
    "semester": "1",
    "academicYear": "2026–2027",
    "start": "2026-09-07",
    "group": "Nhóm 30",
    "authors": [
      "Nguyễn Văn A",
      "Trần Thị B"
    ],
    "studentIds": [
      "xxxxxxxx",
      "xxxxxxxx"
    ],
    "description": "Khảo sát nghiệp vụ đăng ký lịch tư vấn, xác định các tác nhân và yêu cầu chức năng. Xây dựng mô hình ca sử dụng, mô hình dữ liệu, sơ đồ tương tác và bản mẫu giao diện; đối chiếu thiết kế với yêu cầu nghiệp vụ.",
    "features": [
      "khảo sát quy trình tư vấn",
      "xác định tác nhân hệ thống",
      "đặc tả yêu cầu phần mềm",
      "sơ đồ ca sử dụng",
      "mô hình lớp phân tích",
      "sơ đồ trình tự đặt lịch",
      "thiết kế mô hình dữ liệu",
      "bản mẫu giao diện đăng ký",
      "ma trận truy vết yêu cầu",
      "báo cáo đánh giá thiết kế"
    ],
    "syllabusUrl": "",
    "secondary": false
  }
]);
  const dateAt = (start, days) => {
    const date = new Date(`${start}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  samples.forEach(({ createdOnly, ...sample }, index) => {
    const graduation = sample.id.startsWith('ISEDATN');
    const supervised = !createdOnly;
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

(() => {
  const catalog = window.UITLecturerCatalog;
  catalog.records = catalog.records.filter(record => record.topicType !== 'master' && record.type !== 'Luận văn thạc sĩ');
  const ids = new Set(catalog.records.map(record => record.id));
  for (const key of ['created', 'supervised']) catalog[key] = catalog[key].filter(id => ids.has(id));
  catalog.pending = catalog.pending.filter(record => record.topicType !== 'luan-van-thac-si' && record.topicTypeLabel !== 'Luận văn thạc sĩ');
  catalog.records.forEach(record => { record.courseLabel = catalog.subjectLabel(record); });
})();

(() => {
  const catalog = window.UITLecturerCatalog;
  for (const id of ['ISEDATN-001', 'ISEDATN-002', 'ISEDATN-003']) {
    if (!catalog.created.includes(id)) catalog.created.push(id);
  }
})();

(() => {
  const catalog = window.UITLecturerCatalog;
  const deliverables = {
    IE101: { technology: 'Sơ đồ hạ tầng, công cụ mô phỏng mạng và bảng dự toán', outcomes: ['Hồ sơ khảo sát và sơ đồ kiến trúc hạ tầng cho tổ chức giả định.', 'Bảng so sánh thiết bị, chi phí và phương án triển khai.', 'Kế hoạch vận hành, sao lưu, phục hồi và báo cáo đánh giá.'] },
    IE103: { technology: 'SQL, dữ liệu CSV/JSON và mô hình tài liệu', outcomes: ['Mô hình quản lý thông tin và từ điển dữ liệu.', 'Quy trình chuẩn hóa, chuyển đổi và tra cứu trên bộ dữ liệu giả lập.', 'Báo cáo kiểm tra chất lượng dữ liệu và đánh giá mô hình lưu trữ.'] },
    IE105: { technology: 'Máy ảo, phân quyền hệ điều hành và tường lửa trong mạng thực hành cô lập', outcomes: ['Hồ sơ phân loại tài sản và đánh giá rủi ro thông tin.', 'Mô hình thực hành có cấu hình phân quyền hoặc chính sách bảo vệ mạng.', 'Bộ tình huống kiểm tra, nhật ký kết quả và báo cáo khuyến nghị.'] },
  };
  for (const record of catalog.records) {
    if (record.syllabusUrl && deliverables[record.course]) Object.assign(record, deliverables[record.course]);
  }
})();

(() => {
  const catalog = window.UITLecturerCatalog;
  const phases = [
    'Khảo sát bài toán và phạm vi nghiên cứu', 'Tổng hợp tài liệu liên quan',
    'Xác định yêu cầu và tiêu chí đánh giá', 'Chuẩn bị bộ dữ liệu nghiên cứu',
    'Thiết kế phương pháp giải quyết', 'Xây dựng mô hình thử nghiệm',
    'Kiểm tra chất lượng kết quả', 'So sánh và phân tích các phương án',
    'Hoàn thiện báo cáo nghiên cứu', 'Chuẩn bị tài liệu trình bày',
  ];
  const dateAt = (start, days) => {
    const date = new Date(`${start}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  for (const id of catalog.supervised) {
    const record = catalog.records.find(item => item.id === id);
    if (!record) continue;
    const start = record.startsAt || record.supervision?.milestones?.[0] || '2026-09-07';
    const work = record.supervision ||= {
      group: `Nhóm ${String(catalog.supervised.indexOf(id) + 1).padStart(2, '0')}`,
      milestones: [start, dateAt(start, 42), dateAt(start, 90)],
      tasks: { notStarted: [], inProgress: [], completed: [] },
      deliverables: [],
      criteria: ['Nội dung bám sát mục tiêu và phạm vi đề tài.', 'Phương pháp được trình bày rõ và có kết quả đối chiếu.', 'Báo cáo đầy đủ minh chứng và nêu giới hạn nghiên cứu.'],
      comment: 'Cần đối chiếu kết quả với tiêu chí đã đặt ra và trình bày các giới hạn của phương pháp.',
      source: 'illustrative',
    };
    for (const [status, offset] of [['notStarted', 65], ['inProgress', 35], ['completed', 7]]) {
      const tasks = work.tasks[status] ||= [];
      for (let i = tasks.length; i < 10; i++) {
        tasks.push([phases[i], dateAt(start, offset + i * 2)]);
      }
    }
    const groups = [
      { entries: work.deliverables.filter(item => !item.submittedAt), tasks: work.tasks.notStarted, label: 'Kế hoạch thực hiện' },
      { entries: work.deliverables.filter(item => item.submittedAt && !item.feedback), tasks: work.tasks.inProgress, label: 'Báo cáo thực hiện', submitted: true },
      { entries: work.deliverables.filter(item => item.feedback), tasks: work.tasks.completed, label: 'Tài liệu kết quả', submitted: true, reviewed: true },
    ];
    groups.forEach((group, groupIndex) => {
      for (let i = group.entries.length; i < 10; i++) {
        const [task, day] = group.tasks[i % group.tasks.length];
        work.deliverables.push({
          title: `${group.label}: ${task.charAt(0).toLocaleLowerCase('vi') + task.slice(1)}`,
          description: `Trình bày công việc “${task}” trong đề tài “${record.title}”. Nêu phương pháp, minh chứng và kết quả đối chiếu với mục tiêu nghiên cứu.`,
          due: `${day}T23:59`,
          ...(group.submitted ? { file: `${record.code}-bao-cao-${groupIndex}-${i + 1}.pdf`, submittedAt: `${dateAt(day, i % 3 === 0 ? 1 : 0)}T16:00` } : {}),
          ...(group.reviewed ? { feedback: `Đã xem nội dung “${task}”. Bổ sung minh chứng, so sánh kết quả và nêu các hạn chế còn lại.` } : {}),
        });
      }
    });
  }
})();

(() => {
  const catalog = window.UITLecturerCatalog;
  catalog.records.forEach((record, index) => {
    if (record.createdAt || !catalog.created.includes(record.id)) return;
    const year = Number(record.academicYear?.slice(0, 4)) || 2026;
    const semester = String(record.semester || '1');
    const plannedStart = semester === '2' ? `${year + 1}-02-09` : ['3', 'summer'].includes(semester) ? `${year + 1}-06-08` : `${year}-09-07`;
    const date = new Date(`${record.startsAt || record.supervision?.milestones?.[0] || plannedStart}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 21 - index % 10);
    record.createdAt = date.toISOString().slice(0, 10);
    record.createdAtSource = 'illustrative';
  });
})();

(() => {
  const catalog = window.UITLecturerCatalog;
  catalog.records.forEach(record => {
    if (record.supervision) record.supervision.group = catalog.groupLabel(record.supervision.group);
    if (record.group) record.group = catalog.groupLabel(record.group);
  });
})();

(() => {
  const catalog = window.UITLecturerCatalog;
  catalog.records = catalog.records.filter(record => catalog.isAvailableTopic(record));
  const ids = new Set(catalog.records.map(record => record.id));
  for (const kind of ['created', 'supervised']) catalog[kind] = catalog[kind].filter(id => ids.has(id));
  catalog.pending = catalog.pending.filter(record => catalog.isAvailableTopic(record));
})();

(() => {
  const catalog = window.UITLecturerCatalog;
  const guidance = {
    web: {
      file: '[DC] Internet va cong nghe web.pdf', pages: '1–12',
      technology: 'HTML5, CSS3, JavaScript, JSON và công cụ phát triển web',
      objectives: ['Phân tích nhu cầu người dùng và tổ chức nội dung website theo phạm vi đề tài.', 'Xây dựng giao diện HTML/CSS và tương tác JavaScript; xử lý biểu mẫu và dữ liệu JSON.', 'Hoàn thiện website, trình bày cách triển khai và phối hợp báo cáo theo nhóm.'],
      outcomes: ['Website có giao diện và các chức năng trong phạm vi đã xác định.', 'Mã nguồn HTML/CSS/JavaScript, dữ liệu sử dụng và hướng dẫn chạy website.', 'Báo cáo đồ án, bảng phân công công việc và slide thuyết trình.'],
      tasks: ['Khảo sát người dùng và phạm vi website', 'Tổ chức nội dung và cấu trúc điều hướng', 'Thiết kế bố cục các trang chính', 'Xây dựng cấu trúc HTML', 'Định dạng giao diện bằng CSS', 'Điều chỉnh bố cục cho nhiều màn hình', 'Xử lý sự kiện và biểu mẫu JavaScript', 'Tổ chức dữ liệu JSON và tương tác nội dung', 'Chuẩn bị website và hướng dẫn triển khai', 'Hoàn thiện báo cáo và slide thuyết trình'],
      criteria: ['Báo cáo rõ phạm vi, phương pháp xây dựng và phân công công việc.', 'Thuyết trình rõ ràng, giải thích và trả lời được câu hỏi về website.', 'Website đáp ứng chức năng, giao diện và tương tác đã mô tả.'],
    },
    database: {
      file: 'IT004 - Cơ sở dữ liệu (2022-Rubric) - Update 2026.pdf', pages: '1–9',
      technology: 'Microsoft SQL Server, SQL Server Management Studio, ERD và SQL',
      objectives: ['Xác định thực thể, thuộc tính và mối liên kết; xây dựng ERD và chuyển sang mô hình quan hệ.', 'Hiện thực lược đồ, khóa và ràng buộc toàn vẹn; viết truy vấn SQL trên Microsoft SQL Server.', 'Phân tích phụ thuộc hàm, xác định khóa và đánh giá dạng chuẩn của lược đồ.'],
      outcomes: ['ERD, lược đồ quan hệ và tài liệu giải thích các khóa, ràng buộc toàn vẹn.', 'Tệp SQL tạo cơ sở dữ liệu, dữ liệu giả lập và bộ truy vấn có kết quả đối chiếu.', 'Báo cáo phân tích phụ thuộc hàm, dạng chuẩn và đề xuất cải tiến lược đồ.'],
      tasks: ['Khảo sát dữ kiện và quy tắc nghiệp vụ', 'Xác định thực thể và mối liên kết', 'Xây dựng sơ đồ ERD', 'Chuyển ERD sang mô hình quan hệ', 'Xác định khóa chính và khóa ngoại', 'Tạo lược đồ và dữ liệu trên SQL Server', 'Viết truy vấn SQL và đối chiếu đại số quan hệ', 'Phát biểu và hiện thực ràng buộc toàn vẹn', 'Phân tích phụ thuộc hàm và dạng chuẩn', 'Tổng hợp tệp SQL và báo cáo thiết kế'],
      criteria: ['ERD và lược đồ quan hệ phản ánh đúng dữ kiện và các khóa.', 'Truy vấn và ràng buộc toàn vẹn được hiện thực đúng trên SQL Server.', 'Phân tích được phụ thuộc hàm, khóa và dạng chuẩn; giải thích cải tiến lược đồ.'],
    },
    'phan-tich-thiet-ke-phan-mem': {
      file: 'Buoi1-1-6.pdf', pages: '5–6',
      technology: 'UML, công cụ vẽ sơ đồ và thiết kế bản mẫu giao diện',
      objectives: ['Khảo sát quy trình nghiệp vụ và đặc tả yêu cầu của phần mềm trong phạm vi đề tài.', 'Mô hình hóa yêu cầu và thiết kế phần mềm bằng UML.', 'Hoàn thiện bộ hồ sơ phân tích, thiết kế và thuyết trình kết quả làm việc nhóm.'],
      outcomes: ['Tài liệu khảo sát, mô tả nghiệp vụ và đặc tả yêu cầu phần mềm.', 'Bộ mô hình UML và bản mẫu giao diện thể hiện phương án thiết kế.', 'Báo cáo phân tích, thiết kế phần mềm và slide trình bày đồ án.'],
      tasks: ['Khảo sát quy trình và bên liên quan', 'Xác định phạm vi và tác nhân', 'Đặc tả yêu cầu chức năng', 'Đặc tả yêu cầu phi chức năng', 'Xây dựng mô hình ca sử dụng UML', 'Mô hình hóa luồng hoạt động', 'Thiết kế mô hình lớp', 'Thiết kế tương tác và sơ đồ trình tự', 'Đối chiếu bản mẫu giao diện với yêu cầu', 'Hoàn thiện hồ sơ phân tích và thiết kế'],
      criteria: ['Yêu cầu và phạm vi được mô tả rõ, nhất quán với nghiệp vụ.', 'Mô hình UML và phương án thiết kế thể hiện đúng yêu cầu.', 'Báo cáo và thuyết trình giải thích được các quyết định phân tích, thiết kế.'],
    },
  };
  const dateAt = (start, days) => {
    const date = new Date(`${start}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  catalog.courseGuidance = guidance;
  for (const record of catalog.records) {
    if (record.topicType !== 'course') continue;
    const course = catalog.courseKey(record.course);
    const guide = guidance[course];
    if (!guide) continue;
    record.technology = guide.technology;
    record.objectives = [...guide.objectives];
    record.outcomes = [...guide.outcomes];
    record.requirements = ['Vận dụng kiến thức '+catalog.subjectLabel(record)+' trong phạm vi đề tài.', ...guide.outcomes];
    record.outlineReference = { file: guide.file, pages: guide.pages, kind: course === 'phan-tich-thiet-ke-phan-mem' ? 'course-introduction-slides' : 'course-syllabus' };
    if (course === 'phan-tich-thiet-ke-phan-mem') record.description = 'Khảo sát nghiệp vụ quản lý lịch tư vấn học tập, xác định tác nhân và đặc tả yêu cầu chức năng, phi chức năng. Xây dựng mô hình UML và phương án thiết kế giao diện; đối chiếu sự nhất quán giữa yêu cầu, mô hình và bản mẫu. Sản phẩm chính là bộ hồ sơ phân tích và thiết kế phần mềm.';
    if (!record.supervision) continue;
    const work = record.supervision;
    const start = record.startsAt || work.milestones[0];
    for (const [status, verb, offset] of [['notStarted', 'Lập kế hoạch', 65], ['inProgress', 'Thực hiện', 35], ['completed', 'Hoàn thiện', 7]]) {
      work.tasks[status] = guide.tasks.map((task, index) => [`${verb}: ${task.charAt(0).toLocaleLowerCase('vi')+task.slice(1)}`, dateAt(start, offset+index*2)]);
    }
    work.deliverables = [];
    for (let status = 0; status < 3; status++) guide.tasks.forEach((task, index) => {
      const day = dateAt(start, 14+index*2);
      const title = `${['Đề xuất phương án', 'Báo cáo thực hiện', 'Hồ sơ kết quả'][status]}: ${task.charAt(0).toLocaleLowerCase('vi')+task.slice(1)}`;
      work.deliverables.push({ title, description: `Trình bày nội dung “${task}” cho đề tài “${record.title}”. Kèm mô hình, tài liệu hoặc kết quả phù hợp với công việc và giải thích các quyết định đã thực hiện.`, due: `${status===0?dateAt(start,65+index*2):day}T23:59`, ...(status>0?{file:`${record.code}-${status}-${index+1}.${course==='database'&&index===6?'sql':'pdf'}`,submittedAt:`${dateAt(day,index%3===0?1:0)}T16:00`}:{}), ...(status===2?{feedback:`Đã xem hồ sơ “${task}”. Cần giải thích rõ quyết định và đối chiếu với yêu cầu của đề tài.`}:{}) });
    });
    work.criteria = [...guide.criteria];
    work.comment = 'Nhóm cần làm rõ các quyết định trong hồ sơ và đối chiếu kết quả với phạm vi, mục tiêu đã đặt ra.';
  }
})();
