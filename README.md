# Website quản lý đồ án và khóa luận — IE104, Nhóm 7

Website dành cho sinh viên và giảng viên, xây dựng bằng HTML, CSS và
JavaScript thuần. Cập nhật **23/10/2026**: repo có **33 file HTML** gồm
1 trang vào, 10 trang chung, 9 trang sinh viên, 11 trang giảng viên và
2 khung mẫu.

Đây là giai đoạn dựng khung HTML. Tên mẫu, ô trống, ảnh giữ chỗ và dữ liệu
minh họa được giữ để thể hiện cấu trúc; không yêu cầu dữ liệu đầy đủ.
Các biểu mẫu, thông báo trạng thái và hộp xác nhận chưa kết nối xử lý nghiệp vụ.

## Mở dự án

Mở [index.html](index.html) bằng trình duyệt để truy cập danh mục các trang.
Không cần cài thư viện hoặc chạy bước build. Có thể dùng Live Server từ
thư mục gốc repo khi phát triển.

## Cây file HTML hiện có

```text
do_an_IE104/
├── index.html
├── pages/
│   ├── chung/                              # 10 trang
│   │   ├── dang-nhap.html
│   │   ├── quen-mat-khau.html
│   │   ├── gioi-thieu.html
│   │   ├── lien-he.html
│   │   ├── thong-bao.html
│   │   ├── chi-tiet-thong-bao-01.html
│   │   ├── chi-tiet-thong-bao-02.html
│   │   ├── chi-tiet-thong-bao-03.html
│   │   ├── chi-tiet-thong-bao-04.html
│   │   └── chi-tiet-thong-bao-05.html
│   ├── sinh-vien/                          # 9 trang
│   │   ├── tong-quan-sinh-vien.html
│   │   ├── dang-ky-de-tai.html
│   │   ├── chi-tiet-de-tai-mo-dang-ky.html
│   │   ├── tao-de-xuat.html
│   │   ├── de-tai-cua-toi-sinh-vien.html
│   │   ├── chi-tiet-dang-ky-va-de-xuat-sinh-vien.html
│   │   ├── chi-tiet-de-tai-sinh-vien.html
│   │   ├── lich-han-nop.html
│   │   └── ho-so-ca-nhan.html
│   └── giang-vien/                         # 11 trang
│       ├── tong-quan-giang-vien.html
│       ├── danh-sach-de-tai-dang-huong-dan.html
│       ├── danh-sach-de-tai-da-tao.html
│       ├── tao-de-tai-giang-vien.html
│       ├── chi-tiet-de-tai-da-tao-giang-vien.html
│       ├── chinh-sua-de-tai-giang-vien.html
│       ├── chi-tiet-de-tai-dang-huong-dan-giang-vien.html
│       ├── yeu-cau-cho-duyet.html
│       ├── chi-tiet-de-xuat-giang-vien.html
│       ├── han-nop-cua-sinh-vien.html
│       └── ho-so-ca-nhan-giang-vien.html
└── templates/                              # 2 khung mẫu
    ├── khung-sinh-vien.html
    └── khung-giang-vien.html
```

`assets/images/images.jpg` là logo đang sử dụng. `assets/css/` và
`assets/js/` dành cho các giai đoạn tiếp theo; chưa có CSS bố cục chung
hoặc JavaScript nghiệp vụ. Một số trang có CSS nội tuyến tối thiểu phục vụ
chọn nội dung theo fragment hoặc giữ cấu trúc hiện có.

File trùng `chi-tiet-de-tai-dang-ky.html` ở gốc đã được loại bỏ; dùng
[Chi tiết đề tài mở đăng ký](pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html).
Các file hướng dẫn Codex cục bộ không thuộc cây mã nguồn giao diện ở trên.

## Các luồng khung hiện có

- Chung: [Đăng nhập](pages/chung/dang-nhap.html) →
  [Quên mật khẩu](pages/chung/quen-mat-khau.html);
  [Giới thiệu](pages/chung/gioi-thieu.html),
  [Thông báo](pages/chung/thong-bao.html) và [Liên hệ](pages/chung/lien-he.html).
- Sinh viên: [Đăng ký đề tài](pages/sinh-vien/dang-ky-de-tai.html) → chi tiết
  đăng ký hoặc [Tạo đề xuất](pages/sinh-vien/tao-de-xuat.html);
  [Đề tài của tôi](pages/sinh-vien/de-tai-cua-toi-sinh-vien.html) →
  [Chi tiết đề tài](pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html), gồm bốn phần
  Tổng quan (`#tong-quan`), Tiến độ (`#tien-do`), Bài nộp (`#bai-nop`),
  Kết quả đánh giá (`#ket-qua-danh-gia`) trong cùng một file, và hồ sơ
  đăng ký/đề xuất. [Lịch hạn nộp](pages/sinh-vien/lich-han-nop.html)
  có liên kết mở biểu mẫu bài nộp mẫu.
- Giảng viên: Quản lý đề tài → [Đề tài đang hướng dẫn](pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html)
  hoặc [Đề tài đã tạo](pages/giang-vien/danh-sach-de-tai-da-tao.html);
  [Yêu cầu chờ duyệt](pages/giang-vien/yeu-cau-cho-duyet.html) →
  [Chi tiết yêu cầu](pages/giang-vien/chi-tiet-de-xuat-giang-vien.html);
  [Hạn nộp của sinh viên](pages/giang-vien/han-nop-cua-sinh-vien.html) mở từ Tổng quan.

Danh sách Yêu cầu chờ duyệt đang trình bày đề xuất theo wireframe hiện hành;
khung chi tiết có cả đăng ký (`#dk001`) và đề xuất (`#dx001`). Tên file chi
tiết yêu cầu vẫn là `chi-tiet-de-xuat-giang-vien.html` để giữ đường dẫn của dự án.

## Quy ước và giới hạn

- Trang theo vai trò đặt trong `pages/sinh-vien/` hoặc `pages/giang-vien/`;
  trang công khai trong `pages/chung/`. Hồ sơ cá nhân có bản riêng theo vai trò.
- Tên file dùng chữ thường, không dấu, nối bằng dấu gạch ngang.
- Dùng đường dẫn tương đối và dấu `/`: cùng thư mục dùng `ten-trang.html`,
  trang chung dùng `../chung/...`, tài nguyên dùng `../../assets/...`.
- `templates/` chứa khung sao chép; sửa khung không tự cập nhật các trang đã tạo.
- HTML hiện có các mẫu rỗng, lỗi, thành công, khóa và hộp xác nhận cho những
  luồng liên quan. Nhiều mẫu nằm trong `<template>` hoặc `<dialog>` đóng,
  dành cho bước nối tương tác sau này.
- Chưa có xác thực thật, khôi phục mật khẩu, gửi email, lưu dữ liệu, upload
  máy chủ, backend hoặc cơ sở dữ liệu. Không dùng sự hiện diện của nút/form
  làm bằng chứng chức năng nghiệp vụ đã hoàn thành.
- Chưa có CSS bố cục responsive dùng chung. Kiểm tra hiện tại tập trung
  cấu trúc HTML, nhãn biểu mẫu, đường dẫn và điều hướng theo vai trò.

Xem [Hướng dẫn sử dụng khung trang](docs/Huong_dan_su_dung_khung_trang.md)
để tra danh mục, anchor, nguồn wireframe và cách tạo trang tiếp theo.
