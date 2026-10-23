# Hướng dẫn sử dụng khung trang

Cập nhật: **23/10/2026**. Đối chiếu mã nguồn hiện có và wireframe của nhóm.
Repo có **33 file HTML**: 1 trang vào, 10 trang chung, 9 trang sinh viên,
11 trang giảng viên và 2 khung mẫu. [README](../README.md) chứa cây file đầy đủ.

## 1. Phạm vi bàn giao

Đây là giai đoạn dựng khung HTML: kiểm tra đủ vùng nội dung, bảng, trường
nhập, thao tác, thông báo trạng thái, hộp xác nhận và liên kết giữa các màn.
Tên mẫu, ô trống, ảnh giữ chỗ và nội dung “Chưa có thông tin” được chấp nhận.
Chúng không làm một khung bị xem là thiếu thành phần.

Chưa có CSS bố cục chung, JavaScript nghiệp vụ, backend hoặc cơ sở dữ liệu.
CSS nội tuyến hiện có chỉ phục vụ các phần cục bộ như chọn hồ sơ theo
fragment; không thay thế bước xây dựng giao diện responsive. Các thông báo
thành công trong khung ẩn là nội dung mẫu, chưa phải kết quả gửi/lưu thật.

## 2. Danh mục trang thực tế

Các đường dẫn dưới đây trỏ tới file HTML hiện có. File khung là mẫu dành
cho người phát triển; `index.html` là danh mục truy cập, không phải khung vai trò.

### Chung — 10 trang

| Trang | File |
| --- | --- |
| Đăng nhập | [dang-nhap.html](../pages/chung/dang-nhap.html) |
| Quên mật khẩu | [quen-mat-khau.html](../pages/chung/quen-mat-khau.html) |
| Giới thiệu | [gioi-thieu.html](../pages/chung/gioi-thieu.html) |
| Liên hệ | [lien-he.html](../pages/chung/lien-he.html) |
| Danh sách thông báo | [thong-bao.html](../pages/chung/thong-bao.html) |
| Chi tiết thông báo 01 | [chi-tiet-thong-bao-01.html](../pages/chung/chi-tiet-thong-bao-01.html) |
| Chi tiết thông báo 02 | [chi-tiet-thong-bao-02.html](../pages/chung/chi-tiet-thong-bao-02.html) |
| Chi tiết thông báo 03 | [chi-tiet-thong-bao-03.html](../pages/chung/chi-tiet-thong-bao-03.html) |
| Chi tiết thông báo 04 | [chi-tiet-thong-bao-04.html](../pages/chung/chi-tiet-thong-bao-04.html) |
| Chi tiết thông báo 05 | [chi-tiet-thong-bao-05.html](../pages/chung/chi-tiet-thong-bao-05.html) |

### Sinh viên — 9 trang

| Trang | File và thành phần chính |
| --- | --- |
| Tổng quan | [tong-quan-sinh-vien.html](../pages/sinh-vien/tong-quan-sinh-vien.html): thống kê, yêu cầu gần đây, hạn nộp, thông báo |
| Đăng ký đề tài | [dang-ky-de-tai.html](../pages/sinh-vien/dang-ky-de-tai.html): tìm/lọc/sắp xếp, danh sách, tạo đề xuất, phân trang, mẫu rỗng/lỗi |
| Chi tiết trước đăng ký | [chi-tiet-de-tai-mo-dang-ky.html](../pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html): thông tin đề tài, giảng viên, tài liệu, đăng ký nhóm, vai trò thành viên, lưu ý và xác nhận |
| Tạo đề xuất | [tao-de-xuat.html](../pages/sinh-vien/tao-de-xuat.html): biểu mẫu, chọn giảng viên, đính kèm, lưu ý, lỗi/kết quả và xác nhận |
| Đề tài của tôi | [de-tai-cua-toi-sinh-vien.html](../pages/sinh-vien/de-tai-cua-toi-sinh-vien.html): danh sách đề tài và khu vực đăng ký/đề xuất đã gửi |
| Chi tiết đăng ký/đề xuất | [chi-tiet-dang-ky-va-de-xuat-sinh-vien.html](../pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html): hồ sơ DK/DX, phản hồi, lịch sử, biểu mẫu sửa và xác nhận theo mẫu |
| Chi tiết đề tài | [chi-tiet-de-tai-sinh-vien.html](../pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html): bốn phần trong cùng file — Tổng quan (thông tin, nhóm, mốc, mời đồng hướng dẫn), Tiến độ (công việc, lịch sử, popover cập nhật), Bài nộp (yêu cầu, biểu mẫu, lịch sử, xác nhận, mẫu rỗng/khóa), Kết quả đánh giá (tiêu chí, nhận xét, tệp, mẫu chưa công bố) |
| Lịch hạn nộp | [lich-han-nop.html](../pages/sinh-vien/lich-han-nop.html): lịch tháng, bộ lọc, bài sắp đến hạn và liên kết biểu mẫu bài nộp |
| Hồ sơ cá nhân | [ho-so-ca-nhan.html](../pages/sinh-vien/ho-so-ca-nhan.html): xem/sửa hồ sơ và đổi mật khẩu |

