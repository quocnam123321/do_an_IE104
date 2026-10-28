# Website quản lý đồ án môn học và khóa luận tốt nghiệp

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- HTML5, CSS3 và JavaScript thuần, theo yêu cầu đã được người dùng xác nhận.
- Không tự thêm React, Vue, Angular, Tailwind, Bootstrap, jQuery hoặc framework/thư viện thay thế công nghệ thuần.
- Mã nguồn website hiện nằm trong `do_an_IE104/`; điểm vào là `do_an_IE104/index.html`.
- Đây là website tĩnh ở giai đoạn hiện tại, mở bằng trình duyệt hoặc phục vụ qua HTTP khi phát triển; chưa cần bước build.
- Tài liệu sản phẩm này đặt tại thư mục làm việc chứa các skill. Không tạo bản PRODUCT.md cạnh tranh trong thư mục mã nguồn khi chưa có yêu cầu tách phạm vi.

## Users

- **Sinh viên — ưu tiên hiện tại:** tìm hiểu và đăng ký đề tài, gửi đề xuất, xem đề tài của mình, theo dõi tiến độ, hạn nộp, bài nộp và kết quả đánh giá.
- **Giảng viên — ưu tiên hiện tại:** tạo và chỉnh sửa đề tài, xem yêu cầu chờ duyệt, theo dõi đề tài đang hướng dẫn và nội dung sinh viên nộp.
- **Quản trị viên — bổ sung sau:** là nhóm người dùng đã được xác nhận, nhưng chức năng và quyền cụ thể chưa được chốt.
- Thứ tự ưu tiên sinh viên và giảng viên trước, quản trị viên sau được người dùng xác nhận trong bước khởi tạo.

## Product Purpose

Website phục vụ quản lý đồ án môn học và khóa luận tốt nghiệp, tập trung thông tin đề tài và các bước phối hợp giữa sinh viên với giảng viên.

Mục tiêu sản phẩm là giúp người dùng biết đề tài nào có thể đăng ký, yêu cầu nào cần xử lý, công việc nào đang thực hiện và thời hạn nào cần theo dõi. Các luồng được thể hiện trong mã nguồn là bằng chứng về phạm vi giao diện dự kiến, không phải xác nhận rằng nghiệp vụ đã hoạt động.

## Operating Context

- Giao diện hỗ trợ tiếng Việt và tiếng Anh, theo yêu cầu người dùng đã xác nhận; ngữ cảnh sử dụng là học tập và hướng dẫn đồ án/khóa luận. Chưa coi việc có yêu cầu song ngữ là đã triển khai chức năng chuyển ngôn ngữ.
- Mã nguồn hiện mang tên đồ án IE104, Nhóm 7 và có nội dung về Trường Đại học Công nghệ Thông tin. Đây là ngữ cảnh của bản đồ án hiện có, không phải tuyên bố website đã được nhà trường triển khai hoặc chứng thực.
- Mã nguồn được tổ chức thành trang công khai/dùng chung, trang sinh viên, trang giảng viên và các khung trang.
- Các luồng được quan sát trong mã nguồn gồm đăng ký hoặc đề xuất đề tài, yêu cầu chờ duyệt, chi tiết đề tài, tiến độ, lịch hạn nộp, bài nộp, kết quả đánh giá và hồ sơ cá nhân.

## Capabilities and Constraints

### Trạng thái hiện tại đã kiểm tra

- Website đã có các trang HTML và dữ liệu minh họa cho sinh viên, giảng viên và các trang chung.
- Các thư mục `do_an_IE104/assets/css/` và `do_an_IE104/assets/js/` hiện chỉ có `.gitkeep`; chưa có CSS hoặc JavaScript dùng chung trong hai thư mục này.
- Theo README và nội dung demo trong mã nguồn, đăng ký, lưu, duyệt, đăng xuất và các thao tác nghiệp vụ chưa được triển khai đầy đủ. Không mô tả chúng như chức năng đã hoàn thành.
- Chưa có bằng chứng về backend, cơ sở dữ liệu hoặc xác thực/phân quyền thực tế trong phần mã nguồn đã kiểm tra. Không tự bổ sung các hệ thống này chỉ vì có vai trò người dùng hoặc màn hình đăng nhập.

### Quy tắc phối hợp đã được người dùng xác nhận

- `DESIGN.md` giữ các quyết định thiết kế chung đã chốt; mọi lần triển khai hoặc tinh chỉnh phải tôn trọng tài liệu đó khi tồn tại.
- UI/UX Pro Max hỗ trợ đề xuất hệ thống thiết kế ban đầu và tra cứu UX khi cần. Không chọn lại phong cách cho từng trang sau khi đã chốt quy chuẩn chung.
- Impeccable phụ trách rà soát và tinh chỉnh sau khi trang đã hoạt động, trong phạm vi yêu cầu; không tự thiết kế lại toàn bộ website.
- Hook tự động của Impeccable phải giữ tắt. Chỉ bật lại khi người dùng yêu cầu.
- Bước khởi tạo này chỉ ghi nhận thông tin sản phẩm và tùy chọn quy trình, không sửa HTML/CSS/JavaScript hoặc tạo một thiết kế mới.

### Quy trình hai giai đoạn — đã xác nhận ngày 28/10/2026

**Giai đoạn 1 — Tập trung CSS, chưa bổ sung JavaScript**

