# Giải thích và tra cứu mã nguồn IE104

## Cách đọc mã theo một thao tác

1. Mở mục danh mục trang ở [Tài liệu chức năng](01-chuc-nang.md). Xem thứ tự script được nạp và tìm `id`, `data-*` hoặc tên nút trong HTML.
2. Trong script trang, tìm `addEventListener`, `querySelector` hoặc hàm khởi tạo. Theo biến đầu vào đến lời gọi dịch vụ.
3. Trong dịch vụ, đọc theo thứ tự lấy bản ghi, kiểm tra quyền/trạng thái, cập nhật và trả kết quả. Kiểm tra mô hình dữ liệu và nơi lưu trước khi đổi tên trường hoặc mã.
4. Quay lại giao diện để xem cách render lại, mở hộp thoại, hiển thị lỗi và phản hồi khi dữ liệu thay đổi ở tab khác.
5. Dùng tên ca kiểm thử trong danh mục mã để xác định hành vi hiện được bảo vệ. Với module chỉ có trong kho, kiểm tra import hoặc script tiêu thụ trước khi kết luận nó đang chạy.

## Đọc các nhóm quan trọng

| Nhóm mã | Cách lần theo |
|---|---|
| Trang sinh viên và giảng viên | `assets/js/pages` là lớp giao diện. Chọn file theo trang, xem phần tìm DOM ở đầu, hàm render ở giữa và đăng ký sự kiện ở cuối. Hai workspace chi tiết phân phối mã đề tài đến các tab nhóm, tiến độ, bài nộp và đánh giá. |
| Dịch vụ | `storage.js` là lớp kiểm tra và lưu bản ghi cục bộ. `registration-service.js`, `proposal-service.js`, `project-team-service.js` và `teaching-service.js` xử lý quy tắc nghiệp vụ. Các dịch vụ tệp quản lý nội dung riêng với metadata. |
| Bài nộp | `submission-upload.js` đọc tệp và gọi `saveUpload`. `student-submissions-service.js` lưu, đọc, phản hồi và kiểm tra xóa yêu cầu. `submission-file-service.js` phục vụ đọc tệp. `pages/lecturer/submissions.js` điều khiển bảng yêu cầu và bài đã nộp. |
| Dữ liệu và lớp dùng chung | `data` giữ seed và danh mục. Các file `uit-*` kết nối dữ liệu tham khảo vào màn hình. `shared` chứa điều hướng, hộp thoại, tab, kiểm tra dữ liệu, thao tác tệp và tiện ích trình bày. |
| Dịch | `i18n/en-*.js` chứa tài nguyên tiếng Anh. `shared/language.js` điều phối lựa chọn ngôn ngữ. Khi thêm nội dung động, kiểm tra cả nơi render và từ điển. |
| Dịch vụ ngoài | `functions/index.cjs` khai báo điểm vào Firebase. `recovery.cjs` xử lý vòng đời yêu cầu khôi phục và `brevo.cjs` xử lý email. Các module Calendar tách chính sách dữ liệu, chuyển tiếp và gọi Google. `calendar-worker` chứa điểm vào Worker, xác thực, lưu trữ và migration. |
| Kiểm thử | `tests` có các ca dùng Node để đọc dữ liệu hoặc mô phỏng tab. Những ca này kiểm tra quy tắc logic, trạng thái và dữ liệu. Thao tác DOM và tải tệp trên trình duyệt cần thử riêng. |

## Giải thích từng bước ở các luồng chính

### Bài nộp mới và phản hồi