### Giảng viên — 11 trang

| Trang | File và thành phần chính |
| --- | --- |
| Tổng quan | [tong-quan-giang-vien.html](../pages/giang-vien/tong-quan-giang-vien.html): thống kê, yêu cầu, đề tài, hạn nộp và lối tắt |
| Đề tài đang hướng dẫn | [danh-sach-de-tai-dang-huong-dan.html](../pages/giang-vien/danh-sach-de-tai-dang-huong-dan.html): tìm/lọc/sắp xếp, danh sách và liên kết chi tiết |
| Đề tài đã tạo | [danh-sach-de-tai-da-tao.html](../pages/giang-vien/danh-sach-de-tai-da-tao.html): danh sách quản lý, tạo và mở chi tiết |
| Tạo đề tài | [tao-de-tai-giang-vien.html](../pages/giang-vien/tao-de-tai-giang-vien.html): các nhóm trường, tệp đính kèm và trạng thái biểu mẫu |
| Chi tiết đề tài đã tạo | [chi-tiet-de-tai-da-tao-giang-vien.html](../pages/giang-vien/chi-tiet-de-tai-da-tao-giang-vien.html): thông tin, chỉnh sửa, thao tác quản lý và xác nhận |
| Chỉnh sửa đề tài | [chinh-sua-de-tai-giang-vien.html](../pages/giang-vien/chinh-sua-de-tai-giang-vien.html): biểu mẫu sửa và trạng thái |
| Chi tiết đang hướng dẫn | [chi-tiet-de-tai-dang-huong-dan-giang-vien.html](../pages/giang-vien/chi-tiet-de-tai-dang-huong-dan-giang-vien.html): thông tin, tiến độ, yêu cầu nộp, bài nộp, đánh giá |
| Yêu cầu chờ duyệt | [yeu-cau-cho-duyet.html](../pages/giang-vien/yeu-cau-cho-duyet.html): danh sách đề xuất theo wireframe hiện hành |
| Chi tiết yêu cầu | [chi-tiet-de-xuat-giang-vien.html](../pages/giang-vien/chi-tiet-de-xuat-giang-vien.html): đăng ký/đề xuất, thông tin sinh viên, phản hồi, phê duyệt/từ chối và xác nhận |
| Hạn nộp của sinh viên | [han-nop-cua-sinh-vien.html](../pages/giang-vien/han-nop-cua-sinh-vien.html): tìm/lọc, danh sách hạn và tình trạng bài nộp |
| Hồ sơ cá nhân | [ho-so-ca-nhan-giang-vien.html](../pages/giang-vien/ho-so-ca-nhan-giang-vien.html): xem/sửa hồ sơ và đổi mật khẩu |

Trang vào: [index.html](../index.html). Khung sao chép:
[khung-sinh-vien.html](../templates/khung-sinh-vien.html),
[khung-giang-vien.html](../templates/khung-giang-vien.html).

## 3. Cấu trúc và điều hướng chung

Mỗi khung có skip-link tới `#main-content`, header, điều hướng theo vai trò,
menu tài khoản, breadcrumb, tiêu đề/mô tả, vùng nội dung và footer.

- Sinh viên: Tổng quan → Đăng ký đề tài → Đề tài của tôi → Lịch hạn nộp.
  Đăng ký/đề xuất đã gửi đặt trong Đề tài của tôi. Tạo đề xuất hiện có lối
  vào từ Đăng ký đề tài và khu vực đề xuất; không thêm menu cấp chính cũ
  “Yêu cầu và đề xuất”.
- Giảng viên: Tổng quan → Quản lý đề tài → Yêu cầu chờ duyệt.
  Quản lý đề tài dùng `<details class="main-nav__disclosure">`, với Đề tài
  đang hướng dẫn trước Đề tài đã tạo. Hạn nộp của sinh viên mở từ Tổng quan.
- Chung: Giới thiệu, Thông báo, Liên hệ là các trang đã có; dùng `<a href>`
  thực tế. Đăng nhập liên kết tới Quên mật khẩu.
- Hồ sơ mở từ menu tài khoản, dùng file đúng vai trò. Menu dùng
  `account-menu__disclosure`, `account-menu__toggle`, `account-menu__avatar`,
  `account-menu__label`, `account-menu__list`, `account-menu__profile` và
  `account-menu__logout`. `<details>` tự đóng/mở bằng chuột và bàn phím.
