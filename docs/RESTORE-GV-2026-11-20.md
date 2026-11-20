# Phục hồi GV từ 1ddf0d3 — 20/11/2026

Bản này tách riêng khỏi do_an_IE104 hiện hành và checkout GitHub. Người dùng xác nhận dùng nguyên giao diện commit 1ddf0d320d1e0c9eb19dab3621be4f6cd4ae0365 ngày 16/11/2026. Không mang lại các controller, modal, lịch sử công việc, CSS ảnh hoặc điều chỉnh bố cục đã làm ngày 19/11. Các CSS gốc được giữ nguyên byte.

Thay đổi giao diện duy nhất: gộp cột Đã phản hồi ở Yêu cầu bài nộp vào Đã nộp, cả chế độ xem và xóa, giữ các thẻ và hộp thoại. Phần Bài nộp của nhóm vẫn có Chờ phản hồi và Đã phản hồi.

Dữ liệu: 10 đề tài đã tạo (ISE-001–ISE-010), 8 đang hướng dẫn (ISE-001–ISE-008), 2 chờ duyệt (ISE-009–ISE-010). Hai danh sách hướng dẫn/chờ duyệt không giao nhau ở trạng thái ban đầu. Tên đề tài, tác giả, GVHD có công bố đọc từ hai bảng UIT; mã ISE và thời gian/trạng thái/học kỳ/nghiệp vụ là dữ liệu minh họa. MSSV/email/GVHD chưa công bố không điền giả. Môn học không áp dụng cho các luận văn/khóa luận này.

Nguồn: https://ise.uit.edu.vn/vi/bai-viet/ten-d-tai-kltn-c-a-sinh-vien và https://ise.uit.edu.vn/vi/bai-viet/d-tai-lu-n-van-th-c-si-cac-nam . Bản HTML và chuỗi chuyển hướng lưu tại thư mục nguon bên ngoài website. Ngày đối chiếu 20/11/2026.

Đã đọc 7 tài liệu tóm tắt gốc qua tinyurl (6 Word xuất văn bản, 1 PDF). Mô tả/mục tiêu/kết quả dự kiến là nội dung diễn đạt lại có căn cứ trong các tài liệu đó, không phải trích dẫn nguyên văn hay đề cương ban đầu được tác giả xác nhận. Ba bản thạc sĩ không có tóm tắt tại nguồn đã đọc nên ba phần nội dung giữ trạng thái chưa có thông tin. Không công bố lại tài liệu gốc; giao diện chỉ dẫn về nguồn UIT/tóm tắt công khai.

uit-lecturer-catalog.js chứa metadata; uit-lecturer-view.js chỉ điền dữ liệu của đúng mã vào khung HTML gốc. Hai bản uit-proposal-store/detail giữ xử lý quyết định của commit gốc, chỉ thay nguồn/namespace/mã mặc định; không đổi shared proposal-store/detail dùng bởi SV.

Cách thử: vào hai danh sách, xem số 10/8, tìm tên hoặc mã, chọn lọc thạc sĩ, mở từng chi tiết và kiểm tra tên/mô tả. Vào chờ duyệt có 2 đề tài riêng. Tiến độ có ba cột màu cũ. Bài nộp có 2 cột ở phần yêu cầu và 2 cột ở phần bài nhóm. Không coi các nút disabled của bản gốc là chức năng đã xử lý. Khi copy/push về sau, đích là giang-vien; chưa tạo gói ghi đè nhánh này trước khi người dùng xem bản demo.


## Điều chỉnh theo kiểm tra tiếp của người dùng

Giữ 10 đề tài đã tạo và 8 đang hướng dẫn. Bổ sung 4 hồ sơ thật từ bảng KLTN khoa ISE: điểm danh Bluetooth, mô hình thống kê tạo đề thi, quản lý nhiều tài khoản đám mây, thương mại điện tử có gợi ý sản phẩm. Chờ duyệt dùng ISE-009–ISE-014, tổng 6 hồ sơ, không giao với ISE-001–ISE-008 của đang hướng dẫn; danh sách cũ phân trang 5+1. Bốn hồ sơ mới chỉ nhập tên/tác giả/link; chưa đọc tóm tắt nên nội dung chưa rõ dùng placeholder.

Chưa biết MSSV hiển thị xxxxxxxx; thông tin nội dung chưa có dùng [Mô tả đề tài], [Mục tiêu đề tài], [Kết quả dự kiến]. Mã học viên có công bố vẫn giữ giá trị nguồn. Ở phần Đề tài đã tạo, thông tin GV hiển thị placeholder Nguyễn Văn A, giangvien@example.com và hướng nghiên cứu chung Khoa học dữ liệu và Hệ thống thông tin; đây không phải thông tin của một giảng viên thực được xác thực.

Vai trò của ISE-005 là Đồng hướng dẫn (secondary), cả badge và bộ lọc. Đây là vai trò demo, không đổi trạng thái đang thực hiện và không phải khẳng định vai trò thật trong hồ sơ UIT.

Người phụ trách task và các popover được dựng từ cùng authors với Nhóm thực hiện của đúng record. Nhóm 1 người chỉ có người đó; nhóm nhiều người luân phiên phân công trong thành viên thật, không còn các tên/MSSV mẫu từ nhóm thư viện. Chỉ đổi thông tin phân công, không thêm cơ chế cập nhật công việc mới.

Bỏ dòng Thông tin đề tài lấy từ UIT; trạng thái, tiến độ và bài nộp là dữ liệu minh họa theo yêu cầu; sự phân biệt dữ liệu vẫn được ghi trong tài liệu này.

SV/GV: bản phục hồi này chưa tích hợp lại luồng nghiệp vụ mới. Cần chốt ID đề tài/nhóm/người dùng và schema chung, dùng một nguồn dữ liệu cho cả hai vai trò, rồi nối các trang/kiểm tra quyền và sự kiện. Không phải nhập dữ liệu xong hoặc merge nhánh là tự đồng bộ. Demo có thể đồng bộ cùng trình duyệt bằng bộ lưu chung; sử dụng giữa nhiều người/thiết bị cần backend.