- Dựng CSS theo `DESIGN.md`, dùng bộ kích thước đã được phép dựng thử; xử lý responsive trên máy tính, tablet/iPad và điện thoại theo chiều rộng khả dụng.
- Dùng dữ liệu mẫu để đánh giá bố cục, typography, thẻ, bảng, form và các trạng thái thị giác. Giữ nguyên nội dung/nghiệp vụ ngoài phạm vi.
- Tập trung màu, font, kích thước, khoảng cách, bố cục và responsive. Chỉ điều chỉnh HTML cần thiết để gắn stylesheet, class hoặc cấu trúc trình bày; giữ nội dung và nghiệp vụ ngoài phạm vi.
- Chưa bổ sung JavaScript trong giai đoạn này. Giữ và tận dụng hành vi HTML/CSS sẵn có, chẳng hạn details/summary, popover và tab đang có trong mã nguồn. Tương tác cần JavaScript được để sang giai đoạn 2, không phải điều kiện để hoàn thành phần CSS.
- Kiểm tra hover, focus, bàn phím, phóng to chữ và nội dung dài; không mô tả việc dựng giao diện là đã hoàn thành chức năng xử lý dữ liệu.
- Tìm kiếm, áp dụng/xóa điều kiện lọc vào danh sách, sắp xếp và phân trang dữ liệu được để sang giai đoạn 2. Các thao tác chưa xử lý phải được thể hiện rõ, không báo thành công giả.

**Giai đoạn 2 — Chức năng và xử lý dữ liệu**

- Bổ sung JavaScript cho tương tác giao diện khi cần, như menu, thu gọn bộ lọc hoặc chuyển tab nếu HTML/CSS sẵn có chưa đáp ứng.
- Triển khai tìm kiếm, lọc, sắp xếp mới nhất/cũ nhất, phân trang và kiểm tra/gửi form theo nghiệp vụ được xác định.
- Có thể bắt đầu bằng dữ liệu mẫu trên trình duyệt; phải phân biệt rõ bản demo với lưu trữ và xử lý thực tế.
- Đăng nhập, phân quyền, lưu bài nộp, duyệt đề tài và đồng bộ giữa nhiều người cần backend kiểm tra/lưu trữ. Công nghệ backend, API và phạm vi kết nối chưa được quyết định bởi việc chốt hai giai đoạn.
- Khi có xử lý thực tế, bổ sung trạng thái đang xử lý, kết quả, lỗi và cách khôi phục tương ứng; chỉ báo thành công khi thao tác hoàn thành.

Hai giai đoạn là thứ tự và ranh giới công việc đã thống nhất. Việc xác nhận quy trình này chưa phải yêu cầu bắt đầu sửa mã nguồn trong lượt ghi nhận; lựa chọn hai trang thử vẫn là đề xuất đang trao đổi.

### Những quyết định còn mở

- Phạm vi chi tiết, quyền hạn và luồng công việc của quản trị viên.
- Quy tắc nghiệp vụ chính thức: điều kiện đăng ký, thành viên nhóm, quy trình duyệt, cấu trúc hạn nộp và cách đánh giá.
- Cách lưu dữ liệu, kết nối backend và cơ chế xác thực trong các giai đoạn sau.
- Môi trường triển khai chính thức và yêu cầu accessibility cụ thể.
- `DESIGN.md` ghi nhận hướng màu B, điều chỉnh tiêu đề/header, họ font Be Vietnam Pro dùng chung cho tiếng Việt và tiếng Anh, vị trí bộ lọc trên máy tính và phiên bản danh sách đề xuất trên điện thoại được duyệt ngày 28/10/2026. Bản điện thoại dùng thứ tự bộ lọc → tìm kiếm → sắp xếp rộng bằng tìm kiếm → danh sách thẻ có ảnh trên đầu và nhãn trạng thái góc trên phải. Bộ kích thước tại mục 4.1 của `DESIGN.md` đã được phép dùng để dựng thử và tinh chỉnh sau khi xem bản chạy. Độ đậm, khoảng cách dòng, cách tải font, các kích thước khác, breakpoint và bố cục chưa xác nhận vẫn là đề xuất. Phạm vi CSS/JavaScript theo quy trình hai giai đoạn ở trên; lựa chọn hai trang thử chưa được xác nhận riêng.

## Evidence on Hand

- `do_an_IE104/README.md`: giới thiệu dự án, công nghệ thuần, cấu trúc mã nguồn và giới hạn bản demo. Một số mô tả về số lượng hoặc sự hiện diện của trang đã cũ; kiểm tra mã nguồn thực tế trước khi dùng làm hiện trạng.
- `do_an_IE104/index.html`: điểm vào website và các liên kết tới các nhóm trang.
- `do_an_IE104/pages/sinh-vien/`: các màn hình sinh viên đã có mã HTML.
- `do_an_IE104/pages/giang-vien/`: các màn hình giảng viên đã có mã HTML.
- `do_an_IE104/pages/chung/`: đăng nhập, giới thiệu, thông báo và liên hệ.
- `do_an_IE104/docs/Huong_dan_su_dung_khung_trang.md`: hướng dẫn khung trang, đường dẫn và dữ liệu minh họa.
- Các tên người, mã đề tài, số liệu và mốc thời gian trong bản demo là nội dung minh họa; không dùng làm bằng chứng sử dụng thực tế hoặc kết quả sản phẩm.

## Product Principles

1. Ưu tiên các công việc học thuật của sinh viên và giảng viên trước khi mở rộng chức năng quản trị.
2. Giữ thuật ngữ, trạng thái nghiệp vụ và cách điều hướng nhất quán giữa các trang.
3. Thể hiện rõ dữ liệu mẫu và giới hạn chức năng, không báo lưu, nộp hoặc duyệt thành công khi chưa có xử lý thực tế.
4. Giữ công nghệ HTML/CSS/JavaScript thuần và bảo toàn nghiệp vụ, nội dung hiện có khi rà soát hoặc tinh chỉnh.
