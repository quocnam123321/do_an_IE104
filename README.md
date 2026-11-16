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

Kiểm thử kho quyết định demo bằng Node.js, không cần thư viện:

```sh
node --test tests/proposal-store.test.cjs
```

Hướng dẫn phát triển nằm trong **AGENTS.md, PRODUCT.md và DESIGN.md ở thư mục cha**;
đọc PRODUCT và DESIGN trước khi sửa HTML/CSS/JavaScript.
