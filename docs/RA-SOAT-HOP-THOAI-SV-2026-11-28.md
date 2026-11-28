# Rà soát hộp thoại SV — 28/11/2026

Phạm vi: bản làm việc riêng ban đầu dựa trên e94fb1a, đã ghép lên main d7fef24 (giữ chuông thông báo mới của nhóm). Không chỉnh checkout GitHub, không commit, push hoặc deploy. Chưa đổi giao diện GV; các nhánh mới trong mã dùng chung chỉ áp dụng SV.

## Bỏ Hủy dư khi đã có X

1. Xác nhận rút/xóa đề xuất chờ duyệt.
2. Thêm công việc.
3. Sửa công việc.
4. Mẫu nộp/cập nhật bài nộp.
5. Chỉnh sửa hồ sơ.
6. Đổi mật khẩu.
7. Đổi ảnh đại diện.
8. Chọn mốc xuất sang Google Calendar.

Giữ Hủy lời mời (thao tác riêng), Hủy phần phản hồi đang soạn (chỉ đóng trình soạn) và Hủy ở biểu mẫu không có X. Không bỏ xác nhận hành động xóa/rút.

## Bổ sung thông báo sau khi xử lý xong

- Thêm/sửa/xóa công việc; tái sử dụng hộp lưu công việc có sẵn.
- Đăng ký đề tài; thêm/sửa/xóa thành viên trong biểu mẫu đăng ký. Thông báo thành viên ghi rõ cập nhật biểu mẫu, cần đăng ký để gửi.
- Gửi mới/cập nhật/gửi lại đề xuất: đồng nhất cách mở hộp thành công và tiêu đề theo thao tác.
- Rút/xóa đề xuất, sửa/gửi lại/rút/xóa yêu cầu đăng ký và đề xuất trong trang chi tiết yêu cầu.
- Gửi lời mời từ Hướng nghiên cứu: báo thành công rồi đóng X để chuyển tới cuộc trao đổi vừa lưu.
- Gửi phản hồi trong lời mời hướng dẫn, gửi bình luận/phản hồi trong công việc.
- Đồng bộ Google Calendar: chỉ báo thành công khi tất cả kết quả đã thêm/cập nhật/đã có. Lỗi hoặc thành công một phần giữ thông tin trong hộp chọn.

Các hộp thành công đã có của lưu hồ sơ, đổi ảnh, đổi mật khẩu, nộp/cập nhật bài nộp, thêm thành viên đề tài, mời/hủy mời GVHD được giữ. Việc chọn/bỏ tệp nháp, đổi bộ lọc hoặc mở hộp không được mô tả là đã lưu dữ liệu.

## Kiểm tra

- Rà mã 14 trang SV, 110 thẻ dialog: không còn tổ hợp X và Hủy chỉ để đóng. Mẫu bài nộp động cũng đã bỏ Hủy.
- Không thiếu tài nguyên script/CSS được tham chiếu trong 14 trang; các JS thay đổi đều qua node --check.
- 90 bài kiểm thử tự động đạt, gồm hàng đợi hộp thông báo, callback/focus và chặn khởi tạo helper ở đường dẫn GV.
- Đã thao tác trình duyệt: thêm/sửa/xóa công việc thử, gửi bình luận, lưu hồ sơ, thêm thành viên biểu mẫu, đăng ký đề tài, lưu chỉnh sửa đề xuất, gửi lời mời mới và chuyển tới cuộc trao đổi, gửi phản hồi lời mời.
- Đã thử nhập thiếu thành viên: hiện lỗi, không mở thông báo thành công. Đã mở hộp rút và đóng X: không rút dữ liệu.
- Đã mở hộp nộp bài: X hoạt động và nút xác nhận bị khóa khi chưa có tệp.
- Hộp thông báo mới đã xem ở desktop và 320px; thử Escape và trả focus; thử thông báo động tiếng Anh. Không ghi nhận console error ở các trang vừa kiểm tra.

Giới hạn: không thay mật khẩu hoặc ghi Google Calendar thật trong QA. Luồng lưu tệp thật, rút/xóa/gửi lại tất cả loại yêu cầu, đổi ảnh và mời/hủy GVHD chưa được thao tác lại toàn bộ trên trình duyệt trong đợt này; đã đối chiếu mã và chạy các kiểm thử dịch vụ hiện có. 110 là số dialog rà mã, không phải 110 luồng đã bấm thử.

## Demo local

- http://127.0.0.1:8795/pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html?project=UIT-SV-ISEDAMH-004#tien-do
- http://127.0.0.1:8795/pages/sinh-vien/dang-ky-de-tai.html
- http://127.0.0.1:8795/pages/sinh-vien/ho-so-ca-nhan.html
- http://127.0.0.1:8795/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html#loi-moi-huong-dan

Tài khoản demo: sinhvien / Demo1234. Server chỉ dùng trên máy này; dữ liệu demo lưu theo origin trình duyệt, độc lập bản deploy.

## Điều chỉnh theo phản hồi tiếp theo

- Đã bỏ hộp thành công khi thêm thành viên trong đăng ký và trong nhóm đề tài. Sửa/xóa thành viên vẫn giữ thông báo như trước.
- Đã bỏ hộp thành công khi gửi tin nhắn/phản hồi lời mời và bình luận/phản hồi công việc. Dữ liệu vẫn lưu, nội dung hiện ngay, lỗi hiển thị tại chỗ.
- Gửi lời mời mới vẫn có thông báo thành công. Google Calendar không đổi xử lý trong lần điều chỉnh này.

## Đồng bộ dấu X lớn, nét mảnh

Dùng biểu tượng SVG 24px, nét 1.75px và vùng bấm 44×44px trên các trang SV:

- Hồ sơ: chỉnh sửa thông tin, đổi mật khẩu, đổi ảnh, thông báo thành công.
- Đăng ký: xác nhận đăng ký, thêm/sửa thành viên.
- Đề xuất: chọn giảng viên, thông báo gửi/lưu, xác nhận rút/xóa và chi tiết yêu cầu.
- Tiến độ: thêm/sửa/xóa/chi tiết công việc, thông báo sau thao tác, thông tin người phụ trách có nút đóng.
- Nhóm đề tài: thêm thành viên, chọn/mời GVHD, hủy lời mời và thông báo liên quan.
- Bài nộp: chi tiết yêu cầu, nộp/cập nhật, xem phản hồi và thông báo thành công.
- Lịch hạn nộp: xem chi tiết sự kiện/danh sách mốc và hộp chọn Google Calendar.
- Hộp thông báo thao tác dùng chung trên SV.

Không đổi kiểu nút đóng bên GV. Không thêm X vào các biểu mẫu trước đó không có X.
Đã nhìn giao diện hồ sơ và đo icon/vùng bấm ở hồ sơ, tiến độ: 24px/44px; click và Escape đóng được, không có console error.

## Bản tổng hợp để push

Toàn bộ chỉnh sửa hộp thoại SV trong cuộc trao đổi được gộp trong gói goi-hop-thoai-sv-main-d7fef24-2026-11-28, nền main d7fef24fb2c24a185660588ccb328e5198e7e8f5.
Gói không chứa file .github hay thay đổi giao diện GV, không commit/push tự động.
