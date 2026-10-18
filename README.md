# Website quản lý đồ án và khóa luận — IE104, Nhóm 7

Website dành cho sinh viên và giảng viên, xây dựng bằng HTML, CSS và
JavaScript thuần. Hiện repo có **17 file HTML** gồm trang vào, 14 trang chức
năng/minh họa và 2 khung trang; chưa có CSS giao diện chung hoặc JavaScript
xử lý nghiệp vụ.

## Mở dự án

Mở [index.html](index.html) bằng trình duyệt để truy cập các trang hiện có.
Không cần cài thư viện hoặc chạy bước build. Có thể dùng Live Server từ
thư mục gốc repo khi phát triển.

Trang của task này: [Tổng quan giảng viên](pages/giang-vien/tong-quan-giang-vien.html).

## Cây thư mục

```text
do_an_IE104/
├── index.html
├── README.md
├── pages/
│   ├── chung/                         # Dành cho các trang chung sẽ triển khai
│   │   └── .gitkeep
│   ├── sinh-vien/
│   │   ├── tong-quan-sinh-vien.html
│   │   ├── dang-ky-de-tai.html
│   │   ├── chi-tiet-de-tai-mo-dang-ky.html
│   │   ├── chi-tiet-dang-ky-va-de-xuat-sinh-vien.html
│   │   ├── tien-do-de-tai-sinh-vien.html
│   │   ├── chi-tiet-de-tai-bai-nop.html
│   │   ├── chi-tiet-de-tai-ket-qua-danh-gia.html
│   │   ├── lich-han-nop.html
│   │   └── ho-so-ca-nhan.html
│   └── giang-vien/
│       ├── tong-quan-giang-vien.html
│       ├── tao-de-tai-giang-vien.html
│       ├── chi-tiet-de-tai-da-tao-giang-vien.html
│       ├── chinh-sua-de-tai-giang-vien.html
│       └── ho-so-ca-nhan-giang-vien.html
├── templates/
│   ├── khung-sinh-vien.html
│   └── khung-giang-vien.html
├── assets/
│   ├── css/                           # CSS dùng chung và CSS từng trang
│   │   └── .gitkeep
│   ├── js/                            # JavaScript dùng chung và từng trang
│   │   └── .gitkeep
│   └── images/
│       └── images.jpg                 # Ảnh có sẵn, chưa gắn vào giao diện
└── docs/
    └── Huong_dan_su_dung_khung_trang.md
```

Các file hướng dẫn Codex cục bộ ở gốc repo không thuộc mã nguồn giao diện
và không nằm trong cây bàn giao ở trên.

## Quy ước tổ chức

- Trang theo vai trò đặt trong `pages/sinh-vien/` hoặc `pages/giang-vien/`.
  Hồ sơ cá nhân đang có hai bản HTML riêng theo vai trò.
- `pages/chung/` dành cho Đăng nhập, Quên mật khẩu, Giới thiệu, Thông báo và
  Liên hệ khi được triển khai; hiện chưa có các trang này.
- `templates/` chứa khung để sao chép, không phải trang chức năng.
- `assets/` chứa tài nguyên; `docs/` chứa hướng dẫn cho nhóm.
- Tên file HTML mới dùng chữ thường, không dấu, nối bằng dấu gạch ngang.
  File `Chi-tiet-de-tai-mo-dang-ky.html` đã đổi thành
  `pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html`.
- HTML dùng đường dẫn tương đối và dấu `/`. Trong cùng thư mục dùng
  `ten-trang.html`; từ trang chức năng về trang vào dùng `../../index.html`;
  tới tài nguyên dùng `../../assets/...`; tới trang chung dùng `../chung/...`.
- Khi sao chép khung vào thư mục vai trò, sửa các đường dẫn theo vị trí mới.
  Hướng dẫn chi tiết ở [tài liệu khung trang](docs/Huong_dan_su_dung_khung_trang.md).

## Tổng quan giảng viên

- Header/menu theo vai trò, menu tài khoản bằng `<details>`, breadcrumb và footer.
- Bốn khối thống kê: 0 đề tài đang hướng dẫn, 2 đề tài đã tạo, 1 đăng ký và
  1 đề xuất chờ duyệt.
- Hai bảng yêu cầu tách riêng đăng ký DK001 và đề xuất DX001; bảng đề tài
  đã tạo gồm DT001 và DT004.
- Trạng thái trống cho đề tài đang hướng dẫn, hạn nộp và bài nộp cần nhận xét.
- Hoạt động gần đây, lối tắt tạo đề tài/hồ sơ và các template rỗng/lỗi
  chuẩn bị cho giai đoạn JavaScript.

Số liệu là dữ liệu mẫu của GV001 — Nguyễn Văn A tại ngày 18/10/2026, chưa
tự cập nhật. Mở trang tạo đề tài hoặc hồ sơ chỉ mở bản HTML hiện có.
Các thao tác duyệt, lưu, đăng xuất và quản lý từng mã đề tài chưa được xử lý.

## Phạm vi hiện tại

Đây là giai đoạn xây dựng HTML. Các biểu mẫu và nút không đồng nghĩa với
chức năng lưu trữ đã hoàn thành. Chưa có xác thực, backend hay cơ sở dữ liệu.
Chưa có CSS bố cục responsive dùng chung.

Các màn danh sách Đề tài đang hướng dẫn, Đề tài đã tạo, Yêu cầu chờ duyệt
và một số màn sinh viên chưa có mã nguồn. Tổng quan giảng viên dùng chữ
“đang cập nhật” cho các đích chưa có. Một số trang/khung cũ vẫn giữ `href`
dự kiến; xem danh sách và quy ước trong tài liệu khung trang. Không thay
trang danh sách bằng trang chi tiết hoặc thêm mã vào URL khi trang chưa
có xử lý dữ liệu theo mã.
