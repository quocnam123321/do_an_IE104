# Hướng dẫn sử dụng khung trang

Cập nhật: **18/10/2026**, đối chiếu sitemap hiện hành và **17 file HTML đang có
trong repo**. Tài liệu phân biệt trang đã có mã nguồn với đường dẫn dự kiến
để các thành viên tiếp tục triển khai.

## 1. Mục đích

Hai file khung giúp các thành viên tạo trang có cấu trúc và điều hướng
thống nhất:

- `templates/khung-sinh-vien.html`: dùng cho các trang dành cho sinh viên.
- `templates/khung-giang-vien.html`: dùng cho các trang dành cho giảng viên.

Đây là file mẫu để sao chép, không phải trang chức năng dành cho người dùng.

Hiện tại chủ yếu là HTML với dữ liệu minh họa, chưa có JavaScript hoặc CSS
giao diện dùng chung. Riêng trang Chi tiết đăng ký và đề xuất có CSS trong
thẻ `<style>` để chỉ hiện một hồ sơ theo fragment của URL. Chưa có xác thực,
backend, lưu dữ liệu hoặc upload máy chủ.

### Các file hiện có

Các tên file ngắn bên dưới nằm trong `pages/sinh-vien/` hoặc
`pages/giang-vien/` theo vai trò; hai khung nằm trong `templates/`,
`index.html` nằm ở gốc repo. Xem cây đầy đủ trong [README](../README.md).

| File                                         | Nội dung hiện tại                                            |
| -------------------------------------------- | ------------------------------------------------------------ |
| `index.html`                                 | Trang vào các màn SV và Tổng quan GV đã có       |
| `khung-sinh-vien.html`                       | Khung mẫu SV, chưa có nội dung chức năng                     |
| `khung-giang-vien.html`                      | Khung mẫu GV, chưa có nội dung chức năng                     |
| `dang-ky-de-tai.html`                        | Danh mục bốn đề tài, form tìm/lọc/sắp xếp chờ JS             |
| `chi-tiet-de-tai-mo-dang-ky.html`            | Chi tiết DT001 và biểu mẫu đăng ký                           |
| `tong-quan-sinh-vien.html`                   | Tóm tắt hoạt động, yêu cầu gần đây, hạn nộp và thông báo mẫu |
| `lich-han-nop.html`                          | Lịch tháng 10/2026, bộ lọc HTML và hai hạn nộp DT002                                    |
| `chi-tiet-dang-ky-va-de-xuat-sinh-vien.html` | Chi tiết DK001, DK002, DX001, DX002; mỗi lần hiện một hồ sơ  |
| `ho-so-ca-nhan.html` | Hồ sơ SV Nguyễn Minh Anh, biểu mẫu liên hệ và đề tài đang thực hiện |
| `tong-quan-giang-vien.html` | Tổng quan GV Nguyễn Văn A: 2 đề tài đã tạo, 2 yêu cầu chờ duyệt |
| `tien-do-de-tai-sinh-vien.html` | Mẫu tiến độ với danh sách công việc và các hộp nhập liệu HTML |
| `chi-tiet-de-tai-bai-nop.html` | HTML bài nộp dành cho sinh viên |
| `chi-tiet-de-tai-ket-qua-danh-gia.html` | HTML kết quả đánh giá dành cho sinh viên |
| `tao-de-tai-giang-vien.html` | Biểu mẫu tạo đề tài, chưa lưu |
| `chinh-sua-de-tai-giang-vien.html` | Khung biểu mẫu chỉnh sửa đề tài |
| `chi-tiet-de-tai-da-tao-giang-vien.html` | Khung chi tiết đề tài, chưa kết nối dữ liệu theo mã |
| `ho-so-ca-nhan-giang-vien.html` | Khung hồ sơ giảng viên, chưa kết nối dữ liệu tài khoản |