- Logo dùng `../../assets/images/images.jpg` ở trang vai trò, alt
  “Logo Khoa Khoa học và Kỹ thuật Thông tin”. Header theo khung vai trò
  dùng kích thước 70 × 70; đường dẫn tại gốc và trong `templates/` cần đổi cấp.

Chỉ đặt `aria-current="page"` trên liên kết tới đúng trang hiện tại.
Trang con có thể đánh dấu nhóm bằng `aria-current="location"` hoặc để
không chọn; không gọi trang danh sách là trang hiện tại khi đang ở biểu mẫu.
Breadcrumb có dấu trang hiện tại riêng.

Các mục chính sách chưa có trang riêng vẫn là chữ giữ chỗ; không tạo `href="#"`
để giả lập liên kết. Phần tử điều hướng có đích thật dùng `<a href>`;
thao tác chưa nối xử lý dùng `<button type="button" disabled>` khi phù hợp.
Không dùng `<a>` thiếu `href` làm nút.

## 4. Anchor và trạng thái khung

| Trang | Anchor/khung hiện có | Cách dùng |
| --- | --- | --- |
| Đề tài của tôi SV | `#de-tai-dang-thuc-hien`, `#dang-ky-va-de-xuat` | Đi tới danh sách đề tài hoặc đăng ký/đề xuất |
| Chi tiết đăng ký/đề xuất SV | `#dk001`, `#dk002`, `#dx001`, `#dx002` | Chọn hồ sơ mẫu bằng fragment |
| Chi tiết đăng ký/đề xuất SV | `#dx001-chinh-sua`, `#dx002-chinh-sua`, các ID phản hồi | Mở phần chỉnh sửa/phản hồi của hồ sơ tương ứng |
| Chi tiết đề tài SV | `#tong-quan`, `#tien-do`, `#bai-nop`, `#ket-qua-danh-gia` | Chọn một trong bốn phần của `chi-tiet-de-tai-sinh-vien.html` |
| Bài nộp SV | `#submission-form-section` | Đích liên kết Nộp bài từ Lịch hạn nộp |
| Chi tiết yêu cầu GV | `#dk001`, `#dx001` | Hai khung đăng ký/đề xuất; tên file vẫn giữ `chi-tiet-de-xuat-giang-vien.html` |

Chi tiết đề tài SV dùng chung một header, breadcrumb, menu tài khoản và footer.
Bốn phần chuyển bằng CSS `:target`/`:has()` trong cùng file; mặc định mở Tổng quan.
Liên kết tới vùng con như `#submission-form-section` tự hiển thị phần chứa vùng đó.
Các biểu mẫu, popover và dialog được giữ nguyên; chuyển phần không tải lại trang.

Chi tiết đăng ký/đề xuất SV dùng CSS `:target`/`:has()` để chọn hồ sơ;
URL thiếu hoặc sai fragment hiện phần chọn hồ sơ. Giữ ID khi sửa nội dung
để tránh làm hỏng liên kết. Thêm `?ma=...` không làm dữ liệu tự đổi theo mã.

Liên kết Nộp bài ở Lịch hạn nộp mở biểu mẫu mẫu; chưa tự chọn bài từ dòng
được bấm. Các mẫu rỗng/lỗi/khóa/chưa công bố đặt trong `<template>` và các
thông báo có `hidden` chưa tự xuất hiện. Hộp `<dialog>` mặc định đóng;
`aria-controls` chỉ mô tả quan hệ, không tự mở hộp. Popover ở trang Tiến độ
có thể mở/đóng bằng HTML tự nhiên, nhưng chưa lưu thay đổi.

Vùng thông báo lỗi dùng `role="alert"`, vùng kết quả dùng `role="status"`.
Mỗi trường nhập phải có label đúng ID. Không tự đặt quy tắc số thành viên,
giới hạn tệp, số lần đăng ký hoặc nộp muộn từ dữ liệu minh họa.

## 5. Đối chiếu wireframe

