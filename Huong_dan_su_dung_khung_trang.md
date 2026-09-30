# Hướng dẫn sử dụng khung trang

## 1. Mục đích

Hai file khung giúp các thành viên tạo trang có cấu trúc và điều hướng
thống nhất:

- `khung-sinh-vien.html`: dùng cho các trang dành cho sinh viên.
- `khung-giang-vien.html`: dùng cho các trang dành cho giảng viên.

Đây là file mẫu để sao chép, không phải trang chức năng dành cho người dùng.

Hiện tại chỉ có HTML, chưa có CSS và JavaScript.

## 2. Cấu trúc chung

Mỗi khung gồm:

- Đầu trang: tên website, menu theo vai trò và liên kết hồ sơ.
- Breadcrumb: đường dẫn thể hiện vị trí trang.
- Tiêu đề và mô tả trang.
- Khối `page-content`: nơi đặt nội dung riêng của từng trang.

Menu sinh viên:
Tổng quan → Đề tài mở đăng ký → Yêu cầu & Đề xuất →
Đề tài của tôi → Lịch hạn nộp.

Menu giảng viên:
Tổng quan → Đề tài của tôi → Yêu cầu chờ duyệt →
Đề tài hướng dẫn.

## 3. Cách tạo một trang mới

### Bước 1: Chọn khung theo vai trò

Sao chép file khung và đổi tên bản sao thành tên trang cần làm.

Ví dụ:

- Trang sinh viên: sao chép `khung-sinh-vien.html`.
- Trang giảng viên: sao chép `khung-giang-vien.html`.

Giữ file khung gốc để các thành viên khác tiếp tục sử dụng.
Không ghi nội dung riêng của một trang vào file khung gốc.

### Bước 2: Sửa thông tin trang

Trong bản sao, cập nhật:

- `<title>`: tên hiển thị trên tab trình duyệt.
- `<meta name="description">`: mô tả nội dung trang.
- Chữ “Tên trang” trong breadcrumb.
- Nội dung `<h1>`.
- Mô tả trong `page-header__description`.

### Bước 3: Đánh dấu menu đang chọn

Thêm `aria-current="page"` vào liên kết menu tương ứng.

Ví dụ với trang danh sách đề tài:

    <a
      class="main-nav__link"
      href="de-tai-mo-dang-ky.html"
      aria-current="page"
    >
      Đề tài mở đăng ký
    </a>

Chỉ một liên kết trong menu chính được đánh dấu.
Nếu sao chép từ một trang đã hoàn thiện, bỏ dấu chọn của mục cũ.

Breadcrumb có `aria-current="page"` riêng; giữ thuộc tính đó
trên tên trang hiện tại.

### Bước 4: Thêm nội dung riêng

Đặt nội dung chức năng vào khối:

    <div class="page-content">
      <!-- Nội dung riêng của trang -->
    </div>

Ví dụ:

- Đề tài mở đăng ký: tìm kiếm, lọc và danh sách đề tài.
- Lịch hạn nộp: danh sách hoặc lịch các hạn nộp.
- Yêu cầu chờ duyệt: danh sách yêu cầu và nội dung xử lý.

File `de-tai-mo-dang-ky.html` là ví dụ đã áp dụng khung sinh viên.

## 4. Quy ước khi làm việc

- Giữ các tên class chung như `site-header`, `main-nav`,
  `account-menu`, `breadcrumb`, `page-header`, `page-content`
  để sau này có thể dùng chung CSS.
- Đặt tên class mới cho các thành phần riêng của trang.
- Dùng nhãn tiếng Việt có dấu trên giao diện.
- Dùng `<a>` để chuyển trang, `<button>` cho thao tác.
- Mỗi trang có một tiêu đề chính `<h1>`.
- Giữ `id="main-content"` để liên kết “Chuyển đến nội dung chính”
  hoạt động.
- Không thêm thư viện hoặc framework vào khung.

## 5. Đường dẫn giữa các trang

Các đường dẫn hiện được viết theo giả định các file HTML nằm
cùng thư mục.

Tên file trong `href` phải khớp với tên file thực tế.
Nếu đổi tên hoặc chuyển thư mục, cần cập nhật các liên kết liên quan.

Những trang chưa tạo sẽ chưa mở được từ menu.
Không xem việc có liên kết là chức năng đã hoàn thành.

`ho-so-ca-nhan.html` đang là tên đề xuất cho trang hồ sơ dùng chung.
Nếu nhóm tách hồ sơ theo vai trò, cần sửa liên kết tương ứng.

## 6. Khi cần sửa khung chung

HTML hiện được sao chép vào từng trang, chưa có cơ chế nạp khung chung.

Vì vậy, sửa file khung KHÔNG tự cập nhật các trang đã tạo.

Khi đổi menu hoặc cấu trúc chung:

1. Thống nhất thay đổi với nhóm.
2. Cập nhật file khung tương ứng.
3. Cập nhật cùng phần đó trong các trang đã dùng khung.
4. Kiểm tra lại điều hướng.

## 7. Kiểm tra trước khi commit

- Lưu file và mở trên trình duyệt.
- Kiểm tra tiếng Việt, tên tab, tiêu đề và breadcrumb.
- Kiểm tra menu đúng vai trò và mục đang chọn.
- Kiểm tra các liên kết tới những trang đã tồn tại.
- Kiểm tra thẻ HTML đóng/mở đầy đủ.
- Chạy `git status` để xác nhận các file sẽ đưa vào commit.

Chưa có CSS nên nội dung xếp dọc là bình thường.
Tìm kiếm, lọc và các thao tác khác cần được xử lý ở bước JavaScript.
