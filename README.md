# Website quản lý đồ án và khóa luận — IE104, Nhóm 7

Website phục vụ sinh viên và giảng viên theo dõi đề tài, đăng ký, đề xuất,
tiến độ và bài nộp. Dự án dùng HTML5, CSS3 và JavaScript thuần. Bản hiện tại
chạy trên trình duyệt với dữ liệu minh họa.

## Mở dự án

Mở [index.html](index.html) để vào danh mục màn hình. Có thể dùng Live Server
từ gốc repo khi phát triển. Dự án không cần cài thư viện hoặc chạy bước build.

## Cấu trúc mã nguồn

Danh mục dưới đây đối chiếu mã nguồn ngày **07/11/2026**. Repo có 37 file HTML,
gồm trang danh mục và 36 trang theo nhóm.

| Thư mục | Nội dung |
| --- | --- |
| [pages/chung/](pages/chung/) | 11 trang: Đăng nhập, Quên mật khẩu, Giới thiệu, Hướng nghiên cứu, Liên hệ, danh sách và 5 bài Thông báo |
| [pages/sinh-vien/](pages/sinh-vien/) | 15 trang: Tổng quan, Đăng ký đề tài, Đề tài của tôi, Tạo đề xuất, Lịch hạn nộp, Hồ sơ và các trang chi tiết mẫu |
| [pages/giang-vien/](pages/giang-vien/) | 10 trang: Tổng quan, quản lý đề tài đang hướng dẫn/đã tạo, tạo/sửa đề tài, yêu cầu chờ duyệt, chi tiết và Hồ sơ |
| [assets/css/](assets/css/) | Token, CSS nền, thành phần dùng chung và stylesheet theo trang hoặc nhóm chức năng |
| [assets/js/](assets/js/) | Script điều hướng, tab, hộp thoại, lọc đề tài, biểu mẫu và lịch mẫu |
| [assets/fonts/](assets/fonts/) và [assets/images/](assets/images/) | Font Be Vietnam Pro lưu cục bộ, logo, ảnh minh họa và icon |

Danh mục đầy đủ, các biến thể mẫu và ID chuyển phần nằm trong
[Hướng dẫn sử dụng khung trang](docs/Huong_dan_su_dung_khung_trang.md).

## Các luồng giao diện

- **Chung:** [Đăng nhập](pages/chung/dang-nhap.html) → [Quên mật khẩu](pages/chung/quen-mat-khau.html).
  Các trang công khai gồm [Giới thiệu](pages/chung/gioi-thieu.html),
  [Hướng nghiên cứu](pages/chung/huong-nghien-cuu.html),
  [Thông báo](pages/chung/thong-bao.html) và [Liên hệ](pages/chung/lien-he.html).
- **Sinh viên:** [Đăng ký đề tài](pages/sinh-vien/dang-ky-de-tai.html) → xem chi tiết hoặc
  [Tạo đề xuất](pages/sinh-vien/tao-de-xuat.html).
  [Đề tài của tôi](pages/sinh-vien/de-tai-cua-toi-sinh-vien.html) dẫn tới chi tiết
  đề tài và hồ sơ đăng ký/đề xuất mẫu. [Lịch hạn nộp](pages/sinh-vien/lich-han-nop.html)
  hiển thị sự kiện mẫu theo tháng.
- **Giảng viên:** Quản lý đề tài mở [Đề tài đang hướng dẫn](pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html),
  có lối sang [Đề tài đã tạo](pages/giang-vien/danh-sach-de-tai-da-tao.html)
  để tạo hoặc sửa đề tài. [Yêu cầu chờ duyệt](pages/giang-vien/yeu-cau-cho-duyet.html)
  dẫn tới [chi tiết đề xuất mẫu](pages/giang-vien/chi-tiet-de-xuat-giang-vien.html).
  Hạn và bài nộp nằm trong chi tiết đề tài đang hướng dẫn.
- **Chi tiết đề tài:** Sinh viên và giảng viên có bốn phần Tổng quan, Tiến độ,
  Bài nộp và Kết quả đánh giá. Hồ sơ cá nhân dùng trang riêng theo vai trò.

## JavaScript và giới hạn bản demo

- Các trang dùng cùng script chỉ báo điều hướng. Tab Giới thiệu, tab chi tiết
  đề tài và hiện/ẩn mật khẩu hoạt động trên trình duyệt.
- Tìm kiếm, lọc và sắp xếp dữ liệu mẫu hoạt động ở Đăng ký đề tài, Đề tài của tôi,
  Đề tài đang hướng dẫn và Đề tài đã tạo. Ô tìm kiếm chấp nhận tiếng Việt không dấu.
- Tạo đề xuất hỗ trợ tìm/chọn giảng viên và cập nhật lựa chọn môn học theo loại đề tài.
- Hộp thoại dùng nút HTML `command`/`commandfor`. Các trang nạp
  `dialog-commands.js` có xử lý dự phòng khi trình duyệt thiếu hỗ trợ các lệnh này.
- Lịch hạn nộp chuyển tháng và hiển thị sự kiện mẫu với mốc “hôm nay”
  cố định là 18/10/2026. Các lựa chọn đề tài dùng chung dữ liệu mẫu.
- Các tác vụ như đăng nhập, phân quyền, khôi phục mật khẩu, gửi liên hệ,
  lưu đăng ký/đề xuất, duyệt, lưu bài nộp và đánh giá chưa có xử lý thực.
  Repo hiện chưa có backend, cơ sở dữ liệu hoặc lưu trữ dùng chung.
  Chuyển Việt/Anh, phân trang dữ liệu và lọc yêu cầu chờ duyệt vẫn cần xử lý.
  Phân công trang chung và giảng viên được theo dõi ở tab
  **Task JavaScript** của bảng quản lý nhóm.

Khi sửa giao diện, tham khảo [PRODUCT.md](PRODUCT.md), [DESIGN.md](DESIGN.md)
và trang cùng vai trò. Dùng đường dẫn tương đối, tên file chữ thường không dấu,
và kiểm tra lại liên kết, bàn phím và các kích thước màn hình có liên quan.
