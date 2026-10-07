# Hướng dẫn sử dụng khung trang

Cập nhật: **08/10/2026**, theo sitemap ngày **07/10/2026** và các thành phần
wireframe đã đối chiếu cho trang Đăng ký đề tài / Chi tiết đề tài.

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
- Chân trang chung: tên hệ thống, trường và các thông tin/quy định đang cập nhật.

Menu sinh viên:
**Tổng quan → Đăng ký đề tài → Đề tài của tôi → Lịch hạn nộp**.

Đăng ký đề tài là trang danh sách để tìm kiếm, lọc và mở Chi tiết đề tài.
Đề xuất của tôi nằm trong Đề tài của tôi và dẫn tới Tạo đề xuất mới.
Không tạo mục menu độc lập cho yêu cầu và đề xuất của sinh viên.
Vị trí theo dõi đăng ký đã gửi cần đối chiếu user flow hiện hành trước khi triển khai.

Menu giảng viên:
**Tổng quan → Quản lý đề tài → Yêu cầu chờ duyệt**.

- Quản lý đề tài gồm Đề tài đã tạo và Đề tài đang hướng dẫn.
- Đề tài đã tạo dẫn tới Chi tiết đề tài và chức năng Tạo đề tài.
- Đề tài đang hướng dẫn dẫn tới Chi tiết đề tài để theo dõi quá trình thực hiện.
- Yêu cầu chờ duyệt gồm Danh sách yêu cầu và Danh sách đề xuất,
  mỗi danh sách dẫn tới thông tin chi tiết tương ứng.

Trong khung giảng viên, Quản lý đề tài là nhãn nhóm với danh sách con,
không phải liên kết tới một trang riêng. Yêu cầu chờ duyệt giữ liên kết
tới trang dự kiến chứa hai danh sách; nội dung trang này chưa được xây dựng.

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

Với trang chi tiết, thêm các cấp cha vào breadcrumb để người dùng quay lại
trang danh sách. Ví dụ: Sinh viên → Đăng ký đề tài → Chi tiết đề tài DT001.
Mục Đăng ký đề tài trong breadcrumb liên kết tới `dang-ky-de-tai.html`.

### Bước 3: Đánh dấu menu đang chọn

Thêm `aria-current="page"` khi liên kết menu trỏ tới đúng trang hiện tại.

Ví dụ tại trang Đăng ký đề tài:

    <a
      class="main-nav__link"
      href="dang-ky-de-tai.html"
      aria-current="page"
    >
      Đăng ký đề tài
    </a>

Ở trang chi tiết, dùng `aria-current="location"` cho liên kết menu
của nhóm đang xem nếu liên kết đó dẫn về trang danh sách:

    <a
      class="main-nav__link"
      href="dang-ky-de-tai.html"
      aria-current="location"
    >
      Đăng ký đề tài
    </a>

Với nhóm Quản lý đề tài của giảng viên, đánh dấu liên kết con phù hợp:
Đề tài đã tạo hoặc Đề tài đang hướng dẫn.
Chỉ một liên kết trong toàn bộ menu chính, kể cả danh sách con, được đánh dấu.
Nếu sao chép từ một trang đã hoàn thiện, bỏ dấu chọn của mục cũ.
File khung gốc không đánh dấu mục nào vì chưa đại diện cho một trang chức năng.

Breadcrumb có `aria-current="page"` riêng; giữ thuộc tính đó
trên tên trang hiện tại.

### Bước 4: Thêm nội dung riêng

Đặt nội dung chức năng vào khối:

    <div class="page-content">
      <!-- Nội dung riêng của trang -->
    </div>

Ví dụ:

- Đăng ký đề tài: tìm kiếm, lọc và danh sách đề tài.
- Đề tài của tôi: đề tài đang tham gia và khu vực Đề xuất của tôi.
- Lịch hạn nộp: danh sách hoặc lịch các hạn nộp.
- Đề tài đã tạo / Đề tài đang hướng dẫn: nội dung theo mục đích từng danh sách.
- Yêu cầu chờ duyệt: danh sách yêu cầu, danh sách đề xuất và nội dung xử lý.

File `dang-ky-de-tai.html` là ví dụ đã áp dụng khung sinh viên.
File `Chi-tiet-de-tai-mo-dang-ky.html` là trang chi tiết minh họa cho DT001.

### Các thành phần HTML hiện có trong hai trang sinh viên

Trang Đăng ký đề tài gồm:

- Ô tìm theo tên hoặc mã đề tài; sắp xếp mới nhất, cũ nhất hoặc tên A–Z.
- Bộ lọc loại đề tài, giảng viên và môn học; liên kết Xóa bộ lọc quay về URL
  gốc `dang-ky-de-tai.html`.
- Bốn thẻ dữ liệu mẫu và phần tổng hợp số lượng. Mỗi thẻ có vùng ảnh minh họa
  chờ bổ sung, tên, mã/loại, môn/học kỳ, giảng viên, số sinh viên/nhóm,
  hạn đăng ký và trạng thái. Thông tin còn thiếu hiển thị “Chưa có thông tin”.
- Phân trang mẫu chỉ có một trang; nút trang trước và trang sau đang tắt.

Trang Chi tiết đề tài gồm:

- Liên kết Quay lại danh sách, vùng ảnh minh họa chờ bổ sung và thông tin
  đề tài/giảng viên. Các trường môn học, học kỳ, năm học, khoa/bộ môn hoặc
  email chưa có dữ liệu hiển thị “Chưa có thông tin”.