Mở `index.html` ở gốc repo bằng trình duyệt để xem các trang hiện có.
Tổng quan, tạo/sửa/chi tiết đề tài đã tạo và hồ sơ GV đã có HTML; các màn
danh sách quản lý và xét duyệt chi tiết vẫn chưa có. Việc tài liệu hướng dẫn sao chép khung ở mục 3
không có nghĩa các trang dự kiến đã được tạo.

## 2. Cấu trúc chung

Mỗi khung gồm:

- Đầu trang: tên website, menu theo vai trò và menu tài khoản.
- Dialog xác nhận đăng xuất, chưa có xử lý mở/xác nhận bằng JS.
- Breadcrumb: đường dẫn thể hiện vị trí trang.
- Tiêu đề và mô tả trang.
- Khối `page-content`: nơi đặt nội dung riêng của từng trang.
- Chân trang chung: tên hệ thống, trường và các thông tin/quy định đang cập nhật.

Menu sinh viên:
**Tổng quan → Đăng ký đề tài → Đề tài của tôi → Lịch hạn nộp**.

Đăng ký đề tài là trang danh sách để tìm kiếm, lọc và mở Chi tiết đề tài.
Đề xuất của tôi nằm trong Đề tài của tôi và dẫn tới Tạo đề xuất mới.
Không tạo mục menu độc lập cho yêu cầu và đề xuất của sinh viên.
Các liên kết theo dõi đăng ký đã gửi đang hướng tới
`de-tai-cua-toi-sinh-vien.html#dang-ky-da-gui`; trang đích chưa có.
Danh sách đề xuất dùng đường dẫn chính `de-xuat-cua-toi.html`, cũng chưa có.

Menu giảng viên:
**Tổng quan → Quản lý đề tài → Yêu cầu chờ duyệt**.

- Quản lý đề tài xếp **Đề tài đang hướng dẫn** trước **Đề tài đã tạo**.
- Đề tài đã tạo dẫn tới Chi tiết đề tài và chức năng Tạo đề tài.
- Đề tài đang hướng dẫn dẫn tới Chi tiết đề tài để theo dõi quá trình thực hiện.
- Yêu cầu chờ duyệt gồm Danh sách yêu cầu và Danh sách đề xuất,
  mỗi danh sách dẫn tới thông tin chi tiết tương ứng.

Trong khung giảng viên, Quản lý đề tài là nhãn nhóm với danh sách con,
không phải liên kết tới một trang riêng. Yêu cầu chờ duyệt giữ liên kết
tới trang dự kiến chứa hai danh sách; nội dung trang này chưa được xây dựng.

### Menu tài khoản và dialog

Hai khung và năm trang SV dùng menu tài khoản dạng
`<details class="account-menu__disclosure">`. Summary chứa avatar SV/GV và
nhãn tài khoản; bên trong có Hồ sơ cá nhân và nút Đăng xuất. Giữ các class
`account-menu__toggle`, `account-menu__avatar`, `account-menu__label`,
`account-menu__list`, `account-menu__profile`, `account-menu__logout`.

- Summary dùng hành vi đóng/mở tự nhiên của `<details>`, không gắn
  `aria-controls` hoặc đặt `aria-expanded` cố định.
- `ho-so-ca-nhan.html` hiện có dữ liệu SV, mở từ menu tài khoản sinh viên.
  Tổng quan GV và khung GV liên kết tới `ho-so-ca-nhan-giang-vien.html`
  trong `pages/giang-vien/`. Trang hồ sơ GV hiện là khung HTML, chưa kết nối
  tài khoản; khi bổ sung dữ liệu phải giữ đúng vai trò.
- Nút Đăng xuất và nút xác nhận đang disabled, có thông báo chưa xử lý.
- Dialog không có thuộc tính `hidden`. Nút Hủy được bật, dùng
  `type="submit"`, `value="cancel"` trong form `method="dialog"` để đóng
  khi dialog được mở. Hiện chưa có JS gọi `showModal()`.
- `aria-controls`, `aria-labelledby`, `aria-describedby` phải trỏ đúng ID
  trong cùng trang; không tạo ID trùng khi sao chép thành phần.

