# Quản lý đồ án và khóa luận — IE104, Nhóm 7

Đồ án môn **IE104 — Internet và Công nghệ Web, UIT**. Website hỗ trợ sinh viên
và giảng viên quản lý đề tài, đăng ký/đề xuất, tiến độ, hạn nộp, bài nộp và đánh giá.
Dự án dùng **HTML5, CSS3, JavaScript thuần**; hiện là bản demo với dữ liệu minh họa.

## Chạy dự án

Mở [index.html](index.html) để xem danh mục màn hình, hoặc dùng **Live Server**
từ gốc repo. Không cần cài thư viện hay build. Nên dùng HTTP và cùng trình duyệt
để kiểm tra dữ liệu demo giữa các trang/tab.

## Cấu trúc và luồng chính

- [pages/chung/](pages/chung/): đăng nhập, quên mật khẩu, giới thiệu, hướng nghiên cứu, thông báo và liên hệ.
- [pages/sinh-vien/](pages/sinh-vien/): tổng quan, đăng ký đề tài, đề tài của tôi, tạo đề xuất, lịch hạn nộp và hồ sơ.
- [pages/giang-vien/](pages/giang-vien/): tổng quan, đề tài đang hướng dẫn/đã tạo, yêu cầu chờ duyệt và hồ sơ.
- `assets/`: CSS, JavaScript, font Be Vietnam Pro và hình ảnh; `tests/`: kiểm thử tự động.


## Chức năng demo và giới hạn

- Có điều hướng, tab, hộp thoại, hiện/ẩn mật khẩu; tìm kiếm/lọc/sắp xếp các danh sách đề tài; chọn giảng viên, môn học và lịch hạn nộp mẫu.
- Yêu cầu chờ duyệt có tìm kiếm, lọc, sắp xếp, phân trang và mở đúng hồ sơ. Duyệt/từ chối lưu bằng `localStorage`, cập nhật kết quả giữa hai vai trò và các tab cùng nguồn URL.
- Thông báo có lọc theo loại, phân trang và giữ trạng thái khi tải lại hoặc Back/Forward. Khi sửa bài, cập nhật cả `assets/js/notifications-data.js` và HTML dự phòng.

Chưa có backend, cơ sở dữ liệu hoặc đồng bộ giữa người dùng/thiết bị. Đăng nhập,
phân quyền, gửi đăng ký/đề xuất, upload, đánh giá và gửi email chưa xử lý thực.
Chưa triển khai chuyển Việt/Anh. Lịch mẫu cố định “hôm nay” là 18/10/2026.

### Demo Liên hệ xin hướng dẫn

1. Mở [Hướng nghiên cứu](pages/chung/huong-nghien-cuu.html) qua Live Server. Chọn **Liên hệ xin hướng dẫn** và, nếu được chuyển đến Đăng nhập, chọn **Đăng nhập bằng tài khoản mẫu**. Điền và gửi lời mời.
2. Trên tab thứ hai cùng địa chỉ máy chủ, mở [Yêu cầu chờ duyệt → Lời mời hướng dẫn](pages/giang-vien/yeu-cau-cho-duyet.html#loi-moi-huong-dan). Chọn giảng viên đã nhận lời mời và trả lời.
3. Trên tab sinh viên, xem và trả lời trong [Đề tài của tôi → Lời mời hướng dẫn](pages/sinh-vien/de-tai-cua-toi-sinh-vien.html#loi-moi-huong-dan). Giảng viên có thể **Đồng ý hướng dẫn** hoặc **Từ chối** và kèm lời nhắn. Sau khi đồng ý, sinh viên có thể mở **Tạo đề xuất**. Nếu giảng viên chưa có trong danh mục nhận đề xuất thử, biểu mẫu hiển thị thông tin lời mời để đối chiếu.

Phiên sinh viên mẫu lưu trong tab. Lời mời và phản hồi lưu bằng `localStorage` và đồng bộ giữa các tab cùng nguồn URL. Quyết định kết thúc trao đổi trên lời mời. Việc đồng ý hướng dẫn ghi nhận trong lời mời, còn việc gửi đề xuất chính thức vẫn theo luồng riêng.

Tab **Lời mời hướng dẫn** cũng mở được từ **Tổng quan** của mỗi vai trò. Sinh viên thấy phản hồi gần nhất. Giảng viên thấy số lời mời demo đang chờ phản hồi.

Mỗi lời mời hoặc phản hồi có thể đính kèm một tệp tối đa 10 MB. Bản demo lưu tệp trong IndexedDB. Hai vai trò có thể tải tệp từ cuộc trao đổi khi dùng cùng trình duyệt và cùng nguồn URL.

Kiểm thử kho dữ liệu demo bằng Node.js, không cần thư viện:

```sh
node --test tests/proposal-store.test.cjs tests/supervision-store.test.cjs
```

Hướng dẫn phát triển nằm trong **AGENTS.md, PRODUCT.md và DESIGN.md ở thư mục cha**;
đọc PRODUCT và DESIGN trước khi sửa HTML/CSS/JavaScript.
