# Báo cáo chức năng website quản lý đồ án và khóa luận IE104

Phạm vi gồm 61 trang HTML trong phiên bản mã nguồn khảo sát ngày 22/11/2026. Báo cáo được lập từ HTML, các script được nạp và các dịch vụ xử lý liên quan. Việc rà soát mã nguồn chưa bao gồm chạy thử toàn bộ luồng trên trình duyệt, kiểm tra dịch vụ bên ngoài hoặc xác nhận dữ liệu đã đồng bộ giữa các tài khoản.

## Tổng quan

- **Giảng viên** có tổng quan, hồ sơ, quản lý đề tài, xử lý yêu cầu, theo dõi tiến độ, quản lý bài nộp và đánh giá.
- **Sinh viên** có tìm và đăng ký đề tài, tạo đề xuất, gửi lời mời hướng dẫn, quản lý nhóm, cập nhật tiến độ, nộp bài và xem đánh giá.
- **Trang chung** có xác thực, khôi phục tài khoản, thông báo học vụ, giới thiệu, hướng nghiên cứu và liên hệ.
- Dữ liệu học vụ gồm dữ liệu mẫu, hồ sơ tham khảo và dữ liệu thao tác lưu bằng localStorage hoặc IndexedDB. Google, Firebase và dịch vụ OTP có đường tích hợp riêng. Cần kiểm thử với cấu hình triển khai để xác nhận các tích hợp đó hoạt động.
- Footer cung cấp điều hướng, tài nguyên UIT, liên kết PDF điều khoản và quy chế, cùng lối về đầu trang.

## Chức năng còn thiếu trong phạm vi demo

Phạm vi nghiệm thu là một tài khoản sinh viên, thử cả hai vai trò trên cùng trình duyệt và cùng địa chỉ website. Lưu cục bộ phù hợp với phạm vi này. Xác minh MSSV với danh sách tài khoản thật và đồng bộ đa thiết bị là phần mở rộng.

