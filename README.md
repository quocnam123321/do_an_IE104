# Quản lý đồ án và khóa luận tốt nghiệp

Đồ án môn **IE104 · Internet và Công nghệ Web · UIT · Nhóm 7**.
Website giúp sinh viên và giảng viên quản lý đề tài từ lúc đăng ký đến khi nộp bài và xem kết quả.

## Dùng thử website

Mở [trang đăng nhập của bản demo](https://quanlydoanvakhoaluan.onrender.com/pages/chung/dang-nhap.html).
Trong mục **Tài khoản minh họa**, chọn **Sinh viên** hoặc **Giảng viên** để vào thẳng trang tổng quan. Dữ liệu của bản demo được dùng chung.

| Vai trò | Cách sử dụng |
| --- | --- |
| **Sinh viên** | Vào **Đăng ký đề tài** để chọn đề tài hoặc tạo đề xuất. Mở **Đề tài của tôi** để xem trạng thái, cập nhật tiến độ, nộp bài và xem kết quả. Dùng **Lịch hạn nộp** để theo dõi các mốc. |
| **Giảng viên** | Vào **Quản lý đề tài** để tạo đề tài và theo dõi các đề tài đang hướng dẫn. Mở **Yêu cầu chờ duyệt** để xử lý đề xuất và lời mời hướng dẫn. |
| **Quản trị viên** | Đăng nhập bằng tài khoản được cấp. Dùng **Tài khoản**, **Học kỳ và đợt đăng ký**, **Đề tài và hồ sơ**, **Thông báo** và **Yêu cầu liên hệ** để quản lý dữ liệu của hệ thống. |

Khách có thể xem thông báo học vụ và gửi lời nhắn qua trang **Liên hệ**.

## Cấu trúc mã nguồn

Giao diện dùng HTML5, CSS3 và JavaScript thuần. Máy chủ dùng Node.js, Express và PostgreSQL.

```text
web/
├── pages/
│   ├── chung/          Đăng nhập, giới thiệu, thông báo và liên hệ
│   ├── sinh-vien/      Đăng ký, đề xuất, đề tài và lịch hạn nộp
│   ├── giang-vien/     Quản lý đề tài, hướng dẫn và duyệt yêu cầu
│   └── quan-tri/      Các màn hình quản trị
└── assets/            CSS, JavaScript, hình ảnh và phông chữ
server/
├── src/               Express API, xác thực và truy vấn PostgreSQL
└── migrations/        Tạo và cập nhật cấu trúc cơ sở dữ liệu
functions/             Firebase Functions
calendar-worker/       Tích hợp Google Calendar
tests/                 Kiểm thử tự động
docs/                  Tài liệu hệ thống
```

## Chạy trên máy

Cần **Node.js 24 trở lên** và một database PostgreSQL do tài khoản kết nối sở hữu.
Tạo `server/.env` từ [tệp cấu hình mẫu](server/.env.example), rồi chỉnh `DATABASE_URL` theo database trên máy.
Từ thư mục gốc của dự án, chạy các lệnh sau trong PowerShell.

```powershell
cd server
npm.cmd ci
npm.cmd run db:migrate
npm.cmd run start:demo
```

Mở [website trên máy](http://localhost:3000). Có thể kiểm tra kết nối DB ở `/api/health`.

Để thử vai trò quản trị viên trong bản demo local, đặt `IE104_DEMO_ADMIN=1` trong `server/.env`, chạy migration và khởi động lại bằng `npm.cmd run start:demo`. Dùng tùy chọn này với cơ sở dữ liệu minh họa dành riêng cho thử nghiệm.

Trên Render, để trống **Root Directory** và cấu hình `DATABASE_URL`, `APP_ORIGIN` cho Web Service. Dùng `npm --prefix server ci && npm --prefix server run db:migrate` khi build và `npm --prefix server run start:demo` khi khởi động.

[Tài liệu hệ thống](docs/tai-lieu-he-thong/README.md)
