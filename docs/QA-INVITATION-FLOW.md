# Luồng lời mời hướng dẫn — 24/11/2026

Bản làm việc trong GPT: loi-moi-lien-thong-7f4222f-2026-11-24. Chưa sửa/push GitHub.

- SV gửi/hủy lời mời qua projectTeams; GV nhận ở trang chờ duyệt bình thường, xem chi tiết chỉ đọc và xác nhận duyệt/từ chối. Lý do từ chối tối thiểu 10 ký tự. Chỉ báo thành công sau khi lưu được.
- Tài khoản GV demo nhận được lời mời gửi đến mọi giảng viên, không cần chọn người nhận. Quyết định ghi demoDecision và người thao tác GV001; tên/mã người được mời vẫn giữ, được thêm vào nhóm khi đồng ý. Tài khoản thật vẫn đối chiếu email với danh mục, không dùng quy tắc gom lời mời của demo.
- Bỏ khu vực Liên hệ trước khi đề xuất khỏi tab. Không xóa luồng liên hệ độc lập ở những trang khác.
- Hộp thành công gọn, chỉ có X không viền và nội dung; không có footer/nút Đóng. Giữ focus bàn phím. Sửa specificity để CSS dialog chung SV không ghi đè.
- Trang chi tiết có page-container, breadcrumb, nút quay lại cùng kiểu GV, bố cục nội dung 3:2 trên desktop, một cột trên điện thoại.
- Dữ liệu lưu trong trình duyệt, chưa có backend đồng bộ giữa các máy.

Kiểm tra: 14 test project-invitations/student-topic-preview/student-submissions-sync đạt, gồm demo xử lý hai người nhận khác nhau, tài khoản khác bị chặn, duyệt thêm đúng quan hệ, từ chối/lý do, lời mời hủy hoặc stale, đề tài hoàn thành và lỗi lưu không báo thành công. Cú pháp JS đạt; nguồn CSS/JS của hai trang có đủ; không còn selector/contact.
Server demo cổng 8781 trả HTTP200. Chưa kiểm tra trực quan bản cuối do quyền truy cập trình duyệt của công cụ không có trong chat hiện tại.


## Chi tiết lời mời dùng đúng Tổng quan GV
- Thay bố cục riêng bằng nguyên markup overview-section từ chi tiết đang hướng dẫn GV, giữ nguyên thứ tự stylesheet của trang đó.
- Tách hàm hiển thị Tổng quan hiện có sang shared/lecturer-overview.js; cả trang quản lý đề tài và chi tiết lời mời cùng gọi hàm này. Không tải controller tiến độ/bài nộp/đánh giá trong trang lời mời.
- Giữ kiểm tra quyền truy cập lời mời và các nút duyệt/từ chối cuối trang. Không có thanh 4 tab.
- Đối chiếu cấu trúc HTML Tổng quan hai trang giống nhau, thứ tự dependency hợp lệ và cú pháp/asset hợp lệ. 14 kiểm thử dữ liệu hiện có đạt. Chưa xác nhận trực quan vì công cụ trình duyệt không khả dụng.


## Bản đóng gói cuối
- Chi tiết lời mời chỉ xem Tổng quan, không có thanh 4 tab và không có nút Từ chối/Đồng ý. Chỉ duyệt ở danh sách lời mời.
- 15 kiểm thử project-invitations/catalog-detail-course-label/student-topic-preview/student-submissions-sync đạt tại thời điểm đóng gói.
- Không ghi đè phần chi tiết đăng ký hoặc những file không có trong manifest.
- Chưa thể xác nhận trực quan trên trình duyệt do công cụ không khả dụng trong chat hiện tại; kiểm thử trên là kiểm thử xử lý dữ liệu và kiểm tra nguồn.