`index.html` hiện dùng header/footer rút gọn để giới thiệu các trang đã có;
không lấy trang này làm khung cho màn SV/GV.

## 3. Cách tạo một trang mới

### Bước 1: Chọn khung theo vai trò

Sao chép file khung và đổi tên bản sao thành tên trang cần làm.

Ví dụ:

- Trang sinh viên: sao chép `templates/khung-sinh-vien.html` vào `pages/sinh-vien/`.
- Trang giảng viên: sao chép `templates/khung-giang-vien.html` vào `pages/giang-vien/`.

Đường dẫn trong khung được viết để mở trực tiếp từ `templates/`. Sau khi sao
chép, bỏ tiền tố `../pages/sinh-vien/` hoặc `../pages/giang-vien/` ở các link
cùng vai trò. Nếu có link chung, đổi `../pages/chung/` thành `../chung/`.
Tài nguyên từ trang trong `pages/<vai-tro>/` dùng `../../assets/...`;
liên kết về trang vào dùng `../../index.html`. Cập nhật cả `href`, `src`,
`action` và `data-pending-href` nếu có.

Giữ file khung gốc để các thành viên khác tiếp tục sử dụng.
Không ghi nội dung riêng của một trang vào file khung gốc.
Giữ đúng phạm vi phần việc được giao; chỉ tạo trang mới khi nhiệm vụ bao gồm
trang đó, không tự tạo tất cả trang đích để lấp các liên kết còn thiếu.

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
File `chi-tiet-de-tai-mo-dang-ky.html` là trang chi tiết minh họa cho DT001.
Tên file đã được chuẩn hóa thành chữ thường và các liên kết đã cập nhật.
Tên file mới dùng chữ thường, không dấu, nối bằng dấu gạch ngang.

### Các thành phần HTML hiện có

Trang Đăng ký đề tài gồm:

- Ô tìm theo tên hoặc mã đề tài; sắp xếp mới nhất, cũ nhất hoặc tên A–Z.
- Bộ lọc loại đề tài, giảng viên và môn học; liên kết Xóa bộ lọc quay về URL
  gốc `dang-ky-de-tai.html`.
- Bốn thẻ dữ liệu mẫu và phần tổng hợp số lượng. Mỗi thẻ có vùng ảnh minh họa
  chờ bổ sung, tên, mã/loại, môn/học kỳ, giảng viên, số sinh viên/nhóm,
  hạn đăng ký và trạng thái. Thông tin còn thiếu hiển thị “Chưa có thông tin”.
- Danh mục ghi rõ **3 đề tài mở đăng ký, 1 đang thực hiện**. DT002 là đề tài
  đang thực hiện của SV mẫu; không mô tả DT002 là đang mở đăng ký.
- Mỗi thẻ có ngày tạo hiển thị và các thuộc tính `data-topic-id`, `data-name`,
  `data-type`, `data-course`, `data-lecturer`, `data-created-at`, `data-status`.
  Ngày tạo dùng ISO `YYYY-MM-DD`; giá trị loại/môn/GV khớp `value` bộ lọc.
  Giá trị rỗng thể hiện chưa có thông tin. DT001 và DT003 có môn IE104.
- Ngày tạo và môn/loại đã bổ sung là dữ liệu minh họa, phục vụ bước JS.
- DT002–DT004 dùng chữ `Chi tiết đang cập nhật`, class `topic-card__pending`.
  DT002 có `data-pending-href` giữ đường dẫn dự kiến; đây không phải link bấm.
- Phân trang mẫu chỉ có một trang; nút trang trước và trang sau đang tắt.

Trang Chi tiết đề tài gồm:

- Liên kết Quay lại danh sách, vùng ảnh minh họa chờ bổ sung và thông tin
  đề tài/giảng viên. DT001 có môn IE104, ngày tạo 05/10/2026 và hạn đăng ký
  20/10/2026, khớp danh mục. Các trường chưa có dữ liệu như học kỳ, năm học,
  khoa/bộ môn hoặc email GV hiển thị “Chưa có thông tin”.
