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

1. [submission-upload.js](../../web/assets/js/pages/student/topic-detail/submission-upload.js) lấy mã đề tài từ `document.body.dataset.projectId`, ghép danh sách tệp đã chọn và gửi ghi chú vào dịch vụ. Hộp thoại chỉ báo thành công sau khi lời gọi lưu trả về.
2. [uploadRequirement và saveUpload](../../web/assets/js/services/student-submissions-service.js#L124) kiểm tra điều kiện trước khi lưu và kiểm tra lại trong giao dịch. Lần sửa truyền `expectedSavedAt` để nhận ra tệp đã đổi ở tab khác. Khóa IndexedDB gồm `projectId` và `requirementId`, nên hai yêu cầu có tệp cùng tên vẫn tách biệt.
3. [visibleSubmissions](../../web/assets/js/services/student-submissions-service.js#L111) kết hợp bài đã lưu ở kho hướng dẫn và bài mới từ IndexedDB. Logic tương thích bản cũ nhận diện các bản sao theo định danh và lần nộp để tránh hiện trùng. [Bảng giảng viên](../../web/assets/js/pages/lecturer/submissions.js#L247) đọc kho với vai trò giảng viên, rồi cập nhật giao diện.
4. Nếu bài có danh sách tệp cục bộ, giao diện dùng nội dung đó. Bài từ bản ghi hướng dẫn đi qua [submission-file-service.js](../../web/assets/js/services/submission-file-service.js), dịch vụ kiểm tra bản ghi và phiên bản tệp. Hai nguồn được giữ để bài tạo trước khi đổi thiết kế vẫn đọc được khi tệp còn tồn tại.
5. [reviewUpload](../../web/assets/js/services/student-submissions-service.js#L198) kiểm tra giảng viên, yêu cầu, độ dài phản hồi và thời điểm bài nộp. Nếu bài hoặc phản hồi đã đổi, giao dịch dừng. Nếu cập nhật phản hồi, giá trị trước được đưa vào lịch sử. Kênh thông báo thay đổi yêu cầu các tab đọc lại dữ liệu thay vì sao chép tệp qua thông báo.
6. [deleteUnsubmittedRequirement](../../web/assets/js/services/student-submissions-service.js#L178) kiểm tra kho mới trong giao dịch dùng cùng kho với thao tác nộp. Nếu có tệp, dừng trước bước xóa. Dịch vụ hướng dẫn kiểm tra thêm bài từ nguồn cũ và phiên bản yêu cầu.

### Đề tài mở đăng ký và phiếu đăng ký

1. [Trình biên tập đề tài](../../web/assets/js/pages/lecturer/topic-editor.js) đọc biểu mẫu, hiển thị lỗi theo trường rồi gọi [dịch vụ biên tập](../../web/assets/js/services/lecturer-topic-editor-service.js). Kho đề tài chứa bản ghi có mã và trạng thái. Dịch vụ tệp lưu dữ liệu ảnh/tài liệu theo tham chiếu.
2. [published-topic-service.js](../../web/assets/js/services/published-topic-service.js) tạo dữ liệu đọc cho sinh viên. `availability` kiểm tra dữ liệu cần thiết, trạng thái, giờ mở và hạn. Trang chi tiết dùng kết quả này để quyết định có cho đăng ký hay hiển thị lý do.
3. [registration-service.js](../../web/assets/js/services/registration-service.js) đọc lại đề tài ở thời điểm xác nhận, kiểm tra nhóm và lưu đăng ký. Sau khi đăng ký thành công, liên kết trong thông báo mở thẳng đề tài đang thực hiện do [approved-project-service.js](../../web/assets/js/services/approved-project-service.js) cung cấp. Khi đổi danh mục, kiểm tra cả mã trên URL và mã lưu ở các bản ghi.

### Lời mời và đề xuất

- [supervision-compose.js](../../web/assets/js/supervision-compose.js) gửi lời mời từ trang riêng vào [supervision-store.js](../../web/assets/js/supervision-store.js). [supervision-inbox.js](../../web/assets/js/supervision-inbox.js) dựng danh sách, cuộc trao đổi và quyết định cho hai vai trò.
- [project-team-service.js](../../web/assets/js/services/project-team-service.js#L93) xử lý lời mời gắn với một đề tài cụ thể. Màn hình giảng viên gọi các hàm đọc, lấy chi tiết và phản hồi của dịch vụ nhóm. Điều kiện vai trò và lần cập nhật được kiểm tra trước khi sửa.
- [topic-proposal.js](../../web/assets/js/pages/student/topic-proposal.js) gom dữ liệu đề xuất và mở xác nhận. [proposal-file-service.js](../../web/assets/js/services/proposal-file-service.js) hỗ trợ chuẩn bị và đọc tệp theo tham chiếu. Khi truy lỗi tải xuống, kiểm tra cả mã đề xuất, tham chiếu tệp và kết quả đọc thực tế.

### Công bố đánh giá và cập nhật lịch

- [evaluation.js phía giảng viên](../../web/assets/js/pages/lecturer/evaluation.js#L215) chuẩn bị dữ liệu và tệp trước khi gọi `publish`. [teaching-service.js](../../web/assets/js/services/teaching-service.js) xác minh điểm và điều kiện công bố. [evaluation-service.js](../../web/assets/js/services/evaluation-service.js) chuẩn hóa kết quả công bố để phía sinh viên đọc.
- [deadline-service.js](../../web/assets/js/services/deadline-service.js) tạo danh sách sự kiện theo mã đề tài. Khi truy lỗi ngày hoặc trạng thái, kiểm tra chuyển đổi múi giờ, hạn ở bản ghi nguồn và bộ lọc ở trang. [calendar-client.js](../../web/assets/js/calendar-client.js) tách việc lấy phiên, gửi yêu cầu và diễn giải lỗi khỏi giao diện.

### Xác thực và dịch giao diện

- [demo-login.js](../../web/assets/js/demo-login.js), [google-login.js](../../web/assets/js/google-login.js) và [website-session.js](../../web/assets/js/website-session.js) lần lượt tham gia xử lý đăng nhập, Google và phiên website. [recovery-otp.js](../../web/assets/js/recovery-otp.js) điều phối màn khôi phục, gọi dịch vụ bên ngoài ở từng bước và hiển thị lỗi.
- [language.js](../../web/assets/js/shared/language.js) đọc lựa chọn ngôn ngữ, ánh xạ văn bản và thuộc tính, xử lý các nút DOM thêm sau khi trang đã tải và đồng bộ lựa chọn giữa các tab.

## Danh mục JavaScript và mã dịch vụ

Mỗi mục ghi đường dẫn, các điểm vào và trang nạp trực tiếp khi có. Nhãn “Không thấy script HTML trực tiếp” bao gồm module được import, mã chạy máy chủ, mã kiểm thử và các biến thể chưa được xác nhận đang dùng. Danh mục không chép lại toàn bộ mã từng dòng.

### `assets/js`

#### [about-features.js](../../web/assets/js/about-features.js)

Nạp từ [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html).

**Sự kiện** `change`, `click`, `focusin`, `keydown`, `pointermove`, `resize`, `scroll`.

#### [about-tabs.js](../../web/assets/js/about-tabs.js)

Nạp từ [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html).

**Sự kiện** `change`, `click`, `focusin`, `hashchange`, `keydown`, `pointerenter`, `pointerleave`, `resize`.

**Hàm** [select](../../web/assets/js/about-tabs.js#L321), [indexFromHash](../../web/assets/js/about-tabs.js#L351).

#### [calendar-client.js](../../web/assets/js/calendar-client.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [calendarMessage](../../web/assets/js/calendar-client.js#L19), [calendarSession](../../web/assets/js/calendar-client.js#L23), [calendarRequest](../../web/assets/js/calendar-client.js#L30), [addCalendarEvents](../../web/assets/js/calendar-client.js#L47).

#### [contact-form.js](../../web/assets/js/contact-form.js)

Nạp từ [lien-he.html](../../web/pages/chung/lien-he.html).

**Sự kiện** `click`, `input`, `submit`.

### `assets/js/data`

#### [lecturer-merge-catalog.js](../../web/assets/js/data/lecturer-merge-catalog.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [lecturer-real-data.js](../../web/assets/js/data/lecturer-real-data.js)

Không thấy thẻ script HTML nạp trực tiếp.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [lecturer-source-data.js](../../web/assets/js/data/lecturer-source-data.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Khai báo** `lecturerSourceCatalog`.

#### [lecturer-topics.js](../../web/assets/js/data/lecturer-topics.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

**Khai báo** `currentLecturer`, `lecturerTopics`.

#### [mock-data.js](../../web/assets/js/data/mock-data.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

**Khai báo** `openTopics`, `myTopics`.

#### [notification-details.js](../../web/assets/js/data/notification-details.js)

Nạp từ [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [proposal-actors.js](../../web/assets/js/data/proposal-actors.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 16 trang khác.

**Khai báo** `currentStudent`, `currentLecturer`, `proposalDemoReviewerId`, `legacyProposalStudent`, `proposalLecturers`.

#### [student-deadlines.js](../../web/assets/js/data/student-deadlines.js)

Nạp từ [lich-han-nop.html](../../web/pages/sinh-vien/lich-han-nop.html).

**Khai báo** `projectMilestones`.

#### [student-evaluations.js](../../web/assets/js/data/student-evaluations.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) và 2 trang khác.

**Khai báo** `projectEvaluations`.

#### [student-profile.js](../../web/assets/js/data/student-profile.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html), [ho-so-ca-nhan.html](../../web/pages/sinh-vien/ho-so-ca-nhan.html), [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html).

**Khai báo** `studentProfile`.

#### [student-progress.js](../../web/assets/js/data/student-progress.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) và 3 trang khác.

**Khai báo** `projectProgress`.

#### [student-projects.js](../../web/assets/js/data/student-projects.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html) và 12 trang khác.

**Khai báo** `currentStudent`, `projectLecturers`, `currentLecturer`, `studentProjectOverviews`, `projectTeams`.

#### [student-requests.js](../../web/assets/js/data/student-requests.js)

Nạp từ [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html), [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html) và 1 trang khác.

**Khai báo** `requestLecturers`, `initialRequests`.

#### [student-uit-catalog.js](../../web/assets/js/data/student-uit-catalog.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

**Hàm** [submissionReferenceTime](../../web/assets/js/data/student-uit-catalog.js#L20), [submissionSample](../../web/assets/js/data/student-uit-catalog.js#L24), [submissionSchedule](../../web/assets/js/data/student-uit-catalog.js#L104).

#### [student-web-submissions.js](../../web/assets/js/data/student-web-submissions.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [lich-han-nop.html](../../web/pages/sinh-vien/lich-han-nop.html).

**Hàm** [merge](../../web/assets/js/data/student-web-submissions.js#L429), [forProject](../../web/assets/js/data/student-web-submissions.js#L435), [samplePdf](../../web/assets/js/data/student-web-submissions.js#L445), [attachment](../../web/assets/js/data/student-web-submissions.js#L449).

#### [teaching-data.js](../../web/assets/js/data/teaching-data.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác.

**Khai báo** `lecturerProjects`, `projectTeams`, `projectProgress`, `teachingSeeds`, `teachingCriteria`.

#### [uit-notice-index.js](../../web/assets/js/data/uit-notice-index.js)

Nạp từ [thong-bao-uit.html](../../web/pages/chung/thong-bao-uit.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

### `assets/js`

#### [deadline-calendar.js](../../web/assets/js/deadline-calendar.js)

Nạp từ [lich-han-nop.html](../../web/pages/sinh-vien/lich-han-nop.html).

**Sự kiện** `cancel`, `change`, `click`, `close`, `focus`, `input`, `keydown`, `pageshow`, `resize`, `scroll`, `storage`, `toggle`.

**Hàm** [indexEvents](../../web/assets/js/deadline-calendar.js#L66), [formatTime](../../web/assets/js/deadline-calendar.js#L76), [matchesTopic](../../web/assets/js/deadline-calendar.js#L82), [linkedPage](../../web/assets/js/deadline-calendar.js#L86), [requirementPage](../../web/assets/js/deadline-calendar.js#L92), [closePreview](../../web/assets/js/deadline-calendar.js#L100), [closeOverflow](../../web/assets/js/deadline-calendar.js#L109), [anchorVisible](../../web/assets/js/deadline-calendar.js#L119), [placePopover](../../web/assets/js/deadline-calendar.js#L127), [placePopovers](../../web/assets/js/deadline-calendar.js#L160), [schedulePlacement](../../web/assets/js/deadline-calendar.js#L185), [openPreview](../../web/assets/js/deadline-calendar.js#L193), [eventNode](../../web/assets/js/deadline-calendar.js#L246), [chooseAdditionalDeadlines](../../web/assets/js/deadline-calendar.js#L277), [overflowNode](../../web/assets/js/deadline-calendar.js#L301), [renderCalendar](../../web/assets/js/deadline-calendar.js#L349) (dựng lại phần hiển thị), [shiftMonth](../../web/assets/js/deadline-calendar.js#L384), [refreshActiveDeadlines](../../web/assets/js/deadline-calendar.js#L397), [setupGoogleCalendarDialog](../../web/assets/js/deadline-calendar.js#L431) (đặt giá trị hoặc trạng thái), [normalize](../../web/assets/js/deadline-calendar.js#L457), [createRow](../../web/assets/js/deadline-calendar.js#L462) (khởi tạo hoặc tạo bản ghi), [updateSelection](../../web/assets/js/deadline-calendar.js#L477) (cập nhật dữ liệu), [filterRows](../../web/assets/js/deadline-calendar.js#L489), [showRows](../../web/assets/js/deadline-calendar.js#L504) (hiển thị trạng thái), [openDialog](../../web/assets/js/deadline-calendar.js#L514), [selectedIds](../../web/assets/js/deadline-calendar.js#L522), [feedbackMessage](../../web/assets/js/deadline-calendar.js#L526), [submit](../../web/assets/js/deadline-calendar.js#L531), [setBusy](../../web/assets/js/deadline-calendar.js#L538) (đặt giá trị hoặc trạng thái), [loadSavedCalendar](../../web/assets/js/deadline-calendar.js#L581), [resumeAuthorization](../../web/assets/js/deadline-calendar.js#L621).

#### [demo-login.js](../../web/assets/js/demo-login.js)

Nạp từ [dang-nhap.html](../../web/pages/chung/dang-nhap.html).

**Sự kiện** `input`, `reset`, `submit`.

**Hàm** [clearError](../../web/assets/js/demo-login.js#L24), [finishSignIn](../../web/assets/js/demo-login.js#L32), [signInWebsiteAccount](../../web/assets/js/demo-login.js#L40).

#### [detail-tabs.js](../../web/assets/js/detail-tabs.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html), [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html).

**Sự kiện** `click`, `focus`, `focusout`, `hashchange`, `pointerdown`, `pointerenter`, `pointerleave`, `popstate`, `resize`.

#### [dialog-commands.js](../../web/assets/js/dialog-commands.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [ho-so-ca-nhan-giang-vien.html](../../web/pages/giang-vien/ho-so-ca-nhan-giang-vien.html) và 8 trang khác.

**Sự kiện** `click`.

#### [firebase-client.js](../../web/assets/js/firebase-client.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [getFirebaseAuth](../../web/assets/js/firebase-client.js#L12) (tra cứu dữ liệu hoặc trạng thái).

#### [firebase-config.js](../../web/assets/js/firebase-config.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Khai báo** `firebaseConfig`.

#### [google-login.js](../../web/assets/js/google-login.js)

Nạp từ [dang-nhap.html](../../web/pages/chung/dang-nhap.html).

**Sự kiện** `click`.

#### [huong-nghien-cuu.js](../../web/assets/js/huong-nghien-cuu.js)

Nạp từ [huong-nghien-cuu.html](../../web/pages/chung/huong-nghien-cuu.html).

**Sự kiện** `change`, `focusin`, `ie104:languagechange`, `input`.

### `assets/js/i18n`

#### [en-lecturer.js](../../web/assets/js/i18n/en-lecturer.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 7 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [en-public.js](../../web/assets/js/i18n/en-public.js)

Nạp từ [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../web/pages/chung/dang-nhap.html), [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html) và 10 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [en-shared.js](../../web/assets/js/i18n/en-shared.js)

Nạp từ [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../web/pages/chung/dang-nhap.html), [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html) và 36 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [en-student.js](../../web/assets/js/i18n/en-student.js)

Nạp từ [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 11 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

### `assets/js`

#### [nav-indicator.js](../../web/assets/js/nav-indicator.js)

Nạp từ [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html), [huong-nghien-cuu.html](../../web/pages/chung/huong-nghien-cuu.html) và 29 trang khác.

**Sự kiện** `change`, `focusin`, `focusout`, `loadingdone`, `pointerdown`, `pointerenter`, `pointerleave`, `resize`, `scroll`, `toggle`.

#### [notification-detail.js](../../web/assets/js/notification-detail.js)

Nạp từ [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [notifications-data.js](../../web/assets/js/notifications-data.js)

Nạp từ [thong-bao-bao-cao-nop-bai.html](../../web/pages/chung/thong-bao-bao-cao-nop-bai.html), [thong-bao-ke-hoach-hoc-vu.html](../../web/pages/chung/thong-bao-ke-hoach-hoc-vu.html), [thong-bao-lich-bao-ve.html](../../web/pages/chung/thong-bao-lich-bao-ve.html), [thong-bao-tong-ket-vinh-danh.html](../../web/pages/chung/thong-bao-tong-ket-vinh-danh.html) và 2 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [notifications.js](../../web/assets/js/notifications.js)

Nạp từ [thong-bao-bao-cao-nop-bai.html](../../web/pages/chung/thong-bao-bao-cao-nop-bai.html), [thong-bao-ke-hoach-hoc-vu.html](../../web/pages/chung/thong-bao-ke-hoach-hoc-vu.html), [thong-bao-lich-bao-ve.html](../../web/pages/chung/thong-bao-lich-bao-ve.html), [thong-bao-tong-ket-vinh-danh.html](../../web/pages/chung/thong-bao-tong-ket-vinh-danh.html) và 2 trang khác.

**Sự kiện** `click`, `popstate`.

**Hàm** [readState](../../web/assets/js/notifications.js#L45) (đọc dữ liệu), [stateUrl](../../web/assets/js/notifications.js#L55), [createCard](../../web/assets/js/notifications.js#L62) (khởi tạo hoặc tạo bản ghi), [addPageControl](../../web/assets/js/notifications.js#L82), [render](../../web/assets/js/notifications.js#L105) (dựng lại phần hiển thị), [navigate](../../web/assets/js/notifications.js#L146).

### `assets/js/pages/common`

#### [password-toggle.js](../../web/assets/js/pages/common/password-toggle.js)

Nạp từ [ho-so-ca-nhan.html](../../web/pages/sinh-vien/ho-so-ca-nhan.html).

**Sự kiện** `click`, `pageshow`, `reset`.

**Hàm** [setVisible](../../web/assets/js/pages/common/password-toggle.js#L7) (đặt giá trị hoặc trạng thái).

### `assets/js/pages/lecturer`

#### [created-topic.js](../../web/assets/js/pages/lecturer/created-topic.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html).

**Sự kiện** `ie104:lecturer-topic-state-changed`, `ie104:registrations-updated`, `pageshow`, `storage`.

**Hàm** [formatDate](../../web/assets/js/pages/lecturer/created-topic.js#L17), [render](../../web/assets/js/pages/lecturer/created-topic.js#L26) (dựng lại phần hiển thị).

#### [evaluation.js](../../web/assets/js/pages/lecturer/evaluation.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Sự kiện** `change`, `click`, `input`, `submit`.

**Hàm** [labelAction](../../web/assets/js/pages/lecturer/evaluation.js#L11), [attachmentPicker](../../web/assets/js/pages/lecturer/evaluation.js#L23), [showSelection](../../web/assets/js/pages/lecturer/evaluation.js#L33) (hiển thị trạng thái), [render](../../web/assets/js/pages/lecturer/evaluation.js#L79) (dựng lại phần hiển thị), [updateTotal](../../web/assets/js/pages/lecturer/evaluation.js#L125) (cập nhật dữ liệu), [input](../../web/assets/js/pages/lecturer/evaluation.js#L191), [preview](../../web/assets/js/pages/lecturer/evaluation.js#L200).

#### [invitation-preview.js](../../web/assets/js/pages/lecturer/invitation-preview.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `click`, `close`.

**Hàm** [node](../../web/assets/js/pages/lecturer/invitation-preview.js#L39), [button](../../web/assets/js/pages/lecturer/invitation-preview.js#L45), [close](../../web/assets/js/pages/lecturer/invitation-preview.js#L51), [decide](../../web/assets/js/pages/lecturer/invitation-preview.js#L56), [render](../../web/assets/js/pages/lecturer/invitation-preview.js#L83) (dựng lại phần hiển thị).

#### [invitation-topic.js](../../web/assets/js/pages/lecturer/invitation-topic.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html).

**Sự kiện** `storage`.

**Hàm** [refresh](../../web/assets/js/pages/lecturer/invitation-topic.js#L10).

#### [overview.js](../../web/assets/js/pages/lecturer/overview.js)

Nạp từ [tong-quan-giang-vien.html](../../web/pages/giang-vien/tong-quan-giang-vien.html).

**Sự kiện** `ie104:lecturer-topics-updated`, `ie104:registrations-updated`, `storage`.

**Hàm** [element](../../web/assets/js/pages/lecturer/overview.js#L25), [card](../../web/assets/js/pages/lecturer/overview.js#L32), [progressCard](../../web/assets/js/pages/lecturer/overview.js#L47), [proposalCard](../../web/assets/js/pages/lecturer/overview.js#L80), [renderChart](../../web/assets/js/pages/lecturer/overview.js#L104) (dựng lại phần hiển thị), [render](../../web/assets/js/pages/lecturer/overview.js#L141) (dựng lại phần hiển thị).

#### [profile-fields.js](../../web/assets/js/pages/lecturer/profile-fields.js)

Không thấy thẻ script HTML nạp trực tiếp.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [profile.js](../../web/assets/js/pages/lecturer/profile.js)

Nạp từ [ho-so-ca-nhan-giang-vien.html](../../web/pages/giang-vien/ho-so-ca-nhan-giang-vien.html).

**Sự kiện** `cancel`, `change`, `click`, `close`, `pageshow`, `storage`, `submit`.

**Hàm** [refresh](../../web/assets/js/pages/lecturer/profile.js#L17).

#### [progress.js](../../web/assets/js/pages/lecturer/progress.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Sự kiện** `click`, `close`.

**Hàm** [taskCard](../../web/assets/js/pages/lecturer/progress.js#L20), [renderCatalogCards](../../web/assets/js/pages/lecturer/progress.js#L43) (dựng lại phần hiển thị).

#### [project-invitations.js](../../web/assets/js/pages/lecturer/project-invitations.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `click`, `ie104:project-team-updated`, `pageshow`, `storage`, `visibilitychange`.

**Hàm** [refresh](../../web/assets/js/pages/lecturer/project-invitations.js#L14).

#### [source-metadata.js](../../web/assets/js/pages/lecturer/source-metadata.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `ie104:lecturer-topic-rendered`, `ie104:lecturer-topics-rendered`, `pageshow`.

**Hàm** [defaultImages](../../web/assets/js/pages/lecturer/source-metadata.js#L14), [render](../../web/assets/js/pages/lecturer/source-metadata.js#L20) (dựng lại phần hiển thị).

#### [submissions.js](../../web/assets/js/pages/lecturer/submissions.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Sự kiện** `click`, `close`, `focus`, `input`, `visibilitychange`.

**Hàm** [createSymbolIcon](../../web/assets/js/pages/lecturer/submissions.js#L24) (khởi tạo hoặc tạo bản ghi), [feedbackEditor](../../web/assets/js/pages/lecturer/submissions.js#L36), [editRequirement](../../web/assets/js/pages/lecturer/submissions.js#L44), [confirmDeleteRequirement](../../web/assets/js/pages/lecturer/submissions.js#L68), [reopenSubmissions](../../web/assets/js/pages/lecturer/submissions.js#L84), [submissionTime](../../web/assets/js/pages/lecturer/submissions.js#L89), [readSampleFile](../../web/assets/js/pages/lecturer/submissions.js#L95) (đọc dữ liệu), [requirementAttachments](../../web/assets/js/pages/lecturer/submissions.js#L101), [download](../../web/assets/js/pages/lecturer/submissions.js#L113), [viewRequirement](../../web/assets/js/pages/lecturer/submissions.js#L158), [board](../../web/assets/js/pages/lecturer/submissions.js#L205), [renderWithUploads](../../web/assets/js/pages/lecturer/submissions.js#L241) (dựng lại phần hiển thị), [readUploadFile](../../web/assets/js/pages/lecturer/submissions.js#L261) (đọc dữ liệu), [render](../../web/assets/js/pages/lecturer/submissions.js#L275) (dựng lại phần hiển thị), [checkFile](../../web/assets/js/pages/lecturer/submissions.js#L430).

#### [topic-editor.js](../../web/assets/js/pages/lecturer/topic-editor.js)

Nạp từ [chinh-sua-de-tai-giang-vien.html](../../web/pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html).

**Sự kiện** `beforeunload`, `change`, `click`, `close`, `input`, `pageshow`, `storage`, `submit`.

**Hàm** [select](../../web/assets/js/pages/lecturer/topic-editor.js#L46), [read](../../web/assets/js/pages/lecturer/topic-editor.js#L52) (đọc dữ liệu), [refreshCode](../../web/assets/js/pages/lecturer/topic-editor.js#L59), [showErrors](../../web/assets/js/pages/lecturer/topic-editor.js#L64) (hiển thị trạng thái), [errorField](../../web/assets/js/pages/lecturer/topic-editor.js#L89), [clearFieldError](../../web/assets/js/pages/lecturer/topic-editor.js#L93), [displayName](../../web/assets/js/pages/lecturer/topic-editor.js#L156), [reportFileError](../../web/assets/js/pages/lecturer/topic-editor.js#L163).

#### [topic-list.js](../../web/assets/js/pages/lecturer/topic-list.js)

Nạp từ [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Sự kiện** `DOMContentLoaded`, `click`, `ie104:lecturer-topics-updated`, `ie104:project-team-updated`, `ie104:registrations-updated`, `ie104:topics-updated`, `pageshow`, `pointerdown`, `storage`, `visibilitychange`.

**Hàm** [render](../../web/assets/js/pages/lecturer/topic-list.js#L15) (dựng lại phần hiển thị), [refreshReturn](../../web/assets/js/pages/lecturer/topic-list.js#L101).

#### [topic-media.js](../../web/assets/js/pages/lecturer/topic-media.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html).

**Sự kiện** `ie104:lecturer-topic-rendered`, `ie104:lecturer-topics-rendered`, `pagehide`, `pageshow`.

**Hàm** [render](../../web/assets/js/pages/lecturer/topic-media.js#L8) (dựng lại phần hiển thị).

#### [topic-registration-state.js](../../web/assets/js/pages/lecturer/topic-registration-state.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html).

**Sự kiện** `cancel`, `click`, `close`, `input`, `keydown`, `submit`.

#### [topic-sort.js](../../web/assets/js/pages/lecturer/topic-sort.js)

Nạp từ [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Sự kiện** `change`, `click`, `focusout`, `keydown`, `pageshow`, `pointerdown`, `reset`, `resize`, `scroll`.

**Hàm** [syncSelection](../../web/assets/js/pages/lecturer/topic-sort.js#L27) (đồng bộ trạng thái), [positionMenu](../../web/assets/js/pages/lecturer/topic-sort.js#L34), [openMenu](../../web/assets/js/pages/lecturer/topic-sort.js#L46), [closeMenu](../../web/assets/js/pages/lecturer/topic-sort.js#L54).

#### [workspace.js](../../web/assets/js/pages/lecturer/workspace.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Giao diện được công bố** `lecturerWorkspace`.

**Sự kiện** `DOMContentLoaded`, `beforeunload`, `click`, `close`, `keydown`, `pageshow`, `storage`, `submit`.

**Hàm** [overviewView](../../web/assets/js/pages/lecturer/workspace.js#L47), [notify](../../web/assets/js/pages/lecturer/workspace.js#L50), [refresh](../../web/assets/js/pages/lecturer/workspace.js#L54), [commit](../../web/assets/js/pages/lecturer/workspace.js#L75), [modal](../../web/assets/js/pages/lecturer/workspace.js#L92), [field](../../web/assets/js/pages/lecturer/workspace.js#L146).

### `assets/js/pages/student`

#### [deadline-calendar.js](../../web/assets/js/pages/student/deadline-calendar.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `click`, `close`, `pageshow`, `storage`.

**Hàm** [utcDate](../../web/assets/js/pages/student/deadline-calendar.js#L11), [eventButton](../../web/assets/js/pages/student/deadline-calendar.js#L17), [render](../../web/assets/js/pages/student/deadline-calendar.js#L57) (dựng lại phần hiển thị), [shiftMonth](../../web/assets/js/pages/student/deadline-calendar.js#L90).

#### [google-calendar-export.js](../../web/assets/js/pages/student/google-calendar-export.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `click`, `close`, `input`.

**Hàm** [normalize](../../web/assets/js/pages/student/google-calendar-export.js#L34), [isUitStudent](../../web/assets/js/pages/student/google-calendar-export.js#L38), [selectedIds](../../web/assets/js/pages/student/google-calendar-export.js#L42), [updateControls](../../web/assets/js/pages/student/google-calendar-export.js#L46) (cập nhật dữ liệu), [filterRows](../../web/assets/js/pages/student/google-calendar-export.js#L59), [createRow](../../web/assets/js/pages/student/google-calendar-export.js#L71) (khởi tạo hoặc tạo bản ghi), [setBusy](../../web/assets/js/pages/student/google-calendar-export.js#L87) (đặt giá trị hoặc trạng thái), [loadEvents](../../web/assets/js/pages/student/google-calendar-export.js#L92), [loadPicker](../../web/assets/js/pages/student/google-calendar-export.js#L104), [signIn](../../web/assets/js/pages/student/google-calendar-export.js#L125), [openPicker](../../web/assets/js/pages/student/google-calendar-export.js#L146), [submit](../../web/assets/js/pages/student/google-calendar-export.js#L161), [resumeConnection](../../web/assets/js/pages/student/google-calendar-export.js#L189).

#### [my-topics.js](../../web/assets/js/pages/student/my-topics.js)

Nạp từ [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html).

**Hàm** [participantsFor](../../web/assets/js/pages/student/my-topics.js#L13), [createCard](../../web/assets/js/pages/student/my-topics.js#L30) (khởi tạo hoặc tạo bản ghi).

#### [open-topic.js](../../web/assets/js/pages/student/open-topic.js)

Nạp từ [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html).

**Hàm** [toLines](../../web/assets/js/pages/student/open-topic.js#L53), [renderValue](../../web/assets/js/pages/student/open-topic.js#L58) (dựng lại phần hiển thị).

#### [overview.js](../../web/assets/js/pages/student/overview.js)

Nạp từ [tong-quan-sinh-vien.html](../../web/pages/sinh-vien/tong-quan-sinh-vien.html).

**Sự kiện** `pageshow`, `storage`.

**Hàm** [listUrl](../../web/assets/js/pages/student/overview.js#L28) (trả danh sách), [drawChart](../../web/assets/js/pages/student/overview.js#L34), [empty](../../web/assets/js/pages/student/overview.js#L79), [render](../../web/assets/js/pages/student/overview.js#L81) (dựng lại phần hiển thị).

#### [pending-request.js](../../web/assets/js/pages/student/pending-request.js)

Nạp từ [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html).

**Sự kiện** `cancel`, `click`, `close`, `ie104:proposals-updated`, `pageshow`, `storage`.

**Hàm** [findProposal](../../web/assets/js/pages/student/pending-request.js#L39) (tìm bản ghi), [statusMessage](../../web/assets/js/pages/student/pending-request.js#L69), [renderHistory](../../web/assets/js/pages/student/pending-request.js#L81) (dựng lại phần hiển thị), [renderRecipient](../../web/assets/js/pages/student/pending-request.js#L92) (dựng lại phần hiển thị), [render](../../web/assets/js/pages/student/pending-request.js#L125) (dựng lại phần hiển thị).

#### [profile-avatar.js](../../web/assets/js/pages/student/profile-avatar.js)

Nạp từ [ho-so-ca-nhan.html](../../web/pages/sinh-vien/ho-so-ca-nhan.html).

**Sự kiện** `cancel`, `change`, `click`, `close`, `pageshow`.

**Hàm** [clearPreview](../../web/assets/js/pages/student/profile-avatar.js#L20), [load](../../web/assets/js/pages/student/profile-avatar.js#L29).

#### [profile.js](../../web/assets/js/pages/student/profile.js)

Nạp từ [ho-so-ca-nhan.html](../../web/pages/sinh-vien/ho-so-ca-nhan.html).

**Sự kiện** `click`, `close`, `pagehide`, `pageshow`, `reset`, `storage`, `submit`.

**Hàm** [refresh](../../web/assets/js/pages/student/profile.js#L14), [clearEditErrors](../../web/assets/js/pages/student/profile.js#L40).

#### [proposal-date-picker.js](../../web/assets/js/pages/student/proposal-date-picker.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../web/pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác.

**Giao diện được công bố** `proposalDatePicker`.

**Sự kiện** `blur`, `change`, `click`, `focusout`, `keydown`, `paste`, `reset`.

**Hàm** [parseDate](../../web/assets/js/pages/student/proposal-date-picker.js#L24), [parseTime](../../web/assets/js/pages/student/proposal-date-picker.js#L33), [parseDateTime](../../web/assets/js/pages/student/proposal-date-picker.js#L38), [fillEnhancedDate](../../web/assets/js/pages/student/proposal-date-picker.js#L49), [createTimeColumn](../../web/assets/js/pages/student/proposal-date-picker.js#L56) (khởi tạo hoặc tạo bản ghi), [activate](../../web/assets/js/pages/student/proposal-date-picker.js#L69), [select](../../web/assets/js/pages/student/proposal-date-picker.js#L81), [enhanceDate](../../web/assets/js/pages/student/proposal-date-picker.js#L113), [render](../../web/assets/js/pages/student/proposal-date-picker.js#L226) (dựng lại phần hiển thị), [focusDay](../../web/assets/js/pages/student/proposal-date-picker.js#L266), [showMonths](../../web/assets/js/pages/student/proposal-date-picker.js#L277) (hiển thị trạng thái), [setYear](../../web/assets/js/pages/student/proposal-date-picker.js#L287) (đặt giá trị hoặc trạng thái), [close](../../web/assets/js/pages/student/proposal-date-picker.js#L295), [open](../../web/assets/js/pages/student/proposal-date-picker.js#L300), [commit](../../web/assets/js/pages/student/proposal-date-picker.js#L323), [updateActions](../../web/assets/js/pages/student/proposal-date-picker.js#L329) (cập nhật dữ liệu), [updateDateTime](../../web/assets/js/pages/student/proposal-date-picker.js#L333) (cập nhật dữ liệu), [choose](../../web/assets/js/pages/student/proposal-date-picker.js#L344), [openFromKeyboard](../../web/assets/js/pages/student/proposal-date-picker.js#L361).

#### [proposal-outline.js](../../web/assets/js/pages/student/proposal-outline.js)

Nạp từ [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html).

**Giao diện được công bố** `proposalOutline`.

**Sự kiện** `click`.

**Hàm** [addMember](../../web/assets/js/pages/student/proposal-outline.js#L14), [mountMembers](../../web/assets/js/pages/student/proposal-outline.js#L51), [fill](../../web/assets/js/pages/student/proposal-outline.js#L60), [read](../../web/assets/js/pages/student/proposal-outline.js#L78) (đọc dữ liệu), [getField](../../web/assets/js/pages/student/proposal-outline.js#L96) (tra cứu dữ liệu hoặc trạng thái), [setType](../../web/assets/js/pages/student/proposal-outline.js#L103) (đặt giá trị hoặc trạng thái).

#### [proposal-pickers.js](../../web/assets/js/pages/student/proposal-pickers.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../web/pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác.

**Giao diện được công bố** `proposalPickers`.

**Sự kiện** `beforetoggle`, `change`, `click`, `keydown`, `pointermove`, `resize`, `scroll`.

**Hàm** [setupPopup](../../web/assets/js/pages/student/proposal-pickers.js#L10) (đặt giá trị hoặc trạng thái), [place](../../web/assets/js/pages/student/proposal-pickers.js#L16), [enhanceSelect](../../web/assets/js/pages/student/proposal-pickers.js#L60), [sync](../../web/assets/js/pages/student/proposal-pickers.js#L97) (đồng bộ trạng thái), [activate](../../web/assets/js/pages/student/proposal-pickers.js#L105), [choose](../../web/assets/js/pages/student/proposal-pickers.js#L119), [open](../../web/assets/js/pages/student/proposal-pickers.js#L128).

#### [proposal-receipt.js](../../web/assets/js/pages/student/proposal-receipt.js)

Nạp từ [chi-tiet-de-xuat-da-luu.html](../../web/pages/sinh-vien/chi-tiet-de-xuat-da-luu.html), [chi-tiet-de-xuat-nhom.html](../../web/pages/sinh-vien/chi-tiet-de-xuat-nhom.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [published-topic-media.js](../../web/assets/js/pages/student/published-topic-media.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [dang-ky-de-tai.html](../../web/pages/sinh-vien/dang-ky-de-tai.html).

**Sự kiện** `ie104:published-topic-rendered`, `ie104:student-topics-rendered`, `pagehide`, `pageshow`.

**Hàm** [render](../../web/assets/js/pages/student/published-topic-media.js#L8) (dựng lại phần hiển thị).

#### [published-topic.js](../../web/assets/js/pages/student/published-topic.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html).

**Sự kiện** `DOMContentLoaded`, `ie104:published-topics-updated`, `keydown`, `pageshow`, `storage`.

**Hàm** [formatDate](../../web/assets/js/pages/student/published-topic.js#L17), [refresh](../../web/assets/js/pages/student/published-topic.js#L26).

#### [requests.js](../../web/assets/js/pages/student/requests.js)

Nạp từ [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html).

**Sự kiện** `change`, `click`, `close`, `hashchange`, `pageshow`, `popstate`, `storage`, `submit`.

**Hàm** [node](../../web/assets/js/pages/student/requests.js#L20), [row](../../web/assets/js/pages/student/requests.js#L27), [navigate](../../web/assets/js/pages/student/requests.js#L33), [review](../../web/assets/js/pages/student/requests.js#L40), [buildEditor](../../web/assets/js/pages/student/requests.js#L60) (dựng cấu trúc đầu ra), [field](../../web/assets/js/pages/student/requests.js#L73), [readMembers](../../web/assets/js/pages/student/requests.js#L103) (đọc dữ liệu), [drawMembers](../../web/assets/js/pages/student/requests.js#L106), [render](../../web/assets/js/pages/student/requests.js#L183) (dựng lại phần hiển thị).

### `assets/js/pages/student/topic-detail`

#### [evaluation.js](../../web/assets/js/pages/student/topic-detail/evaluation.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `click`, `pageshow`, `storage`.

**Hàm** [renderUnpublished](../../web/assets/js/pages/student/topic-detail/evaluation.js#L18) (dựng lại phần hiển thị), [renderAttachment](../../web/assets/js/pages/student/topic-detail/evaluation.js#L29) (dựng lại phần hiển thị), [renderPublished](../../web/assets/js/pages/student/topic-detail/evaluation.js#L42) (dựng lại phần hiển thị), [render](../../web/assets/js/pages/student/topic-detail/evaluation.js#L71) (dựng lại phần hiển thị).

#### [progress.js](../../web/assets/js/pages/student/topic-detail/progress.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `change`, `click`, `close`, `input`, `keydown`, `pageshow`, `storage`, `submit`.

**Hàm** [syncSelection](../../web/assets/js/pages/student/topic-detail/progress.js#L51) (đồng bộ trạng thái), [renderDetail](../../web/assets/js/pages/student/topic-detail/progress.js#L58) (dựng lại phần hiển thị), [showDetail](../../web/assets/js/pages/student/topic-detail/progress.js#L69) (hiển thị trạng thái), [focusTask](../../web/assets/js/pages/student/topic-detail/progress.js#L86), [updateAssigneeCount](../../web/assets/js/pages/student/topic-detail/progress.js#L143) (cập nhật dữ liệu), [resetAssignees](../../web/assets/js/pages/student/topic-detail/progress.js#L148), [element](../../web/assets/js/pages/student/topic-detail/progress.js#L169), [icon](../../web/assets/js/pages/student/topic-detail/progress.js#L176), [renderTask](../../web/assets/js/pages/student/topic-detail/progress.js#L198) (dựng lại phần hiển thị), [refresh](../../web/assets/js/pages/student/topic-detail/progress.js#L211), [validateTaskForm](../../web/assets/js/pages/student/topic-detail/progress.js#L273) (kiểm tra dữ liệu), [showError](../../web/assets/js/pages/student/topic-detail/progress.js#L296) (hiển thị trạng thái), [open](../../web/assets/js/pages/student/topic-detail/progress.js#L302).

#### [submission-upload.js](../../web/assets/js/pages/student/topic-detail/submission-upload.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `studentUpload`.

**Sự kiện** `cancel`, `change`, `click`, `close`, `submit`.

**Hàm** [mount](../../web/assets/js/pages/student/topic-detail/submission-upload.js#L9), [showError](../../web/assets/js/pages/student/topic-detail/submission-upload.js#L37) (hiển thị trạng thái), [updateControls](../../web/assets/js/pages/student/topic-detail/submission-upload.js#L42) (cập nhật dữ liệu), [renderFiles](../../web/assets/js/pages/student/topic-detail/submission-upload.js#L51) (dựng lại phần hiển thị), [open](../../web/assets/js/pages/student/topic-detail/submission-upload.js#L117).

#### [submission-zip.js](../../web/assets/js/pages/student/topic-detail/submission-zip.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Hàm** [crc32](../../web/assets/js/pages/student/topic-detail/submission-zip.js#L11), [uniqueName](../../web/assets/js/pages/student/topic-detail/submission-zip.js#L26), [submissionZipNames](../../web/assets/js/pages/student/topic-detail/submission-zip.js#L39), [createSubmissionZip](../../web/assets/js/pages/student/topic-detail/submission-zip.js#L44) (khởi tạo hoặc tạo bản ghi).

#### [submissions.js](../../web/assets/js/pages/student/topic-detail/submissions.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `click`, `close`, `focus`, `pageshow`, `storage`.

**Hàm** [element](../../web/assets/js/pages/student/topic-detail/submissions.js#L29), [time](../../web/assets/js/pages/student/topic-detail/submissions.js#L36), [deadlineBadge](../../web/assets/js/pages/student/topic-detail/submissions.js#L45), [boardIcon](../../web/assets/js/pages/student/topic-detail/submissions.js#L49), [demoBundle](../../web/assets/js/pages/student/topic-detail/submissions.js#L55), [sampleBundle](../../web/assets/js/pages/student/topic-detail/submissions.js#L63), [downloadRow](../../web/assets/js/pages/student/topic-detail/submissions.js#L73), [downloadButton](../../web/assets/js/pages/student/topic-detail/submissions.js#L81), [archiveName](../../web/assets/js/pages/student/topic-detail/submissions.js#L89), [bindUploadDownload](../../web/assets/js/pages/student/topic-detail/submissions.js#L93), [renderAttachments](../../web/assets/js/pages/student/topic-detail/submissions.js#L109) (dựng lại phần hiển thị), [appendSubmittedDetails](../../web/assets/js/pages/student/topic-detail/submissions.js#L168), [uploadButton](../../web/assets/js/pages/student/topic-detail/submissions.js#L182), [requirementCard](../../web/assets/js/pages/student/topic-detail/submissions.js#L202), [prepareSampleRequirements](../../web/assets/js/pages/student/topic-detail/submissions.js#L242), [submissionFileCard](../../web/assets/js/pages/student/topic-detail/submissions.js#L294), [viewFeedbackTrigger](../../web/assets/js/pages/student/topic-detail/submissions.js#L350), [openFeedback](../../web/assets/js/pages/student/topic-detail/submissions.js#L370), [sampleCardDeadline](../../web/assets/js/pages/student/topic-detail/submissions.js#L405), [renderSampleUploads](../../web/assets/js/pages/student/topic-detail/submissions.js#L409) (dựng lại phần hiển thị), [uploadSaved](../../web/assets/js/pages/student/topic-detail/submissions.js#L450), [board](../../web/assets/js/pages/student/topic-detail/submissions.js#L465), [sampleRows](../../web/assets/js/pages/student/topic-detail/submissions.js#L498), [updateSampleColumn](../../web/assets/js/pages/student/topic-detail/submissions.js#L505) (cập nhật dữ liệu), [newRow](../../web/assets/js/pages/student/topic-detail/submissions.js#L520), [sharedRequirementRow](../../web/assets/js/pages/student/topic-detail/submissions.js#L526), [renderSharedSample](../../web/assets/js/pages/student/topic-detail/submissions.js#L555) (dựng lại phần hiển thị), [render](../../web/assets/js/pages/student/topic-detail/submissions.js#L584) (dựng lại phần hiển thị), [renderLiveBoards](../../web/assets/js/pages/student/topic-detail/submissions.js#L625) (dựng lại phần hiển thị), [refreshUploads](../../web/assets/js/pages/student/topic-detail/submissions.js#L662), [openCalendarRequirement](../../web/assets/js/pages/student/topic-detail/submissions.js#L680).

#### [team.js](../../web/assets/js/pages/student/topic-detail/team.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `change`, `click`, `close`, `ie104:project-team-updated`, `input`, `keydown`, `pageshow`, `storage`, `submit`.

**Hàm** [showError](../../web/assets/js/pages/student/topic-detail/team.js#L51) (hiển thị trạng thái), [setResult](../../web/assets/js/pages/student/topic-detail/team.js#L57) (đặt giá trị hoặc trạng thái), [refresh](../../web/assets/js/pages/student/topic-detail/team.js#L63), [renderInvitations](../../web/assets/js/pages/student/topic-detail/team.js#L107) (dựng lại phần hiển thị), [updateResults](../../web/assets/js/pages/student/topic-detail/team.js#L201) (cập nhật dữ liệu), [renderInviteOptions](../../web/assets/js/pages/student/topic-detail/team.js#L221) (dựng lại phần hiển thị).

#### [workspace.js](../../web/assets/js/pages/student/topic-detail/workspace.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `DOMContentLoaded`, `ie104:project-team-updated`, `keydown`, `pageshow`, `storage`.

**Hàm** [refresh](../../web/assets/js/pages/student/topic-detail/workspace.js#L17), [initializeSubmissions](../../web/assets/js/pages/student/topic-detail/workspace.js#L75).

### `assets/js/pages/student`

#### [topic-enrollment.js](../../web/assets/js/pages/student/topic-enrollment.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html).

**Sự kiện** `click`, `close`, `ie104:published-topics-updated`, `pageshow`, `storage`, `submit`.

**Hàm** [cards](../../web/assets/js/pages/student/topic-enrollment.js#L51), [controls](../../web/assets/js/pages/student/topic-enrollment.js#L55), [readValue](../../web/assets/js/pages/student/topic-enrollment.js#L59) (đọc dữ liệu), [clearErrors](../../web/assets/js/pages/student/topic-enrollment.js#L67), [showErrors](../../web/assets/js/pages/student/topic-enrollment.js#L78) (hiển thị trạng thái), [refreshMembers](../../web/assets/js/pages/student/topic-enrollment.js#L106), [showSaved](../../web/assets/js/pages/student/topic-enrollment.js#L138) (hiển thị trạng thái), [checkExisting](../../web/assets/js/pages/student/topic-enrollment.js#L164), [showReview](../../web/assets/js/pages/student/topic-enrollment.js#L189) (hiển thị trạng thái), [renderMember](../../web/assets/js/pages/student/topic-enrollment.js#L221) (dựng lại phần hiển thị), [openMember](../../web/assets/js/pages/student/topic-enrollment.js#L270).

#### [topic-proposal.js](../../web/assets/js/pages/student/topic-proposal.js)

Nạp từ [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html).

**Sự kiện** `cancel`, `change`, `click`, `close`, `pageshow`, `reset`, `storage`, `submit`.

**Hàm** [showCover](../../web/assets/js/pages/student/topic-proposal.js#L61) (hiển thị trạng thái), [showAttachment](../../web/assets/js/pages/student/topic-proposal.js#L68) (hiển thị trạng thái), [fillOriginal](../../web/assets/js/pages/student/topic-proposal.js#L76), [showLegacyValues](../../web/assets/js/pages/student/topic-proposal.js#L94) (hiển thị trạng thái), [updateCourse](../../web/assets/js/pages/student/topic-proposal.js#L105) (cập nhật dữ liệu), [updateTopicCode](../../web/assets/js/pages/student/topic-proposal.js#L129) (cập nhật dữ liệu), [clearFieldError](../../web/assets/js/pages/student/topic-proposal.js#L145), [clearErrors](../../web/assets/js/pages/student/topic-proposal.js#L152), [readInput](../../web/assets/js/pages/student/topic-proposal.js#L158) (đọc dữ liệu), [showErrors](../../web/assets/js/pages/student/topic-proposal.js#L162) (hiển thị trạng thái), [review](../../web/assets/js/pages/student/topic-proposal.js#L185), [showSavedResult](../../web/assets/js/pages/student/topic-proposal.js#L339) (hiển thị trạng thái), [saveProposal](../../web/assets/js/pages/student/topic-proposal.js#L349) (lưu dữ liệu).

#### [topic-registration.js](../../web/assets/js/pages/student/topic-registration.js)

Nạp từ [dang-ky-de-tai.html](../../web/pages/sinh-vien/dang-ky-de-tai.html).

**Sự kiện** `ie104:published-topics-updated`, `storage`.

**Hàm** [createCard](../../web/assets/js/pages/student/topic-registration.js#L5) (khởi tạo hoặc tạo bản ghi), [refreshLecturers](../../web/assets/js/pages/student/topic-registration.js#L26).

### `assets/js`

#### [password-toggle.js](../../web/assets/js/password-toggle.js)

Nạp từ [dang-nhap.html](../../web/pages/chung/dang-nhap.html), [quen-mat-khau.html](../../web/pages/chung/quen-mat-khau.html).

**Sự kiện** `click`, `pageshow`, `reset`.

**Hàm** [setVisible](../../web/assets/js/password-toggle.js#L7) (đặt giá trị hoặc trạng thái).

#### [pending-proposals.js](../../web/assets/js/pending-proposals.js)

Nạp từ [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html).

**Sự kiện** `change`, `click`, `input`, `pageshow`, `popstate`, `reset`, `submit`.

**Hàm** [courseKey](../../web/assets/js/pending-proposals.js#L34), [readUrl](../../web/assets/js/pending-proposals.js#L39) (đọc dữ liệu), [pageUrl](../../web/assets/js/pending-proposals.js#L58), [writeUrl](../../web/assets/js/pending-proposals.js#L71) (ghi dữ liệu), [makeCard](../../web/assets/js/pending-proposals.js#L82), [renderPagination](../../web/assets/js/pending-proposals.js#L128) (dựng lại phần hiển thị), [addPage](../../web/assets/js/pending-proposals.js#L131), [render](../../web/assets/js/pending-proposals.js#L159) (dựng lại phần hiển thị).

#### [proposal-detail.js](../../web/assets/js/proposal-detail.js)

Nạp từ [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html).

**Sự kiện** `beforetoggle`, `input`, `submit`.

**Hàm** [text](../../web/assets/js/proposal-detail.js#L53), [render](../../web/assets/js/proposal-detail.js#L58) (dựng lại phần hiển thị), [validateReason](../../web/assets/js/proposal-detail.js#L159) (kiểm tra dữ liệu).

#### [proposal-store.js](../../web/assets/js/proposal-store.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 11 trang khác.

**Sự kiện** `ie104:proposals-updated`, `ie104:registrations-updated`, `pageshow`, `storage`.

**Hàm** [readDecision](../../web/assets/js/proposal-store.js#L60) (đọc dữ liệu), [seedRecord](../../web/assets/js/proposal-store.js#L73), [getApprovedSeed](../../web/assets/js/proposal-store.js#L82) (tra cứu dữ liệu hoặc trạng thái), [getAll](../../web/assets/js/proposal-store.js#L90) (tra cứu dữ liệu hoặc trạng thái), [get](../../web/assets/js/proposal-store.js#L107) (tra cứu dữ liệu hoặc trạng thái), [notify](../../web/assets/js/proposal-store.js#L124), [decide](../../web/assets/js/proposal-store.js#L128).

#### [recovery-otp.js](../../web/assets/js/recovery-otp.js)

Nạp từ [quen-mat-khau.html](../../web/pages/chung/quen-mat-khau.html).

**Sự kiện** `change`, `click`, `focus`, `input`, `keydown`, `paste`, `submit`.

**Hàm** [request](../../web/assets/js/recovery-otp.js#L35), [waitLabel](../../web/assets/js/recovery-otp.js#L51), [updateResend](../../web/assets/js/recovery-otp.js#L57) (cập nhật dữ liệu), [startCountdown](../../web/assets/js/recovery-otp.js#L64), [run](../../web/assets/js/recovery-otp.js#L71), [showStep](../../web/assets/js/recovery-otp.js#L92) (hiển thị trạng thái), [fillDigits](../../web/assets/js/recovery-otp.js#L100), [sendCode](../../web/assets/js/recovery-otp.js#L109), [passwordLevel](../../web/assets/js/recovery-otp.js#L206), [updatePasswordFeedback](../../web/assets/js/recovery-otp.js#L212) (cập nhật dữ liệu).

### `assets/js/services`

#### [approved-project-service.js](../../web/assets/js/services/approved-project-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 11 trang khác.

**Giao diện được công bố** `approvedProjects`.

**Hàm** [proposalContent](../../web/assets/js/services/approved-project-service.js#L9), [definitions](../../web/assets/js/services/approved-project-service.js#L25), [get](../../web/assets/js/services/approved-project-service.js#L74) (tra cứu dữ liệu hoặc trạng thái), [studentCanView](../../web/assets/js/services/approved-project-service.js#L103), [forStudent](../../web/assets/js/services/approved-project-service.js#L108), [canSupervise](../../web/assets/js/services/approved-project-service.js#L115), [list](../../web/assets/js/services/approved-project-service.js#L121) (trả danh sách).

#### [avatar-service.js](../../web/assets/js/services/avatar-service.js)

Nạp từ [ho-so-ca-nhan.html](../../web/pages/sinh-vien/ho-so-ca-nhan.html).

**Giao diện được công bố** `avatar`.

**Hàm** [validate](../../web/assets/js/services/avatar-service.js#L7) (kiểm tra dữ liệu), [transact](../../web/assets/js/services/avatar-service.js#L11), [read](../../web/assets/js/services/avatar-service.js#L40) (đọc dữ liệu), [save](../../web/assets/js/services/avatar-service.js#L46) (lưu dữ liệu).

#### [deadline-service.js](../../web/assets/js/services/deadline-service.js)

Nạp từ [lich-han-nop.html](../../web/pages/sinh-vien/lich-han-nop.html).

**Giao diện được công bố** `deadlines`.

**Hàm** [today](../../web/assets/js/services/deadline-service.js#L5), [getState](../../web/assets/js/services/deadline-service.js#L11) (tra cứu dữ liệu hoặc trạng thái), [dateTime](../../web/assets/js/services/deadline-service.js#L49), [getActiveDeadlines](../../web/assets/js/services/deadline-service.js#L54) (tra cứu dữ liệu hoặc trạng thái).

#### [evaluation-service.js](../../web/assets/js/services/evaluation-service.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `evaluations`.

**Hàm** [getResult](../../web/assets/js/services/evaluation-service.js#L7) (tra cứu dữ liệu hoặc trạng thái).

#### [lecturer-profile-service.js](../../web/assets/js/services/lecturer-profile-service.js)

Nạp từ [ho-so-ca-nhan-giang-vien.html](../../web/pages/giang-vien/ho-so-ca-nhan-giang-vien.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html).

**Giao diện được công bố** `lecturerProfile`.

**Hàm** [validate](../../web/assets/js/services/lecturer-profile-service.js#L7) (kiểm tra dữ liệu), [getState](../../web/assets/js/services/lecturer-profile-service.js#L17) (tra cứu dữ liệu hoặc trạng thái), [update](../../web/assets/js/services/lecturer-profile-service.js#L32) (cập nhật dữ liệu).

#### [lecturer-topic-editor-service.js](../../web/assets/js/services/lecturer-topic-editor-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../web/pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html).

**Giao diện được công bố** `lecturerTopicEditor`.

**Hàm** [getSupervisor](../../web/assets/js/services/lecturer-topic-editor-service.js#L20) (tra cứu dữ liệu hoặc trạng thái), [nextCode](../../web/assets/js/services/lecturer-topic-editor-service.js#L28), [requiresMethodPlan](../../web/assets/js/services/lecturer-topic-editor-service.js#L38), [validate](../../web/assets/js/services/lecturer-topic-editor-service.js#L43) (kiểm tra dữ liệu), [save](../../web/assets/js/services/lecturer-topic-editor-service.js#L107) (lưu dữ liệu), [setRegistration](../../web/assets/js/services/lecturer-topic-editor-service.js#L149) (đặt giá trị hoặc trạng thái).

#### [lecturer-topic-file-service.js](../../web/assets/js/services/lecturer-topic-file-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../web/pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 2 trang khác.

**Giao diện được công bố** `lecturerTopicFiles`.

**Hàm** [validate](../../web/assets/js/services/lecturer-topic-file-service.js#L4) (kiểm tra dữ liệu), [transaction](../../web/assets/js/services/lecturer-topic-file-service.js#L10), [validateSelection](../../web/assets/js/services/lecturer-topic-file-service.js#L31) (kiểm tra dữ liệu), [stage](../../web/assets/js/services/lecturer-topic-file-service.js#L40), [readResolved](../../web/assets/js/services/lecturer-topic-file-service.js#L48) (đọc dữ liệu), [readPublished](../../web/assets/js/services/lecturer-topic-file-service.js#L60) (đọc dữ liệu), [discard](../../web/assets/js/services/lecturer-topic-file-service.js#L64).

#### [lecturer-topic-repository.js](../../web/assets/js/services/lecturer-topic-repository.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 12 trang khác.

**Giao diện được công bố** `lecturerTopicRepository`.

**Hàm** [valid](../../web/assets/js/services/lecturer-topic-repository.js#L7), [read](../../web/assets/js/services/lecturer-topic-repository.js#L11) (đọc dữ liệu), [write](../../web/assets/js/services/lecturer-topic-repository.js#L21) (ghi dữ liệu).

#### [lecturer-topic-service.js](../../web/assets/js/services/lecturer-topic-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 15 trang khác.

**Giao diện được công bố** `lecturerTopics`.

**Hàm** [registeredTopicIds](../../web/assets/js/services/lecturer-topic-service.js#L72), [createdStatus](../../web/assets/js/services/lecturer-topic-service.js#L87) (khởi tạo hoặc tạo bản ghi), [list](../../web/assets/js/services/lecturer-topic-service.js#L96) (trả danh sách), [get](../../web/assets/js/services/lecturer-topic-service.js#L116) (tra cứu dữ liệu hoặc trạng thái), [detailUrl](../../web/assets/js/services/lecturer-topic-service.js#L132), [returnUrl](../../web/assets/js/services/lecturer-topic-service.js#L137), [workspaceChoices](../../web/assets/js/services/lecturer-topic-service.js#L148), [supervisedParticipants](../../web/assets/js/services/lecturer-topic-service.js#L158), [projectIdentity](../../web/assets/js/services/lecturer-topic-service.js#L183), [workspaceState](../../web/assets/js/services/lecturer-topic-service.js#L201).

#### [profile-service.js](../../web/assets/js/services/profile-service.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html), [ho-so-ca-nhan.html](../../web/pages/sinh-vien/ho-so-ca-nhan.html), [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html).

**Giao diện được công bố** `profile`.

**Hàm** [validate](../../web/assets/js/services/profile-service.js#L5) (kiểm tra dữ liệu), [getState](../../web/assets/js/services/profile-service.js#L14) (tra cứu dữ liệu hoặc trạng thái), [update](../../web/assets/js/services/profile-service.js#L22) (cập nhật dữ liệu), [validatePassword](../../web/assets/js/services/profile-service.js#L32) (kiểm tra dữ liệu).

#### [project-invitation-identity.js](../../web/assets/js/services/project-invitation-identity.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Giao diện được công bố** `invitationIdentity`.

**Hàm** [resolve](../../web/assets/js/services/project-invitation-identity.js#L5).

#### [project-progress-service.js](../../web/assets/js/services/project-progress-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) và 3 trang khác.

**Giao diện được công bố** `projectProgress`.

**Hàm** [stateFrom](../../web/assets/js/services/project-progress-service.js#L13), [getState](../../web/assets/js/services/project-progress-service.js#L20) (tra cứu dữ liệu hoặc trạng thái), [getPermissions](../../web/assets/js/services/project-progress-service.js#L25) (tra cứu dữ liệu hoặc trạng thái), [canUpdateTask](../../web/assets/js/services/project-progress-service.js#L36), [validateTask](../../web/assets/js/services/project-progress-service.js#L41) (kiểm tra dữ liệu), [validateUpdate](../../web/assets/js/services/project-progress-service.js#L72) (kiểm tra dữ liệu), [mutate](../../web/assets/js/services/project-progress-service.js#L83), [saveTask](../../web/assets/js/services/project-progress-service.js#L97) (lưu dữ liệu), [deleteTask](../../web/assets/js/services/project-progress-service.js#L119) (xóa theo quy tắc nghiệp vụ), [deleteTasks](../../web/assets/js/services/project-progress-service.js#L123) (xóa theo quy tắc nghiệp vụ), [updateProgress](../../web/assets/js/services/project-progress-service.js#L132) (cập nhật dữ liệu), [summarize](../../web/assets/js/services/project-progress-service.js#L146).

#### [project-team-service.js](../../web/assets/js/services/project-team-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html) và 7 trang khác.

**Giao diện được công bố** `projectTeams`.

**Hàm** [getDefinition](../../web/assets/js/services/project-team-service.js#L6) (tra cứu dữ liệu hoặc trạng thái), [stateFrom](../../web/assets/js/services/project-team-service.js#L16), [supervisorIds](../../web/assets/js/services/project-team-service.js#L21), [getState](../../web/assets/js/services/project-team-service.js#L25) (tra cứu dữ liệu hoặc trạng thái), [getPermission](../../web/assets/js/services/project-team-service.js#L39) (tra cứu dữ liệu hoặc trạng thái), [validateMember](../../web/assets/js/services/project-team-service.js#L46) (kiểm tra dữ liệu), [canInvite](../../web/assets/js/services/project-team-service.js#L57), [getLecturers](../../web/assets/js/services/project-team-service.js#L65) (tra cứu dữ liệu hoặc trạng thái), [mutate](../../web/assets/js/services/project-team-service.js#L71), [addMember](../../web/assets/js/services/project-team-service.js#L85), [inviteSupervisor](../../web/assets/js/services/project-team-service.js#L93), [checkChange](../../web/assets/js/services/project-team-service.js#L120), [cancelInvitation](../../web/assets/js/services/project-team-service.js#L126), [canReview](../../web/assets/js/services/project-team-service.js#L142), [listInvitations](../../web/assets/js/services/project-team-service.js#L147) (trả danh sách), [invitationDetail](../../web/assets/js/services/project-team-service.js#L162), [respondInvitation](../../web/assets/js/services/project-team-service.js#L172).

#### [proposal-file-service.js](../../web/assets/js/services/proposal-file-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html) và 4 trang khác.

**Giao diện được công bố** `proposalFiles`.

**Hàm** [transaction](../../web/assets/js/services/proposal-file-service.js#L6), [stage](../../web/assets/js/services/proposal-file-service.js#L39), [read](../../web/assets/js/services/proposal-file-service.js#L47) (đọc dữ liệu), [validateImage](../../web/assets/js/services/proposal-file-service.js#L56) (kiểm tra dữ liệu), [stageImage](../../web/assets/js/services/proposal-file-service.js#L62).

#### [proposal-service.js](../../web/assets/js/services/proposal-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 10 trang khác.

**Giao diện được công bố** `proposals`.

**Hàm** [listSupervisors](../../web/assets/js/services/proposal-service.js#L34) (trả danh sách), [catalogFor](../../web/assets/js/services/proposal-service.js#L40), [notify](../../web/assets/js/services/proposal-service.js#L46), [save](../../web/assets/js/services/proposal-service.js#L50) (lưu dữ liệu), [submittingStudent](../../web/assets/js/services/proposal-service.js#L55), [validateForStudent](../../web/assets/js/services/proposal-service.js#L60) (kiểm tra dữ liệu), [validate](../../web/assets/js/services/proposal-service.js#L68) (kiểm tra dữ liệu), [nextTopicCode](../../web/assets/js/services/proposal-service.js#L72), [create](../../web/assets/js/services/proposal-service.js#L100) (khởi tạo hoặc tạo bản ghi), [findById](../../web/assets/js/services/proposal-service.js#L125) (tìm bản ghi), [rejectDuplicate](../../web/assets/js/services/proposal-service.js#L129), [getEditable](../../web/assets/js/services/proposal-service.js#L134) (tra cứu dữ liệu hoặc trạng thái), [update](../../web/assets/js/services/proposal-service.js#L143) (cập nhật dữ liệu), [withdraw](../../web/assets/js/services/proposal-service.js#L156), [listMyTopics](../../web/assets/js/services/proposal-service.js#L164) (trả danh sách), [canReview](../../web/assets/js/services/proposal-service.js#L196), [listForLecturer](../../web/assets/js/services/proposal-service.js#L202) (trả danh sách), [withWriteLock](../../web/assets/js/services/proposal-service.js#L223), [decide](../../web/assets/js/services/proposal-service.js#L231).

#### [published-topic-service.js](../../web/assets/js/services/published-topic-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 11 trang khác.

**Giao diện được công bố** `publishedTopics`.

**Hàm** [complete](../../web/assets/js/services/published-topic-service.js#L6), [availability](../../web/assets/js/services/published-topic-service.js#L9), [project](../../web/assets/js/services/published-topic-service.js#L16), [get](../../web/assets/js/services/published-topic-service.js#L31) (tra cứu dữ liệu hoặc trạng thái), [list](../../web/assets/js/services/published-topic-service.js#L35) (trả danh sách), [findEdited](../../web/assets/js/services/published-topic-service.js#L38) (tìm bản ghi), [requireOpen](../../web/assets/js/services/published-topic-service.js#L48).

#### [registration-service.js](../../web/assets/js/services/registration-service.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 11 trang khác.

**Giao diện được công bố** `registrations`.

**Hàm** [getTopic](../../web/assets/js/services/registration-service.js#L13) (tra cứu dữ liệu hoặc trạng thái), [getRules](../../web/assets/js/services/registration-service.js#L21) (tra cứu dữ liệu hoặc trạng thái), [findByTopic](../../web/assets/js/services/registration-service.js#L25) (tìm bản ghi), [findById](../../web/assets/js/services/registration-service.js#L33) (tìm bản ghi), [validateEnrollment](../../web/assets/js/services/registration-service.js#L37) (kiểm tra dữ liệu), [create](../../web/assets/js/services/registration-service.js#L43) (khởi tạo hoặc tạo bản ghi), [submit](../../web/assets/js/services/registration-service.js#L74), [save](../../web/assets/js/services/registration-service.js#L82) (lưu dữ liệu), [listForLecturer](../../web/assets/js/services/registration-service.js#L87) (trả danh sách), [decide](../../web/assets/js/services/registration-service.js#L108), [listMyTopics](../../web/assets/js/services/registration-service.js#L128) (trả danh sách).

#### [request-service.js](../../web/assets/js/services/request-service.js)

Nạp từ [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html), [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html) và 1 trang khác.

**Giao diện được công bố** `requests`.

**Hàm** [withSeedDecision](../../web/assets/js/services/request-service.js#L8), [recordsFrom](../../web/assets/js/services/request-service.js#L15), [list](../../web/assets/js/services/request-service.js#L20) (trả danh sách), [findById](../../web/assets/js/services/request-service.js#L24) (tìm bản ghi), [permissions](../../web/assets/js/services/request-service.js#L28), [isStudentProposal](../../web/assets/js/services/request-service.js#L33), [findStudentProposal](../../web/assets/js/services/request-service.js#L38) (tìm bản ghi), [proposalForEdit](../../web/assets/js/services/request-service.js#L43), [proposalCatalog](../../web/assets/js/services/request-service.js#L56), [validateProposal](../../web/assets/js/services/request-service.js#L63) (kiểm tra dữ liệu), [proposalChanges](../../web/assets/js/services/request-service.js#L73), [validate](../../web/assets/js/services/request-service.js#L94) (kiểm tra dữ liệu), [mutate](../../web/assets/js/services/request-service.js#L111), [mutateProposal](../../web/assets/js/services/request-service.js#L142), [updateProposal](../../web/assets/js/services/request-service.js#L149) (cập nhật dữ liệu), [withdrawProposal](../../web/assets/js/services/request-service.js#L153), [removeProposal](../../web/assets/js/services/request-service.js#L157), [applyToTopics](../../web/assets/js/services/request-service.js#L161), [recent](../../web/assets/js/services/request-service.js#L176).

#### [storage.js](../../web/assets/js/services/storage.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 18 trang khác.

**Hàm** [readRegistrations](../../web/assets/js/services/storage.js#L5) (đọc dữ liệu), [writeRegistrations](../../web/assets/js/services/storage.js#L38) (ghi dữ liệu), [validProposalCover](../../web/assets/js/services/storage.js#L48), [isProposalOutline](../../web/assets/js/services/storage.js#L54), [isProposalRecord](../../web/assets/js/services/storage.js#L74), [readProposals](../../web/assets/js/services/storage.js#L97) (đọc dữ liệu), [writeProposals](../../web/assets/js/services/storage.js#L113) (ghi dữ liệu), [readProjectTeams](../../web/assets/js/services/storage.js#L123) (đọc dữ liệu), [writeProjectTeams](../../web/assets/js/services/storage.js#L144) (ghi dữ liệu), [readProjectProgress](../../web/assets/js/services/storage.js#L154) (đọc dữ liệu), [writeProjectProgress](../../web/assets/js/services/storage.js#L184) (ghi dữ liệu), [readProfile](../../web/assets/js/services/storage.js#L194) (đọc dữ liệu), [writeProfile](../../web/assets/js/services/storage.js#L208) (ghi dữ liệu), [readRequests](../../web/assets/js/services/storage.js#L215) (đọc dữ liệu), [writeRequests](../../web/assets/js/services/storage.js#L238) (ghi dữ liệu), [readTeachingRecords](../../web/assets/js/services/storage.js#L245) (đọc dữ liệu), [writeTeachingRecords](../../web/assets/js/services/storage.js#L271) (ghi dữ liệu).

#### [student-overview-service.js](../../web/assets/js/services/student-overview-service.js)

Nạp từ [tong-quan-sinh-vien.html](../../web/pages/sinh-vien/tong-quan-sinh-vien.html).

**Giao diện được công bố** `overview`.

**Hàm** [getState](../../web/assets/js/services/student-overview-service.js#L5) (tra cứu dữ liệu hoặc trạng thái).

#### [student-submissions-service.js](../../web/assets/js/services/student-submissions-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [lich-han-nop.html](../../web/pages/sinh-vien/lich-han-nop.html).

**Giao diện được công bố** `studentSubmissions`.

**Sự kiện** `message`.

**Hàm** [forStudent](../../web/assets/js/services/student-submissions-service.js#L12), [localUploads](../../web/assets/js/services/student-submissions-service.js#L57), [readUploads](../../web/assets/js/services/student-submissions-service.js#L90) (đọc dữ liệu), [onUploadsChanged](../../web/assets/js/services/student-submissions-service.js#L96), [legacyCopy](../../web/assets/js/services/student-submissions-service.js#L100), [withLegacyFeedback](../../web/assets/js/services/student-submissions-service.js#L105), [visibleSubmissions](../../web/assets/js/services/student-submissions-service.js#L111), [uploadRequirement](../../web/assets/js/services/student-submissions-service.js#L124), [saveUpload](../../web/assets/js/services/student-submissions-service.js#L135) (lưu dữ liệu), [deleteUnsubmittedRequirement](../../web/assets/js/services/student-submissions-service.js#L178) (xóa theo quy tắc nghiệp vụ), [reviewUpload](../../web/assets/js/services/student-submissions-service.js#L198).

#### [student-topic-codes.js](../../web/assets/js/services/student-topic-codes.js)

Nạp từ [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html) và 4 trang khác.

**Hàm** [typeOf](../../web/assets/js/services/student-topic-codes.js#L19), [titleKey](../../web/assets/js/services/student-topic-codes.js#L24), [candidate](../../web/assets/js/services/student-topic-codes.js#L28), [buildCodes](../../web/assets/js/services/student-topic-codes.js#L34) (dựng cấu trúc đầu ra), [get](../../web/assets/js/services/student-topic-codes.js#L52) (tra cứu dữ liệu hoặc trạng thái).

#### [submission-file-service.js](../../web/assets/js/services/submission-file-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Giao diện được công bố** `submissionFiles`.

**Hàm** [accessFile](../../web/assets/js/services/submission-file-service.js#L8), [lookup](../../web/assets/js/services/submission-file-service.js#L41), [availability](../../web/assets/js/services/submission-file-service.js#L53), [read](../../web/assets/js/services/submission-file-service.js#L58) (đọc dữ liệu).

#### [task-comments-service.js](../../web/assets/js/services/task-comments-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `taskComments`.

**Hàm** [authorFor](../../web/assets/js/services/task-comments-service.js#L8), [openDatabase](../../web/assets/js/services/task-comments-service.js#L26), [transact](../../web/assets/js/services/task-comments-service.js#L58), [read](../../web/assets/js/services/task-comments-service.js#L79) (đọc dữ liệu), [add](../../web/assets/js/services/task-comments-service.js#L88), [insert](../../web/assets/js/services/task-comments-service.js#L98).

#### [teaching-service.js](../../web/assets/js/services/teaching-service.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác.

**Giao diện được công bố** `teaching`.

**Hàm** [context](../../web/assets/js/services/teaching-service.js#L8), [supervisedProjects](../../web/assets/js/services/teaching-service.js#L22), [listProjects](../../web/assets/js/services/teaching-service.js#L33) (trả danh sách), [listActiveProjects](../../web/assets/js/services/teaching-service.js#L37) (trả danh sách), [listSupervisedProjects](../../web/assets/js/services/teaching-service.js#L41) (trả danh sách), [stateFrom](../../web/assets/js/services/teaching-service.js#L45), [evaluationCriteria](../../web/assets/js/services/teaching-service.js#L56), [decorate](../../web/assets/js/services/teaching-service.js#L66), [getState](../../web/assets/js/services/teaching-service.js#L76) (tra cứu dữ liệu hoặc trạng thái), [getSubmission](../../web/assets/js/services/teaching-service.js#L81) (tra cứu dữ liệu hoặc trạng thái), [mutate](../../web/assets/js/services/teaching-service.js#L89), [active](../../web/assets/js/services/teaching-service.js#L102), [validateRequirement](../../web/assets/js/services/teaching-service.js#L106) (kiểm tra dữ liệu), [saveRequirement](../../web/assets/js/services/teaching-service.js#L124) (lưu dữ liệu), [deleteRequirement](../../web/assets/js/services/teaching-service.js#L137) (xóa theo quy tắc nghiệp vụ), [setLocked](../../web/assets/js/services/teaching-service.js#L147) (đặt giá trị hoặc trạng thái), [addProgressReview](../../web/assets/js/services/teaching-service.js#L159), [assertFeedbackAllowed](../../web/assets/js/services/teaching-service.js#L171), [saveFeedback](../../web/assets/js/services/teaching-service.js#L177) (lưu dữ liệu), [validateEvaluation](../../web/assets/js/services/teaching-service.js#L191) (kiểm tra dữ liệu), [publish](../../web/assets/js/services/teaching-service.js#L208), [submissionAccess](../../web/assets/js/services/teaching-service.js#L226).

#### [topic-service.js](../../web/assets/js/services/topic-service.js)

Nạp từ [dang-ky-de-tai.html](../../web/pages/sinh-vien/dang-ky-de-tai.html), [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html), [tong-quan-sinh-vien.html](../../web/pages/sinh-vien/tong-quan-sinh-vien.html).

**Giao diện được công bố** `topics`.

**Hàm** [normalizeText](../../web/assets/js/services/topic-service.js#L10), [courseKey](../../web/assets/js/services/topic-service.js#L20), [listTopics](../../web/assets/js/services/topic-service.js#L26) (trả danh sách), [listOpenTopics](../../web/assets/js/services/topic-service.js#L78) (trả danh sách), [normalizeMyTopic](../../web/assets/js/services/topic-service.js#L104), [listMyTopics](../../web/assets/js/services/topic-service.js#L113) (trả danh sách).

### `assets/js/shared`

#### [course-filters.js](../../web/assets/js/shared/course-filters.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html) và 2 trang khác.

**Hàm** [createOption](../../web/assets/js/shared/course-filters.js#L18) (khởi tạo hoặc tạo bản ghi).

#### [detail-tabs.js](../../web/assets/js/shared/detail-tabs.js)

Nạp từ [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `click`, `focus`, `focusout`, `hashchange`, `pointerdown`, `pointerenter`, `pointerleave`, `popstate`, `resize`.

#### [dialog-commands.js](../../web/assets/js/shared/dialog-commands.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [ho-so-ca-nhan.html](../../web/pages/sinh-vien/ho-so-ca-nhan.html).

**Sự kiện** `click`.

#### [download-file.js](../../web/assets/js/shared/download-file.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html) và 3 trang khác.

**Giao diện được công bố** `downloadFile`.

**Sự kiện** `pagehide`.

**Hàm** [release](../../web/assets/js/shared/download-file.js#L5).

#### [evaluation-attachment.js](../../web/assets/js/shared/evaluation-attachment.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `bindEvaluationAttachmentDownload`.

**Sự kiện** `click`.

#### [invitation-dialogs.js](../../web/assets/js/shared/invitation-dialogs.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `invitationSuccess`, `confirmInvitation`.

**Sự kiện** `cancel`, `click`, `close`, `input`, `submit`.

**Hàm** [shell](../../web/assets/js/shared/invitation-dialogs.js#L10).

#### [language.js](../../web/assets/js/shared/language.js)

Nạp từ [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../web/pages/chung/dang-nhap.html), [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html) và 36 trang khác.

**Sự kiện** `DOMContentLoaded`, `click`, `pageshow`, `storage`.

**Hàm** [readLanguage](../../web/assets/js/shared/language.js#L18) (đọc dữ liệu), [english](../../web/assets/js/shared/language.js#L26), [sourceText](../../web/assets/js/shared/language.js#L49), [translateText](../../web/assets/js/shared/language.js#L73), [translateAttribute](../../web/assets/js/shared/language.js#L100), [translateElement](../../web/assets/js/shared/language.js#L124), [translateTree](../../web/assets/js/shared/language.js#L131), [isLocalizedAttribute](../../web/assets/js/shared/language.js#L152), [observe](../../web/assets/js/shared/language.js#L173), [applyLanguage](../../web/assets/js/shared/language.js#L195).

#### [lecturer-overview.js](../../web/assets/js/shared/lecturer-overview.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html).

**Hàm** [render](../../web/assets/js/shared/lecturer-overview.js#L6) (dựng lại phần hiển thị).

#### [logout.js](../../web/assets/js/shared/logout.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 22 trang khác.

**Sự kiện** `click`.

**Hàm** [bindLogout](../../web/assets/js/shared/logout.js#L6), [showError](../../web/assets/js/shared/logout.js#L13) (hiển thị trạng thái).

#### [main-nav.js](../../web/assets/js/shared/main-nav.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `focus`, `focusin`, `focusout`, `ie104:languagechange`, `pointerdown`, `pointerenter`, `pointerleave`, `resize`.

**Hàm** [measureAndSet](../../web/assets/js/shared/main-nav.js#L33), [moveIndicator](../../web/assets/js/shared/main-nav.js#L68), [getFocusedTab](../../web/assets/js/shared/main-nav.js#L83) (tra cứu dữ liệu hoặc trạng thái).

#### [nav-indicator.js](../../web/assets/js/shared/nav-indicator.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [dang-ky-de-tai.html](../../web/pages/sinh-vien/dang-ky-de-tai.html) và 1 trang khác.

**Sự kiện** `change`, `focusin`, `focusout`, `loadingdone`, `pointerdown`, `pointerenter`, `pointerleave`, `resize`, `scroll`, `toggle`.

#### [progress-task-view.js](../../web/assets/js/shared/progress-task-view.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Hàm** [element](../../web/assets/js/shared/progress-task-view.js#L10), [calendar](../../web/assets/js/shared/progress-task-view.js#L17), [deadlineDate](../../web/assets/js/shared/progress-task-view.js#L23), [today](../../web/assets/js/shared/progress-task-view.js#L30), [isOverdue](../../web/assets/js/shared/progress-task-view.js#L34), [fillStats](../../web/assets/js/shared/progress-task-view.js#L38), [memberAvatar](../../web/assets/js/shared/progress-task-view.js#L50), [renderMemberPopover](../../web/assets/js/shared/progress-task-view.js#L57) (dựng lại phần hiển thị), [memberIndex](../../web/assets/js/shared/progress-task-view.js#L78), [renderAssignees](../../web/assets/js/shared/progress-task-view.js#L84) (dựng lại phần hiển thị), [renderCard](../../web/assets/js/shared/progress-task-view.js#L103) (dựng lại phần hiển thị), [fillDetails](../../web/assets/js/shared/progress-task-view.js#L134).

#### [proposal-cover.js](../../web/assets/js/shared/proposal-cover.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html) và 3 trang khác.

**Hàm** [renderProposalCover](../../web/assets/js/shared/proposal-cover.js#L5) (dựng lại phần hiển thị).

#### [proposal-detail-fields.js](../../web/assets/js/shared/proposal-detail-fields.js)

Nạp từ [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html).

**Hàm** [render](../../web/assets/js/shared/proposal-detail-fields.js#L9) (dựng lại phần hiển thị), [renderAttachment](../../web/assets/js/shared/proposal-detail-fields.js#L62) (dựng lại phần hiển thị), [download](../../web/assets/js/shared/proposal-detail-fields.js#L80), [readSample](../../web/assets/js/shared/proposal-detail-fields.js#L100) (đọc dữ liệu).

#### [proposal-outline.js](../../web/assets/js/shared/proposal-outline.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html).

**Hàm** [milestones](../../web/assets/js/shared/proposal-outline.js#L5), [fields](../../web/assets/js/shared/proposal-outline.js#L18), [render](../../web/assets/js/shared/proposal-outline.js#L28) (dựng lại phần hiển thị).

#### [public-session.js](../../web/assets/js/shared/public-session.js)

Nạp từ [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html), [huong-nghien-cuu.html](../../web/pages/chung/huong-nghien-cuu.html) và 8 trang khác.

**Sự kiện** `pageshow`.

**Hàm** [createAccountMenu](../../web/assets/js/shared/public-session.js#L23) (khởi tạo hoặc tạo bản ghi), [refreshAccount](../../web/assets/js/shared/public-session.js#L65).

#### [registration-supervisor.js](../../web/assets/js/shared/registration-supervisor.js)

Nạp từ [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html).

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [student-course-label.js](../../web/assets/js/shared/student-course-label.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 4 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [submission-file-list.js](../../web/assets/js/shared/submission-file-list.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Sự kiện** `beforetoggle`, `resize`, `scroll`, `toggle`.

**Hàm** [closeOnScroll](../../web/assets/js/shared/submission-file-list.js#L6), [position](../../web/assets/js/shared/submission-file-list.js#L13), [fileNames](../../web/assets/js/shared/submission-file-list.js#L31), [attach](../../web/assets/js/shared/submission-file-list.js#L45).

#### [supervisor-dialog.js](../../web/assets/js/shared/supervisor-dialog.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `click`, `close`, `input`.

**Hàm** [updateSelection](../../web/assets/js/shared/supervisor-dialog.js#L14) (cập nhật dữ liệu).

#### [task-comments.js](../../web/assets/js/shared/task-comments.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `mountTaskComments`.

**Sự kiện** `click`, `close`, `input`, `message`, `submit`, `visibilitychange`.

**Hàm** [element](../../web/assets/js/shared/task-comments.js#L10), [button](../../web/assets/js/shared/task-comments.js#L17), [avatar](../../web/assets/js/shared/task-comments.js#L24), [commentBody](../../web/assets/js/shared/task-comments.js#L32), [newestFirst](../../web/assets/js/shared/task-comments.js#L47), [openChannel](../../web/assets/js/shared/task-comments.js#L51), [mount](../../web/assets/js/shared/task-comments.js#L59), [render](../../web/assets/js/shared/task-comments.js#L64) (dựng lại phần hiển thị), [openReply](../../web/assets/js/shared/task-comments.js#L144), [composer](../../web/assets/js/shared/task-comments.js#L158), [eventMatches](../../web/assets/js/shared/task-comments.js#L202), [submit](../../web/assets/js/shared/task-comments.js#L206), [build](../../web/assets/js/shared/task-comments.js#L254) (dựng cấu trúc đầu ra), [refresh](../../web/assets/js/shared/task-comments.js#L270).

#### [teacher-detail-tabs.js](../../web/assets/js/shared/teacher-detail-tabs.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `click`, `focus`, `focusout`, `hashchange`, `pointerdown`, `pointerenter`, `pointerleave`, `popstate`, `resize`.

#### [theme.js](../../web/assets/js/shared/theme.js)

Nạp từ [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../web/pages/chung/dang-nhap.html), [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html) và 36 trang khác.

**Sự kiện** `DOMContentLoaded`, `click`, `pageshow`, `storage`.

**Hàm** [readTheme](../../web/assets/js/shared/theme.js#L5) (đọc dữ liệu), [applyTheme](../../web/assets/js/shared/theme.js#L34).

#### [topic-attachment.js](../../web/assets/js/shared/topic-attachment.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html).

**Sự kiện** `click`.

**Hàm** [render](../../web/assets/js/shared/topic-attachment.js#L15) (dựng lại phần hiển thị).

#### [topic-identity.js](../../web/assets/js/shared/topic-identity.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 14 trang khác.

**Hàm** [uniqueTitles](../../web/assets/js/shared/topic-identity.js#L5).

#### [topic-list-empty.js](../../web/assets/js/shared/topic-list-empty.js)

Nạp từ [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html) và 2 trang khác.

**Sự kiện** `click`.

#### [topic-list.js](../../web/assets/js/shared/topic-list.js)

Nạp từ [dang-ky-de-tai.html](../../web/pages/sinh-vien/dang-ky-de-tai.html), [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html).

**Giao diện được công bố** `initTopicList`.

**Sự kiện** `change`, `click`, `ie104:published-topics-updated`, `input`, `pageshow`, `reset`, `storage`, `submit`.

**Hàm** [initTopicList](../../web/assets/js/shared/topic-list.js#L5), [readFilters](../../web/assets/js/shared/topic-list.js#L28) (đọc dữ liệu), [createPageButton](../../web/assets/js/shared/topic-list.js#L41) (khởi tạo hoặc tạo bản ghi), [renderPagination](../../web/assets/js/shared/topic-list.js#L59) (dựng lại phần hiển thị), [refreshLecturers](../../web/assets/js/shared/topic-list.js#L70), [render](../../web/assets/js/shared/topic-list.js#L80) (dựng lại phần hiển thị), [applyFilters](../../web/assets/js/shared/topic-list.js#L104).

#### [topic-overview.js](../../web/assets/js/shared/topic-overview.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Hàm** [renderList](../../web/assets/js/shared/topic-overview.js#L5) (dựng lại phần hiển thị), [supervisorCard](../../web/assets/js/shared/topic-overview.js#L16), [renderSupervisors](../../web/assets/js/shared/topic-overview.js#L49) (dựng lại phần hiển thị), [renderAcceptedSupervisors](../../web/assets/js/shared/topic-overview.js#L60) (dựng lại phần hiển thị), [renderLecturerSupervisors](../../web/assets/js/shared/topic-overview.js#L69) (dựng lại phần hiển thị), [renderSupervisedSummary](../../web/assets/js/shared/topic-overview.js#L103) (dựng lại phần hiển thị).

#### [validation.js](../../web/assets/js/shared/validation.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 13 trang khác.

**Hàm** [validateRegistration](../../web/assets/js/shared/validation.js#L4) (kiểm tra dữ liệu), [validateProposalOutline](../../web/assets/js/shared/validation.js#L31) (kiểm tra dữ liệu), [validateProposal](../../web/assets/js/shared/validation.js#L82) (kiểm tra dữ liệu).

#### [workflow-dialog.js](../../web/assets/js/shared/workflow-dialog.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html).

**Giao diện được công bố** `workflowIcon`, `workflowDetails`.

**Sự kiện** `click`, `close`.

**Hàm** [progressTime](../../web/assets/js/shared/workflow-dialog.js#L5), [progressHistorySection](../../web/assets/js/shared/workflow-dialog.js#L17).

### `assets/js`

#### [student-overview.js](../../web/assets/js/student-overview.js)

Nạp từ [tong-quan-sinh-vien.html](../../web/pages/sinh-vien/tong-quan-sinh-vien.html).

**Sự kiện** `change`, `focusin`.

#### [student-proposal-status.js](../../web/assets/js/student-proposal-status.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [setText](../../web/assets/js/student-proposal-status.js#L15) (đặt giá trị hoặc trạng thái), [resultMessage](../../web/assets/js/student-proposal-status.js#L20), [updateMyTopics](../../web/assets/js/student-proposal-status.js#L26) (cập nhật dữ liệu), [updateRequest](../../web/assets/js/student-proposal-status.js#L49) (cập nhật dữ liệu), [updateDetail](../../web/assets/js/student-proposal-status.js#L76) (cập nhật dữ liệu), [render](../../web/assets/js/student-proposal-status.js#L142) (dựng lại phần hiển thị).

#### [student-topic-proposal.js](../../web/assets/js/student-topic-proposal.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `pageshow`, `reset`.

**Hàm** [updateCourse](../../web/assets/js/student-topic-proposal.js#L17) (cập nhật dữ liệu).

#### [supervision-attachment-ui.js](../../web/assets/js/supervision-attachment-ui.js)

Nạp từ [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html), [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html), [loi-moi-huong-dan.html](../../web/pages/sinh-vien/loi-moi-huong-dan.html).

**Sự kiện** `change`, `click`, `reset`.

**Hàm** [formatSize](../../web/assets/js/supervision-attachment-ui.js#L7), [createPicker](../../web/assets/js/supervision-attachment-ui.js#L13) (khởi tạo hoặc tạo bản ghi), [validate](../../web/assets/js/supervision-attachment-ui.js#L35) (kiểm tra dữ liệu), [createDownload](../../web/assets/js/supervision-attachment-ui.js#L58) (khởi tạo hoặc tạo bản ghi).

#### [supervision-compose.js](../../web/assets/js/supervision-compose.js)

Nạp từ [loi-moi-huong-dan.html](../../web/pages/sinh-vien/loi-moi-huong-dan.html).

**Sự kiện** `input`, `pageshow`, `submit`.

**Hàm** [validate](../../web/assets/js/supervision-compose.js#L17) (kiểm tra dữ liệu), [initialize](../../web/assets/js/supervision-compose.js#L30).

#### [supervision-entry.js](../../web/assets/js/supervision-entry.js)

Nạp từ [dang-nhap.html](../../web/pages/chung/dang-nhap.html), [huong-nghien-cuu.html](../../web/pages/chung/huong-nghien-cuu.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 9 trang khác.

**Hàm** [departmentLabel](../../web/assets/js/supervision-entry.js#L10), [validateTeacherId](../../web/assets/js/supervision-entry.js#L17) (kiểm tra dữ liệu), [withQuery](../../web/assets/js/supervision-entry.js#L23), [getComposeUrl](../../web/assets/js/supervision-entry.js#L29) (tra cứu dữ liệu hoặc trạng thái), [getLoginUrl](../../web/assets/js/supervision-entry.js#L34) (tra cứu dữ liệu hoặc trạng thái), [getInboxLoginUrl](../../web/assets/js/supervision-entry.js#L39) (tra cứu dữ liệu hoặc trạng thái), [getStudent](../../web/assets/js/supervision-entry.js#L43) (tra cứu dữ liệu hoặc trạng thái), [getDirectory](../../web/assets/js/supervision-entry.js#L57) (tra cứu dữ liệu hoặc trạng thái), [getTeachers](../../web/assets/js/supervision-entry.js#L75) (tra cứu dữ liệu hoặc trạng thái), [getTeacherInboxSession](../../web/assets/js/supervision-entry.js#L95) (tra cứu dữ liệu hoặc trạng thái), [getTeacher](../../web/assets/js/supervision-entry.js#L105) (tra cứu dữ liệu hoặc trạng thái).

#### [supervision-inbox.js](../../web/assets/js/supervision-inbox.js)

Nạp từ [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html), [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html).

**Sự kiện** `change`, `click`, `input`, `pageshow`, `submit`, `visibilitychange`.

**Hàm** [textElement](../../web/assets/js/supervision-inbox.js#L109), [describeStatus](../../web/assets/js/supervision-inbox.js#L116), [setTime](../../web/assets/js/supervision-inbox.js#L121) (đặt giá trị hoặc trạng thái), [renderTabCount](../../web/assets/js/supervision-inbox.js#L126) (dựng lại phần hiển thị), [scheduleRead](../../web/assets/js/supervision-inbox.js#L134), [renderList](../../web/assets/js/supervision-inbox.js#L148) (dựng lại phần hiển thị), [showTeacherChoices](../../web/assets/js/supervision-inbox.js#L177) (hiển thị trạng thái), [renderThread](../../web/assets/js/supervision-inbox.js#L193) (dựng lại phần hiển thị), [clearReplyError](../../web/assets/js/supervision-inbox.js#L248), [render](../../web/assets/js/supervision-inbox.js#L254) (dựng lại phần hiển thị), [save](../../web/assets/js/supervision-inbox.js#L331) (lưu dữ liệu).

#### [supervision-login.js](../../web/assets/js/supervision-login.js)

Nạp từ [dang-nhap.html](../../web/pages/chung/dang-nhap.html).

**Hàm** [showInvalidInvitation](../../web/assets/js/supervision-login.js#L14) (hiển thị trạng thái).

#### [supervision-shortcut.js](../../web/assets/js/supervision-shortcut.js)

Nạp từ [tong-quan-giang-vien.html](../../web/pages/giang-vien/tong-quan-giang-vien.html), [tong-quan-sinh-vien.html](../../web/pages/sinh-vien/tong-quan-sinh-vien.html).

**Sự kiện** `pageshow`.

**Hàm** [latestResponse](../../web/assets/js/supervision-shortcut.js#L15), [render](../../web/assets/js/supervision-shortcut.js#L25) (dựng lại phần hiển thị).

#### [supervision-store.js](../../web/assets/js/supervision-store.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [tong-quan-giang-vien.html](../../web/pages/giang-vien/tong-quan-giang-vien.html) và 6 trang khác.

**Sự kiện** `change`, `pageshow`, `storage`.

**Hàm** [isText](../../web/assets/js/supervision-store.js#L15), [validateText](../../web/assets/js/supervision-store.js#L19) (kiểm tra dữ liệu), [isAttachment](../../web/assets/js/supervision-store.js#L35), [isRecord](../../web/assets/js/supervision-store.js#L41), [read](../../web/assets/js/supervision-store.js#L59) (đọc dữ liệu), [getAll](../../web/assets/js/supervision-store.js#L76) (tra cứu dữ liệu hoặc trạng thái), [write](../../web/assets/js/supervision-store.js#L91) (ghi dữ liệu), [notify](../../web/assets/js/supervision-store.js#L99), [randomId](../../web/assets/js/supervision-store.js#L103), [openAttachmentDatabase](../../web/assets/js/supervision-store.js#L108), [accessAttachments](../../web/assets/js/supervision-store.js#L117), [withAttachment](../../web/assets/js/supervision-store.js#L131), [getAttachment](../../web/assets/js/supervision-store.js#L151) (tra cứu dữ liệu hoặc trạng thái), [responseCount](../../web/assets/js/supervision-store.js#L165), [receiptKey](../../web/assets/js/supervision-store.js#L169), [readReceipt](../../web/assets/js/supervision-store.js#L173) (đọc dữ liệu), [getUnreadResponses](../../web/assets/js/supervision-store.js#L182) (tra cứu dữ liệu hoặc trạng thái), [markResponsesRead](../../web/assets/js/supervision-store.js#L186), [canReply](../../web/assets/js/supervision-store.js#L205), [needsTeacherReply](../../web/assets/js/supervision-store.js#L209), [create](../../web/assets/js/supervision-store.js#L216) (khởi tạo hoặc tạo bản ghi), [update](../../web/assets/js/supervision-store.js#L250) (cập nhật dữ liệu), [reply](../../web/assets/js/supervision-store.js#L267), [decide](../../web/assets/js/supervision-store.js#L279), [cancelProjectInvitation](../../web/assets/js/supervision-store.js#L289).

#### [supervisor-dialog.js](../../web/assets/js/supervisor-dialog.js)

Nạp từ [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html).

**Sự kiện** `change`, `click`, `close`, `input`.

**Hàm** [renderSavedSelection](../../web/assets/js/supervisor-dialog.js#L27) (dựng lại phần hiển thị), [loadDirectory](../../web/assets/js/supervisor-dialog.js#L42), [showInvitationNote](../../web/assets/js/supervisor-dialog.js#L54) (hiển thị trạng thái), [fillFromInvitation](../../web/assets/js/supervisor-dialog.js#L63), [updateSelection](../../web/assets/js/supervisor-dialog.js#L87) (cập nhật dữ liệu), [filterOptions](../../web/assets/js/supervisor-dialog.js#L91).

#### [teacher-approved-proposals.js](../../web/assets/js/teacher-approved-proposals.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `pageshow`.

**Hàm** [semesterLabel](../../web/assets/js/teacher-approved-proposals.js#L15), [createCard](../../web/assets/js/teacher-approved-proposals.js#L19) (khởi tạo hoặc tạo bản ghi), [render](../../web/assets/js/teacher-approved-proposals.js#L52) (dựng lại phần hiển thị).

#### [teacher-topic-store.js](../../web/assets/js/teacher-topic-store.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 8 trang khác.

**Hàm** [read](../../web/assets/js/teacher-topic-store.js#L144) (đọc dữ liệu), [validDate](../../web/assets/js/teacher-topic-store.js#L160), [validate](../../web/assets/js/teacher-topic-store.js#L167) (kiểm tra dữ liệu), [nextCode](../../web/assets/js/teacher-topic-store.js#L188), [save](../../web/assets/js/teacher-topic-store.js#L201) (lưu dữ liệu), [withWriteLock](../../web/assets/js/teacher-topic-store.js#L218), [setRegistrationStatus](../../web/assets/js/teacher-topic-store.js#L221) (đặt giá trị hoặc trạng thái), [studentTopics](../../web/assets/js/teacher-topic-store.js#L234).

#### [teacher-topic-workflow.js](../../web/assets/js/teacher-topic-workflow.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `beforeunload`, `cancel`, `change`, `click`, `input`, `pageshow`, `storage`, `submit`.

**Hàm** [imageIn](../../web/assets/js/teacher-topic-workflow.js#L29), [render](../../web/assets/js/teacher-topic-workflow.js#L52) (dựng lại phần hiển thị), [setMeta](../../web/assets/js/teacher-topic-workflow.js#L66) (đặt giá trị hoặc trạng thái), [refreshList](../../web/assets/js/teacher-topic-workflow.js#L90), [renderStatus](../../web/assets/js/teacher-topic-workflow.js#L134) (dựng lại phần hiển thị), [refreshStatus](../../web/assets/js/teacher-topic-workflow.js#L147), [refreshImage](../../web/assets/js/teacher-topic-workflow.js#L279).

#### [topic-list.js](../../web/assets/js/topic-list.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `change`, `click`, `ie104:topics-updated`, `input`, `pageshow`, `reset`, `storage`, `submit`.

**Hàm** [refreshTabCounts](../../web/assets/js/topic-list.js#L17), [render](../../web/assets/js/topic-list.js#L76) (dựng lại phần hiển thị), [applyFilters](../../web/assets/js/topic-list.js#L137).

#### [uit-lecturer-catalog.js](../../web/assets/js/uit-lecturer-catalog.js)

Nạp từ [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 16 trang khác.

Xem nội dung khai báo hoặc cấu hình tại liên kết tệp.

#### [uit-lecturer-view.js](../../web/assets/js/uit-lecturer-view.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Khai báo** `lecturerTopics`.

#### [uit-notice.js](../../web/assets/js/uit-notice.js)

Nạp từ [thong-bao-uit.html](../../web/pages/chung/thong-bao-uit.html).

**Sự kiện** `error`.

**Hàm** [select](../../web/assets/js/uit-notice.js#L41), [detailUrl](../../web/assets/js/uit-notice.js#L45), [formatDate](../../web/assets/js/uit-notice.js#L51), [createItem](../../web/assets/js/uit-notice.js#L55) (khởi tạo hoặc tạo bản ghi).

#### [uit-proposal-detail.js](../../web/assets/js/uit-proposal-detail.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `input`, `submit`.

**Hàm** [text](../../web/assets/js/uit-proposal-detail.js#L35), [render](../../web/assets/js/uit-proposal-detail.js#L40) (dựng lại phần hiển thị), [validateReason](../../web/assets/js/uit-proposal-detail.js#L95) (kiểm tra dữ liệu).

#### [uit-proposal-store.js](../../web/assets/js/uit-proposal-store.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Sự kiện** `pageshow`, `storage`.

**Hàm** [readDecision](../../web/assets/js/uit-proposal-store.js#L13) (đọc dữ liệu), [getAll](../../web/assets/js/uit-proposal-store.js#L25) (tra cứu dữ liệu hoặc trạng thái), [notify](../../web/assets/js/uit-proposal-store.js#L37), [decide](../../web/assets/js/uit-proposal-store.js#L41).

#### [uit-supervised-demo.js](../../web/assets/js/uit-supervised-demo.js)

Nạp từ [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html).

**Hàm** [displayDate](../../web/assets/js/uit-supervised-demo.js#L6), [setDate](../../web/assets/js/uit-supervised-demo.js#L12) (đặt giá trị hoặc trạng thái), [cloneWithDialogs](../../web/assets/js/uit-supervised-demo.js#L19), [keepCards](../../web/assets/js/uit-supervised-demo.js#L48), [renderProgress](../../web/assets/js/uit-supervised-demo.js#L63) (dựng lại phần hiển thị), [renderRequirements](../../web/assets/js/uit-supervised-demo.js#L100) (dựng lại phần hiển thị), [renderSubmissions](../../web/assets/js/uit-supervised-demo.js#L169) (dựng lại phần hiển thị).

#### [uit-teacher-approved-proposals.js](../../web/assets/js/uit-teacher-approved-proposals.js)

Nạp từ [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Sự kiện** `storage`.

**Hàm** [render](../../web/assets/js/uit-teacher-approved-proposals.js#L9) (dựng lại phần hiển thị).

#### [uit-topic-list.js](../../web/assets/js/uit-topic-list.js)

Nạp từ [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html).

**Sự kiện** `animationend`, `change`, `click`, `ie104:topics-updated`, `input`, `pageshow`, `reset`, `submit`.

**Hàm** [renderProjectStatus](../../web/assets/js/uit-topic-list.js#L15) (dựng lại phần hiển thị), [refreshCodes](../../web/assets/js/uit-topic-list.js#L32), [countActiveFilters](../../web/assets/js/uit-topic-list.js#L105), [updateFilterTitle](../../web/assets/js/uit-topic-list.js#L121) (cập nhật dữ liệu), [clearPageTransition](../../web/assets/js/uit-topic-list.js#L132), [triggerPageTransition](../../web/assets/js/uit-topic-list.js#L144), [render](../../web/assets/js/uit-topic-list.js#L164) (dựng lại phần hiển thị).

#### [website-session.js](../../web/assets/js/website-session.js)

Không thấy thẻ script HTML nạp trực tiếp.

**Hàm** [setDemoRole](../../web/assets/js/website-session.js#L7) (đặt giá trị hoặc trạng thái), [setFirebaseSession](../../web/assets/js/website-session.js#L11) (đặt giá trị hoặc trạng thái), [clearWebsiteSession](../../web/assets/js/website-session.js#L15), [hasStoredWebsiteSession](../../web/assets/js/website-session.js#L19), [getWebsiteRole](../../web/assets/js/website-session.js#L23) (tra cứu dữ liệu hoặc trạng thái), [readFirebaseSession](../../web/assets/js/website-session.js#L33) (đọc dữ liệu), [getWebsiteSession](../../web/assets/js/website-session.js#L41) (tra cứu dữ liệu hoặc trạng thái).

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
| [about-audiences.css](../../web/assets/css/about-audiences.css) | [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html) |
| [auth.css](../../web/assets/css/auth.css) | [dang-nhap.html](../../web/pages/chung/dang-nhap.html), [quen-mat-khau.html](../../web/pages/chung/quen-mat-khau.html) |
| [base.css](../../web/assets/css/base.css) | [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../web/pages/chung/dang-nhap.html) và 37 trang khác |
| [breadcrumb.css](../../web/assets/css/breadcrumb.css) | [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html), [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html) |
| [common.css](../../web/assets/css/common.css) | [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../web/pages/chung/dang-nhap.html) và 11 trang khác |
| [components.css](../../web/assets/css/components.css) | [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../web/pages/chung/dang-nhap.html) và 36 trang khác |
| [dang-ky-de-tai.css](../../web/assets/css/dang-ky-de-tai.css) | [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 8 trang khác |
| [de-tai-cua-toi.css](../../web/assets/css/de-tai-cua-toi.css) | [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html), [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html) |
| [de-tai-dang-thuc-hien.css](../../web/assets/css/de-tai-dang-thuc-hien.css) | [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [deadline-calendar.css](../../web/assets/css/deadline-calendar.css) | [lich-han-nop.html](../../web/pages/sinh-vien/lich-han-nop.html) |
| [ho-so-ca-nhan.css](../../web/assets/css/ho-so-ca-nhan.css) | [ho-so-ca-nhan-giang-vien.html](../../web/pages/giang-vien/ho-so-ca-nhan-giang-vien.html), [ho-so-ca-nhan.html](../../web/pages/sinh-vien/ho-so-ca-nhan.html) |
| [huong-nghien-cuu.css](../../web/assets/css/huong-nghien-cuu.css) | [huong-nghien-cuu.html](../../web/pages/chung/huong-nghien-cuu.html) |
| [information.css](../../web/assets/css/information.css) | [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html), [lien-he.html](../../web/pages/chung/lien-he.html) |
| [invitation-dialogs.css](../../web/assets/css/invitation-dialogs.css) | [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [lecturer-invitation-preview.css](../../web/assets/css/lecturer-invitation-preview.css) | [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [lecturer-overview-data.css](../../web/assets/css/lecturer-overview-data.css) | [tong-quan-giang-vien.html](../../web/pages/giang-vien/tong-quan-giang-vien.html) |
| [lecturer-profile.css](../../web/assets/css/lecturer-profile.css) | [ho-so-ca-nhan-giang-vien.html](../../web/pages/giang-vien/ho-so-ca-nhan-giang-vien.html) |
| [lecturer-source-data.css](../../web/assets/css/lecturer-source-data.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) và 1 trang khác |
| [lecturer-topic-editor.css](../../web/assets/css/lecturer-topic-editor.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chinh-sua-de-tai-giang-vien.html](../../web/pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) |
| [lecturer-topic-routing.css](../../web/assets/css/lecturer-topic-routing.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [page-directory.css](../../web/assets/css/page-directory.css) | [index.html](../../web/index.html) |
| [project-evaluation.css](../../web/assets/css/project-evaluation.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [project-footer.css](../../web/assets/css/project-footer.css) | [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [gioi-thieu.html](../../web/pages/chung/gioi-thieu.html) và 36 trang khác |
| [project-progress.css](../../web/assets/css/project-progress.css) | [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [project-team.css](../../web/assets/css/project-team.css) | [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [proposal-outline.css](../../web/assets/css/proposal-outline.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) và 1 trang khác |
| [proposal-pickers.css](../../web/assets/css/proposal-pickers.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) và 3 trang khác |
| [proposal-request-detail.css](../../web/assets/css/proposal-request-detail.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html), [chi-tiet-de-tai-cho-duyet-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-cho-duyet-sinh-vien.html) và 2 trang khác |
| [published-topic.css](../../web/assets/css/published-topic.css) | [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) |
| [registration-detail.css](../../web/assets/css/registration-detail.css) | [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html) |
| [student-deadlines-data.css](../../web/assets/css/student-deadlines-data.css) | Kiểm tra import CSS hoặc màn hình dùng biến thể này |
| [student-overview-data.css](../../web/assets/css/student-overview-data.css) | [tong-quan-sinh-vien.html](../../web/pages/sinh-vien/tong-quan-sinh-vien.html) |
| [student-profile.css](../../web/assets/css/student-profile.css) | [ho-so-ca-nhan.html](../../web/pages/sinh-vien/ho-so-ca-nhan.html) |
| [student-requests.css](../../web/assets/css/student-requests.css) | [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html) |
| [student-topic-detail.css](../../web/assets/css/student-topic-detail.css) | [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [student-topic-overview.css](../../web/assets/css/student-topic-overview.css) | [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html) |
| [student-topic-proposal.css](../../web/assets/css/student-topic-proposal.css) | [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html) |
| [student-topic-registration.css](../../web/assets/css/student-topic-registration.css) | [dang-ky-de-tai.html](../../web/pages/sinh-vien/dang-ky-de-tai.html), [de-tai-cua-toi-sinh-vien.html](../../web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html) |
| [supervision-invitations.css](../../web/assets/css/supervision-invitations.css) | [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [tong-quan-giang-vien.html](../../web/pages/giang-vien/tong-quan-giang-vien.html), [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html) và 3 trang khác |
| [supervisor-dialog.css](../../web/assets/css/supervisor-dialog.css) | [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), [tao-de-xuat.html](../../web/pages/sinh-vien/tao-de-xuat.html) |
| [teacher-created-detail.css](../../web/assets/css/teacher-created-detail.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html) |
| [teacher-created-topics.css](../../web/assets/css/teacher-created-topics.css) | [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html) |
| [teacher-dialogs.css](../../web/assets/css/teacher-dialogs.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html) và 1 trang khác |
| [teacher-layout.css](../../web/assets/css/teacher-layout.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html) và 5 trang khác |
| [teacher-pending-proposals.css](../../web/assets/css/teacher-pending-proposals.css) | [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html) |
| [teacher-request-detail.css](../../web/assets/css/teacher-request-detail.css) | [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html) |
| [teacher-supervised-topics.css](../../web/assets/css/teacher-supervised-topics.css) | [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html) |
| [teacher-topic-detail.css](../../web/assets/css/teacher-topic-detail.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [teacher-topic-forms.css](../../web/assets/css/teacher-topic-forms.css) | [chinh-sua-de-tai-giang-vien.html](../../web/pages/giang-vien/chinh-sua-de-tai-giang-vien.html), [tao-de-tai-giang-vien.html](../../web/pages/giang-vien/tao-de-tai-giang-vien.html) |
| [teacher-workspace-detail.css](../../web/assets/css/teacher-workspace-detail.css) | Kiểm tra import CSS hoặc màn hình dùng biến thể này |
| [teacher-workspace-layout.css](../../web/assets/css/teacher-workspace-layout.css) | Kiểm tra import CSS hoặc màn hình dùng biến thể này |
| [teaching-workspace.css](../../web/assets/css/teaching-workspace.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [tokens.css](../../web/assets/css/tokens.css) | [index.html](../../web/index.html), [chi-tiet-thong-bao.html](../../web/pages/chung/chi-tiet-thong-bao.html), [dang-nhap.html](../../web/pages/chung/dang-nhap.html) và 37 trang khác |
| [tong-quan-giang-vien.css](../../web/assets/css/tong-quan-giang-vien.css) | [tong-quan-giang-vien.html](../../web/pages/giang-vien/tong-quan-giang-vien.html) |
| [tong-quan-sinh-vien.css](../../web/assets/css/tong-quan-sinh-vien.css) | [tong-quan-sinh-vien.html](../../web/pages/sinh-vien/tong-quan-sinh-vien.html) |
| [topic-detail-boards.css](../../web/assets/css/topic-detail-boards.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |
| [topic-detail-overview-evaluation.css](../../web/assets/css/topic-detail-overview-evaluation.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html) và 2 trang khác |
| [topic-enrollment.css](../../web/assets/css/topic-enrollment.css) | [chi-tiet-de-tai-gv-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-gv-mo-dang-ky.html), [chi-tiet-de-tai-mo-dang-ky.html](../../web/pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html) |
| [topic-filter-panel.css](../../web/assets/css/topic-filter-panel.css) | [danh-sach-de-tai-da-tao.html](../../web/pages/giang-vien/danh-sach-de-tai-da-tao.html), [danh-sach-de-tai-dang-huong-dan.html](../../web/pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html), [yeu-cau-cho-duyet.html](../../web/pages/giang-vien/yeu-cau-cho-duyet.html) và 2 trang khác |
| [topic-media-shared.css](../../web/assets/css/topic-media-shared.css) | [chi-tiet-de-tai-da-tao-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html), [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-de-xuat-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-xuat-giang-vien.html) và 10 trang khác |
| [uit-notice.css](../../web/assets/css/uit-notice.css) | [thong-bao-uit.html](../../web/pages/chung/thong-bao-uit.html) |
| [uit-restored-submissions.css](../../web/assets/css/uit-restored-submissions.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html) |
| [workflow-detail-shared.css](../../web/assets/css/workflow-detail-shared.css) | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../../web/pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html), [chi-tiet-loi-moi-huong-dan.html](../../web/pages/giang-vien/chi-tiet-loi-moi-huong-dan.html), [chi-tiet-de-tai-sinh-vien.html](../../web/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html) |

## Cấu hình và tài nguyên

- [firebase.json](../../firebase.json) khai báo cấu hình Firebase. [wrangler.jsonc](../../calendar-worker/wrangler.jsonc) khai báo Worker. [package.json](../../functions/package.json) mô tả phụ thuộc và lệnh của Firebase Functions.
- Ảnh, font, PDF, JSON và dữ liệu minh họa trong `assets` được các trang hoặc dịch vụ tham chiếu. Lockfile ghi phiên bản phụ thuộc đã khóa.