1. [submission-upload.js](../../assets/js/pages/student/topic-detail/submission-upload.js) lấy mã đề tài từ `document.body.dataset.projectId`, ghép danh sách tệp đã chọn và gửi ghi chú vào dịch vụ. Hộp thoại chỉ báo thành công sau khi lời gọi lưu trả về.
2. [uploadRequirement và saveUpload](../../assets/js/services/student-submissions-service.js#L124) kiểm tra điều kiện trước khi lưu và kiểm tra lại trong giao dịch. Lần sửa truyền `expectedSavedAt` để nhận ra tệp đã đổi ở tab khác. Khóa IndexedDB gồm `projectId` và `requirementId`, nên hai yêu cầu có tệp cùng tên vẫn tách biệt.
3. [visibleSubmissions](../../assets/js/services/student-submissions-service.js#L111) kết hợp bài đã lưu ở kho hướng dẫn và bài mới từ IndexedDB. Logic tương thích bản cũ nhận diện các bản sao theo định danh và lần nộp để tránh hiện trùng. [Bảng giảng viên](../../assets/js/pages/lecturer/submissions.js#L247) đọc kho với vai trò giảng viên, rồi cập nhật giao diện.
4. Nếu bài có danh sách tệp cục bộ, giao diện dùng nội dung đó. Bài từ bản ghi hướng dẫn đi qua [submission-file-service.js](../../assets/js/services/submission-file-service.js), dịch vụ kiểm tra bản ghi và phiên bản tệp. Hai nguồn được giữ để bài tạo trước khi đổi thiết kế vẫn đọc được khi tệp còn tồn tại.
5. [reviewUpload](../../assets/js/services/student-submissions-service.js#L198) kiểm tra giảng viên, yêu cầu, độ dài phản hồi và thời điểm bài nộp. Nếu bài hoặc phản hồi đã đổi, giao dịch dừng. Nếu cập nhật phản hồi, giá trị trước được đưa vào lịch sử. Kênh thông báo thay đổi yêu cầu các tab đọc lại dữ liệu thay vì sao chép tệp qua thông báo.
6. [deleteUnsubmittedRequirement](../../assets/js/services/student-submissions-service.js#L178) kiểm tra kho mới trong giao dịch dùng cùng kho với thao tác nộp. Nếu có tệp, dừng trước bước xóa. Dịch vụ hướng dẫn kiểm tra thêm bài từ nguồn cũ và phiên bản yêu cầu.

### Đề tài mở đăng ký và phiếu đăng ký

1. [Trình biên tập đề tài](../../assets/js/pages/lecturer/topic-editor.js) đọc biểu mẫu, hiển thị lỗi theo trường rồi gọi [dịch vụ biên tập](../../assets/js/services/lecturer-topic-editor-service.js). Kho đề tài chứa bản ghi có mã và trạng thái. Dịch vụ tệp lưu dữ liệu ảnh/tài liệu theo tham chiếu.
2. [published-topic-service.js](../../assets/js/services/published-topic-service.js) tạo dữ liệu đọc cho sinh viên. `availability` kiểm tra dữ liệu cần thiết, trạng thái, giờ mở và hạn. Trang chi tiết dùng kết quả này để quyết định có cho đăng ký hay hiển thị lý do.
3. [registration-service.js](../../assets/js/services/registration-service.js) đọc lại đề tài ở thời điểm xác nhận và kiểm tra nhóm. Phiếu đăng ký lưu mã nghiệp vụ. [approved-project-service.js](../../assets/js/services/approved-project-service.js) cung cấp dữ liệu đề tài có thể mở từ phiếu đủ điều kiện. Khi đổi danh mục, kiểm tra cả mã trên URL và mã lưu ở các bản ghi.

### Lời mời và đề xuất

- [supervision-compose.js](../../assets/js/supervision-compose.js) gửi lời mời từ trang riêng vào [supervision-store.js](../../assets/js/supervision-store.js). [supervision-inbox.js](../../assets/js/supervision-inbox.js) dựng danh sách, cuộc trao đổi và quyết định cho hai vai trò.
- [project-team-service.js](../../assets/js/services/project-team-service.js#L93) xử lý lời mời gắn với một đề tài cụ thể. Màn hình giảng viên gọi các hàm đọc, lấy chi tiết và phản hồi của dịch vụ nhóm. Điều kiện vai trò và lần cập nhật được kiểm tra trước khi sửa.
- [topic-proposal.js](../../assets/js/pages/student/topic-proposal.js) gom dữ liệu đề xuất và mở xác nhận. [proposal-file-service.js](../../assets/js/services/proposal-file-service.js) hỗ trợ chuẩn bị và đọc tệp theo tham chiếu. Khi truy lỗi tải xuống, kiểm tra cả mã đề xuất, tham chiếu tệp và kết quả đọc thực tế.

### Công bố đánh giá và cập nhật lịch

- [evaluation.js phía giảng viên](../../assets/js/pages/lecturer/evaluation.js#L215) chuẩn bị dữ liệu và tệp trước khi gọi `publish`. [teaching-service.js](../../assets/js/services/teaching-service.js) xác minh điểm và điều kiện công bố. [evaluation-service.js](../../assets/js/services/evaluation-service.js) chuẩn hóa kết quả công bố để phía sinh viên đọc.
- [deadline-service.js](../../assets/js/services/deadline-service.js) tạo danh sách sự kiện theo mã đề tài. Khi truy lỗi ngày hoặc trạng thái, kiểm tra chuyển đổi múi giờ, hạn ở bản ghi nguồn và bộ lọc ở trang. [calendar-client.js](../../assets/js/calendar-client.js) tách việc lấy phiên, gửi yêu cầu và diễn giải lỗi khỏi giao diện.

### Xác thực và dịch giao diện

- [demo-login.js](../../assets/js/demo-login.js), [google-login.js](../../assets/js/google-login.js) và [website-session.js](../../assets/js/website-session.js) lần lượt tham gia xử lý đăng nhập, Google và phiên website. [recovery-otp.js](../../assets/js/recovery-otp.js) điều phối màn khôi phục, gọi dịch vụ bên ngoài ở từng bước và hiển thị lỗi.
- [language.js](../../assets/js/shared/language.js) đọc lựa chọn ngôn ngữ, ánh xạ văn bản và thuộc tính, xử lý các nút DOM thêm sau khi trang đã tải và đồng bộ lựa chọn giữa các tab.

## Danh mục JavaScript và mã dịch vụ

Mỗi mục ghi đường dẫn, các điểm vào và trang nạp trực tiếp khi có. Nhãn “Không thấy script HTML trực tiếp” bao gồm module được import, mã chạy máy chủ, mã kiểm thử và các biến thể chưa được xác nhận đang dùng. Danh mục không chép lại toàn bộ mã từng dòng.

### `assets/js`

#### [about-features.js](../../assets/js/about-features.js)

Nạp từ [gioi-thieu.html](../../pages/chung/gioi-thieu.html).

**Sự kiện** `change`, `click`, `focusin`, `keydown`, `pointermove`, `resize`, `scroll`.

#### [about-tabs.js](../../assets/js/about-tabs.js)

Nạp từ [gioi-thieu.html](../../pages/chung/gioi-thieu.html).

**Sự kiện** `change`, `click`, `focusin`, `hashchange`, `keydown`, `pointerenter`, `pointerleave`, `resize`.

**Hàm** [select](../../assets/js/about-tabs.js#L321), [indexFromHash](../../assets/js/about-tabs.js#L351).

#### [calendar-client.js](../../assets/js/calendar-client.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [calendarMessage](../../assets/js/calendar-client.js#L19), [calendarSession](../../assets/js/calendar-client.js#L23), [calendarRequest](../../assets/js/calendar-client.js#L30), [addCalendarEvents](../../assets/js/calendar-client.js#L47).

#### [contact-form.js](../../assets/js/contact-form.js)

Nạp từ [lien-he.html](../../pages/chung/lien-he.html).

**Sự kiện** `click`, `input`, `submit`.

### `assets/js/data`

#### [lecturer-merge-catalog.js](../../assets/js/data/lecturer-merge-catalog.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [lecturer-real-data.js](../../assets/js/data/lecturer-real-data.js)

Không thấy thẻ script HTML nạp trực tiếp.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [lecturer-source-data.js](../../assets/js/data/lecturer-source-data.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Khai báo** `lecturerSourceCatalog`.

#### [lecturer-topics.js](../../assets/js/data/lecturer-topics.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

**Khai báo** `currentLecturer`, `lecturerTopics`.

#### [mock-data.js](../../assets/js/data/mock-data.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

**Khai báo** `openTopics`, `myTopics`.

#### [notification-details.js](../../assets/js/data/notification-details.js)

Nạp từ [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [proposal-actors.js](../../assets/js/data/proposal-actors.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 16 trang khác.

**Khai báo** `currentStudent`, `currentLecturer`, `proposalDemoReviewerId`, `legacyProposalStudent`, `proposalLecturers`.

#### [student-deadlines.js](../../assets/js/data/student-deadlines.js)

Nạp từ [lich-han-nop.html](../../pages/sinh-vien/lich-han-nop.html).

**Khai báo** `projectMilestones`.

#### [student-evaluations.js](../../assets/js/data/student-evaluations.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) và 2 trang khác.

**Khai báo** `projectEvaluations`.

#### [student-profile.js](../../assets/js/data/student-profile.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html), [ho-so-ca-nhan.html](../../pages/sinh-vien/ho-so-ca-nhan.html), [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html).

**Khai báo** `studentProfile`.

#### [student-progress.js](../../assets/js/data/student-progress.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) và 3 trang khác.

**Khai báo** `projectProgress`.

#### [student-projects.js](../../assets/js/data/student-projects.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html) và 12 trang khác.

**Khai báo** `currentStudent`, `projectLecturers`, `currentLecturer`, `studentProjectOverviews`, `projectTeams`.

#### [student-requests.js](../../assets/js/data/student-requests.js)

Nạp từ [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html), [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html) và 1 trang khác.

**Khai báo** `requestLecturers`, `initialRequests`.

#### [student-uit-catalog.js](../../assets/js/data/student-uit-catalog.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

**Hàm** [submissionReferenceTime](../../assets/js/data/student-uit-catalog.js#L20), [submissionSample](../../assets/js/data/student-uit-catalog.js#L24), [submissionSchedule](../../assets/js/data/student-uit-catalog.js#L104).

#### [student-web-submissions.js](../../assets/js/data/student-web-submissions.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [lich-han-nop.html](../../pages/sinh-vien/lich-han-nop.html).

**Hàm** [merge](../../assets/js/data/student-web-submissions.js#L429), [forProject](../../assets/js/data/student-web-submissions.js#L435), [samplePdf](../../assets/js/data/student-web-submissions.js#L445), [attachment](../../assets/js/data/student-web-submissions.js#L449).

#### [teaching-data.js](../../assets/js/data/teaching-data.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác.

**Khai báo** `lecturerProjects`, `projectTeams`, `projectProgress`, `teachingSeeds`, `teachingCriteria`.

#### [uit-notice-index.js](../../assets/js/data/uit-notice-index.js)

Nạp từ [thong-bao-uit.html](../../pages/chung/thong-bao-uit.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

### `assets/js`

#### [deadline-calendar.js](../../assets/js/deadline-calendar.js)

Nạp từ [lich-han-nop.html](../../pages/sinh-vien/lich-han-nop.html).

**Sự kiện** `cancel`, `change`, `click`, `close`, `focus`, `input`, `keydown`, `pageshow`, `resize`, `scroll`, `storage`, `toggle`.

**Hàm** [indexEvents](../../assets/js/deadline-calendar.js#L66), [formatTime](../../assets/js/deadline-calendar.js#L76), [matchesTopic](../../assets/js/deadline-calendar.js#L82), [linkedPage](../../assets/js/deadline-calendar.js#L86), [requirementPage](../../assets/js/deadline-calendar.js#L92), [closePreview](../../assets/js/deadline-calendar.js#L100), [closeOverflow](../../assets/js/deadline-calendar.js#L109), [anchorVisible](../../assets/js/deadline-calendar.js#L119), [placePopover](../../assets/js/deadline-calendar.js#L127), [placePopovers](../../assets/js/deadline-calendar.js#L160), [schedulePlacement](../../assets/js/deadline-calendar.js#L185), [openPreview](../../assets/js/deadline-calendar.js#L193), [eventNode](../../assets/js/deadline-calendar.js#L246), [chooseAdditionalDeadlines](../../assets/js/deadline-calendar.js#L277), [overflowNode](../../assets/js/deadline-calendar.js#L301), [renderCalendar](../../assets/js/deadline-calendar.js#L349) (dựng lại phần hiển thị), [shiftMonth](../../assets/js/deadline-calendar.js#L384), [refreshActiveDeadlines](../../assets/js/deadline-calendar.js#L397), [setupGoogleCalendarDialog](../../assets/js/deadline-calendar.js#L431) (đặt giá trị hoặc trạng thái), [normalize](../../assets/js/deadline-calendar.js#L457), [createRow](../../assets/js/deadline-calendar.js#L462) (khởi tạo hoặc tạo bản ghi), [updateSelection](../../assets/js/deadline-calendar.js#L477) (cập nhật dữ liệu), [filterRows](../../assets/js/deadline-calendar.js#L489), [showRows](../../assets/js/deadline-calendar.js#L504) (hiển thị trạng thái), [openDialog](../../assets/js/deadline-calendar.js#L514), [selectedIds](../../assets/js/deadline-calendar.js#L522), [feedbackMessage](../../assets/js/deadline-calendar.js#L526), [submit](../../assets/js/deadline-calendar.js#L531), [setBusy](../../assets/js/deadline-calendar.js#L538) (đặt giá trị hoặc trạng thái), [loadSavedCalendar](../../assets/js/deadline-calendar.js#L581), [resumeAuthorization](../../assets/js/deadline-calendar.js#L621).

#### [demo-login.js](../../assets/js/demo-login.js)

Nạp từ [dang-nhap.html](../../pages/chung/dang-nhap.html).

**Sự kiện** `input`, `reset`, `submit`.

**Hàm** [clearError](../../assets/js/demo-login.js#L24), [finishSignIn](../../assets/js/demo-login.js#L32), [signInWebsiteAccount](../../assets/js/demo-login.js#L40).

#### [detail-tabs.js](../../assets/js/detail-tabs.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html), [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html).

**Sự kiện** `click`, `focus`, `focusout`, `hashchange`, `pointerdown`, `pointerenter`, `pointerleave`, `popstate`, `resize`.

#### [dialog-commands.js](../../assets/js/dialog-commands.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [ho-so-ca-nhan-giang-vien.html](../../pages/giang-vien/ho-so-ca-nhan-giang-vien.html) và 8 trang khác.

**Sự kiện** `click`.

#### [firebase-client.js](../../assets/js/firebase-client.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [getFirebaseAuth](../../assets/js/firebase-client.js#L12) (tra cứu dữ liệu hoặc trạng thái).

#### [firebase-config.js](../../assets/js/firebase-config.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Khai báo** `firebaseConfig`.

#### [google-login.js](../../assets/js/google-login.js)

Nạp từ [dang-nhap.html](../../pages/chung/dang-nhap.html).

**Sự kiện** `click`.

#### [huong-nghien-cuu.js](../../assets/js/huong-nghien-cuu.js)

Nạp từ [huong-nghien-cuu.html](../../pages/chung/huong-nghien-cuu.html).

**Sự kiện** `change`, `focusin`, `ie104:languagechange`, `input`.

### `assets/js/i18n`

#### [en-lecturer.js](../../assets/js/i18n/en-lecturer.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 7 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [en-public.js](../../assets/js/i18n/en-public.js)

Nạp từ [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../pages/chung/dang-nhap.html), [gioi-thieu.html](../../pages/chung/gioi-thieu.html) và 10 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [en-shared.js](../../assets/js/i18n/en-shared.js)

Nạp từ [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../pages/chung/dang-nhap.html), [gioi-thieu.html](../../pages/chung/gioi-thieu.html) và 36 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [en-student.js](../../assets/js/i18n/en-student.js)

Nạp từ [chi-tiet-dang-ky-da-luu.html](../../pages/sinh-vien/chi-tiet-dang-ky-da-luu.html), [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 11 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

### `assets/js`

#### [nav-indicator.js](../../assets/js/nav-indicator.js)

Nạp từ [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [gioi-thieu.html](../../pages/chung/gioi-thieu.html), [huong-nghien-cuu.html](../../pages/chung/huong-nghien-cuu.html) và 29 trang khác.

**Sự kiện** `change`, `focusin`, `focusout`, `loadingdone`, `pointerdown`, `pointerenter`, `pointerleave`, `resize`, `scroll`, `toggle`.

#### [notification-detail.js](../../assets/js/notification-detail.js)

Nạp từ [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [notifications-data.js](../../assets/js/notifications-data.js)

Nạp từ [thong-bao-bao-cao-nop-bai.html](../../pages/chung/thong-bao-bao-cao-nop-bai.html), [thong-bao-ke-hoach-hoc-vu.html](../../pages/chung/thong-bao-ke-hoach-hoc-vu.html), [thong-bao-lich-bao-ve.html](../../pages/chung/thong-bao-lich-bao-ve.html), [thong-bao-tong-ket-vinh-danh.html](../../pages/chung/thong-bao-tong-ket-vinh-danh.html) và 2 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [notifications.js](../../assets/js/notifications.js)

Nạp từ [thong-bao-bao-cao-nop-bai.html](../../pages/chung/thong-bao-bao-cao-nop-bai.html), [thong-bao-ke-hoach-hoc-vu.html](../../pages/chung/thong-bao-ke-hoach-hoc-vu.html), [thong-bao-lich-bao-ve.html](../../pages/chung/thong-bao-lich-bao-ve.html), [thong-bao-tong-ket-vinh-danh.html](../../pages/chung/thong-bao-tong-ket-vinh-danh.html) và 2 trang khác.

**Sự kiện** `click`, `popstate`.

**Hàm** [readState](../../assets/js/notifications.js#L45) (đọc dữ liệu), [stateUrl](../../assets/js/notifications.js#L55), [createCard](../../assets/js/notifications.js#L62) (khởi tạo hoặc tạo bản ghi), [addPageControl](../../assets/js/notifications.js#L82), [render](../../assets/js/notifications.js#L105) (dựng lại phần hiển thị), [navigate](../../assets/js/notifications.js#L146).

### `assets/js/pages/common`

#### [password-toggle.js](../../assets/js/pages/common/password-toggle.js)

Nạp từ [ho-so-ca-nhan.html](../../pages/sinh-vien/ho-so-ca-nhan.html).

**Sự kiện** `click`, `pageshow`, `reset`.

**Hàm** [setVisible](../../assets/js/pages/common/password-toggle.js#L7) (đặt giá trị hoặc trạng thái).

### `assets/js/pages/lecturer`

#### [created-topic.js](../../assets/js/pages/lecturer/created-topic.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html).

**Sự kiện** `ie104:lecturer-topic-state-changed`, `ie104:registrations-updated`, `pageshow`, `storage`.

**Hàm** [formatDate](../../assets/js/pages/lecturer/created-topic.js#L17), [render](../../assets/js/pages/lecturer/created-topic.js#L26) (dựng lại phần hiển thị).

#### [evaluation.js](../../assets/js/pages/lecturer/evaluation.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Sự kiện** `change`, `click`, `input`, `submit`.

**Hàm** [labelAction](../../assets/js/pages/lecturer/evaluation.js#L11), [attachmentPicker](../../assets/js/pages/lecturer/evaluation.js#L23), [showSelection](../../assets/js/pages/lecturer/evaluation.js#L33) (hiển thị trạng thái), [render](../../assets/js/pages/lecturer/evaluation.js#L79) (dựng lại phần hiển thị), [updateTotal](../../assets/js/pages/lecturer/evaluation.js#L125) (cập nhật dữ liệu), [input](../../assets/js/pages/lecturer/evaluation.js#L191), [preview](../../assets/js/pages/lecturer/evaluation.js#L200).

#### [invitation-preview.js](../../assets/js/pages/lecturer/invitation-preview.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `click`, `close`.

**Hàm** [node](../../assets/js/pages/lecturer/invitation-preview.js#L39), [button](../../assets/js/pages/lecturer/invitation-preview.js#L45), [close](../../assets/js/pages/lecturer/invitation-preview.js#L51), [decide](../../assets/js/pages/lecturer/invitation-preview.js#L56), [render](../../assets/js/pages/lecturer/invitation-preview.js#L83) (dựng lại phần hiển thị).

#### [invitation-topic.js](../../assets/js/pages/lecturer/invitation-topic.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html).

**Sự kiện** `storage`.

**Hàm** [refresh](../../assets/js/pages/lecturer/invitation-topic.js#L10).

#### [overview.js](../../assets/js/pages/lecturer/overview.js)

Nạp từ [tong-quan-giang-vien.html](../../pages/giang-vien/tong-quan-giang-vien.html).

**Sự kiện** `ie104:lecturer-topics-updated`, `ie104:registrations-updated`, `storage`.

**Hàm** [element](../../assets/js/pages/lecturer/overview.js#L25), [card](../../assets/js/pages/lecturer/overview.js#L32), [progressCard](../../assets/js/pages/lecturer/overview.js#L47), [proposalCard](../../assets/js/pages/lecturer/overview.js#L80), [renderChart](../../assets/js/pages/lecturer/overview.js#L104) (dựng lại phần hiển thị), [render](../../assets/js/pages/lecturer/overview.js#L141) (dựng lại phần hiển thị).

#### [profile-fields.js](../../assets/js/pages/lecturer/profile-fields.js)

Không thấy thẻ script HTML nạp trực tiếp.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [profile.js](../../assets/js/pages/lecturer/profile.js)

Nạp từ [ho-so-ca-nhan-giang-vien.html](../../pages/giang-vien/ho-so-ca-nhan-giang-vien.html).

**Sự kiện** `cancel`, `change`, `click`, `close`, `pageshow`, `storage`, `submit`.

**Hàm** [refresh](../../assets/js/pages/lecturer/profile.js#L17).

#### [progress.js](../../assets/js/pages/lecturer/progress.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Sự kiện** `click`, `close`.

**Hàm** [taskCard](../../assets/js/pages/lecturer/progress.js#L20), [renderCatalogCards](../../assets/js/pages/lecturer/progress.js#L43) (dựng lại phần hiển thị).

#### [project-invitations.js](../../assets/js/pages/lecturer/project-invitations.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `click`, `ie104:project-team-updated`, `pageshow`, `storage`, `visibilitychange`.

**Hàm** [refresh](../../assets/js/pages/lecturer/project-invitations.js#L14).

#### [source-metadata.js](../../assets/js/pages/lecturer/source-metadata.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `ie104:lecturer-topic-rendered`, `ie104:lecturer-topics-rendered`, `pageshow`.

**Hàm** [defaultImages](../../assets/js/pages/lecturer/source-metadata.js#L14), [render](../../assets/js/pages/lecturer/source-metadata.js#L20) (dựng lại phần hiển thị).

#### [submissions.js](../../assets/js/pages/lecturer/submissions.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Sự kiện** `click`, `close`, `focus`, `input`, `visibilitychange`.

**Hàm** [createSymbolIcon](../../assets/js/pages/lecturer/submissions.js#L24) (khởi tạo hoặc tạo bản ghi), [feedbackEditor](../../assets/js/pages/lecturer/submissions.js#L36), [editRequirement](../../assets/js/pages/lecturer/submissions.js#L44), [confirmDeleteRequirement](../../assets/js/pages/lecturer/submissions.js#L68), [reopenSubmissions](../../assets/js/pages/lecturer/submissions.js#L84), [submissionTime](../../assets/js/pages/lecturer/submissions.js#L89), [readSampleFile](../../assets/js/pages/lecturer/submissions.js#L95) (đọc dữ liệu), [requirementAttachments](../../assets/js/pages/lecturer/submissions.js#L101), [download](../../assets/js/pages/lecturer/submissions.js#L113), [viewRequirement](../../assets/js/pages/lecturer/submissions.js#L158), [board](../../assets/js/pages/lecturer/submissions.js#L205), [renderWithUploads](../../assets/js/pages/lecturer/submissions.js#L241) (dựng lại phần hiển thị), [readUploadFile](../../assets/js/pages/lecturer/submissions.js#L261) (đọc dữ liệu), [render](../../assets/js/pages/lecturer/submissions.js#L275) (dựng lại phần hiển thị), [checkFile](../../assets/js/pages/lecturer/submissions.js#L430).

#### [topic-editor.js](../../assets/js/pages/lecturer/topic-editor.js)

Nạp từ [chinh-sua-de-tai-giang-vien.html](../../pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html).

**Sự kiện** `beforeunload`, `change`, `click`, `close`, `input`, `pageshow`, `storage`, `submit`.

**Hàm** [select](../../assets/js/pages/lecturer/topic-editor.js#L46), [read](../../assets/js/pages/lecturer/topic-editor.js#L52) (đọc dữ liệu), [refreshCode](../../assets/js/pages/lecturer/topic-editor.js#L59), [showErrors](../../assets/js/pages/lecturer/topic-editor.js#L64) (hiển thị trạng thái), [errorField](../../assets/js/pages/lecturer/topic-editor.js#L89), [clearFieldError](../../assets/js/pages/lecturer/topic-editor.js#L93), [displayName](../../assets/js/pages/lecturer/topic-editor.js#L156), [reportFileError](../../assets/js/pages/lecturer/topic-editor.js#L163).

#### [topic-list.js](../../assets/js/pages/lecturer/topic-list.js)

Nạp từ [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Sự kiện** `DOMContentLoaded`, `click`, `ie104:lecturer-topics-updated`, `ie104:project-team-updated`, `ie104:registrations-updated`, `ie104:topics-updated`, `pageshow`, `pointerdown`, `storage`, `visibilitychange`.

**Hàm** [render](../../assets/js/pages/lecturer/topic-list.js#L15) (dựng lại phần hiển thị), [refreshReturn](../../assets/js/pages/lecturer/topic-list.js#L101).

#### [topic-media.js](../../assets/js/pages/lecturer/topic-media.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html).

**Sự kiện** `ie104:lecturer-topic-rendered`, `ie104:lecturer-topics-rendered`, `pagehide`, `pageshow`.

**Hàm** [render](../../assets/js/pages/lecturer/topic-media.js#L8) (dựng lại phần hiển thị).

#### [topic-registration-state.js](../../assets/js/pages/lecturer/topic-registration-state.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html).

**Sự kiện** `cancel`, `click`, `close`, `input`, `keydown`, `submit`.

#### [topic-sort.js](../../assets/js/pages/lecturer/topic-sort.js)

Nạp từ [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Sự kiện** `change`, `click`, `focusout`, `keydown`, `pageshow`, `pointerdown`, `reset`, `resize`, `scroll`.

**Hàm** [syncSelection](../../assets/js/pages/lecturer/topic-sort.js#L27) (đồng bộ trạng thái), [positionMenu](../../assets/js/pages/lecturer/topic-sort.js#L34), [openMenu](../../assets/js/pages/lecturer/topic-sort.js#L46), [closeMenu](../../assets/js/pages/lecturer/topic-sort.js#L54).

#### [workspace.js](../../assets/js/pages/lecturer/workspace.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Giao diện được công bố** `lecturerWorkspace`.

**Sự kiện** `DOMContentLoaded`, `beforeunload`, `click`, `close`, `keydown`, `pageshow`, `storage`, `submit`.

**Hàm** [overviewView](../../assets/js/pages/lecturer/workspace.js#L47), [notify](../../assets/js/pages/lecturer/workspace.js#L50), [refresh](../../assets/js/pages/lecturer/workspace.js#L54), [commit](../../assets/js/pages/lecturer/workspace.js#L75), [modal](../../assets/js/pages/lecturer/workspace.js#L92), [field](../../assets/js/pages/lecturer/workspace.js#L146).

### `assets/js/pages/student`

#### [deadline-calendar.js](../../assets/js/pages/student/deadline-calendar.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `click`, `close`, `pageshow`, `storage`.

**Hàm** [utcDate](../../assets/js/pages/student/deadline-calendar.js#L11), [eventButton](../../assets/js/pages/student/deadline-calendar.js#L17), [render](../../assets/js/pages/student/deadline-calendar.js#L57) (dựng lại phần hiển thị), [shiftMonth](../../assets/js/pages/student/deadline-calendar.js#L90).

#### [google-calendar-export.js](../../assets/js/pages/student/google-calendar-export.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `click`, `close`, `input`.

**Hàm** [normalize](../../assets/js/pages/student/google-calendar-export.js#L34), [isUitStudent](../../assets/js/pages/student/google-calendar-export.js#L38), [selectedIds](../../assets/js/pages/student/google-calendar-export.js#L42), [updateControls](../../assets/js/pages/student/google-calendar-export.js#L46) (cập nhật dữ liệu), [filterRows](../../assets/js/pages/student/google-calendar-export.js#L59), [createRow](../../assets/js/pages/student/google-calendar-export.js#L71) (khởi tạo hoặc tạo bản ghi), [setBusy](../../assets/js/pages/student/google-calendar-export.js#L87) (đặt giá trị hoặc trạng thái), [loadEvents](../../assets/js/pages/student/google-calendar-export.js#L92), [loadPicker](../../assets/js/pages/student/google-calendar-export.js#L104), [signIn](../../assets/js/pages/student/google-calendar-export.js#L125), [openPicker](../../assets/js/pages/student/google-calendar-export.js#L146), [submit](../../assets/js/pages/student/google-calendar-export.js#L161), [resumeConnection](../../assets/js/pages/student/google-calendar-export.js#L189).

#### [my-topics.js](../../assets/js/pages/student/my-topics.js)

Nạp từ [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html).

**Hàm** [participantsFor](../../assets/js/pages/student/my-topics.js#L13), [createCard](../../assets/js/pages/student/my-topics.js#L30) (khởi tạo hoặc tạo bản ghi).

#### [open-topic.js](../../assets/js/pages/student/open-topic.js)

Nạp từ [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html).

**Hàm** [toLines](../../assets/js/pages/student/open-topic.js#L53), [renderValue](../../assets/js/pages/student/open-topic.js#L58) (dựng lại phần hiển thị).

#### [overview.js](../../assets/js/pages/student/overview.js)

Nạp từ [tong-quan-sinh-vien.html](../../pages/sinh-vien/tong-quan-sinh-vien.html).

**Sự kiện** `pageshow`, `storage`.

**Hàm** [listUrl](../../assets/js/pages/student/overview.js#L28) (trả danh sách), [drawChart](../../assets/js/pages/student/overview.js#L34), [empty](../../assets/js/pages/student/overview.js#L79), [render](../../assets/js/pages/student/overview.js#L81) (dựng lại phần hiển thị).

#### [pending-request.js](../../assets/js/pages/student/pending-request.js)

Nạp từ [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html).

**Sự kiện** `cancel`, `click`, `close`, `ie104:proposals-updated`, `pageshow`, `storage`.

**Hàm** [findProposal](../../assets/js/pages/student/pending-request.js#L39) (tìm bản ghi), [statusMessage](../../assets/js/pages/student/pending-request.js#L69), [renderHistory](../../assets/js/pages/student/pending-request.js#L81) (dựng lại phần hiển thị), [renderRecipient](../../assets/js/pages/student/pending-request.js#L92) (dựng lại phần hiển thị), [render](../../assets/js/pages/student/pending-request.js#L125) (dựng lại phần hiển thị).

#### [profile-avatar.js](../../assets/js/pages/student/profile-avatar.js)

Nạp từ [ho-so-ca-nhan.html](../../pages/sinh-vien/ho-so-ca-nhan.html).

**Sự kiện** `cancel`, `change`, `click`, `close`, `pageshow`.

**Hàm** [clearPreview](../../assets/js/pages/student/profile-avatar.js#L20), [load](../../assets/js/pages/student/profile-avatar.js#L29).

#### [profile.js](../../assets/js/pages/student/profile.js)

Nạp từ [ho-so-ca-nhan.html](../../pages/sinh-vien/ho-so-ca-nhan.html).

**Sự kiện** `click`, `close`, `pagehide`, `pageshow`, `reset`, `storage`, `submit`.

**Hàm** [refresh](../../assets/js/pages/student/profile.js#L14), [clearEditErrors](../../assets/js/pages/student/profile.js#L40).

#### [proposal-date-picker.js](../../assets/js/pages/student/proposal-date-picker.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác.

**Giao diện được công bố** `proposalDatePicker`.

**Sự kiện** `blur`, `change`, `click`, `focusout`, `keydown`, `paste`, `reset`.

**Hàm** [parseDate](../../assets/js/pages/student/proposal-date-picker.js#L24), [parseTime](../../assets/js/pages/student/proposal-date-picker.js#L33), [parseDateTime](../../assets/js/pages/student/proposal-date-picker.js#L38), [fillEnhancedDate](../../assets/js/pages/student/proposal-date-picker.js#L49), [createTimeColumn](../../assets/js/pages/student/proposal-date-picker.js#L56) (khởi tạo hoặc tạo bản ghi), [activate](../../assets/js/pages/student/proposal-date-picker.js#L69), [select](../../assets/js/pages/student/proposal-date-picker.js#L81), [enhanceDate](../../assets/js/pages/student/proposal-date-picker.js#L113), [render](../../assets/js/pages/student/proposal-date-picker.js#L226) (dựng lại phần hiển thị), [focusDay](../../assets/js/pages/student/proposal-date-picker.js#L266), [showMonths](../../assets/js/pages/student/proposal-date-picker.js#L277) (hiển thị trạng thái), [setYear](../../assets/js/pages/student/proposal-date-picker.js#L287) (đặt giá trị hoặc trạng thái), [close](../../assets/js/pages/student/proposal-date-picker.js#L295), [open](../../assets/js/pages/student/proposal-date-picker.js#L300), [commit](../../assets/js/pages/student/proposal-date-picker.js#L323), [updateActions](../../assets/js/pages/student/proposal-date-picker.js#L329) (cập nhật dữ liệu), [updateDateTime](../../assets/js/pages/student/proposal-date-picker.js#L333) (cập nhật dữ liệu), [choose](../../assets/js/pages/student/proposal-date-picker.js#L344), [openFromKeyboard](../../assets/js/pages/student/proposal-date-picker.js#L361).

#### [proposal-outline.js](../../assets/js/pages/student/proposal-outline.js)

Nạp từ [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html).

**Giao diện được công bố** `proposalOutline`.

**Sự kiện** `click`.

**Hàm** [addMember](../../assets/js/pages/student/proposal-outline.js#L14), [mountMembers](../../assets/js/pages/student/proposal-outline.js#L51), [fill](../../assets/js/pages/student/proposal-outline.js#L60), [read](../../assets/js/pages/student/proposal-outline.js#L78) (đọc dữ liệu), [getField](../../assets/js/pages/student/proposal-outline.js#L96) (tra cứu dữ liệu hoặc trạng thái), [setType](../../assets/js/pages/student/proposal-outline.js#L103) (đặt giá trị hoặc trạng thái).

#### [proposal-pickers.js](../../assets/js/pages/student/proposal-pickers.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác.

**Giao diện được công bố** `proposalPickers`.

**Sự kiện** `beforetoggle`, `change`, `click`, `keydown`, `pointermove`, `resize`, `scroll`.

**Hàm** [setupPopup](../../assets/js/pages/student/proposal-pickers.js#L10) (đặt giá trị hoặc trạng thái), [place](../../assets/js/pages/student/proposal-pickers.js#L16), [enhanceSelect](../../assets/js/pages/student/proposal-pickers.js#L60), [sync](../../assets/js/pages/student/proposal-pickers.js#L97) (đồng bộ trạng thái), [activate](../../assets/js/pages/student/proposal-pickers.js#L105), [choose](../../assets/js/pages/student/proposal-pickers.js#L119), [open](../../assets/js/pages/student/proposal-pickers.js#L128).

#### [proposal-receipt.js](../../assets/js/pages/student/proposal-receipt.js)

Nạp từ [chi-tiet-de-xuat-da-luu.html](../../pages/sinh-vien/chi-tiet-de-xuat-da-luu.html), [chi-tiet-de-xuat-nhom.html](../../pages/sinh-vien/chi-tiet-de-xuat-nhom.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [published-topic-media.js](../../assets/js/pages/student/published-topic-media.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [dang-ky-de-tai.html](../../pages/sinh-vien/dang-ky-de-tai.html).

**Sự kiện** `ie104:published-topic-rendered`, `ie104:student-topics-rendered`, `pagehide`, `pageshow`.

**Hàm** [render](../../assets/js/pages/student/published-topic-media.js#L8) (dựng lại phần hiển thị).

#### [published-topic.js](../../assets/js/pages/student/published-topic.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html).

**Sự kiện** `DOMContentLoaded`, `ie104:published-topics-updated`, `keydown`, `pageshow`, `storage`.

**Hàm** [formatDate](../../assets/js/pages/student/published-topic.js#L17), [refresh](../../assets/js/pages/student/published-topic.js#L26).

#### [registration-receipt.js](../../assets/js/pages/student/registration-receipt.js)

Nạp từ [chi-tiet-dang-ky-da-luu.html](../../pages/sinh-vien/chi-tiet-dang-ky-da-luu.html).

**Sự kiện** `ie104:registrations-updated`, `pageshow`, `storage`.

**Hàm** [render](../../assets/js/pages/student/registration-receipt.js#L6) (dựng lại phần hiển thị).

#### [requests.js](../../assets/js/pages/student/requests.js)

Nạp từ [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html).

**Sự kiện** `change`, `click`, `close`, `hashchange`, `pageshow`, `popstate`, `storage`, `submit`.

**Hàm** [node](../../assets/js/pages/student/requests.js#L20), [row](../../assets/js/pages/student/requests.js#L27), [navigate](../../assets/js/pages/student/requests.js#L33), [review](../../assets/js/pages/student/requests.js#L40), [buildEditor](../../assets/js/pages/student/requests.js#L60) (dựng cấu trúc đầu ra), [field](../../assets/js/pages/student/requests.js#L73), [readMembers](../../assets/js/pages/student/requests.js#L103) (đọc dữ liệu), [drawMembers](../../assets/js/pages/student/requests.js#L106), [render](../../assets/js/pages/student/requests.js#L183) (dựng lại phần hiển thị).

### `assets/js/pages/student/topic-detail`

#### [evaluation.js](../../assets/js/pages/student/topic-detail/evaluation.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `click`, `pageshow`, `storage`.

**Hàm** [renderUnpublished](../../assets/js/pages/student/topic-detail/evaluation.js#L18) (dựng lại phần hiển thị), [renderAttachment](../../assets/js/pages/student/topic-detail/evaluation.js#L29) (dựng lại phần hiển thị), [renderPublished](../../assets/js/pages/student/topic-detail/evaluation.js#L42) (dựng lại phần hiển thị), [render](../../assets/js/pages/student/topic-detail/evaluation.js#L71) (dựng lại phần hiển thị).

#### [lecturer-reviews.js](../../assets/js/pages/student/topic-detail/lecturer-reviews.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `pageshow`, `storage`.

**Hàm** [render](../../assets/js/pages/student/topic-detail/lecturer-reviews.js#L13) (dựng lại phần hiển thị).

#### [progress.js](../../assets/js/pages/student/topic-detail/progress.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `change`, `click`, `close`, `input`, `keydown`, `pageshow`, `storage`, `submit`.

**Hàm** [syncSelection](../../assets/js/pages/student/topic-detail/progress.js#L51) (đồng bộ trạng thái), [renderDetail](../../assets/js/pages/student/topic-detail/progress.js#L58) (dựng lại phần hiển thị), [showDetail](../../assets/js/pages/student/topic-detail/progress.js#L69) (hiển thị trạng thái), [focusTask](../../assets/js/pages/student/topic-detail/progress.js#L86), [updateAssigneeCount](../../assets/js/pages/student/topic-detail/progress.js#L143) (cập nhật dữ liệu), [resetAssignees](../../assets/js/pages/student/topic-detail/progress.js#L148), [element](../../assets/js/pages/student/topic-detail/progress.js#L169), [icon](../../assets/js/pages/student/topic-detail/progress.js#L176), [renderTask](../../assets/js/pages/student/topic-detail/progress.js#L198) (dựng lại phần hiển thị), [refresh](../../assets/js/pages/student/topic-detail/progress.js#L211), [validateTaskForm](../../assets/js/pages/student/topic-detail/progress.js#L273) (kiểm tra dữ liệu), [showError](../../assets/js/pages/student/topic-detail/progress.js#L296) (hiển thị trạng thái), [open](../../assets/js/pages/student/topic-detail/progress.js#L302).

#### [submission-upload.js](../../assets/js/pages/student/topic-detail/submission-upload.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `studentUpload`.

**Sự kiện** `cancel`, `change`, `click`, `close`, `submit`.

**Hàm** [mount](../../assets/js/pages/student/topic-detail/submission-upload.js#L9), [showError](../../assets/js/pages/student/topic-detail/submission-upload.js#L37) (hiển thị trạng thái), [updateControls](../../assets/js/pages/student/topic-detail/submission-upload.js#L42) (cập nhật dữ liệu), [renderFiles](../../assets/js/pages/student/topic-detail/submission-upload.js#L51) (dựng lại phần hiển thị), [open](../../assets/js/pages/student/topic-detail/submission-upload.js#L117).

#### [submission-zip.js](../../assets/js/pages/student/topic-detail/submission-zip.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Hàm** [crc32](../../assets/js/pages/student/topic-detail/submission-zip.js#L11), [uniqueName](../../assets/js/pages/student/topic-detail/submission-zip.js#L26), [submissionZipNames](../../assets/js/pages/student/topic-detail/submission-zip.js#L39), [createSubmissionZip](../../assets/js/pages/student/topic-detail/submission-zip.js#L44) (khởi tạo hoặc tạo bản ghi).

#### [submissions.js](../../assets/js/pages/student/topic-detail/submissions.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `click`, `close`, `focus`, `pageshow`, `storage`.

**Hàm** [element](../../assets/js/pages/student/topic-detail/submissions.js#L29), [time](../../assets/js/pages/student/topic-detail/submissions.js#L36), [deadlineBadge](../../assets/js/pages/student/topic-detail/submissions.js#L45), [boardIcon](../../assets/js/pages/student/topic-detail/submissions.js#L49), [demoBundle](../../assets/js/pages/student/topic-detail/submissions.js#L55), [sampleBundle](../../assets/js/pages/student/topic-detail/submissions.js#L63), [downloadRow](../../assets/js/pages/student/topic-detail/submissions.js#L73), [downloadButton](../../assets/js/pages/student/topic-detail/submissions.js#L81), [archiveName](../../assets/js/pages/student/topic-detail/submissions.js#L89), [bindUploadDownload](../../assets/js/pages/student/topic-detail/submissions.js#L93), [renderAttachments](../../assets/js/pages/student/topic-detail/submissions.js#L109) (dựng lại phần hiển thị), [appendSubmittedDetails](../../assets/js/pages/student/topic-detail/submissions.js#L168), [uploadButton](../../assets/js/pages/student/topic-detail/submissions.js#L182), [requirementCard](../../assets/js/pages/student/topic-detail/submissions.js#L202), [prepareSampleRequirements](../../assets/js/pages/student/topic-detail/submissions.js#L242), [submissionFileCard](../../assets/js/pages/student/topic-detail/submissions.js#L294), [viewFeedbackTrigger](../../assets/js/pages/student/topic-detail/submissions.js#L350), [openFeedback](../../assets/js/pages/student/topic-detail/submissions.js#L370), [sampleCardDeadline](../../assets/js/pages/student/topic-detail/submissions.js#L405), [renderSampleUploads](../../assets/js/pages/student/topic-detail/submissions.js#L409) (dựng lại phần hiển thị), [uploadSaved](../../assets/js/pages/student/topic-detail/submissions.js#L450), [board](../../assets/js/pages/student/topic-detail/submissions.js#L465), [sampleRows](../../assets/js/pages/student/topic-detail/submissions.js#L498), [updateSampleColumn](../../assets/js/pages/student/topic-detail/submissions.js#L505) (cập nhật dữ liệu), [newRow](../../assets/js/pages/student/topic-detail/submissions.js#L520), [sharedRequirementRow](../../assets/js/pages/student/topic-detail/submissions.js#L526), [renderSharedSample](../../assets/js/pages/student/topic-detail/submissions.js#L555) (dựng lại phần hiển thị), [render](../../assets/js/pages/student/topic-detail/submissions.js#L584) (dựng lại phần hiển thị), [renderLiveBoards](../../assets/js/pages/student/topic-detail/submissions.js#L625) (dựng lại phần hiển thị), [refreshUploads](../../assets/js/pages/student/topic-detail/submissions.js#L662), [openCalendarRequirement](../../assets/js/pages/student/topic-detail/submissions.js#L680).

#### [team.js](../../assets/js/pages/student/topic-detail/team.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `change`, `click`, `close`, `ie104:project-team-updated`, `input`, `keydown`, `pageshow`, `storage`, `submit`.

**Hàm** [showError](../../assets/js/pages/student/topic-detail/team.js#L51) (hiển thị trạng thái), [setResult](../../assets/js/pages/student/topic-detail/team.js#L57) (đặt giá trị hoặc trạng thái), [refresh](../../assets/js/pages/student/topic-detail/team.js#L63), [renderInvitations](../../assets/js/pages/student/topic-detail/team.js#L107) (dựng lại phần hiển thị), [updateResults](../../assets/js/pages/student/topic-detail/team.js#L201) (cập nhật dữ liệu), [renderInviteOptions](../../assets/js/pages/student/topic-detail/team.js#L221) (dựng lại phần hiển thị).

#### [workspace.js](../../assets/js/pages/student/topic-detail/workspace.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `DOMContentLoaded`, `ie104:project-team-updated`, `keydown`, `pageshow`, `storage`.

**Hàm** [refresh](../../assets/js/pages/student/topic-detail/workspace.js#L17), [initializeSubmissions](../../assets/js/pages/student/topic-detail/workspace.js#L75).

### `assets/js/pages/student`

#### [topic-enrollment.js](../../assets/js/pages/student/topic-enrollment.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html).

**Sự kiện** `click`, `close`, `ie104:published-topics-updated`, `pageshow`, `storage`, `submit`.

**Hàm** [cards](../../assets/js/pages/student/topic-enrollment.js#L51), [controls](../../assets/js/pages/student/topic-enrollment.js#L55), [readValue](../../assets/js/pages/student/topic-enrollment.js#L59) (đọc dữ liệu), [clearErrors](../../assets/js/pages/student/topic-enrollment.js#L67), [showErrors](../../assets/js/pages/student/topic-enrollment.js#L78) (hiển thị trạng thái), [refreshMembers](../../assets/js/pages/student/topic-enrollment.js#L106), [showSaved](../../assets/js/pages/student/topic-enrollment.js#L138) (hiển thị trạng thái), [checkExisting](../../assets/js/pages/student/topic-enrollment.js#L164), [showReview](../../assets/js/pages/student/topic-enrollment.js#L189) (hiển thị trạng thái), [renderMember](../../assets/js/pages/student/topic-enrollment.js#L221) (dựng lại phần hiển thị), [openMember](../../assets/js/pages/student/topic-enrollment.js#L270).

#### [topic-proposal.js](../../assets/js/pages/student/topic-proposal.js)

Nạp từ [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html).

**Sự kiện** `cancel`, `change`, `click`, `close`, `pageshow`, `reset`, `storage`, `submit`.

**Hàm** [showCover](../../assets/js/pages/student/topic-proposal.js#L61) (hiển thị trạng thái), [showAttachment](../../assets/js/pages/student/topic-proposal.js#L68) (hiển thị trạng thái), [fillOriginal](../../assets/js/pages/student/topic-proposal.js#L76), [showLegacyValues](../../assets/js/pages/student/topic-proposal.js#L94) (hiển thị trạng thái), [updateCourse](../../assets/js/pages/student/topic-proposal.js#L105) (cập nhật dữ liệu), [updateTopicCode](../../assets/js/pages/student/topic-proposal.js#L129) (cập nhật dữ liệu), [clearFieldError](../../assets/js/pages/student/topic-proposal.js#L145), [clearErrors](../../assets/js/pages/student/topic-proposal.js#L152), [readInput](../../assets/js/pages/student/topic-proposal.js#L158) (đọc dữ liệu), [showErrors](../../assets/js/pages/student/topic-proposal.js#L162) (hiển thị trạng thái), [review](../../assets/js/pages/student/topic-proposal.js#L185), [showSavedResult](../../assets/js/pages/student/topic-proposal.js#L339) (hiển thị trạng thái), [saveProposal](../../assets/js/pages/student/topic-proposal.js#L349) (lưu dữ liệu).

#### [topic-registration.js](../../assets/js/pages/student/topic-registration.js)

Nạp từ [dang-ky-de-tai.html](../../pages/sinh-vien/dang-ky-de-tai.html).

**Sự kiện** `ie104:published-topics-updated`, `storage`.

**Hàm** [createCard](../../assets/js/pages/student/topic-registration.js#L5) (khởi tạo hoặc tạo bản ghi), [refreshLecturers](../../assets/js/pages/student/topic-registration.js#L26).

### `assets/js`

#### [password-toggle.js](../../assets/js/password-toggle.js)

Nạp từ [dang-nhap.html](../../pages/chung/dang-nhap.html), [quen-mat-khau.html](../../pages/chung/quen-mat-khau.html).

**Sự kiện** `click`, `pageshow`, `reset`.

**Hàm** [setVisible](../../assets/js/password-toggle.js#L7) (đặt giá trị hoặc trạng thái).

#### [pending-proposals.js](../../assets/js/pending-proposals.js)

Nạp từ [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html).

**Sự kiện** `change`, `click`, `input`, `pageshow`, `popstate`, `reset`, `submit`.

**Hàm** [courseKey](../../assets/js/pending-proposals.js#L34), [readUrl](../../assets/js/pending-proposals.js#L39) (đọc dữ liệu), [pageUrl](../../assets/js/pending-proposals.js#L58), [writeUrl](../../assets/js/pending-proposals.js#L71) (ghi dữ liệu), [makeCard](../../assets/js/pending-proposals.js#L82), [renderPagination](../../assets/js/pending-proposals.js#L128) (dựng lại phần hiển thị), [addPage](../../assets/js/pending-proposals.js#L131), [render](../../assets/js/pending-proposals.js#L159) (dựng lại phần hiển thị).

#### [proposal-detail.js](../../assets/js/proposal-detail.js)

Nạp từ [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html).

**Sự kiện** `beforetoggle`, `input`, `submit`.

**Hàm** [text](../../assets/js/proposal-detail.js#L53), [render](../../assets/js/proposal-detail.js#L58) (dựng lại phần hiển thị), [validateReason](../../assets/js/proposal-detail.js#L159) (kiểm tra dữ liệu).

#### [proposal-store.js](../../assets/js/proposal-store.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 11 trang khác.

**Sự kiện** `ie104:proposals-updated`, `ie104:registrations-updated`, `pageshow`, `storage`.

**Hàm** [readDecision](../../assets/js/proposal-store.js#L60) (đọc dữ liệu), [seedRecord](../../assets/js/proposal-store.js#L73), [getApprovedSeed](../../assets/js/proposal-store.js#L82) (tra cứu dữ liệu hoặc trạng thái), [getAll](../../assets/js/proposal-store.js#L90) (tra cứu dữ liệu hoặc trạng thái), [get](../../assets/js/proposal-store.js#L107) (tra cứu dữ liệu hoặc trạng thái), [notify](../../assets/js/proposal-store.js#L124), [decide](../../assets/js/proposal-store.js#L128).

#### [recovery-otp.js](../../assets/js/recovery-otp.js)

Nạp từ [quen-mat-khau.html](../../pages/chung/quen-mat-khau.html).

**Sự kiện** `change`, `click`, `focus`, `input`, `keydown`, `paste`, `submit`.

**Hàm** [request](../../assets/js/recovery-otp.js#L35), [waitLabel](../../assets/js/recovery-otp.js#L51), [updateResend](../../assets/js/recovery-otp.js#L57) (cập nhật dữ liệu), [startCountdown](../../assets/js/recovery-otp.js#L64), [run](../../assets/js/recovery-otp.js#L71), [showStep](../../assets/js/recovery-otp.js#L92) (hiển thị trạng thái), [fillDigits](../../assets/js/recovery-otp.js#L100), [sendCode](../../assets/js/recovery-otp.js#L109), [passwordLevel](../../assets/js/recovery-otp.js#L206), [updatePasswordFeedback](../../assets/js/recovery-otp.js#L212) (cập nhật dữ liệu).

### `assets/js/services`

#### [approved-project-service.js](../../assets/js/services/approved-project-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 11 trang khác.

**Giao diện được công bố** `approvedProjects`.

**Hàm** [proposalContent](../../assets/js/services/approved-project-service.js#L9), [definitions](../../assets/js/services/approved-project-service.js#L25), [get](../../assets/js/services/approved-project-service.js#L74) (tra cứu dữ liệu hoặc trạng thái), [studentCanView](../../assets/js/services/approved-project-service.js#L103), [forStudent](../../assets/js/services/approved-project-service.js#L108), [canSupervise](../../assets/js/services/approved-project-service.js#L115), [list](../../assets/js/services/approved-project-service.js#L121) (trả danh sách).

#### [avatar-service.js](../../assets/js/services/avatar-service.js)

Nạp từ [ho-so-ca-nhan.html](../../pages/sinh-vien/ho-so-ca-nhan.html).

**Giao diện được công bố** `avatar`.

**Hàm** [validate](../../assets/js/services/avatar-service.js#L7) (kiểm tra dữ liệu), [transact](../../assets/js/services/avatar-service.js#L11), [read](../../assets/js/services/avatar-service.js#L40) (đọc dữ liệu), [save](../../assets/js/services/avatar-service.js#L46) (lưu dữ liệu).

#### [deadline-service.js](../../assets/js/services/deadline-service.js)

Nạp từ [lich-han-nop.html](../../pages/sinh-vien/lich-han-nop.html).

**Giao diện được công bố** `deadlines`.

**Hàm** [today](../../assets/js/services/deadline-service.js#L5), [getState](../../assets/js/services/deadline-service.js#L11) (tra cứu dữ liệu hoặc trạng thái), [dateTime](../../assets/js/services/deadline-service.js#L49), [getActiveDeadlines](../../assets/js/services/deadline-service.js#L54) (tra cứu dữ liệu hoặc trạng thái).

#### [evaluation-service.js](../../assets/js/services/evaluation-service.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `evaluations`.

**Hàm** [getResult](../../assets/js/services/evaluation-service.js#L7) (tra cứu dữ liệu hoặc trạng thái).

#### [lecturer-profile-service.js](../../assets/js/services/lecturer-profile-service.js)

Nạp từ [ho-so-ca-nhan-giang-vien.html](../../pages/giang-vien/ho-so-ca-nhan-giang-vien.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html).

**Giao diện được công bố** `lecturerProfile`.

**Hàm** [validate](../../assets/js/services/lecturer-profile-service.js#L7) (kiểm tra dữ liệu), [getState](../../assets/js/services/lecturer-profile-service.js#L17) (tra cứu dữ liệu hoặc trạng thái), [update](../../assets/js/services/lecturer-profile-service.js#L32) (cập nhật dữ liệu).

#### [lecturer-topic-editor-service.js](../../assets/js/services/lecturer-topic-editor-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html).

**Giao diện được công bố** `lecturerTopicEditor`.

**Hàm** [getSupervisor](../../assets/js/services/lecturer-topic-editor-service.js#L20) (tra cứu dữ liệu hoặc trạng thái), [nextCode](../../assets/js/services/lecturer-topic-editor-service.js#L28), [requiresMethodPlan](../../assets/js/services/lecturer-topic-editor-service.js#L38), [validate](../../assets/js/services/lecturer-topic-editor-service.js#L43) (kiểm tra dữ liệu), [save](../../assets/js/services/lecturer-topic-editor-service.js#L107) (lưu dữ liệu), [setRegistration](../../assets/js/services/lecturer-topic-editor-service.js#L149) (đặt giá trị hoặc trạng thái).

#### [lecturer-topic-file-service.js](../../assets/js/services/lecturer-topic-file-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 2 trang khác.

**Giao diện được công bố** `lecturerTopicFiles`.

**Hàm** [validate](../../assets/js/services/lecturer-topic-file-service.js#L4) (kiểm tra dữ liệu), [transaction](../../assets/js/services/lecturer-topic-file-service.js#L10), [validateSelection](../../assets/js/services/lecturer-topic-file-service.js#L31) (kiểm tra dữ liệu), [stage](../../assets/js/services/lecturer-topic-file-service.js#L40), [readResolved](../../assets/js/services/lecturer-topic-file-service.js#L48) (đọc dữ liệu), [readPublished](../../assets/js/services/lecturer-topic-file-service.js#L60) (đọc dữ liệu), [discard](../../assets/js/services/lecturer-topic-file-service.js#L64).

#### [lecturer-topic-repository.js](../../assets/js/services/lecturer-topic-repository.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 12 trang khác.

**Giao diện được công bố** `lecturerTopicRepository`.

**Hàm** [valid](../../assets/js/services/lecturer-topic-repository.js#L7), [read](../../assets/js/services/lecturer-topic-repository.js#L11) (đọc dữ liệu), [write](../../assets/js/services/lecturer-topic-repository.js#L21) (ghi dữ liệu).

#### [lecturer-topic-service.js](../../assets/js/services/lecturer-topic-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

**Giao diện được công bố** `lecturerTopics`.

**Hàm** [registeredTopicIds](../../assets/js/services/lecturer-topic-service.js#L72), [createdStatus](../../assets/js/services/lecturer-topic-service.js#L87) (khởi tạo hoặc tạo bản ghi), [list](../../assets/js/services/lecturer-topic-service.js#L96) (trả danh sách), [get](../../assets/js/services/lecturer-topic-service.js#L116) (tra cứu dữ liệu hoặc trạng thái), [detailUrl](../../assets/js/services/lecturer-topic-service.js#L132), [returnUrl](../../assets/js/services/lecturer-topic-service.js#L137), [workspaceChoices](../../assets/js/services/lecturer-topic-service.js#L148), [supervisedParticipants](../../assets/js/services/lecturer-topic-service.js#L158), [projectIdentity](../../assets/js/services/lecturer-topic-service.js#L183), [workspaceState](../../assets/js/services/lecturer-topic-service.js#L201).

#### [profile-service.js](../../assets/js/services/profile-service.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html), [ho-so-ca-nhan.html](../../pages/sinh-vien/ho-so-ca-nhan.html), [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html).

**Giao diện được công bố** `profile`.

**Hàm** [validate](../../assets/js/services/profile-service.js#L5) (kiểm tra dữ liệu), [getState](../../assets/js/services/profile-service.js#L14) (tra cứu dữ liệu hoặc trạng thái), [update](../../assets/js/services/profile-service.js#L22) (cập nhật dữ liệu), [validatePassword](../../assets/js/services/profile-service.js#L32) (kiểm tra dữ liệu).

#### [project-invitation-identity.js](../../assets/js/services/project-invitation-identity.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Giao diện được công bố** `invitationIdentity`.

**Hàm** [resolve](../../assets/js/services/project-invitation-identity.js#L5).

#### [project-progress-service.js](../../assets/js/services/project-progress-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) và 3 trang khác.

**Giao diện được công bố** `projectProgress`.

**Hàm** [stateFrom](../../assets/js/services/project-progress-service.js#L13), [getState](../../assets/js/services/project-progress-service.js#L20) (tra cứu dữ liệu hoặc trạng thái), [getPermissions](../../assets/js/services/project-progress-service.js#L25) (tra cứu dữ liệu hoặc trạng thái), [canUpdateTask](../../assets/js/services/project-progress-service.js#L36), [validateTask](../../assets/js/services/project-progress-service.js#L41) (kiểm tra dữ liệu), [validateUpdate](../../assets/js/services/project-progress-service.js#L72) (kiểm tra dữ liệu), [mutate](../../assets/js/services/project-progress-service.js#L83), [saveTask](../../assets/js/services/project-progress-service.js#L97) (lưu dữ liệu), [deleteTask](../../assets/js/services/project-progress-service.js#L119) (xóa theo quy tắc nghiệp vụ), [deleteTasks](../../assets/js/services/project-progress-service.js#L123) (xóa theo quy tắc nghiệp vụ), [updateProgress](../../assets/js/services/project-progress-service.js#L132) (cập nhật dữ liệu), [summarize](../../assets/js/services/project-progress-service.js#L146).

#### [project-team-service.js](../../assets/js/services/project-team-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html) và 7 trang khác.

**Giao diện được công bố** `projectTeams`.

**Hàm** [getDefinition](../../assets/js/services/project-team-service.js#L6) (tra cứu dữ liệu hoặc trạng thái), [stateFrom](../../assets/js/services/project-team-service.js#L16), [supervisorIds](../../assets/js/services/project-team-service.js#L21), [getState](../../assets/js/services/project-team-service.js#L25) (tra cứu dữ liệu hoặc trạng thái), [getPermission](../../assets/js/services/project-team-service.js#L39) (tra cứu dữ liệu hoặc trạng thái), [validateMember](../../assets/js/services/project-team-service.js#L46) (kiểm tra dữ liệu), [canInvite](../../assets/js/services/project-team-service.js#L57), [getLecturers](../../assets/js/services/project-team-service.js#L65) (tra cứu dữ liệu hoặc trạng thái), [mutate](../../assets/js/services/project-team-service.js#L71), [addMember](../../assets/js/services/project-team-service.js#L85), [inviteSupervisor](../../assets/js/services/project-team-service.js#L93), [checkChange](../../assets/js/services/project-team-service.js#L120), [cancelInvitation](../../assets/js/services/project-team-service.js#L126), [canReview](../../assets/js/services/project-team-service.js#L142), [listInvitations](../../assets/js/services/project-team-service.js#L147) (trả danh sách), [invitationDetail](../../assets/js/services/project-team-service.js#L162), [respondInvitation](../../assets/js/services/project-team-service.js#L172).

#### [proposal-file-service.js](../../assets/js/services/proposal-file-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html) và 4 trang khác.

**Giao diện được công bố** `proposalFiles`.

**Hàm** [transaction](../../assets/js/services/proposal-file-service.js#L6), [stage](../../assets/js/services/proposal-file-service.js#L39), [read](../../assets/js/services/proposal-file-service.js#L47) (đọc dữ liệu), [validateImage](../../assets/js/services/proposal-file-service.js#L56) (kiểm tra dữ liệu), [stageImage](../../assets/js/services/proposal-file-service.js#L62).

#### [proposal-service.js](../../assets/js/services/proposal-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 10 trang khác.

**Giao diện được công bố** `proposals`.

**Hàm** [listSupervisors](../../assets/js/services/proposal-service.js#L34) (trả danh sách), [catalogFor](../../assets/js/services/proposal-service.js#L40), [notify](../../assets/js/services/proposal-service.js#L46), [save](../../assets/js/services/proposal-service.js#L50) (lưu dữ liệu), [submittingStudent](../../assets/js/services/proposal-service.js#L55), [validateForStudent](../../assets/js/services/proposal-service.js#L60) (kiểm tra dữ liệu), [validate](../../assets/js/services/proposal-service.js#L68) (kiểm tra dữ liệu), [nextTopicCode](../../assets/js/services/proposal-service.js#L72), [create](../../assets/js/services/proposal-service.js#L100) (khởi tạo hoặc tạo bản ghi), [findById](../../assets/js/services/proposal-service.js#L125) (tìm bản ghi), [rejectDuplicate](../../assets/js/services/proposal-service.js#L129), [getEditable](../../assets/js/services/proposal-service.js#L134) (tra cứu dữ liệu hoặc trạng thái), [update](../../assets/js/services/proposal-service.js#L143) (cập nhật dữ liệu), [withdraw](../../assets/js/services/proposal-service.js#L156), [listMyTopics](../../assets/js/services/proposal-service.js#L164) (trả danh sách), [canReview](../../assets/js/services/proposal-service.js#L196), [listForLecturer](../../assets/js/services/proposal-service.js#L202) (trả danh sách), [withWriteLock](../../assets/js/services/proposal-service.js#L223), [decide](../../assets/js/services/proposal-service.js#L231).

#### [published-topic-service.js](../../assets/js/services/published-topic-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 11 trang khác.

**Giao diện được công bố** `publishedTopics`.

**Hàm** [complete](../../assets/js/services/published-topic-service.js#L6), [availability](../../assets/js/services/published-topic-service.js#L9), [project](../../assets/js/services/published-topic-service.js#L16), [get](../../assets/js/services/published-topic-service.js#L31) (tra cứu dữ liệu hoặc trạng thái), [list](../../assets/js/services/published-topic-service.js#L35) (trả danh sách), [findEdited](../../assets/js/services/published-topic-service.js#L38) (tìm bản ghi), [requireOpen](../../assets/js/services/published-topic-service.js#L48).

#### [registration-service.js](../../assets/js/services/registration-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 11 trang khác.

**Giao diện được công bố** `registrations`.

**Hàm** [getTopic](../../assets/js/services/registration-service.js#L13) (tra cứu dữ liệu hoặc trạng thái), [getRules](../../assets/js/services/registration-service.js#L21) (tra cứu dữ liệu hoặc trạng thái), [findByTopic](../../assets/js/services/registration-service.js#L25) (tìm bản ghi), [findById](../../assets/js/services/registration-service.js#L33) (tìm bản ghi), [validateEnrollment](../../assets/js/services/registration-service.js#L37) (kiểm tra dữ liệu), [create](../../assets/js/services/registration-service.js#L43) (khởi tạo hoặc tạo bản ghi), [submit](../../assets/js/services/registration-service.js#L74), [save](../../assets/js/services/registration-service.js#L82) (lưu dữ liệu), [listForLecturer](../../assets/js/services/registration-service.js#L87) (trả danh sách), [decide](../../assets/js/services/registration-service.js#L108), [listMyTopics](../../assets/js/services/registration-service.js#L128) (trả danh sách).

#### [request-service.js](../../assets/js/services/request-service.js)

Nạp từ [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html), [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html) và 1 trang khác.

**Giao diện được công bố** `requests`.

**Hàm** [withSeedDecision](../../assets/js/services/request-service.js#L8), [recordsFrom](../../assets/js/services/request-service.js#L15), [list](../../assets/js/services/request-service.js#L20) (trả danh sách), [findById](../../assets/js/services/request-service.js#L24) (tìm bản ghi), [permissions](../../assets/js/services/request-service.js#L28), [isStudentProposal](../../assets/js/services/request-service.js#L33), [findStudentProposal](../../assets/js/services/request-service.js#L38) (tìm bản ghi), [proposalForEdit](../../assets/js/services/request-service.js#L43), [proposalCatalog](../../assets/js/services/request-service.js#L56), [validateProposal](../../assets/js/services/request-service.js#L63) (kiểm tra dữ liệu), [proposalChanges](../../assets/js/services/request-service.js#L73), [validate](../../assets/js/services/request-service.js#L94) (kiểm tra dữ liệu), [mutate](../../assets/js/services/request-service.js#L111), [mutateProposal](../../assets/js/services/request-service.js#L142), [updateProposal](../../assets/js/services/request-service.js#L149) (cập nhật dữ liệu), [withdrawProposal](../../assets/js/services/request-service.js#L153), [removeProposal](../../assets/js/services/request-service.js#L157), [applyToTopics](../../assets/js/services/request-service.js#L161), [recent](../../assets/js/services/request-service.js#L176).

#### [storage.js](../../assets/js/services/storage.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 18 trang khác.

**Hàm** [readRegistrations](../../assets/js/services/storage.js#L5) (đọc dữ liệu), [writeRegistrations](../../assets/js/services/storage.js#L38) (ghi dữ liệu), [validProposalCover](../../assets/js/services/storage.js#L48), [isProposalOutline](../../assets/js/services/storage.js#L54), [isProposalRecord](../../assets/js/services/storage.js#L74), [readProposals](../../assets/js/services/storage.js#L97) (đọc dữ liệu), [writeProposals](../../assets/js/services/storage.js#L113) (ghi dữ liệu), [readProjectTeams](../../assets/js/services/storage.js#L123) (đọc dữ liệu), [writeProjectTeams](../../assets/js/services/storage.js#L144) (ghi dữ liệu), [readProjectProgress](../../assets/js/services/storage.js#L154) (đọc dữ liệu), [writeProjectProgress](../../assets/js/services/storage.js#L184) (ghi dữ liệu), [readProfile](../../assets/js/services/storage.js#L194) (đọc dữ liệu), [writeProfile](../../assets/js/services/storage.js#L208) (ghi dữ liệu), [readRequests](../../assets/js/services/storage.js#L215) (đọc dữ liệu), [writeRequests](../../assets/js/services/storage.js#L238) (ghi dữ liệu), [readTeachingRecords](../../assets/js/services/storage.js#L245) (đọc dữ liệu), [writeTeachingRecords](../../assets/js/services/storage.js#L271) (ghi dữ liệu).

#### [student-overview-service.js](../../assets/js/services/student-overview-service.js)

Nạp từ [tong-quan-sinh-vien.html](../../pages/sinh-vien/tong-quan-sinh-vien.html).

**Giao diện được công bố** `overview`.

**Hàm** [getState](../../assets/js/services/student-overview-service.js#L5) (tra cứu dữ liệu hoặc trạng thái).

#### [student-submissions-service.js](../../assets/js/services/student-submissions-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [lich-han-nop.html](../../pages/sinh-vien/lich-han-nop.html).

**Giao diện được công bố** `studentSubmissions`.

**Sự kiện** `message`.

**Hàm** [forStudent](../../assets/js/services/student-submissions-service.js#L12), [localUploads](../../assets/js/services/student-submissions-service.js#L57), [readUploads](../../assets/js/services/student-submissions-service.js#L90) (đọc dữ liệu), [onUploadsChanged](../../assets/js/services/student-submissions-service.js#L96), [legacyCopy](../../assets/js/services/student-submissions-service.js#L100), [withLegacyFeedback](../../assets/js/services/student-submissions-service.js#L105), [visibleSubmissions](../../assets/js/services/student-submissions-service.js#L111), [uploadRequirement](../../assets/js/services/student-submissions-service.js#L124), [saveUpload](../../assets/js/services/student-submissions-service.js#L135) (lưu dữ liệu), [deleteUnsubmittedRequirement](../../assets/js/services/student-submissions-service.js#L178) (xóa theo quy tắc nghiệp vụ), [reviewUpload](../../assets/js/services/student-submissions-service.js#L198).

#### [student-topic-codes.js](../../assets/js/services/student-topic-codes.js)

Nạp từ [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html), [chi-tiet-dang-ky-da-luu.html](../../pages/sinh-vien/chi-tiet-dang-ky-da-luu.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html) và 4 trang khác.

**Hàm** [typeOf](../../assets/js/services/student-topic-codes.js#L19), [titleKey](../../assets/js/services/student-topic-codes.js#L24), [candidate](../../assets/js/services/student-topic-codes.js#L28), [buildCodes](../../assets/js/services/student-topic-codes.js#L34) (dựng cấu trúc đầu ra), [get](../../assets/js/services/student-topic-codes.js#L52) (tra cứu dữ liệu hoặc trạng thái).

#### [submission-file-service.js](../../assets/js/services/submission-file-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Giao diện được công bố** `submissionFiles`.

**Hàm** [accessFile](../../assets/js/services/submission-file-service.js#L8), [lookup](../../assets/js/services/submission-file-service.js#L41), [availability](../../assets/js/services/submission-file-service.js#L53), [read](../../assets/js/services/submission-file-service.js#L58) (đọc dữ liệu).

#### [task-comments-service.js](../../assets/js/services/task-comments-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `taskComments`.

**Hàm** [authorFor](../../assets/js/services/task-comments-service.js#L8), [openDatabase](../../assets/js/services/task-comments-service.js#L26), [transact](../../assets/js/services/task-comments-service.js#L58), [read](../../assets/js/services/task-comments-service.js#L79) (đọc dữ liệu), [add](../../assets/js/services/task-comments-service.js#L88), [insert](../../assets/js/services/task-comments-service.js#L98).

#### [teaching-service.js](../../assets/js/services/teaching-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác.

**Giao diện được công bố** `teaching`.

**Hàm** [context](../../assets/js/services/teaching-service.js#L8), [supervisedProjects](../../assets/js/services/teaching-service.js#L22), [listProjects](../../assets/js/services/teaching-service.js#L33) (trả danh sách), [listActiveProjects](../../assets/js/services/teaching-service.js#L37) (trả danh sách), [listSupervisedProjects](../../assets/js/services/teaching-service.js#L41) (trả danh sách), [stateFrom](../../assets/js/services/teaching-service.js#L45), [evaluationCriteria](../../assets/js/services/teaching-service.js#L56), [decorate](../../assets/js/services/teaching-service.js#L66), [getState](../../assets/js/services/teaching-service.js#L76) (tra cứu dữ liệu hoặc trạng thái), [getSubmission](../../assets/js/services/teaching-service.js#L81) (tra cứu dữ liệu hoặc trạng thái), [mutate](../../assets/js/services/teaching-service.js#L89), [active](../../assets/js/services/teaching-service.js#L102), [validateRequirement](../../assets/js/services/teaching-service.js#L106) (kiểm tra dữ liệu), [saveRequirement](../../assets/js/services/teaching-service.js#L124) (lưu dữ liệu), [deleteRequirement](../../assets/js/services/teaching-service.js#L137) (xóa theo quy tắc nghiệp vụ), [setLocked](../../assets/js/services/teaching-service.js#L147) (đặt giá trị hoặc trạng thái), [addProgressReview](../../assets/js/services/teaching-service.js#L159), [assertFeedbackAllowed](../../assets/js/services/teaching-service.js#L171), [saveFeedback](../../assets/js/services/teaching-service.js#L177) (lưu dữ liệu), [validateEvaluation](../../assets/js/services/teaching-service.js#L191) (kiểm tra dữ liệu), [publish](../../assets/js/services/teaching-service.js#L208), [submissionAccess](../../assets/js/services/teaching-service.js#L226).

#### [topic-service.js](../../assets/js/services/topic-service.js)

Nạp từ [dang-ky-de-tai.html](../../pages/sinh-vien/dang-ky-de-tai.html), [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html), [tong-quan-sinh-vien.html](../../pages/sinh-vien/tong-quan-sinh-vien.html).

**Giao diện được công bố** `topics`.

**Hàm** [normalizeText](../../assets/js/services/topic-service.js#L10), [courseKey](../../assets/js/services/topic-service.js#L20), [listTopics](../../assets/js/services/topic-service.js#L26) (trả danh sách), [listOpenTopics](../../assets/js/services/topic-service.js#L78) (trả danh sách), [normalizeMyTopic](../../assets/js/services/topic-service.js#L104), [listMyTopics](../../assets/js/services/topic-service.js#L113) (trả danh sách).

### `assets/js/shared`

#### [course-filters.js](../../assets/js/shared/course-filters.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html) và 2 trang khác.

**Hàm** [createOption](../../assets/js/shared/course-filters.js#L18) (khởi tạo hoặc tạo bản ghi).

#### [detail-tabs.js](../../assets/js/shared/detail-tabs.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `click`, `focus`, `focusout`, `hashchange`, `pointerdown`, `pointerenter`, `pointerleave`, `popstate`, `resize`.

#### [dialog-commands.js](../../assets/js/shared/dialog-commands.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [ho-so-ca-nhan.html](../../pages/sinh-vien/ho-so-ca-nhan.html).

**Sự kiện** `click`.

#### [download-file.js](../../assets/js/shared/download-file.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html) và 3 trang khác.

**Giao diện được công bố** `downloadFile`.

**Sự kiện** `pagehide`.

**Hàm** [release](../../assets/js/shared/download-file.js#L5).

#### [evaluation-attachment.js](../../assets/js/shared/evaluation-attachment.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `bindEvaluationAttachmentDownload`.

**Sự kiện** `click`.

#### [invitation-dialogs.js](../../assets/js/shared/invitation-dialogs.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `invitationSuccess`, `confirmInvitation`.

**Sự kiện** `cancel`, `click`, `close`, `input`, `submit`.

**Hàm** [shell](../../assets/js/shared/invitation-dialogs.js#L10).

#### [language.js](../../assets/js/shared/language.js)

Nạp từ [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../pages/chung/dang-nhap.html), [gioi-thieu.html](../../pages/chung/gioi-thieu.html) và 36 trang khác.

**Sự kiện** `DOMContentLoaded`, `click`, `pageshow`, `storage`.

**Hàm** [readLanguage](../../assets/js/shared/language.js#L18) (đọc dữ liệu), [english](../../assets/js/shared/language.js#L26), [sourceText](../../assets/js/shared/language.js#L49), [translateText](../../assets/js/shared/language.js#L73), [translateAttribute](../../assets/js/shared/language.js#L100), [translateElement](../../assets/js/shared/language.js#L124), [translateTree](../../assets/js/shared/language.js#L131), [isLocalizedAttribute](../../assets/js/shared/language.js#L152), [observe](../../assets/js/shared/language.js#L173), [applyLanguage](../../assets/js/shared/language.js#L195).

#### [lecturer-overview.js](../../assets/js/shared/lecturer-overview.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html).

**Hàm** [render](../../assets/js/shared/lecturer-overview.js#L6) (dựng lại phần hiển thị).

#### [logout.js](../../assets/js/shared/logout.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 22 trang khác.

**Sự kiện** `click`.

**Hàm** [bindLogout](../../assets/js/shared/logout.js#L6), [showError](../../assets/js/shared/logout.js#L13) (hiển thị trạng thái).

#### [main-nav.js](../../assets/js/shared/main-nav.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `focus`, `focusin`, `focusout`, `ie104:languagechange`, `pointerdown`, `pointerenter`, `pointerleave`, `resize`.

**Hàm** [measureAndSet](../../assets/js/shared/main-nav.js#L33), [moveIndicator](../../assets/js/shared/main-nav.js#L68), [getFocusedTab](../../assets/js/shared/main-nav.js#L83) (tra cứu dữ liệu hoặc trạng thái).

#### [nav-indicator.js](../../assets/js/shared/nav-indicator.js)

Nạp từ [chi-tiet-dang-ky-da-luu.html](../../pages/sinh-vien/chi-tiet-dang-ky-da-luu.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [dang-ky-de-tai.html](../../pages/sinh-vien/dang-ky-de-tai.html) và 1 trang khác.

**Sự kiện** `change`, `focusin`, `focusout`, `loadingdone`, `pointerdown`, `pointerenter`, `pointerleave`, `resize`, `scroll`, `toggle`.

#### [progress-task-view.js](../../assets/js/shared/progress-task-view.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Hàm** [element](../../assets/js/shared/progress-task-view.js#L10), [calendar](../../assets/js/shared/progress-task-view.js#L17), [deadlineDate](../../assets/js/shared/progress-task-view.js#L23), [today](../../assets/js/shared/progress-task-view.js#L30), [isOverdue](../../assets/js/shared/progress-task-view.js#L34), [fillStats](../../assets/js/shared/progress-task-view.js#L38), [memberAvatar](../../assets/js/shared/progress-task-view.js#L50), [renderMemberPopover](../../assets/js/shared/progress-task-view.js#L57) (dựng lại phần hiển thị), [memberIndex](../../assets/js/shared/progress-task-view.js#L78), [renderAssignees](../../assets/js/shared/progress-task-view.js#L84) (dựng lại phần hiển thị), [renderCard](../../assets/js/shared/progress-task-view.js#L103) (dựng lại phần hiển thị), [fillDetails](../../assets/js/shared/progress-task-view.js#L134).

#### [proposal-cover.js](../../assets/js/shared/proposal-cover.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html) và 3 trang khác.

**Hàm** [renderProposalCover](../../assets/js/shared/proposal-cover.js#L5) (dựng lại phần hiển thị).

#### [proposal-detail-fields.js](../../assets/js/shared/proposal-detail-fields.js)

Nạp từ [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html).

**Hàm** [render](../../assets/js/shared/proposal-detail-fields.js#L9) (dựng lại phần hiển thị), [renderAttachment](../../assets/js/shared/proposal-detail-fields.js#L62) (dựng lại phần hiển thị), [download](../../assets/js/shared/proposal-detail-fields.js#L80), [readSample](../../assets/js/shared/proposal-detail-fields.js#L100) (đọc dữ liệu).

#### [proposal-outline.js](../../assets/js/shared/proposal-outline.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html).

**Hàm** [milestones](../../assets/js/shared/proposal-outline.js#L5), [fields](../../assets/js/shared/proposal-outline.js#L18), [render](../../assets/js/shared/proposal-outline.js#L28) (dựng lại phần hiển thị).

#### [public-session.js](../../assets/js/shared/public-session.js)

Nạp từ [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [gioi-thieu.html](../../pages/chung/gioi-thieu.html), [huong-nghien-cuu.html](../../pages/chung/huong-nghien-cuu.html) và 8 trang khác.

**Sự kiện** `pageshow`.

**Hàm** [createAccountMenu](../../assets/js/shared/public-session.js#L23) (khởi tạo hoặc tạo bản ghi), [refreshAccount](../../assets/js/shared/public-session.js#L65).

#### [registration-supervisor.js](../../assets/js/shared/registration-supervisor.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [student-course-label.js](../../assets/js/shared/student-course-label.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-dang-ky-da-luu.html](../../pages/sinh-vien/chi-tiet-dang-ky-da-luu.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 4 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [submission-file-list.js](../../assets/js/shared/submission-file-list.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `beforetoggle`, `resize`, `scroll`, `toggle`.

**Hàm** [closeOnScroll](../../assets/js/shared/submission-file-list.js#L6), [position](../../assets/js/shared/submission-file-list.js#L13), [fileNames](../../assets/js/shared/submission-file-list.js#L31), [attach](../../assets/js/shared/submission-file-list.js#L45).

#### [supervisor-dialog.js](../../assets/js/shared/supervisor-dialog.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `click`, `close`, `input`.

**Hàm** [updateSelection](../../assets/js/shared/supervisor-dialog.js#L14) (cập nhật dữ liệu).

#### [task-comments.js](../../assets/js/shared/task-comments.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `mountTaskComments`.

**Sự kiện** `click`, `close`, `input`, `message`, `submit`, `visibilitychange`.

**Hàm** [element](../../assets/js/shared/task-comments.js#L10), [button](../../assets/js/shared/task-comments.js#L17), [avatar](../../assets/js/shared/task-comments.js#L24), [commentBody](../../assets/js/shared/task-comments.js#L32), [newestFirst](../../assets/js/shared/task-comments.js#L47), [openChannel](../../assets/js/shared/task-comments.js#L51), [mount](../../assets/js/shared/task-comments.js#L59), [render](../../assets/js/shared/task-comments.js#L64) (dựng lại phần hiển thị), [openReply](../../assets/js/shared/task-comments.js#L144), [composer](../../assets/js/shared/task-comments.js#L158), [eventMatches](../../assets/js/shared/task-comments.js#L202), [submit](../../assets/js/shared/task-comments.js#L206), [build](../../assets/js/shared/task-comments.js#L254) (dựng cấu trúc đầu ra), [refresh](../../assets/js/shared/task-comments.js#L270).

#### [teacher-detail-tabs.js](../../assets/js/shared/teacher-detail-tabs.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `click`, `focus`, `focusout`, `hashchange`, `pointerdown`, `pointerenter`, `pointerleave`, `popstate`, `resize`.

#### [theme.js](../../assets/js/shared/theme.js)

Nạp từ [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../pages/chung/dang-nhap.html), [gioi-thieu.html](../../pages/chung/gioi-thieu.html) và 36 trang khác.

**Sự kiện** `DOMContentLoaded`, `click`, `pageshow`, `storage`.

**Hàm** [readTheme](../../assets/js/shared/theme.js#L5) (đọc dữ liệu), [applyTheme](../../assets/js/shared/theme.js#L34).

#### [topic-attachment.js](../../assets/js/shared/topic-attachment.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html).

**Sự kiện** `click`.

**Hàm** [render](../../assets/js/shared/topic-attachment.js#L15) (dựng lại phần hiển thị).

#### [topic-identity.js](../../assets/js/shared/topic-identity.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 14 trang khác.

**Hàm** [uniqueTitles](../../assets/js/shared/topic-identity.js#L5).

#### [topic-list-empty.js](../../assets/js/shared/topic-list-empty.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html) và 2 trang khác.

**Sự kiện** `click`.

#### [topic-list.js](../../assets/js/shared/topic-list.js)

Nạp từ [dang-ky-de-tai.html](../../pages/sinh-vien/dang-ky-de-tai.html), [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html).

**Giao diện được công bố** `initTopicList`.

**Sự kiện** `change`, `click`, `ie104:published-topics-updated`, `input`, `pageshow`, `reset`, `storage`, `submit`.

**Hàm** [initTopicList](../../assets/js/shared/topic-list.js#L5), [readFilters](../../assets/js/shared/topic-list.js#L28) (đọc dữ liệu), [createPageButton](../../assets/js/shared/topic-list.js#L41) (khởi tạo hoặc tạo bản ghi), [renderPagination](../../assets/js/shared/topic-list.js#L59) (dựng lại phần hiển thị), [refreshLecturers](../../assets/js/shared/topic-list.js#L70), [render](../../assets/js/shared/topic-list.js#L80) (dựng lại phần hiển thị), [applyFilters](../../assets/js/shared/topic-list.js#L104).

#### [topic-overview.js](../../assets/js/shared/topic-overview.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Hàm** [renderList](../../assets/js/shared/topic-overview.js#L5) (dựng lại phần hiển thị), [supervisorCard](../../assets/js/shared/topic-overview.js#L16), [renderSupervisors](../../assets/js/shared/topic-overview.js#L49) (dựng lại phần hiển thị), [renderAcceptedSupervisors](../../assets/js/shared/topic-overview.js#L60) (dựng lại phần hiển thị), [renderLecturerSupervisors](../../assets/js/shared/topic-overview.js#L69) (dựng lại phần hiển thị), [renderSupervisedSummary](../../assets/js/shared/topic-overview.js#L103) (dựng lại phần hiển thị).

#### [validation.js](../../assets/js/shared/validation.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 13 trang khác.

**Hàm** [validateRegistration](../../assets/js/shared/validation.js#L4) (kiểm tra dữ liệu), [validateProposalOutline](../../assets/js/shared/validation.js#L31) (kiểm tra dữ liệu), [validateProposal](../../assets/js/shared/validation.js#L82) (kiểm tra dữ liệu).

#### [workflow-dialog.js](../../assets/js/shared/workflow-dialog.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `workflowIcon`, `workflowDetails`.

**Sự kiện** `click`, `close`.

**Hàm** [progressTime](../../assets/js/shared/workflow-dialog.js#L5), [progressHistorySection](../../assets/js/shared/workflow-dialog.js#L17).

### `assets/js`

#### [student-overview.js](../../assets/js/student-overview.js)

Nạp từ [tong-quan-sinh-vien.html](../../pages/sinh-vien/tong-quan-sinh-vien.html).

**Sự kiện** `change`, `focusin`.

#### [student-proposal-status.js](../../assets/js/student-proposal-status.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [setText](../../assets/js/student-proposal-status.js#L15) (đặt giá trị hoặc trạng thái), [resultMessage](../../assets/js/student-proposal-status.js#L20), [updateMyTopics](../../assets/js/student-proposal-status.js#L26) (cập nhật dữ liệu), [updateRequest](../../assets/js/student-proposal-status.js#L49) (cập nhật dữ liệu), [updateDetail](../../assets/js/student-proposal-status.js#L76) (cập nhật dữ liệu), [render](../../assets/js/student-proposal-status.js#L142) (dựng lại phần hiển thị).

#### [student-topic-proposal.js](../../assets/js/student-topic-proposal.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `pageshow`, `reset`.

**Hàm** [updateCourse](../../assets/js/student-topic-proposal.js#L17) (cập nhật dữ liệu).

#### [supervision-attachment-ui.js](../../assets/js/supervision-attachment-ui.js)

Nạp từ [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html), [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html), [loi-moi-huong-dan.html](../../pages/sinh-vien/loi-moi-huong-dan.html).

**Sự kiện** `change`, `click`, `reset`.

**Hàm** [formatSize](../../assets/js/supervision-attachment-ui.js#L7), [createPicker](../../assets/js/supervision-attachment-ui.js#L13) (khởi tạo hoặc tạo bản ghi), [validate](../../assets/js/supervision-attachment-ui.js#L35) (kiểm tra dữ liệu), [createDownload](../../assets/js/supervision-attachment-ui.js#L58) (khởi tạo hoặc tạo bản ghi).

#### [supervision-compose.js](../../assets/js/supervision-compose.js)

Nạp từ [loi-moi-huong-dan.html](../../pages/sinh-vien/loi-moi-huong-dan.html).

**Sự kiện** `input`, `pageshow`, `submit`.

**Hàm** [validate](../../assets/js/supervision-compose.js#L17) (kiểm tra dữ liệu), [initialize](../../assets/js/supervision-compose.js#L30).

#### [supervision-entry.js](../../assets/js/supervision-entry.js)

Nạp từ [dang-nhap.html](../../pages/chung/dang-nhap.html), [huong-nghien-cuu.html](../../pages/chung/huong-nghien-cuu.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 9 trang khác.

**Hàm** [departmentLabel](../../assets/js/supervision-entry.js#L10), [validateTeacherId](../../assets/js/supervision-entry.js#L17) (kiểm tra dữ liệu), [withQuery](../../assets/js/supervision-entry.js#L23), [getComposeUrl](../../assets/js/supervision-entry.js#L29) (tra cứu dữ liệu hoặc trạng thái), [getLoginUrl](../../assets/js/supervision-entry.js#L34) (tra cứu dữ liệu hoặc trạng thái), [getInboxLoginUrl](../../assets/js/supervision-entry.js#L39) (tra cứu dữ liệu hoặc trạng thái), [getStudent](../../assets/js/supervision-entry.js#L43) (tra cứu dữ liệu hoặc trạng thái), [getDirectory](../../assets/js/supervision-entry.js#L57) (tra cứu dữ liệu hoặc trạng thái), [getTeachers](../../assets/js/supervision-entry.js#L75) (tra cứu dữ liệu hoặc trạng thái), [getTeacherInboxSession](../../assets/js/supervision-entry.js#L95) (tra cứu dữ liệu hoặc trạng thái), [getTeacher](../../assets/js/supervision-entry.js#L105) (tra cứu dữ liệu hoặc trạng thái).

#### [supervision-inbox.js](../../assets/js/supervision-inbox.js)

Nạp từ [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html), [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html).

**Sự kiện** `change`, `click`, `input`, `pageshow`, `submit`, `visibilitychange`.

**Hàm** [textElement](../../assets/js/supervision-inbox.js#L109), [describeStatus](../../assets/js/supervision-inbox.js#L116), [setTime](../../assets/js/supervision-inbox.js#L121) (đặt giá trị hoặc trạng thái), [renderTabCount](../../assets/js/supervision-inbox.js#L126) (dựng lại phần hiển thị), [scheduleRead](../../assets/js/supervision-inbox.js#L134), [renderList](../../assets/js/supervision-inbox.js#L148) (dựng lại phần hiển thị), [showTeacherChoices](../../assets/js/supervision-inbox.js#L177) (hiển thị trạng thái), [renderThread](../../assets/js/supervision-inbox.js#L193) (dựng lại phần hiển thị), [clearReplyError](../../assets/js/supervision-inbox.js#L248), [render](../../assets/js/supervision-inbox.js#L254) (dựng lại phần hiển thị), [save](../../assets/js/supervision-inbox.js#L331) (lưu dữ liệu).

#### [supervision-login.js](../../assets/js/supervision-login.js)

Nạp từ [dang-nhap.html](../../pages/chung/dang-nhap.html).

**Hàm** [showInvalidInvitation](../../assets/js/supervision-login.js#L14) (hiển thị trạng thái).

#### [supervision-shortcut.js](../../assets/js/supervision-shortcut.js)

Nạp từ [tong-quan-giang-vien.html](../../pages/giang-vien/tong-quan-giang-vien.html), [tong-quan-sinh-vien.html](../../pages/sinh-vien/tong-quan-sinh-vien.html).

**Sự kiện** `pageshow`.

**Hàm** [latestResponse](../../assets/js/supervision-shortcut.js#L15), [render](../../assets/js/supervision-shortcut.js#L25) (dựng lại phần hiển thị).

#### [supervision-store.js](../../assets/js/supervision-store.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tong-quan-giang-vien.html](../../pages/giang-vien/tong-quan-giang-vien.html) và 6 trang khác.

**Sự kiện** `change`, `pageshow`, `storage`.

**Hàm** [isText](../../assets/js/supervision-store.js#L15), [validateText](../../assets/js/supervision-store.js#L19) (kiểm tra dữ liệu), [isAttachment](../../assets/js/supervision-store.js#L35), [isRecord](../../assets/js/supervision-store.js#L41), [read](../../assets/js/supervision-store.js#L59) (đọc dữ liệu), [getAll](../../assets/js/supervision-store.js#L76) (tra cứu dữ liệu hoặc trạng thái), [write](../../assets/js/supervision-store.js#L91) (ghi dữ liệu), [notify](../../assets/js/supervision-store.js#L99), [randomId](../../assets/js/supervision-store.js#L103), [openAttachmentDatabase](../../assets/js/supervision-store.js#L108), [accessAttachments](../../assets/js/supervision-store.js#L117), [withAttachment](../../assets/js/supervision-store.js#L131), [getAttachment](../../assets/js/supervision-store.js#L151) (tra cứu dữ liệu hoặc trạng thái), [responseCount](../../assets/js/supervision-store.js#L165), [receiptKey](../../assets/js/supervision-store.js#L169), [readReceipt](../../assets/js/supervision-store.js#L173) (đọc dữ liệu), [getUnreadResponses](../../assets/js/supervision-store.js#L182) (tra cứu dữ liệu hoặc trạng thái), [markResponsesRead](../../assets/js/supervision-store.js#L186), [canReply](../../assets/js/supervision-store.js#L205), [needsTeacherReply](../../assets/js/supervision-store.js#L209), [create](../../assets/js/supervision-store.js#L216) (khởi tạo hoặc tạo bản ghi), [update](../../assets/js/supervision-store.js#L250) (cập nhật dữ liệu), [reply](../../assets/js/supervision-store.js#L267), [decide](../../assets/js/supervision-store.js#L279), [cancelProjectInvitation](../../assets/js/supervision-store.js#L289).

#### [supervisor-dialog.js](../../assets/js/supervisor-dialog.js)

Nạp từ [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html).

**Sự kiện** `change`, `click`, `close`, `input`.

**Hàm** [renderSavedSelection](../../assets/js/supervisor-dialog.js#L27) (dựng lại phần hiển thị), [loadDirectory](../../assets/js/supervisor-dialog.js#L42), [showInvitationNote](../../assets/js/supervisor-dialog.js#L54) (hiển thị trạng thái), [fillFromInvitation](../../assets/js/supervisor-dialog.js#L63), [updateSelection](../../assets/js/supervisor-dialog.js#L87) (cập nhật dữ liệu), [filterOptions](../../assets/js/supervisor-dialog.js#L91).

#### [teacher-approved-proposals.js](../../assets/js/teacher-approved-proposals.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `pageshow`.

**Hàm** [semesterLabel](../../assets/js/teacher-approved-proposals.js#L15), [createCard](../../assets/js/teacher-approved-proposals.js#L19) (khởi tạo hoặc tạo bản ghi), [render](../../assets/js/teacher-approved-proposals.js#L52) (dựng lại phần hiển thị).

#### [teacher-topic-store.js](../../assets/js/teacher-topic-store.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 8 trang khác.

**Hàm** [read](../../assets/js/teacher-topic-store.js#L144) (đọc dữ liệu), [validDate](../../assets/js/teacher-topic-store.js#L160), [validate](../../assets/js/teacher-topic-store.js#L167) (kiểm tra dữ liệu), [nextCode](../../assets/js/teacher-topic-store.js#L188), [save](../../assets/js/teacher-topic-store.js#L201) (lưu dữ liệu), [withWriteLock](../../assets/js/teacher-topic-store.js#L218), [setRegistrationStatus](../../assets/js/teacher-topic-store.js#L221) (đặt giá trị hoặc trạng thái), [studentTopics](../../assets/js/teacher-topic-store.js#L234).

#### [teacher-topic-workflow.js](../../assets/js/teacher-topic-workflow.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `beforeunload`, `cancel`, `change`, `click`, `input`, `pageshow`, `storage`, `submit`.

**Hàm** [imageIn](../../assets/js/teacher-topic-workflow.js#L29), [render](../../assets/js/teacher-topic-workflow.js#L52) (dựng lại phần hiển thị), [setMeta](../../assets/js/teacher-topic-workflow.js#L66) (đặt giá trị hoặc trạng thái), [refreshList](../../assets/js/teacher-topic-workflow.js#L90), [renderStatus](../../assets/js/teacher-topic-workflow.js#L134) (dựng lại phần hiển thị), [refreshStatus](../../assets/js/teacher-topic-workflow.js#L147), [refreshImage](../../assets/js/teacher-topic-workflow.js#L279).

#### [topic-list.js](../../assets/js/topic-list.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `click`, `ie104:topics-updated`, `input`, `pageshow`, `reset`, `storage`, `submit`.

**Hàm** [refreshTabCounts](../../assets/js/topic-list.js#L17), [render](../../assets/js/topic-list.js#L76) (dựng lại phần hiển thị), [applyFilters](../../assets/js/topic-list.js#L137).

#### [uit-lecturer-catalog.js](../../assets/js/uit-lecturer-catalog.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 16 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [uit-lecturer-view.js](../../assets/js/uit-lecturer-view.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Khai báo** `lecturerTopics`.

#### [uit-notice.js](../../assets/js/uit-notice.js)

Nạp từ [thong-bao-uit.html](../../pages/chung/thong-bao-uit.html).

**Sự kiện** `error`.

**Hàm** [select](../../assets/js/uit-notice.js#L41), [detailUrl](../../assets/js/uit-notice.js#L45), [formatDate](../../assets/js/uit-notice.js#L51), [createItem](../../assets/js/uit-notice.js#L55) (khởi tạo hoặc tạo bản ghi).

#### [uit-proposal-detail.js](../../assets/js/uit-proposal-detail.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `input`, `submit`.

**Hàm** [text](../../assets/js/uit-proposal-detail.js#L35), [render](../../assets/js/uit-proposal-detail.js#L40) (dựng lại phần hiển thị), [validateReason](../../assets/js/uit-proposal-detail.js#L95) (kiểm tra dữ liệu).

#### [uit-proposal-store.js](../../assets/js/uit-proposal-store.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `pageshow`, `storage`.

**Hàm** [readDecision](../../assets/js/uit-proposal-store.js#L13) (đọc dữ liệu), [getAll](../../assets/js/uit-proposal-store.js#L25) (tra cứu dữ liệu hoặc trạng thái), [notify](../../assets/js/uit-proposal-store.js#L37), [decide](../../assets/js/uit-proposal-store.js#L41).

#### [uit-supervised-demo.js](../../assets/js/uit-supervised-demo.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Hàm** [displayDate](../../assets/js/uit-supervised-demo.js#L6), [setDate](../../assets/js/uit-supervised-demo.js#L12) (đặt giá trị hoặc trạng thái), [cloneWithDialogs](../../assets/js/uit-supervised-demo.js#L19), [keepCards](../../assets/js/uit-supervised-demo.js#L48), [renderProgress](../../assets/js/uit-supervised-demo.js#L63) (dựng lại phần hiển thị), [renderRequirements](../../assets/js/uit-supervised-demo.js#L100) (dựng lại phần hiển thị), [renderSubmissions](../../assets/js/uit-supervised-demo.js#L169) (dựng lại phần hiển thị).

#### [uit-teacher-approved-proposals.js](../../assets/js/uit-teacher-approved-proposals.js)

Nạp từ [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Sự kiện** `storage`.

**Hàm** [render](../../assets/js/uit-teacher-approved-proposals.js#L9) (dựng lại phần hiển thị).

#### [uit-topic-list.js](../../assets/js/uit-topic-list.js)

Nạp từ [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Sự kiện** `animationend`, `change`, `click`, `ie104:topics-updated`, `input`, `pageshow`, `reset`, `submit`.

**Hàm** [renderProjectStatus](../../assets/js/uit-topic-list.js#L15) (dựng lại phần hiển thị), [refreshCodes](../../assets/js/uit-topic-list.js#L32), [countActiveFilters](../../assets/js/uit-topic-list.js#L105), [updateFilterTitle](../../assets/js/uit-topic-list.js#L121) (cập nhật dữ liệu), [clearPageTransition](../../assets/js/uit-topic-list.js#L132), [triggerPageTransition](../../assets/js/uit-topic-list.js#L144), [render](../../assets/js/uit-topic-list.js#L164) (dựng lại phần hiển thị).

#### [website-session.js](../../assets/js/website-session.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [setDemoRole](../../assets/js/website-session.js#L7) (đặt giá trị hoặc trạng thái), [setFirebaseSession](../../assets/js/website-session.js#L11) (đặt giá trị hoặc trạng thái), [clearWebsiteSession](../../assets/js/website-session.js#L15), [hasStoredWebsiteSession](../../assets/js/website-session.js#L19), [getWebsiteRole](../../assets/js/website-session.js#L23) (tra cứu dữ liệu hoặc trạng thái), [readFirebaseSession](../../assets/js/website-session.js#L33) (đọc dữ liệu), [getWebsiteSession](../../assets/js/website-session.js#L41) (tra cứu dữ liệu hoặc trạng thái).

### `calendar-worker`

#### [auth.mjs](../../calendar-worker/auth.mjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [authenticate](../../calendar-worker/auth.mjs#L8).

#### [index.mjs](../../calendar-worker/index.mjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [siteUrl](../../calendar-worker/index.mjs#L12), [googleConnection](../../calendar-worker/index.mjs#L23), [readBody](../../calendar-worker/index.mjs#L34) (đọc dữ liệu), [saveRequirement](../../calendar-worker/index.mjs#L61) (lưu dữ liệu), [startOAuth](../../calendar-worker/index.mjs#L74), [finishOAuth](../../calendar-worker/index.mjs#L80), [addEvents](../../calendar-worker/index.mjs#L101), [createCalendarWorker](../../calendar-worker/index.mjs#L138) (khởi tạo hoặc tạo bản ghi).

### `calendar-worker/migrations`

#### [0001_calendar.sql](../../calendar-worker/migrations/0001_calendar.sql)

Không thấy thẻ script HTML nạp trực tiếp.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

### `calendar-worker`

#### [store.mjs](../../calendar-worker/store.mjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [createStore](../../calendar-worker/store.mjs#L3) (khởi tạo hoặc tạo bản ghi).

#### [worker.test.mjs](../../calendar-worker/worker.test.mjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [validates Firebase sessions and D1 project permissions](../../calendar-worker/worker.test.mjs#L147)
- [enrolls verified UIT Google students once and only in the library demo](../../calendar-worker/worker.test.mjs#L160)
- [links Google events once and retries propagation after a lecturer saves](../../calendar-worker/worker.test.mjs#L182)

**Hàm** [database](../../calendar-worker/worker.test.mjs#L14), [fixture](../../calendar-worker/worker.test.mjs#L49), [call](../../calendar-worker/worker.test.mjs#L120), [consent](../../calendar-worker/worker.test.mjs#L128).

### `.`

#### [firestore.rules](../../firestore.rules)

Không thấy thẻ script HTML nạp trực tiếp.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

### `functions`

#### [brevo.cjs](../../functions/brevo.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [otpMessage](../../functions/brevo.cjs#L5), [sendBrevoEmail](../../functions/brevo.cjs#L13).

#### [calendar-bridge.cjs](../../functions/calendar-bridge.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [inBatches](../../functions/calendar-bridge.cjs#L13), [createCalendarBridge](../../functions/calendar-bridge.cjs#L21) (khởi tạo hoặc tạo bản ghi), [accessFor](../../functions/calendar-bridge.cjs#L28), [readItems](../../functions/calendar-bridge.cjs#L33) (đọc dữ liệu), [saveRequirement](../../functions/calendar-bridge.cjs#L39) (lưu dữ liệu), [connect](../../functions/calendar-bridge.cjs#L56), [callback](../../functions/calendar-bridge.cjs#L68), [addEvents](../../functions/calendar-bridge.cjs#L112), [handle](../../functions/calendar-bridge.cjs#L153) (xử lý sự kiện hoặc yêu cầu), [syncRequirement](../../functions/calendar-bridge.cjs#L204) (đồng bộ trạng thái).

#### [calendar-policy.cjs](../../functions/calendar-policy.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [validateEdit](../../functions/calendar-policy.cjs#L15) (kiểm tra dữ liệu), [withOverride](../../functions/calendar-policy.cjs#L32).

#### [google-calendar.cjs](../../functions/google-calendar.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [createTokenVault](../../functions/google-calendar.cjs#L22) (khởi tạo hoặc tạo bản ghi), [buildEvent](../../functions/google-calendar.cjs#L46) (dựng cấu trúc đầu ra), [createGoogleCalendar](../../functions/google-calendar.cjs#L61) (khởi tạo hoặc tạo bản ghi), [request](../../functions/google-calendar.cjs#L64), [tokenRequest](../../functions/google-calendar.cjs#L83), [authorized](../../functions/google-calendar.cjs#L87), [patch](../../functions/google-calendar.cjs#L94).

#### [index.cjs](../../functions/index.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Giao diện được công bố** `accountRecovery`, `calendarBridge`, `syncCalendarRequirement`.

**Hàm** [sendEmail](../../functions/index.cjs#L48).

#### [provision-user.cjs](../../functions/provision-user.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [provision](../../functions/provision-user.cjs#L5).

#### [recovery.cjs](../../functions/recovery.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [normalizeEmail](../../functions/recovery.cjs#L20), [gmailAddress](../../functions/recovery.cjs#L28), [createRecovery](../../functions/recovery.cjs#L35) (khởi tạo hoặc tạo bản ghi), [issueCode](../../functions/recovery.cjs#L40), [verifyCode](../../functions/recovery.cjs#L84).

### `functions/test`

#### [recovery.test.cjs](../../functions/test/recovery.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [xác minh Gmail chưa đăng ký và chỉ mở bước mô phỏng một lần](../../functions/test/recovery.test.cjs#L38)
- [chỉ nhận Gmail và áp dụng chung giới hạn cho tên có dấu chấm hoặc thẻ cộng](../../functions/test/recovery.test.cjs#L58)
- [hết hạn, giới hạn nhập sai và vô hiệu hóa mã cũ khi gửi lại thành công](../../functions/test/recovery.test.cjs#L76)
- [mã cũ vẫn xác minh được khi nhà cung cấp từ chối lần gửi lại](../../functions/test/recovery.test.cjs#L95)
- [giới hạn toàn bộ bản demo ở 240 lượt trong 24 giờ](../../functions/test/recovery.test.cjs#L104)
- [gửi nội dung OTP đến Gmail qua đúng endpoint giao dịch của Brevo](../../functions/test/recovery.test.cjs#L116)
- [lỗi Brevo không trở thành báo gửi mã thành công](../../functions/test/recovery.test.cjs#L140)

**Hàm** [fixture](../../functions/test/recovery.test.cjs#L9).

### `scripts`

#### [check-completed-downloads.cjs](../../scripts/check-completed-downloads.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Khai báo** `myTopics`, `teachingSeeds`, `studentWebSubmissions`.

### `tests`

#### [catalog-detail-course-label.test.cjs](../../tests/catalog-detail-course-label.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [thesis and graduation course codes appear only in details for both roles](../../tests/catalog-detail-course-label.test.cjs#L11)

**Hàm** [catalog](../../tests/catalog-detail-course-label.test.cjs#L6).

#### [lecturer-overview.test.cjs](../../tests/lecturer-overview.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [demo counts, chart slices and on-chart percentages agree](../../tests/lecturer-overview.test.cjs#L125)
- [progress and pending cards open the correct project and proposal IDs](../../tests/lecturer-overview.test.cjs#L136)
- [approval refreshes counts and chart without duplicating labels](../../tests/lecturer-overview.test.cjs#L148)
- [empty data hides the chart and shows separate empty messages](../../tests/lecturer-overview.test.cjs#L165)
- [a storage change refreshes the overview and corrupt data is reported](../../tests/lecturer-overview.test.cjs#L180)
- [opening the overview as a file shows the bundled catalog while saved data is unavailable](../../tests/lecturer-overview.test.cjs#L194)

**Hàm** [setup](../../tests/lecturer-overview.test.cjs#L55) (đặt giá trị hoặc trạng thái).

#### [logout.test.cjs](../../tests/logout.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [đăng xuất ngay bằng một lần bấm, không mở hộp thoại, chỉ chuyển trang sau khi dọn trạng thái](../../tests/logout.test.cjs#L40)
- [lỗi đăng xuất không chuyển trang, khôi phục cả hai nút và cho phép thử lại](../../tests/logout.test.cjs#L51)
- [menu công khai gắn lại không nhân đôi xử lý và vẫn hoạt động nếu thiếu dialog cũ](../../tests/logout.test.cjs#L66)

**Hàm** [setup](../../tests/logout.test.cjs#L8) (đặt giá trị hoặc trạng thái).

#### [pending-catalog.test.cjs](../../tests/pending-catalog.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [tổng 10 hồ sơ đủ 3 loại, 4 môn; giữ nguyên dữ liệu quản lý đề tài](../../tests/pending-catalog.test.cjs#L23)
- [giữ quyết định của hồ sơ mẫu cũ khi thay danh sách chờ bằng 10 hồ sơ](../../tests/pending-catalog.test.cjs#L36)
- [toàn bộ hồ sơ chờ duyệt không trùng mã hoặc tên với danh mục quản lý đề tài](../../tests/pending-catalog.test.cjs#L43)
- [hồ sơ mới mở được từ store, có nội dung, nguồn và nhãn môn học nhất quán](../../tests/pending-catalog.test.cjs#L57)
- [duyệt hồ sơ mới của cả ba loại và tải lại vẫn đọc được đề tài đã duyệt](../../tests/pending-catalog.test.cjs#L81)
- [hai hồ sơ mẫu ở SV dùng cùng dữ liệu và phản ánh quyết định GV](../../tests/pending-catalog.test.cjs#L98)
- [đề xuất SV giữ nội dung, ba ngày và tham chiếu tệp khi GV đọc lại sau tải trang](../../tests/pending-catalog.test.cjs#L120)
- [SV gửi → GV duyệt → hai bên đọc đúng ba ngày, phương pháp, kế hoạch và tài liệu sau tải lại](../../tests/pending-catalog.test.cjs#L153)
- [hồ sơ mẫu SV chuyển đúng trang đang thực hiện khi GV duyệt, không mất đề cương](../../tests/pending-catalog.test.cjs#L188)
- [không dùng ngày duyệt làm ngày bắt đầu, giữ ba ngày riêng từ đăng ký và đề tài cũ](../../tests/pending-catalog.test.cjs#L210)

**Hàm** [setup](../../tests/pending-catalog.test.cjs#L9) (đặt giá trị hoặc trạng thái), [loadStudentServices](../../tests/pending-catalog.test.cjs#L92), [loadApprovedView](../../tests/pending-catalog.test.cjs#L147).

#### [project-invitations.test.cjs](../../tests/project-invitations.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [SV sends; only recipient decides; approval persists membership and lecturer listing](../../tests/project-invitations.test.cjs#L19)
- [a project can add multiple co-supervisors without inviting the same lecturer twice](../../tests/project-invitations.test.cjs#L35)
- [rejection requires reason, persists result, adds no supervisor](../../tests/project-invitations.test.cjs#L46)
- [cancelled/stale/completed requests and failed storage cannot report success](../../tests/project-invitations.test.cjs#L53)
- [shared demo lecturer receives and handles invitations to any recipient without changing invited lecturer](../../tests/project-invitations.test.cjs#L65)

**Giao diện được công bố** `invitationIdentity`.

**Hàm** [setup](../../tests/project-invitations.test.cjs#L4) (đặt giá trị hoặc trạng thái), [invite](../../tests/project-invitations.test.cjs#L18).

#### [proposal-store.test.cjs](../../tests/proposal-store.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [mã demo không trùng hồ sơ sinh viên; dữ liệu trả về không làm thay đổi seed](../../tests/proposal-store.test.cjs#L22)
- [duyệt cập nhật đúng đề tài, tải lại vẫn giữ kết quả, không xử lý lần hai](../../tests/proposal-store.test.cjs#L32)
- [đề tài demo đã duyệt vẫn mở được sau khi chuyển sang danh mục UIT](../../tests/proposal-store.test.cjs#L45)
- [từ chối kiểm tra lý do đã trim và chỉ ghi khi đủ điều kiện](../../tests/proposal-store.test.cjs#L65)
- [mã, quyết định, dữ liệu hỏng và quyền lưu trữ không tạo kết quả giả](../../tests/proposal-store.test.cjs#L76)
- [khóa dùng chung ngăn hai tab ghi hai quyết định cho cùng hồ sơ](../../tests/proposal-store.test.cjs#L91)
- [đề xuất gửi giảng viên trong danh mục hiện trong hộp chờ duyệt mẫu và giữ người nhận khi duyệt](../../tests/proposal-store.test.cjs#L109)

**Hàm** [setup](../../tests/proposal-store.test.cjs#L8) (đặt giá trị hoặc trạng thái).

#### [registration-service.test.cjs](../../tests/registration-service.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [ISEDAMH-017 updates the created-topic badge from current and legacy registrations](../../tests/registration-service.test.cjs#L38)
- [đăng ký thành công mở đề tài đang thực hiện và không tạo yêu cầu chờ duyệt](../../tests/registration-service.test.cjs#L67)
- [đăng ký chờ duyệt đã lưu vẫn đọc và xử lý được cạnh hồ sơ đăng ký trực tiếp](../../tests/registration-service.test.cjs#L89)
- [sinh viên có thể đăng ký một mình và lưu tên nhóm trống](../../tests/registration-service.test.cjs#L106)
- [đề tài giảng viên đã mở nhận một sinh viên và giữ số thành viên tối đa](../../tests/registration-service.test.cjs#L124)
- [đề tài cùng tên chỉ hiện một lần và không đăng ký lại qua mã cũ](../../tests/registration-service.test.cjs#L172)

**Hàm** [setup](../../tests/registration-service.test.cjs#L13) (đặt giá trị hoặc trạng thái).

#### [student-submissions-sync.test.cjs](../../tests/student-submissions-sync.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [lịch mẫu tháng 10 và 11 có đủ năm trạng thái từ cùng bộ yêu cầu của giảng viên](../../tests/student-submissions-sync.test.cjs#L32)
- [bài nộp mẫu của đề tài đang thực hiện có thể tải tệp lẻ và toàn bộ, kể cả từ bản ghi cũ](../../tests/student-submissions-sync.test.cjs#L67)
- [DA005 shares submissions across roles and locks feedback writes after completion](../../tests/student-submissions-sync.test.cjs#L85)
- [publishes the current assessment directly and exposes the result to the student](../../tests/student-submissions-sync.test.cjs#L120)
- [publishing an assessment preserves, replaces, or removes its attachment across roles](../../tests/student-submissions-sync.test.cjs#L141)
- [an existing DA005 evaluation keeps its original rubric and takes precedence over the sample](../../tests/student-submissions-sync.test.cjs#L166)
- [yêu cầu lưu phía giảng viên cập nhật ở bài nộp và lịch theo giờ Việt Nam](../../tests/student-submissions-sync.test.cjs#L182)
- [nhãn thời hạn dùng giờ gửi của từng bài và lần gửi gần nhất cho yêu cầu](../../tests/student-submissions-sync.test.cjs#L231)
- [shares a newly uploaded file and the lecturer feedback, and keeps the previous version on failed storage](../../tests/student-submissions-sync.test.cjs#L272)

**Hàm** [createTab](../../tests/student-submissions-sync.test.cjs#L7) (khởi tạo hoặc tạo bản ghi).

#### [student-topic-preview.test.cjs](../../tests/student-topic-preview.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [file preview shows bundled student project data without reading or writing storage](../../tests/student-topic-preview.test.cjs#L18)
- [the DA005 group leader can delete tasks only while the project is active](../../tests/student-topic-preview.test.cjs#L44)
- [new student tasks preserve multiple assignees, description and initial status across edits](../../tests/student-topic-preview.test.cjs#L74)

**Hàm** [loadStudentServices](../../tests/student-topic-preview.test.cjs#L7).

#### [supervision-store.test.cjs](../../tests/supervision-store.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [các lượt trả lời đồng thời được lưu trước quyết định và chỉ chốt một lần](../../tests/supervision-store.test.cjs#L31)
- [lời mời kiểm tra người tham gia, nội dung và dữ liệu đã lưu](../../tests/supervision-store.test.cjs#L66)
- [chỉ báo thay đổi sau khi lưu và khi tab nhận thông báo dữ liệu](../../tests/supervision-store.test.cjs#L85)
- [tệp trống, quá dung lượng hoặc không lưu được đều không tạo lời mời](../../tests/supervision-store.test.cjs#L107)
- [sinh viên chỉ đánh dấu phản hồi đã hiện trong bản lời mời đang xem](../../tests/supervision-store.test.cjs#L127)
- [trạng thái đã xem cập nhật giữa các tab và không phát lại khi không đổi](../../tests/supervision-store.test.cjs#L159)

**Hàm** [setup](../../tests/supervision-store.test.cjs#L13) (đặt giá trị hoặc trạng thái).

#### [teacher-topic-store.test.cjs](../../tests/teacher-topic-store.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [create persists, edit selects exact ID and preserves untouched content and other topics](../../tests/teacher-topic-store.test.cjs#L19)
- [required fields match each existing form; invalid codes, members and dates are rejected](../../tests/teacher-topic-store.test.cjs#L34)
- [stale edits, changed read-only codes and full storage cannot overwrite records](../../tests/teacher-topic-store.test.cjs#L48)
- [corrupted storage is reported and left intact](../../tests/teacher-topic-store.test.cjs#L61)
- [codes are allocated separately by type with the latest records inside the write lock](../../tests/teacher-topic-store.test.cjs#L70)
- [legacy codes continue the sequence and a failed save does not consume a number](../../tests/teacher-topic-store.test.cjs#L85)
- [creation form presents the generated code as output with an associated hint](../../tests/teacher-topic-store.test.cjs#L99)

**Hàm** [setup](../../tests/teacher-topic-store.test.cjs#L6) (đặt giá trị hoặc trạng thái).

#### [topic-codes.test.cjs](../../tests/topic-codes.test.cjs)

Không thấy thẻ script HTML nạp trực tiếp.

**Ca kiểm thử**

- [six faculty prefixes, Vietnamese Đ and legacy codes follow the requested format](../../tests/topic-codes.test.cjs#L20)
- [course owner uses verified subject data while graduation subjects use their type](../../tests/topic-codes.test.cjs#L34)
- [migrated display codes are unique and both old and displayed IDs open the same topic](../../tests/topic-codes.test.cjs#L43)
- [new codes count by faculty and type, including supervised topics not in the created tab](../../tests/topic-codes.test.cjs#L53)
- [Unicode IDs save and reload, without changing existing display codes or consuming failed numbers](../../tests/topic-codes.test.cjs#L65)
- [workspace IDs stay internal and projects sharing a created topic keep its displayed code](../../tests/topic-codes.test.cjs#L81)

**Hàm** [setup](../../tests/topic-codes.test.cjs#L6) (đặt giá trị hoặc trạng thái).

## Danh mục CSS

| Tệp | Phạm vi sử dụng |
|---|---|
| [about-audiences.css](../../assets/css/about-audiences.css) | [gioi-thieu.html](../../pages/chung/gioi-thieu.html) |
| [auth.css](../../assets/css/auth.css) | [dang-nhap.html](../../pages/chung/dang-nhap.html), [quen-mat-khau.html](../../pages/chung/quen-mat-khau.html) |
| [base.css](../../assets/css/base.css) | [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../pages/chung/dang-nhap.html) và 37 trang khác |
| [breadcrumb.css](../../assets/css/breadcrumb.css) | [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html), [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html) |
| [common.css](../../assets/css/common.css) | [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../pages/chung/dang-nhap.html) và 11 trang khác |
| [components.css](../../assets/css/components.css) | [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../pages/chung/dang-nhap.html) và 36 trang khác |
| [dang-ky-de-tai.css](../../assets/css/dang-ky-de-tai.css) | [chi-tiet-dang-ky-da-luu.html](../../pages/sinh-vien/chi-tiet-dang-ky-da-luu.html), [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 8 trang khác |
| [de-tai-cua-toi.css](../../assets/css/de-tai-cua-toi.css) | [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html) |
| [de-tai-dang-thuc-hien.css](../../assets/css/de-tai-dang-thuc-hien.css) | [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [deadline-calendar.css](../../assets/css/deadline-calendar.css) | [lich-han-nop.html](../../pages/sinh-vien/lich-han-nop.html) |
| [ho-so-ca-nhan.css](../../assets/css/ho-so-ca-nhan.css) | [ho-so-ca-nhan-giang-vien.html](../../pages/giang-vien/ho-so-ca-nhan-giang-vien.html), [ho-so-ca-nhan.html](../../pages/sinh-vien/ho-so-ca-nhan.html) |
| [huong-nghien-cuu.css](../../assets/css/huong-nghien-cuu.css) | [huong-nghien-cuu.html](../../pages/chung/huong-nghien-cuu.html) |
| [information.css](../../assets/css/information.css) | [gioi-thieu.html](../../pages/chung/gioi-thieu.html), [lien-he.html](../../pages/chung/lien-he.html) |
| [invitation-dialogs.css](../../assets/css/invitation-dialogs.css) | [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [lecturer-invitation-preview.css](../../assets/css/lecturer-invitation-preview.css) | [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [lecturer-overview-data.css](../../assets/css/lecturer-overview-data.css) | [tong-quan-giang-vien.html](../../pages/giang-vien/tong-quan-giang-vien.html) |
| [lecturer-profile.css](../../assets/css/lecturer-profile.css) | [ho-so-ca-nhan-giang-vien.html](../../pages/giang-vien/ho-so-ca-nhan-giang-vien.html) |
| [lecturer-source-data.css](../../assets/css/lecturer-source-data.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác |
| [lecturer-topic-editor.css](../../assets/css/lecturer-topic-editor.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) |
| [lecturer-topic-routing.css](../../assets/css/lecturer-topic-routing.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [page-directory.css](../../assets/css/page-directory.css) | [index.html](../../index.html) |
| [project-evaluation.css](../../assets/css/project-evaluation.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [project-footer.css](../../assets/css/project-footer.css) | [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [gioi-thieu.html](../../pages/chung/gioi-thieu.html) và 36 trang khác |
| [project-progress.css](../../assets/css/project-progress.css) | [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [project-team.css](../../assets/css/project-team.css) | [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [proposal-outline.css](../../assets/css/proposal-outline.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) và 1 trang khác |
| [proposal-pickers.css](../../assets/css/proposal-pickers.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 3 trang khác |
| [proposal-request-detail.css](../../assets/css/proposal-request-detail.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html) và 2 trang khác |
| [published-topic.css](../../assets/css/published-topic.css) | [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) |
| [registration-detail.css](../../assets/css/registration-detail.css) | [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html) |
| [student-deadlines-data.css](../../assets/css/student-deadlines-data.css) | Kiểm tra import CSS hoặc màn hình dùng biến thể này |
| [student-overview-data.css](../../assets/css/student-overview-data.css) | [tong-quan-sinh-vien.html](../../pages/sinh-vien/tong-quan-sinh-vien.html) |
| [student-profile.css](../../assets/css/student-profile.css) | [ho-so-ca-nhan.html](../../pages/sinh-vien/ho-so-ca-nhan.html) |
| [student-requests.css](../../assets/css/student-requests.css) | [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html) |
| [student-topic-detail.css](../../assets/css/student-topic-detail.css) | [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [student-topic-overview.css](../../assets/css/student-topic-overview.css) | [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html) |
| [student-topic-proposal.css](../../assets/css/student-topic-proposal.css) | [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html) |
| [student-topic-registration.css](../../assets/css/student-topic-registration.css) | [dang-ky-de-tai.html](../../pages/sinh-vien/dang-ky-de-tai.html), [de-tai-cua-toi-sinh-vien.html](../../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html) |
| [supervision-invitations.css](../../assets/css/supervision-invitations.css) | [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [tong-quan-giang-vien.html](../../pages/giang-vien/tong-quan-giang-vien.html), [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html) và 3 trang khác |
| [supervisor-dialog.css](../../assets/css/supervisor-dialog.css) | [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [tao-de-xuat.html](../../pages/sinh-vien/tao-de-xuat.html) |
| [teacher-created-detail.css](../../assets/css/teacher-created-detail.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html) |
| [teacher-created-topics.css](../../assets/css/teacher-created-topics.css) | [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html) |
| [teacher-dialogs.css](../../assets/css/teacher-dialogs.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html) và 1 trang khác |
| [teacher-layout.css](../../assets/css/teacher-layout.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html) và 5 trang khác |
| [teacher-pending-proposals.css](../../assets/css/teacher-pending-proposals.css) | [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html) |
| [teacher-request-detail.css](../../assets/css/teacher-request-detail.css) | [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html) |
| [teacher-supervised-topics.css](../../assets/css/teacher-supervised-topics.css) | [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html) |
| [teacher-topic-detail.css](../../assets/css/teacher-topic-detail.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [teacher-topic-forms.css](../../assets/css/teacher-topic-forms.css) | [chinh-sua-de-tai-giang-vien.html](../../pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../pages/giang-vien/tao-de-tai-giang-vien.html) |
| [teacher-workspace-detail.css](../../assets/css/teacher-workspace-detail.css) | Kiểm tra import CSS hoặc màn hình dùng biến thể này |
| [teacher-workspace-layout.css](../../assets/css/teacher-workspace-layout.css) | Kiểm tra import CSS hoặc màn hình dùng biến thể này |
| [teaching-workspace.css](../../assets/css/teaching-workspace.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [tokens.css](../../assets/css/tokens.css) | [index.html](../../index.html), [chi-tiet-thong-bao.html](../../pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../pages/chung/dang-nhap.html) và 37 trang khác |
| [tong-quan-giang-vien.css](../../assets/css/tong-quan-giang-vien.css) | [tong-quan-giang-vien.html](../../pages/giang-vien/tong-quan-giang-vien.html) |
| [tong-quan-sinh-vien.css](../../assets/css/tong-quan-sinh-vien.css) | [tong-quan-sinh-vien.html](../../pages/sinh-vien/tong-quan-sinh-vien.html) |
| [topic-detail-boards.css](../../assets/css/topic-detail-boards.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [topic-detail-overview-evaluation.css](../../assets/css/topic-detail-overview-evaluation.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 2 trang khác |
| [topic-enrollment.css](../../assets/css/topic-enrollment.css) | [chi-tiet-dang-ky-da-luu.html](../../pages/sinh-vien/chi-tiet-dang-ky-da-luu.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html) |
| [topic-filter-panel.css](../../assets/css/topic-filter-panel.css) | [danh-sach-de-tai-da-tao.html](../../pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [yeu-cau-cho-duyet.html](../../pages/giang-vien/yeu-cau-cho-duyet.html) và 2 trang khác |
| [topic-media-shared.css](../../assets/css/topic-media-shared.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html) và 10 trang khác |
| [uit-notice.css](../../assets/css/uit-notice.css) | [thong-bao-uit.html](../../pages/chung/thong-bao-uit.html) |
| [uit-restored-submissions.css](../../assets/css/uit-restored-submissions.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [workflow-detail-shared.css](../../assets/css/workflow-detail-shared.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |

## Cấu hình và tài nguyên

- [firebase.json](../../firebase.json) khai báo cấu hình Firebase. [wrangler.jsonc](../../calendar-worker/wrangler.jsonc) khai báo Worker. [package.json](../../functions/package.json) mô tả phụ thuộc và lệnh của Firebase Functions.
- Ảnh, font, PDF, JSON và dữ liệu minh họa trong `assets` được các trang hoặc dịch vụ tham chiếu. Lockfile ghi phiên bản phụ thuộc đã khóa.