- Các khối Mô tả đề tài, Mục tiêu đề tài và Yêu cầu thực hiện được tách riêng;
  các mục nội dung như kiến thức, sản phẩm bàn giao và bước thực hiện vẫn
  được giữ trong phần nội dung đề tài.
- Biểu mẫu có tên nhóm, MSSV/họ tên/**email** người đăng ký, một hàng thành
  viên mẫu, lời nhắn và xác nhận. Email có label riêng và `type="email"`.
  Các nút thêm/xóa thành viên và gửi đăng ký đang tắt.
- Phần số lượng thành viên chờ xử lý JavaScript; số hàng mẫu không xác định
  giới hạn thành viên của nhóm. Chưa tự điền dữ liệu người đăng ký hoặc
  gán quyền nhóm trưởng khi chưa có quy tắc nghiệp vụ tương ứng.

Trang Tổng quan sinh viên gồm tóm tắt hoạt động, ba yêu cầu gần nhất, hai
hạn nộp, hai thông báo mẫu và lối tắt. Mục Xem tất cả thông báo hiện là chữ
`đang cập nhật`, có `data-pending-href="thong-bao.html"`, chưa phải link.
Các template rỗng/lỗi được giữ cho JS chọn về sau.

Trang Lịch hạn nộp có hai mốc Đề cương/Báo cáo tiến độ của DT002, trạng thái
chưa nộp và link tới phần nộp bài dự kiến. Có template không có hạn và quá
hạn; ngày hiện tại chưa tự làm thay đổi trạng thái vì chưa có JS.

Trang Chi tiết đăng ký và đề xuất dùng fragment như `#dk001` hoặc `#dx002`:

- CSS `:target` và `:has(:target)` nằm ngay trong HTML, không có file CSS
  ngoài. Chỉ một article được hiện; fragment đến phần con phản hồi/chỉnh
  sửa vẫn hiện đúng article cha. Cần trình duyệt hỗ trợ CSS `:has()`.
- URL thiếu/sai fragment hiện phần chọn bốn yêu cầu mẫu, không hiện cả bốn
  chi tiết cùng lúc. Thêm `?ma=DK001` chưa có tác dụng chọn hồ sơ.
- Biểu mẫu sửa DX001/DX002 dùng `#dx001-chinh-sua` / `#dx002-chinh-sua`, không bị che bởi
  `<details>` đóng. Thêm/xóa thành viên, lưu/gửi lại/xóa đề xuất chưa xử lý.
- Giữ `request-detail-page`, các ID hồ sơ và bộ skip-link tương ứng để
  chuyển tới nội dung bằng bàn phím không làm mất hồ sơ đang xem.

Năm trang SV và hai file khung dùng cùng chân trang. Điều khoản sử dụng,
Quy chế đồ án / khóa luận và Chính sách bảo mật hiện là chữ “đang cập nhật”,
không có liên kết hoặc trang chính sách riêng.

Vùng ảnh dùng nội dung placeholder, không dùng nguồn ảnh hỏng. Không coi
các nút/form hoặc dữ liệu mẫu là chức năng đã kết nối lưu trữ thật.

### Dữ liệu cần giữ khớp giữa các trang

Tài khoản SV mẫu là **Nguyễn Minh Anh (24520001)**. Mốc có giờ dùng múi giờ
Việt Nam; thuộc tính `datetime` có offset `+07:00`.

| Mã                      | Trạng thái mẫu                                      | Mốc thời gian                                   |
| ----------------------- | --------------------------------------------------- | ----------------------------------------------- |
| DK001 / DT001           | Chờ duyệt, nhóm Web UIT, Nguyễn Văn A               | Gửi 12/10/2026 09:00                            |
| DK002 / DT002           | Đã duyệt, cá nhân, Trần Thị B; DT002 đang thực hiện | Gửi 08/10/2026 14:00; duyệt 09/10/2026 10:00    |
| DX001                   | Chờ duyệt, cá nhân, đề nghị Nguyễn Văn A            | Gửi 11/10/2026 16:00                            |
| DX002                   | Yêu cầu chỉnh sửa, nhóm Web UIT, Trần Thị B         | Gửi 07/10/2026 10:00; phản hồi 10/10/2026 15:00 |
| DT002 / Đề cương        | Chưa nộp                                            | Hạn 20/10/2026 23:59                            |
| DT002 / Báo cáo tiến độ | Chưa nộp                                            | Hạn 27/10/2026 23:59                            |

Phản hồi DX002: “Bổ sung tiêu chí ghép nhóm, phạm vi môn học và kế hoạch
kiểm thử.” Giữ riêng trạng thái đăng ký, đề xuất, thực hiện và bài nộp.

### Phần bổ sung ngày 18/10/2026

- Chi tiết đăng ký/đề xuất: thêm lịch sử xử lý cho bốn hồ sơ; DX001 có biểu
  mẫu chỉnh sửa khi chờ duyệt và khung xác nhận xóa. DX002 giữ biểu mẫu nhóm.
- Lịch hạn nộp: lịch đủ 31 ngày tháng 10/2026, hai ngày có hạn dẫn tới dòng
  tương ứng, tách tình trạng bài nộp khỏi tình trạng hạn. Các số liệu là ảnh
  chụp dữ liệu ngày 18/10/2026, không tự thay đổi theo thời gian.
- Hồ sơ sinh viên: giữ thông tin định danh chỉ đọc; có thể nhập thử liên hệ,
  khôi phục biểu mẫu; chưa lưu. Không đặt thêm quyền sửa tài khoản thực tế.
- Tổng quan GV001: DT001 và DT004 đã tạo; DK001 và DX001 chờ duyệt.
  Chưa có đề tài đang hướng dẫn, hạn nộp hoặc bài nộp thuộc GV001 trong mẫu.
- Tổng quan GV có bốn khối thống kê, hoạt động gần đây từ DK001/DX001 và
  lối tắt mở trang tạo đề tài/hồ sơ GV đã có. Nút quản lý từng đề tài vẫn
  tắt vì trang chi tiết chưa nhận mã đề tài; không trỏ DT001/DT004 vào
  cùng một khung trống rồi coi là đã mở đúng hồ sơ.
- Bốn trang trên dùng `data-pending-href` cho trang đích chưa có; không tạo
  thêm trang ngoài phạm vi để lấp liên kết. Các trang cũ khác và file khung
  có thể vẫn giữ liên kết dự kiến.
- Chưa bổ sung CSS giao diện chung, JavaScript, lưu dữ liệu hay backend.
  Các nút lưu, gửi, xóa, lọc, xét duyệt và đăng xuất vẫn bị vô hiệu hóa.

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
- `name` form dùng tiếng Việt không dấu, kebab-case: `ma-sinh-vien`, `ho-ten`,
  `email`, `ten-nhom`, `thanh-vien-2-mssv`, `thanh-vien-2-ho-ten` (tăng số
  theo hàng). Không đổi lại thành `student-code` hoặc `member-code-2`.
- Tìm/lọc dùng `tu-khoa`, `sap-xep`, `loai-de-tai`, `giang-vien`, `mon-hoc`.
  Đề xuất dùng `ten-de-tai`, `loai-de-tai`, `mo-ta`, `muc-tieu`, `pham-vi`,
  `hinh-thuc`, `giang-vien-de-nghi`.
- Giữ template rỗng/lỗi và nhãn mô tả thao tác chưa hoạt động. Không tự đặt
  thêm giới hạn thành viên, số đăng ký, nộp muộn hoặc dung lượng tệp khi
  chưa có quy tắc nghiệp vụ được xác nhận.

## 5. Đường dẫn giữa các trang

Các đường dẫn dùng vị trí thư mục thực tế. Trong cùng vai trò dùng tên
file; tới vai trò khác dùng `../<vai-tro>/ten-trang.html`; tới trang chung
dự kiến dùng `../chung/ten-trang.html`. Từ `index.html` dùng
`pages/<vai-tro>/ten-trang.html`; từ khung dùng `../pages/<vai-tro>/...`.
Các tên ngắn trong bảng dưới được hiểu trong thư mục vai trò tương ứng.

Tên file trong `href` phải khớp với tên file thực tế, kể cả chữ hoa/thường.
Nếu đổi tên hoặc chuyển thư mục, cần cập nhật các liên kết liên quan.

Đổi nhãn menu không bắt buộc đổi tên file. Các đường dẫn hiện dùng:

| Nội dung                       | Đường dẫn                                    | Tình trạng                          |
| ------------------------------ | -------------------------------------------- | ----------------------------------- |
| Đăng ký đề tài                 | `dang-ky-de-tai.html`                        | Đã có HTML danh sách                |
| Chi tiết đề tài DT001          | `chi-tiet-de-tai-mo-dang-ky.html`            | Đã có HTML minh họa                 |
| Tổng quan SV                   | `tong-quan-sinh-vien.html`                   | Đã có HTML minh họa                 |
| Lịch hạn nộp                   | `lich-han-nop.html`                          | Đã có HTML minh họa                 |
| Chi tiết đăng ký/đề xuất       | `chi-tiet-dang-ky-va-de-xuat-sinh-vien.html` | Đã có HTML chọn hồ sơ bằng fragment |
| Đề tài của tôi SV              | `de-tai-cua-toi-sinh-vien.html`              | Chưa có trang                       |
| Chi tiết đề tài đang thực hiện | `chi-tiet-de-tai-cua-toi-sinh-vien.html`     | Chưa có trang                       |
| Danh sách đề xuất              | `de-xuat-cua-toi.html`                       | Chưa có trang                       |
| Hồ sơ cá nhân                  | `ho-so-ca-nhan.html`                         | Đã có HTML hồ sơ sinh viên          |
| Tổng quan GV                   | `tong-quan-giang-vien.html`                  | Đã có HTML minh họa GV001           |
| Đề tài đã tạo của giảng viên   | `de-tai-cua-toi-giang-vien.html`             | Chưa có trang                       |
| Đề tài đang hướng dẫn          | `de-tai-huong-dan.html`                      | Chưa có trang                       |
| Yêu cầu chờ duyệt              | `yeu-cau-cho-duyet.html`                     | Chưa có trang                       |
| Hồ sơ giảng viên               | `ho-so-ca-nhan-giang-vien.html`              | Đã có khung HTML                    |
| Tạo đề tài giảng viên          | `tao-de-tai-giang-vien.html`                 | Đã có biểu mẫu HTML, chưa lưu       |
| Chi tiết đề tài đã tạo         | `chi-tiet-de-tai-da-tao-giang-vien.html`      | Đã có khung, chưa có dữ liệu theo mã |
| Chỉnh sửa đề tài giảng viên    | `chinh-sua-de-tai-giang-vien.html`            | Đã có khung biểu mẫu HTML           |

DT002–DT004 hiện hiển thị “Chi tiết đang cập nhật”. Chỉ bổ sung liên kết
khi có nội dung chi tiết tương ứng. Trang DT001 đang là HTML tĩnh;
thêm `?ma=DT002` vào URL chưa làm nội dung đổi theo mã đề tài.

Những trang chưa tạo sẽ chưa mở được từ menu.
Không xem việc có liên kết là chức năng đã hoàn thành.

`ho-so-ca-nhan.html` đã có HTML cho sinh viên. Chưa có chuyển dữ liệu theo
vai trò hoặc phiên đăng nhập; không dùng hồ sơ mẫu này cho giảng viên.

Giới thiệu, Thông báo, Liên hệ, Đăng nhập và Quên mật khẩu có trong sitemap
nhưng chưa có trang. Tạo đề xuất mới cũng chưa có trang. Không tự thêm các
file này khi phần việc chỉ yêu cầu sửa HTML hiện có.

### Anchor hiện có và hợp đồng cho trang đích

| File                                         | ID                                                                          | Tình trạng                                          |
| -------------------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| `chi-tiet-dang-ky-va-de-xuat-sinh-vien.html` | `dk001`, `dk002`, `dx001`, `dx002`                                          | Đã có; chọn một hồ sơ                               |
| `chi-tiet-dang-ky-va-de-xuat-sinh-vien.html` | `dk002-phan-hoi-giang-vien`, `dx002-phan-hoi-giang-vien`, `dx002-chinh-sua` | Đã có; mở phần con trong hồ sơ                      |
| `de-tai-cua-toi-sinh-vien.html`              | `de-tai-dang-thuc-hien`, `dang-ky-da-gui`, `de-xuat-cua-toi`                | Chưa có trang; người làm trang đích cần đặt đúng ID |
| `chi-tiet-de-tai-cua-toi-sinh-vien.html`     | `de-cuong`, `bao-cao-tien-do`                                               | Chưa có trang; người làm trang đích cần đặt đúng ID |

Các link xem danh sách đề xuất hiện dùng `de-xuat-cua-toi.html`. Nếu trang
Đề tài của tôi bổ sung mục `#de-xuat-cua-toi`, mục này nên dẫn tới danh sách
chính đó, tránh tạo hai danh sách có nội dung/trạng thái khác nhau.

`data-pending-href` chỉ lưu đường dẫn dự kiến cho phần tử chưa bấm được;
trình duyệt không tự điều hướng theo thuộc tính này. Các link `href` tới
trang chưa có vẫn có thể mở lỗi; giữ rõ giới hạn này khi bàn giao, không
coi các đường dẫn dự kiến là đã kiểm thử hoạt động.

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
- Kiểm tra DT002 đang thực hiện; các hạn, trạng thái và phản hồi khớp Tổng
  quan, Lịch hạn nộp và Chi tiết đăng ký/đề xuất.
- Thử trang chi tiết với URL không fragment, từng mã DK/DX, fragment phản
  hồi và `#dx002-chinh-sua`; chỉ hiện một hồ sơ. Thử skip-link bằng bàn phím.
- Thử menu tài khoản bằng chuột/bàn phím. Giữ Hủy trong form
  `method="dialog"`; không báo đăng xuất hoạt động khi nút mở vẫn disabled.
- Kiểm tra mỗi trường biểu mẫu có nhãn đúng; nút thêm/xóa thành viên,
  phân trang mẫu và nút gửi thể hiện đúng trạng thái chưa hoạt động.
- Kiểm tra chân trang đồng nhất và các mục đang cập nhật không có liên kết giả.
- Kiểm tra thẻ HTML đóng/mở đầy đủ.
- Chạy `git status` để xác nhận các file sẽ đưa vào commit.

Chưa có CSS giao diện chung nên nội dung xếp dọc là bình thường. CSS chọn
hồ sơ trong trang chi tiết không thay thế bước làm bố cục responsive.
Trang Đăng ký đề tài đã có nút Tìm kiếm, nhưng gửi form hiện chỉ đưa giá trị
lên URL, chưa tìm kiếm, lọc hoặc sắp xếp danh sách. Liên kết Xóa bộ lọc
quay về URL gốc. Biểu mẫu đăng ký ở trang chi tiết chưa tiếp nhận hoặc lưu
yêu cầu; thêm/xóa thành viên, đếm số lượng và gửi yêu cầu chưa hoạt động.
Các tương tác HTML tự nhiên như menu `<details>`, reset form và chọn hồ sơ
bằng fragment có thể dùng ngay; chúng không gửi/lưu yêu cầu. Những phần
nghiệp vụ còn lại cần được xử lý ở bước JavaScript.

Nguồn HTML hiện dùng thụt lề hai khoảng trắng. Repo chưa có file cấu hình
formatter dùng chung; thống nhất công cụ với nhóm trước khi áp dụng toàn
repo và tách thay đổi chỉ định dạng khỏi thay đổi chức năng khi có thể.