Nguồn: [Figma Đồ án IE104_Nhóm_7 — trang wireframe](https://www.figma.com/design/P9ZoxkVEEUPZdAHVfAVuok?node-id=1-2).
Các node dưới đây đã được dùng để đối chiếu cấu trúc trong lần cập nhật này;
không phải xác nhận đã hoàn thành CSS hoặc toàn bộ task của nhóm.

| Nhóm màn | Node Figma |
| --- | --- |
| SV — Danh sách đăng ký / chi tiết mới | `436:1402`, `624:1552` |
| SV — Tạo đề xuất / chọn giảng viên | `621:1527`, `621:1758` |
| SV — Tổng quan đề tài / tiến độ | `346:530`, `348:2359` |
| SV — Bài nộp / chưa có tệp | `348:2026`, `130:2140` |
| SV — Đánh giá / chưa công bố | `348:2193`, `130:2269` |
| SV — Lịch hạn nộp | `584:1487` |
| SV — Đề tài của tôi / các trạng thái rỗng | `130:1567`, `130:2032`, `130:2084` |
| SV — Chi tiết đăng ký/đề xuất nhóm | `653:1550`, `653:1618` |
| SV — Hồ sơ / sửa hồ sơ / đổi mật khẩu | `205:94`, `206:263`, `545:1544`, `545:1598` |
| GV — Tổng quan chi tiết đề tài đang hướng dẫn mới | `600:2282` |
| GV — Danh sách đang hướng dẫn / đã tạo mới | `640:1507`, `639:1536` |
| GV — Danh sách yêu cầu / chi tiết yêu cầu | `33:103`, `541:1694` |
| GV — Chi tiết đã tạo / đóng, mở đăng ký | `654:2100`, `658:1622`, `658:1636` |
| GV — Tạo / sửa đề tài | `654:1816`, `446:1528` |
| GV — Hồ sơ | `432:1537` |
| GV — Bài nộp / hộp phản hồi, chia sẻ tài liệu / hạn nộp sinh viên | `453:1387`, `453:1611`, `453:1586`, `443:2708`, `547:1648` |

Quên mật khẩu chưa có frame riêng được tìm thấy trên trang Figma đã đọc.
Khung này theo task và vỏ trang công khai hiện có; chưa khẳng định cơ chế
khôi phục mật khẩu, gửi email hoặc đặt lại mật khẩu thật.

## 6. Tạo hoặc sửa một trang

1. Chọn khung theo vai trò, sao chép vào `pages/sinh-vien/` hoặc
   `pages/giang-vien/`. Giữ file mẫu gốc cho các thành viên khác.
2. Sửa `<title>`, meta description, breadcrumb, `<h1>`, mô tả và menu đang chọn.
3. Thay nội dung trong `page-content`; tái sử dụng vùng/bảng/biểu mẫu đã có.
4. Sửa đường dẫn theo vị trí mới. Trong cùng thư mục dùng `ten-trang.html`;
   tới trang chung dùng `../chung/...`; tài nguyên dùng `../../assets/...`;
   về danh mục dùng `../../index.html`. Từ khung mẫu dùng `../pages/...`.
5. Dùng tiếng Việt UTF-8, thụt lề hai khoảng trắng và tên file chữ thường
   không dấu. Giữ class chung để dùng CSS thống nhất về sau.
6. Giữ tên trường dễ hiểu, ưu tiên tiếng Việt không dấu theo quy ước biểu mẫu
   đang sửa. Mỗi hàng thành viên có ID/label riêng; không tái sử dụng ID.

`data-pending-href` chỉ lưu đích dự kiến, trình duyệt không điều hướng theo
thuộc tính đó. Khi trang đích đã có, thay bằng `href` đúng cấp thư mục.
Không khôi phục file trùng `chi-tiet-de-tai-dang-ky.html` tại gốc; dùng bản
`pages/sinh-vien/chi-tiet-de-tai-mo-dang-ky.html`.

Khung được sao chép vào từng file; sửa template không tự sửa các trang khác.
Khi đổi header/footer, cập nhật cả template và các trang chịu ảnh hưởng,
giữ nội dung riêng từng màn rồi kiểm tra lại điều hướng.

## 7. Kiểm tra trước khi bàn giao

- Mở trang bằng trình duyệt; kiểm tra tiếng Việt, tên tab, tiêu đề, breadcrumb
  và các khu vực đúng wireframe. Nội dung xếp dọc là bình thường khi chưa có CSS.
- Kiểm tra file/fragment của liên kết, ảnh logo và đường dẫn sau khi di chuyển file.
- Kiểm tra không trùng ID, mọi label/ARIA/popover target trỏ đúng ID tồn tại.
- Thử menu `<details>`, link danh sách/chi tiết và chuyển giữa bốn tab đề tài.
- Kiểm tra biểu mẫu có đủ ô nhập, lưu/hủy/xác nhận và vị trí lỗi/kết quả;
  các trạng thái ẩn/template có khung tương ứng, không bắt buộc hiện cùng lúc.
- Giữ phân biệt trạng thái đăng ký, đề xuất, thực hiện, bài nộp và khóa đề tài.
- Phân biệt thao tác HTML tự nhiên với xử lý chưa triển khai; không báo đã lưu,
  gửi yêu cầu, duyệt, upload hay gửi email khi mới có khung.
- Chạy `git diff --check`, xem diff và `git status` trước khi commit.

Bổ sung CSS responsive và JavaScript là công việc tiếp theo theo phân công.
Tài liệu này ghi nhận cấu trúc mã nguồn; không thay bảng task hoặc xác nhận
nghiệm thu toàn bộ chức năng.