| Mức ưu tiên | Luồng | Phần còn thiếu | Tiêu chí kiểm tra |
|---|---|---|---|
| Cao | Sinh viên nộp bài và giảng viên phản hồi | Tệp mới lưu ở kho bài nộp sinh viên. Màn hình giảng viên đọc kho hướng dẫn riêng. [Nộp bài](../assets/js/pages/student/topic-detail/submission-upload.js#L111) · [Dữ liệu giảng viên](../assets/js/services/teaching-service.js#L61) | Bài mới hiện đúng yêu cầu ở phía giảng viên, tải được tệp và phản hồi hiện ở phía sinh viên. |
| Cao | Xóa yêu cầu đã có bài nộp | Kiểm tra trước khi xóa chỉ đọc kho hướng dẫn nên có thể bỏ sót bài mới. Nếu xóa yêu cầu, bản nộp sinh viên có thể bị ẩn khỏi danh sách. [Kiểm tra khi xóa](../assets/js/services/teaching-service.js#L120) · [Danh sách sinh viên](../assets/js/pages/student/topic-detail/submissions.js#L449) | Sau khi sinh viên nộp bài, chặn xóa yêu cầu. Khóa nhận bài vẫn giữ tệp và lịch sử. |
| Cao | Tải đề cương đề tài mở đăng ký | Trang mẫu có nút tải bị khóa và thiếu xử lý tải. Biến thể đề tài giảng viên công bố đã có xử lý khi tìm thấy tệp. [Trang mẫu](../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html#L219) · [Biến thể giảng viên công bố](../assets/js/pages/student/published-topic-media.js#L23) | Chỉ cho tải tệp do giảng viên tải lên cho đúng đề tài. Khi thiếu tệp, ghi “Chưa có tài liệu đính kèm”. |
| Cao | Đính kèm đề xuất | Sinh viên chọn tệp nhưng luồng đề xuất chỉ giữ thông tin tệp. Giảng viên xem tên nhưng không tải được nội dung. [Gửi đề xuất](../assets/js/pages/student/topic-proposal.js#L151) · [Chi tiết đề xuất](../assets/js/proposal-detail.js#L128) | Tệp vẫn mở được sau khi tải lại trang và giảng viên tải đúng tệp của đề xuất. |
| Cao | Mời GVHD từ tab Nhóm | Tab Nhóm và hộp thư giảng viên dùng hai kho khác nhau. Luồng từ trang Lời mời hướng dẫn riêng đã có phản hồi, quyết định và liên kết tạo đề xuất sau khi được đồng ý. [Tab Nhóm](../assets/js/services/project-team-service.js#L82) · [Hộp thư](../assets/js/supervision-inbox.js#L248) | Lời mời từ tab Nhóm xuất hiện ở hộp thư GV và kết quả xử lý hiện trong đề tài. |
| Cao | Lịch hạn nộp | Trang lịch đang đọc mốc HTML mẫu. Dịch vụ tổng hợp hạn nộp đã có trong repo và chưa được trang lịch nạp. [Trang lịch](../assets/js/deadline-calendar.js#L44) · [Dịch vụ hạn nộp](../assets/js/services/deadline-service.js#L27) | Tạo, đổi hạn hoặc xóa yêu cầu hợp lệ sẽ cập nhật lịch sinh viên. |
| Vừa | Sửa và xóa thành viên nhóm | Bản demo có thêm thành viên, kiểm tra trùng MSSV và giới hạn nhóm. Chưa có thao tác sửa hoặc xóa thành viên đã lưu. [Dịch vụ nhóm](../assets/js/services/project-team-service.js#L74) | Nhóm trưởng sửa được bản ghi nhập nhầm hoặc xóa thành viên thử. |
| Vừa | Đổi mật khẩu trong hồ sơ | Trang sinh viên chỉ kiểm tra dữ liệu nhập. Nút phía giảng viên đang vô hiệu hóa. [Sinh viên](../assets/js/pages/student/profile.js#L99) · [Giảng viên](../pages/giang-vien/ho-so-ca-nhan-giang-vien.html#L346) | Nếu tính năng nằm trong phạm vi demo, kiểm tra mật khẩu cũ và cập nhật mật khẩu thực tế. |
| Vừa | Gửi lời nhắn liên hệ | Biểu mẫu chỉ mở hộp kết quả thử nghiệm, lời nhắn chưa gửi hoặc lưu. [Biểu mẫu](../pages/chung/lien-he.html#L311) · [Xử lý](../assets/js/contact-form.js#L21) | Lời nhắn đến kênh tiếp nhận đã cấu hình, trạng thái phản ánh kết quả thực tế. |
| Vừa | Tệp đính kèm đánh giá | Sinh viên có thể tải tệp đánh giá có đường dẫn tài nguyên, nhưng màn hình đánh giá GV thiếu bước tải lên tệp mới. [Phía GV](../assets/js/pages/lecturer/evaluation.js#L50) · [Phía SV](../assets/js/pages/student/topic-detail/evaluation.js#L28) | Giảng viên đính kèm phiếu đánh giá và sinh viên tải đúng tệp sau khi công bố. |

### Cải tiến tùy chọn

- **Đề tài và đăng ký** — Lưu trữ đề tài tạo nhầm, hỗ trợ hết hạn đối với đề tài mẫu. Kiểm tra hạn đã có đối với đề tài giảng viên công bố. [Kiểm tra hạn](../assets/js/services/published-topic-service.js#L9)
- **Bài nộp và đánh giá** — Xem lại các phiên bản bài nộp, thu hồi kết quả công bố, cấu hình tiêu chí/trọng số và xuất phiếu đánh giá. [Kho bài nộp](../assets/js/services/student-submissions-service.js#L49) · [Công bố đánh giá](../assets/js/pages/lecturer/evaluation.js#L71)
- **Thông báo và lịch** — Tìm thông báo theo từ khóa và nhắc hạn nộp. Thông báo đã có chuyên mục và phân trang. [Lọc thông báo](../assets/js/notifications.js#L105)

### Tích hợp cần kiểm thử

Đăng nhập Google, OTP và Google Calendar đã có mã tích hợp. Cần kiểm thử với cấu hình triển khai, đặc biệt là trường hợp lỗi mạng, từ chối cấp quyền và xuất lại lịch. Rút đề xuất, mở hoặc đóng đăng ký đề tài đã công bố, nhận xét tiến độ, cùng tìm kiếm và lọc Hướng nghiên cứu đã có xử lý trong mã nguồn.

## Trang giảng viên

| Trang | Chức năng hiện có | Còn thiếu hoặc chưa hoàn thiện | Đề xuất |
|---|---|---|---|
| `tong-quan-giang-vien.html` | Tổng hợp đề tài, yêu cầu và lối tắt nghiệp vụ theo dữ liệu của trang. | Số liệu chứa dữ liệu mẫu và dữ liệu lưu tại trình duyệt. | Thêm bộ lọc học kỳ và danh sách việc cần xử lý theo hạn. |
| `ho-so-ca-nhan-giang-vien.html` | Hiển thị, chỉnh sửa hồ sơ và xử lý ảnh đại diện trong bản demo. | Nút đổi mật khẩu còn vô hiệu hóa. Hồ sơ lưu cục bộ. | Tách trường có thể sửa và trường do trường quản lý. Thêm lịch sử cập nhật. |
| `danh-sach-de-tai-da-tao.html` | Xem danh sách, tìm kiếm, lọc, sắp xếp theo thời gian hoặc tên và mở chi tiết. | Danh sách kết hợp hồ sơ tham khảo với dữ liệu lưu cục bộ. | Lọc theo học kỳ và trạng thái công bố. |
| `danh-sach-de-tai-dang-huong-dan.html` | Xem đề tài hướng dẫn, tìm kiếm, lọc, sắp xếp và mở chi tiết. Kết hợp dữ liệu mẫu và đề xuất được duyệt. | Kết quả phụ thuộc nguồn dữ liệu được nạp trên thiết bị. | Lọc theo vai trò hướng dẫn và đánh dấu đề tài cần phản hồi. |
| `chi-tiet-de-tai-da-tao-giang-vien.html` | Xem thông tin, ảnh và tệp đính kèm. Có xử lý mở hoặc đóng đăng ký khi đủ điều kiện và tải tệp khi tìm thấy nội dung. | Tài liệu chỉ có tên mẫu hoặc thiếu tệp thực tế sẽ không tải được. Các thay đổi và tệp mới lưu cục bộ. | Thêm nhật ký mở, đóng đăng ký và lịch sử thay đổi đề tài. |
| `tao-de-tai-giang-vien.html` | Nhập đề tài, kiểm tra dữ liệu, xử lý ảnh và tệp, lưu qua trình biên tập. | Dữ liệu đề tài và tệp mới lưu trên trình duyệt. | Thêm nhân bản đề tài theo học kỳ và xem trước ở vai trò SV. |
| `chinh-sua-de-tai-giang-vien.html` | Nạp đề tài theo mã, sửa thông tin, cập nhật ảnh và tệp trong luồng biên tập chung. | Chưa có quản lý phiên bản và xử lý xung đột khi nhiều người chỉnh sửa. | Hiển thị thay đổi trước khi lưu và hỗ trợ khôi phục phiên bản. |
| `yeu-cau-cho-duyet.html` | Xem yêu cầu đang chờ và lời mời hướng dẫn, mở yêu cầu để xử lý. | Các quyết định và lời mời dựa vào kho dữ liệu cục bộ. | Bổ sung hạn phản hồi, nhắc việc và lọc yêu cầu theo đợt. |
| `chi-tiet-de-xuat-giang-vien.html` | Xem nội dung và tên tài liệu đề xuất, thông tin nhóm, duyệt hoặc từ chối yêu cầu còn chờ. | Nút tải tài liệu bị vô hiệu hóa và script hiện chỉ điền tên tài liệu. Kết quả duyệt hoặc từ chối lưu cục bộ. | Lưu người xử lý, lý do và thời điểm. Cho phép yêu cầu bổ sung hồ sơ. |
| `chi-tiet-de-tai-dang-huong-dan-giang-vien.html` | Theo dõi tiến độ, phản hồi, quản lý yêu cầu và lưu/công bố đánh giá. | Bài sinh viên mới nộp chưa được đưa vào danh sách hướng dẫn. Chưa có tải lên tệp đánh giá. | Bổ sung nhật ký phản hồi, phiên bản bài nộp, rubric và thông báo theo từng sự kiện. |

## Trang sinh viên

| Trang | Chức năng hiện có | Còn thiếu hoặc chưa hoàn thiện | Đề xuất |
|---|---|---|---|
| `tong-quan-sinh-vien.html` | Tổng hợp đề tài, yêu cầu, mốc và lối tắt theo dữ liệu hiện có. | Số liệu phụ thuộc dữ liệu mẫu và thao tác cục bộ. | Đưa việc sắp đến hạn và phản hồi mới lên đầu trang. |
| `ho-so-ca-nhan.html` | Xem và sửa hồ sơ, chọn ảnh đại diện, nhập và kiểm tra các trường đổi mật khẩu. | Hồ sơ và ảnh lưu cục bộ. Biểu mẫu đổi mật khẩu chỉ kiểm tra dữ liệu nhập, chưa xác minh mật khẩu cũ hoặc đổi mật khẩu tài khoản. | Cho xem trước ảnh, hiển thị thời điểm cập nhật hồ sơ và phân biệt thông tin do trường quản lý. |
| `dang-ky-de-tai.html` | Duyệt danh sách, tìm kiếm, lọc, phân trang bằng JavaScript và mở chi tiết. | Danh mục và trạng thái phụ thuộc dữ liệu mẫu hoặc dữ liệu lưu cục bộ. | Hiển thị điều kiện và số chỗ theo nguồn dữ liệu học vụ. |
| `chi-tiet-de-tai-mo-dang-ky.html` | Xem thông tin và mở luồng đăng ký. Mục tài liệu hiển thị tên đề cương mẫu. | Nút Tải xuống bị khóa trong HTML. Trang chưa có nguồn tệp hoặc trình xử lý tải đề cương. Việc xác nhận đăng ký chưa được kiểm chứng với máy chủ học vụ. | Chỉ hiển thị nút Tải xuống khi giảng viên đã tải lên tệp thực cho đúng đề tài đang xem. Nếu chưa có tệp, hiển thị “Chưa có tài liệu đính kèm”. |
| `chi-tiet-de-tai-gv-mo-dang-ky.html` | Xem đề tài giảng viên công bố và mở luồng đăng ký. Nút tải đề cương được bật khi script tìm thấy nội dung tệp. | Chỉ có tên tài liệu hoặc thiếu bản ghi tệp đã công bố thì nút vẫn khóa. Tệp lưu cục bộ chưa được chia sẻ qua thiết bị. | Cung cấp phiên bản đề tài và quyền tải tệp theo tài khoản. |
| `tao-de-xuat.html` | Nhập đề xuất và chọn tệp, kiểm tra thông tin, lưu hoặc gửi trong demo. | Chỉ giữ thông tin tệp, thiếu lưu và cung cấp nội dung tệp cho giảng viên. | Tự lưu bản nháp, xem trước và cho phép bổ sung theo phản hồi. |
| `loi-moi-huong-dan.html` | Soạn lời mời hướng dẫn, kèm tài liệu và lưu trạng thái lời mời. | Lời mời và tệp dùng bộ nhớ cục bộ. Chưa xác nhận gửi thông báo thật. | Thông báo kết quả, nhắc phản hồi và quản lý lời mời trùng. |
| `de-tai-cua-toi-sinh-vien.html` | Xem, tìm, lọc và phân trang đề tài. Xem yêu cầu và lời mời liên quan. | Trạng thái giữa các tài khoản và thiết bị chưa được xác minh. | Lọc theo học kỳ và hiển thị lịch sử trạng thái. |
| `chi-tiet-dang-ky-va-de-xuat-sinh-vien.html` | Hiển thị đăng ký và đề xuất của sinh viên, mở nội dung và trạng thái tương ứng. | Danh sách đọc từ các kho mẫu/cục bộ. | Thêm bộ lọc theo trạng thái và thời điểm gửi. |
| `chi-tiet-dang-ky-da-luu.html` | Đọc phiếu đăng ký đã lưu và hiển thị lại dữ liệu. | Phiếu phụ thuộc bản ghi ở trình duyệt. | Thêm mã biên nhận và lịch sử thay đổi. |
| `chi-tiet-de-tai-cho-duyet-sinh-vien.html` | Hiển thị yêu cầu đang chờ và trạng thái xử lý theo dữ liệu hiện có. | Trạng thái được đọc từ dữ liệu cục bộ. | Hiển thị mốc xử lý và lý do khi yêu cầu cần bổ sung. |
| `chi-tiet-de-xuat-nhom.html` | Hiển thị thông tin đề xuất nhóm qua bộ hiển thị phiếu đề xuất. | Dữ liệu nhóm và phiếu chưa có đồng bộ qua tài khoản. | Hiển thị ai đã xác nhận và phiên bản đề cương đã gửi. |
| `chi-tiet-de-xuat-da-luu.html` | Mở lại nội dung đề xuất đã lưu, gồm thông tin và trạng thái có sẵn. | Bản lưu phụ thuộc thiết bị. | Thêm phiên bản và thao tác tiếp tục chỉnh sửa bản nháp. |
| `chi-tiet-de-tai-sinh-vien.html` | Quản lý nhóm, cập nhật tiến độ, nộp tệp, đóng gói ZIP, xem phản hồi và đánh giá. | Bài mới chưa hiện phía GV. Chưa sửa/xóa thành viên đã lưu. Lời mời từ tab Nhóm chưa vào hộp thư GV. | Bổ sung biên nhận nộp bài, lịch sử phiên bản, thông báo phản hồi và quyền truy cập theo thành viên. |
| `lich-han-nop.html` | Hiển thị lịch và hỗ trợ xuất mốc sang Google Calendar khi được cấu hình. | Lịch chưa đọc hạn nộp mới từ yêu cầu do giảng viên tạo hoặc sửa. Tích hợp Google cần kiểm thử triển khai. | Thêm xuất ICS và nhắc hạn theo lựa chọn của sinh viên. |

## Trang chung và thông báo

| Trang | Chức năng hiện có | Còn thiếu hoặc chưa hoàn thiện | Đề xuất |
|---|---|---|---|
| `index.html` | Giới thiệu hệ thống và điều hướng tới các khu vực dùng chung và theo vai trò. | Nội dung giới thiệu tĩnh. | Thêm lối vào công việc gần nhất sau đăng nhập. |
| `dang-nhap.html` | Biểu mẫu đăng nhập, ẩn/hiện mật khẩu, luồng đăng nhập demo, đăng nhập email/mật khẩu và đăng nhập Google qua Firebase. | Cần xác minh cấu hình triển khai, ánh xạ vai trò và trạng thái phiên thực tế. | Thống nhất lỗi xác thực và chuyển về trang người dùng đang truy cập sau đăng nhập. |
| `quen-mat-khau.html` | Nhập email, gọi dịch vụ OTP để xác minh và đặt mật khẩu mới theo các bước. | Kết quả phụ thuộc điểm cuối khôi phục và việc gửi email. Chưa kiểm thử giao nhận OTP. | Bổ sung kiểm thử mã hết hạn, giới hạn gửi lại và khôi phục khi mạng lỗi. |
| `gioi-thieu.html` | Giới thiệu dự án, tính năng, nhóm và chuyển tab nội dung. | Nội dung do mã HTML và dữ liệu giao diện định nghĩa. | Thêm hướng dẫn bắt đầu theo vai trò và ghi nhận phiên bản. |
| `huong-nghien-cuu.html` | Xem giảng viên và hướng nghiên cứu, tìm kiếm, lọc theo bộ môn và nhóm nghiên cứu. | Một số hồ sơ thiếu thông tin nghiên cứu trong dữ liệu. | Bổ sung trạng thái nhận hướng dẫn và điền các hồ sơ còn thiếu nội dung. |
| `lien-he.html` | Xem thông tin liên hệ và bản đồ, nhập lời nhắn, kiểm tra biểu mẫu và mở hộp kết quả minh họa. | Biểu mẫu chưa gửi lời nhắn qua máy chủ. | Kết nối kênh tiếp nhận thật, cấp mã yêu cầu và hiển thị lỗi gửi. |
| `thong-bao.html` | Hiển thị danh sách, điều hướng chuyên mục, phân trang và mở bài. | Danh sách dựa trên dữ liệu đi kèm mã nguồn. | Thêm tìm kiếm theo từ khóa và ghim thông báo quan trọng. |
| `thong-bao-trang-2.html` | Mở trang 2 của danh sách và truy cập bài chi tiết. | Phân trang theo tập tin/dữ liệu sẵn có. | Hợp nhất phân trang vào một URL có tham số. |
| `thong-bao-bao-cao-nop-bai.html` | Liệt kê thông báo chuyên mục báo cáo và nộp bài. | Bài viết tĩnh. | Thêm lọc theo hạn và liên kết tới lịch nộp. |
| `thong-bao-ke-hoach-hoc-vu.html` | Liệt kê thông báo kế hoạch học vụ. | Chưa đồng bộ lịch học vụ từ nguồn quản lý tập trung. | Lọc theo học kỳ và gắn tài liệu, biểu mẫu theo đợt. |
| `thong-bao-lich-bao-ve.html` | Liệt kê thông báo lịch bảo vệ. | Thay đổi lịch phụ thuộc cập nhật nội dung. | Hiển thị lịch theo ngày/phòng và đánh dấu lịch điều chỉnh. |
| `thong-bao-tong-ket-vinh-danh.html` | Liệt kê bài tổng kết và vinh danh. | Nội dung lưu tĩnh. | Thêm bộ lọc năm học và tìm bài theo từ khóa. |

### Trang chi tiết thông báo

Các trang dưới đây dùng chung mô hình đọc bài. Mỗi dòng ghi nhận nội dung riêng của trang và một cải tiến áp dụng cho tuyến đọc thông báo.

| Trang | Chức năng hiện có | Còn thiếu hoặc chưa hoàn thiện | Đề xuất |
|---|---|---|---|
| `chi-tiet-thong-bao.html?id=01` | Đọc bài “[KH&KTTT] VINH DANH SINH VIÊN ĐẠT ĐIỂM KLTN CAO NHẤT HKII NĂM HỌC 2025-2026”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=02` | Đọc bài “[KH&KTTT] THÔNG BÁO THỜI GIAN BẢO VỆ KHÓA LUẬN TỐT NGHIỆP HỌC KỲ II NĂM HỌC 2025-2026”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=03` | Đọc bài “[KH&KTTT] KẾ HOẠCH THỰC HIỆN HỌC PHẦN ĐỒ ÁN_HKI_NH2025 - 2026”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=04` | Đọc bài “[KH&KTTT] THÔNG BÁO KẾ HOẠCH THỰC HIỆN KLTN HỌC KỲ I NĂM HỌC 2025 - 2026”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=05` | Đọc bài “[KH&KTTT] THÔNG TIN HỘI ĐỒNG BẢO VỆ KHÓA LUẬN TỐT NGHIỆP HỌC KỲ II NĂM HỌC 2024-2025”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=06` | Đọc bài “[KH&KTTT] THÔNG BÁO KẾT QUẢ BÁO CÁO TIẾN ĐỘ GIỮA KỲ KLTN_HKII_NH 22024 - 2025”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=07` | Đọc bài “[KH&KTTT] TỔNG KẾT LỄ BẢO VỆ KLTN HKI NH 2024 - 2025”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=08` | Đọc bài “[KH&KTTT] HỘI ĐỒNG BẢO VỆ KLTN HKI NH 2024 - 2025”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=09` | Đọc bài “[KH&KTTT] KẾ HOẠCH HỌC VỤ ĐỒ ÁN HKII NĂM HỌC 2024 - 2025”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=10` | Đọc bài “[KH&KTTT] THÔNG BÁO HỌC VỤ KLTN_HKII_NH 2024 - 2025”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=11` | Đọc bài “[KH&KTTT] THÔNG BÁO HĐ BÁO CÁO GIỮA KỲ KLTN HKI NH 2024-2025”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=12` | Đọc bài “[KH&KTTT] THÔNG BÁO THỰC HIỆN KLTN HKI NĂM HỌC 2024 - 2025”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=13` | Đọc bài “[KH&KTTT] TỔNG KẾT LỄ BẢO VỆ KHÓA LUẬN TỐT NGHIỆP ĐỢT 2 - NĂM 2023”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=14` | Đọc bài “[KH&KTTT] LỄ BẢO VỆ KHÓA LUẬN TỐT NGHIỆP ĐỢT 2 NĂM HỌC 2022 - 2023”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=15` | Đọc bài “[KH&KTTT] BẢO VỆ KHÓA LUẬN TỐT NGHIỆP - ĐỢT 1 - NĂM HỌC 2022 - 2023”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=16` | Đọc bài “[KH&KTTT] THÔNG BÁO CUỐI KỲ KHÓA LUẬN TỐT NGHIỆP HK I NĂM HỌC 2022 - 2023”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=17` | Đọc bài “[KH&KTTT] KHÓA LUẬN TỐT NGHIỆP HK I NĂM HỌC 2022 - 2023”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=18` | Đọc bài “[KH&KTTT] VINH DANH SINH VIÊN ĐẠT THÀNH TÍCH CAO TRONG LỄ BẢO VỆ KHÓA LUẬN TỐT NGHIỆP ĐỢT 2 - NĂM HỌC 2021-2022 NGÀNH CNTT, KHDL”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=19` | Đọc bài “[KH&KTTT] [TỔNG KẾT] LỄ TỐT NGHIỆP VÀ TRAO BẰNG KHOA KHOA HỌC VÀ KỸ THUẬT THÔNG TIN, ĐỢT 1 NĂM 2022”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=20` | Đọc bài “[KH&KTTT] KẾT QUẢ XÉT DUYỆT ĐỀ CƯƠNG KLTN HK2 2021-2022”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=21` | Đọc bài “[KH&KTTT] NỘP ĐỀ CƯƠNG KHÓA LUẬN TỐT NGHIỆP”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=22` | Đọc bài “[KH&KTTT] KHÓA LUẬN TỐT NGHIỆP HK2 NĂM HỌC 2021-2022”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=23` | Đọc bài “[KH&KTTT] VINH DANH SINH VIÊN ĐẠT ĐIỂM SỐ CAO NHẤT - BẢO VỆ KLTN NGÀNH KHDL KHÓA 2018”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |
| `chi-tiet-thong-bao.html?id=24` | Đọc bài “[KH&KTTT] THÔNG BÁO KHOÁ LUẬN TỐT NGHIỆP HK1 NĂM HỌC 2021-2022”. | Nội dung lưu trong `assets/js/data/notification-details.js`. | Hiển thị ngày cập nhật và liên kết tới bài liên quan. |

## Đối chiếu module giảng viên

Các module nghiệp vụ nằm dưới `assets/js/pages/lecturer/`. Bảng trên đối chiếu với script được nạp ở điểm vào HTML.

- `overview.js` và `profile.js` phục vụ tổng quan và hồ sơ. `profile-fields.js` chứa mã hỗ trợ trường hồ sơ.
- `topic-list.js` và `topic-sort.js` phục vụ hai danh sách. Các trang còn nạp `uit-topic-list.js`, và danh sách đang hướng dẫn nạp thêm `uit-teacher-approved-proposals.js`.
- `created-topic.js`, `topic-media.js` và `topic-registration-state.js` phục vụ chi tiết đề tài đã tạo. `topic-editor.js` dùng chung cho tạo và sửa.
- `workspace.js`, `progress.js`, `submissions.js` và `evaluation.js` phục vụ chi tiết đề tài đang hướng dẫn.
- Các tệp `source-metadata.js`, `profile-fields.js` và `teacher-approved-proposals.js` có trong mã nguồn. Rà soát HTML và JavaScript chưa tìm thấy tham chiếu nạp trực tiếp các tệp này. Danh sách đề tài đang hướng dẫn nạp biến thể `uit-teacher-approved-proposals.js`.
- Dữ liệu giảng viên dựa trên `data/lecturer-topics.js`, `data/lecturer-source-data.js`, `data/lecturer-real-data.js`, `data/proposal-actors.js`, `data/teaching-data.js` cùng các tập dữ liệu mẫu liên quan. Hồ sơ tham khảo UIT cần được nhận diện khác với bản ghi do người dùng tạo.
- Nhóm dịch vụ bao gồm hồ sơ, đề tài và tệp đề tài, đăng ký/đề xuất, đề tài đã duyệt hoặc công bố, nhóm, tiến độ, hướng dẫn, bài nộp và đánh giá. Các lớp giao diện dùng chung xử lý menu, tab, hộp thoại, kiểm tra đầu vào và tải tệp. Sự hiện diện của tệp dịch vụ chưa xác nhận tính năng đã đồng bộ qua máy chủ.

## Thứ tự đề xuất triển khai

1. Nối bài nộp và phản hồi giữa hai vai trò, đồng thời chặn xóa yêu cầu đã có bài nộp.
2. Hoàn thiện tải tệp đúng đề tài và lưu nội dung tệp đề xuất.
3. Nối lời mời từ tab Nhóm với hộp thư giảng viên và cập nhật lịch từ yêu cầu bài nộp.
4. Hoàn thiện chỉnh sửa nhóm, đổi mật khẩu, gửi liên hệ và tệp đánh giá theo phạm vi trình diễn. Kiểm thử các tích hợp đã có.

## Nguồn đối chiếu trong dự án

- Điểm vào và trang theo vai trò tại [index.html](../index.html), [pages/chung](../pages/chung), [pages/sinh-vien](../pages/sinh-vien) và [pages/giang-vien](../pages/giang-vien).
- Mã theo trang tại [assets/js/pages](../assets/js/pages), dịch vụ tại [assets/js/services](../assets/js/services) và dữ liệu tại [assets/js/data](../assets/js/data).
- Trạng thái cục bộ và tích hợp tại [storage.js](../assets/js/services/storage.js), [supervision-store.js](../assets/js/supervision-store.js), [student-submissions-service.js](../assets/js/services/student-submissions-service.js), [contact-form.js](../assets/js/contact-form.js), [recovery-otp.js](../assets/js/recovery-otp.js), [google-login.js](../assets/js/google-login.js) và [deadline-calendar.js](../assets/js/deadline-calendar.js).
