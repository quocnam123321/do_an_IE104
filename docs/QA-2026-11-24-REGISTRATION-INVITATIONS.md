# Kiểm tra bản ghép 50fdab7 — 24/11/2026

- Bản nền hiện hành: 50fdab70539c3df0c1b494caf21ddb760d3eb89b. Không sửa thư mục GitHub.
- Ghép ba chiều, xử lý 6 file trùng: registration-detail.css, open-topic.js, published-topic.js và ba HTML sửa/chi tiết đăng ký.
- Giữ luồng chỉnh sửa, đăng ký, helper registration-supervisor.js/topic-attachment.js của commit mới; không đưa lại bản renderer cũ.
- Giữ bản đồng bộ 23 đề tài, 5 hoàn thành và tệp đánh giá giữ chỗ; liên kết tải các bài minh họa vẫn có khi hoàn thành, tệp tải lên thật không bị thay.
- Trong chi tiết SV/GV: IE505 - Khóa luận tốt nghiệp; IE501 - Đồ án tốt nghiệp. Ngoài danh sách vẫn chỉ tên.
- Lời mời bản thử: mã - tên chung tiêu đề, không nhãn chờ, không dòng SV/nhóm; xử lý xong bỏ khỏi danh sách đang chờ. Chỉ trạng thái của trang, chưa lưu nghiệp vụ. Xem bằng ?preview=loi-moi#loi-moi-huong-dan. Hộp thư thực tế không bị ghi đè.
- 11 kiểm thử liên quan đạt; kiểm tra 23 đề tài/5 hoàn thành/510 tệp mẫu đạt. Cú pháp JS kiểm tra khi đóng gói.
- Đã mở bản ghép mới trên trình duyệt ở cổng 8780: chi tiết đăng ký IE505, khung GVHD/tài liệu mới không có lỗi console; lời mời hiện đúng thiết kế rút gọn.
- Trước ghép đã xem chi tiết GV IE501 và tải PDF thực tế từ đề tài hoàn thành; sau ghép kiểm thử quyền/tệp tiếp tục đạt.
- Trang lời mời là bản thử, không tuyên bố đã nối dữ liệu mời SV/GV.

## Điều chỉnh phạm vi cuối cùng
Theo yêu cầu người dùng: bỏ các sửa riêng trong chi tiết Đăng ký đề tài, giữ giao diện/luồng của commit 50fdab7. Khôi phục nguyên bản registration-detail.css, open-topic.js, published-topic.js và hai HTML chi tiết mở đăng ký. HTML chỉ khác query cache của catalog/dữ liệu dùng chung. Không giữ sửa ảnh, khung GVHD, tên nhóm, khoảng cách hoặc bố cục tài liệu riêng của GPT tại đây. Mã môn chi tiết IE505/IE501 vẫn giữ qua subjectLabel dùng chung. Các sửa lời mời/bài nộp/đề tài của tôi ngoài phạm vi này giữ nguyên.
Đối chiếu bằng nội dung với archive 50fdab7: 3 file CSS/JS giống byte; 2 HTML chỉ khác query cache. 11 kiểm thử liên quan vẫn đạt. Chưa copy/push GitHub.