- Các khối Mô tả đề tài, Mục tiêu đề tài và Yêu cầu thực hiện được tách riêng;
  các mục nội dung như kiến thức, sản phẩm bàn giao và bước thực hiện vẫn
  được giữ trong phần nội dung đề tài.
- Biểu mẫu có tên nhóm, MSSV/họ tên người đăng ký và một hàng thành viên mẫu,
  cùng lời nhắn. Các nút thêm/xóa thành viên và gửi đăng ký đang tắt.
- Phần số lượng thành viên chờ xử lý JavaScript; số hàng mẫu không xác định
  giới hạn thành viên của nhóm. Chưa tự điền dữ liệu người đăng ký hoặc
  gán quyền nhóm trưởng khi chưa có quy tắc nghiệp vụ tương ứng.

Hai trang và hai file khung dùng cùng chân trang. Điều khoản sử dụng,
Quy chế đồ án / khóa luận và Chính sách bảo mật hiện là chữ “đang cập nhật”,
không có liên kết hoặc trang chính sách riêng.

Các thành phần này mới là HTML. Vùng ảnh dùng nội dung placeholder,
không dùng nguồn ảnh hỏng; dữ liệu còn thiếu chưa được tự bổ sung.

## 4. Quy ước khi làm việc

- Giữ các tên class chung như `site-header`, `main-nav`,
  `account-menu`, `breadcrumb`, `page-header`, `page-content`, `site-footer`
  để sau này có thể dùng chung CSS.
- Với menu giảng viên, giữ `main-nav__label`, `main-nav__sublist`
  và `main-nav__subitem` cho nhãn nhóm và danh sách con.
- Đặt tên class mới cho các thành phần riêng của trang.
- Dùng nhãn tiếng Việt có dấu trên giao diện.
- Dùng `<a>` để chuyển trang, `<button>` cho thao tác.
- Mỗi trang có một tiêu đề chính `<h1>`.
- Giữ `id="main-content"` để liên kết “Chuyển đến nội dung chính”
  hoạt động.
- Không thêm thư viện hoặc framework vào khung.
- Khi bổ sung biểu mẫu nhóm, đối chiếu quy tắc nghiệp vụ trước khi đặt
  giới hạn thành viên hoặc quyền đại diện. Mỗi trường MSSV/họ tên cần có
  nhãn và `id` riêng, kể cả các hàng thành viên. `rows` của textarea chỉ
  quy định chiều cao hiển thị, không giới hạn số thành viên.

## 5. Đường dẫn giữa các trang

Các đường dẫn hiện được viết theo giả định các file HTML nằm
cùng thư mục.

Tên file trong `href` phải khớp với tên file thực tế, kể cả chữ hoa/thường.
Nếu đổi tên hoặc chuyển thư mục, cần cập nhật các liên kết liên quan.

Đổi nhãn menu không bắt buộc đổi tên file. Các đường dẫn hiện dùng:

| Nội dung | Đường dẫn | Tình trạng |
| --- | --- | --- |
| Đăng ký đề tài | `dang-ky-de-tai.html` | Đã có HTML danh sách |
| Chi tiết đề tài DT001 | `Chi-tiet-de-tai-mo-dang-ky.html` | Đã có HTML minh họa |
| Đề tài đã tạo của giảng viên | `de-tai-cua-toi-giang-vien.html` | Chưa có trang |
| Đề tài đang hướng dẫn | `de-tai-huong-dan.html` | Chưa có trang |
| Yêu cầu chờ duyệt | `yeu-cau-cho-duyet.html` | Chưa có trang |

DT002–DT004 hiện hiển thị “Chi tiết đang cập nhật”. Chỉ bổ sung liên kết
khi có nội dung chi tiết tương ứng. Trang DT001 đang là HTML tĩnh;
thêm `?ma=DT002` vào URL chưa làm nội dung đổi theo mã đề tài.

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
- Kiểm tra danh sách con của Quản lý đề tài và breadcrumb của trang chi tiết.
- Kiểm tra các liên kết tới những trang đã tồn tại.
- Kiểm tra nhãn tìm tên/mã, các bộ lọc và liên kết Xóa bộ lọc về URL gốc.
- Kiểm tra mã đề tài, thông tin trên thẻ và số lượng bốn thẻ dữ liệu mẫu.
- Kiểm tra mỗi trường biểu mẫu có nhãn đúng; nút thêm/xóa thành viên,
  phân trang mẫu và nút gửi thể hiện đúng trạng thái chưa hoạt động.
- Kiểm tra chân trang đồng nhất và các mục đang cập nhật không có liên kết giả.
- Kiểm tra thẻ HTML đóng/mở đầy đủ.
- Chạy `git status` để xác nhận các file sẽ đưa vào commit.

Chưa có CSS nên nội dung xếp dọc là bình thường.
Trang Đăng ký đề tài đã có nút Tìm kiếm, nhưng gửi form hiện chỉ đưa giá trị
lên URL, chưa tìm kiếm, lọc hoặc sắp xếp danh sách. Liên kết Xóa bộ lọc
quay về URL gốc. Biểu mẫu đăng ký ở trang chi tiết chưa tiếp nhận hoặc lưu
yêu cầu; thêm/xóa thành viên, đếm số lượng và gửi yêu cầu chưa hoạt động.
Tác vụ này chỉ bổ sung HTML, chưa thêm CSS, JavaScript, backend hoặc cơ chế
lưu dữ liệu. Tìm kiếm, lọc và các thao tác tương tác cần được xử lý ở bước
JavaScript.
