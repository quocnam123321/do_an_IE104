# Hệ thống thiết kế — Quản lý đồ án và khóa luận tốt nghiệp

Trạng thái: **v0.8 — đã chốt màu, họ font, vị trí bộ lọc trên máy tính, bản danh sách điện thoại và quy trình CSS trước, JavaScript sau tại mục 11.1; bộ kích thước tại mục 4.1 đã được phép dùng để dựng thử ngày 28/10/2026. Các thông số dùng thử được tinh chỉnh sau khi xem bản chạy; những phần chưa xác nhận vẫn là đề xuất**.

Tài liệu này dùng chung cho website tại thư mục gốc mã nguồn, đặt cùng cấp với `AGENTS.md`, `PRODUCT.md` và `index.html`. Người dùng đã chọn phương án B “Trắng – xanh cân bằng”, yêu cầu mục đang chọn trên header chỉ có gạch xanh bên dưới và các tiêu đề/nhãn in đậm trong nội dung dùng đen thuần. Người dùng cũng đã chốt Be Vietnam Pro làm họ font chung, chuyển bộ lọc trên máy tính lên trên hàng tìm kiếm/sắp xếp và duyệt bản danh sách đề xuất trên điện thoại tại mục 6.1. Đây là các quyết định thiết kế, chưa phải yêu cầu triển khai HTML/CSS/JavaScript.

### Những điểm màu đã chốt

- Header, card, bảng và form nền trắng; nền trang xám xanh rất nhạt; nút và liên kết giữ xanh dương theo phương án B.
- Mục điều hướng đang chọn trên header không có nền xanh nhạt bao cả ô. Dấu hiệu lựa chọn là gạch xanh nằm bên dưới; nền của ô vẫn trắng như header.
- Tiêu đề trang, tiêu đề section, tên đề tài/card, tiêu đề bộ lọc và các nhãn nhóm in đậm trong phần nội dung dùng `#000000`, không pha xanh/navy.
- Phạm vi chữ đen là các tiêu đề/nhãn in đậm trong nội dung, theo trả lời làm rõ của người dùng. Không tự đổi toàn bộ mô tả/metadata thành đen, không đổi chữ trắng trên nút xanh hoặc màu chữ badge trạng thái.
- Logo khoa và màu tên hệ thống ở vùng nhận diện giữ theo phương án B; không thay chữ trong ảnh logo bằng font giao diện.
- Ảnh minh họa đã chỉnh (`output/design-references/color-b-header-underline-black-headings.png`): hiện chưa có tài nguyên tham khảo này trong kho mã nguồn (thư mục `output/` chưa tồn tại trong repo; không tự tạo ảnh thay thế). Ảnh từng là bản xem thị giác do imagegen tạo, chưa phải giao diện đã triển khai hoặc bản kiểm chứng font thật; các quyết định màu đã chốt ở trên được áp dụng theo mô tả văn bản.
- Các mã token dưới đây cụ thể hóa màu cho bước triển khai sau; ảnh minh họa không phải nguồn để đo chính xác mọi mã HEX hoặc kích thước.

### Họ font đã chốt

- **Be Vietnam Pro** là font chính cho giao diện tiếng Việt và tiếng Anh, dùng chung cho tiêu đề, nội dung, menu, nút và form giữa các vai trò.
- Chuỗi font dự phòng: `"Be Vietnam Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`.
- Mẫu chữ bằng font thật từng xem (`output/font-comparison/so-sanh-font-tieng-viet.png`): hiện chưa có tài nguyên tham khảo này trong kho mã nguồn (thư mục `output/` chưa có trong repo; không tự tạo ảnh thay thế). Ảnh minh họa AI không dùng để xác nhận hình dáng chính xác của font.
- Họ font đã chốt. Cỡ chữ tại mục 4.1 đã được phép dùng để dựng thử; độ đậm, khoảng cách dòng và cách tải font còn là đề xuất. Chưa sửa CSS website.

### Vị trí bộ lọc trên máy tính đã chốt

- Tại trang cần lọc, bộ lọc là một khối phía trên hàng tìm kiếm và sắp xếp, rộng theo khung nội dung; không tiếp tục dùng panel lọc bên trái.
- Thứ tự sau tiêu đề/mô tả trang: khối bộ lọc → hàng tìm kiếm và sắp xếp → danh sách kết quả → phân trang khi có.
- Dùng các tiêu chí lọc phù hợp nghiệp vụ hiện có. Ảnh tham khảo chỉ xác định cách đặt khối bộ lọc, không đưa nội dung du lịch hoặc màu vàng của ảnh vào website.
- Quyết định này thay thế đề xuất cột lọc trái 260px trên máy tính. Số cột bên trong bộ lọc và kích thước trên máy tính còn là đề xuất. Bản điện thoại đã chốt riêng ở mục 6.1; bố cục tablet vẫn đang được xem xét.
- Chỉ ghi nhận quyết định thiết kế; chưa thay đổi HTML/CSS/JavaScript.

### Phiên bản điện thoại đã chốt

- Ảnh người dùng xác nhận ngày 28/10/2026 (`output/design-references/mobile-proposals-approved-2026-10-28.png`): hiện chưa có tài nguyên tham khảo này trong kho mã nguồn (thư mục `output/` chưa có trong repo; không tự tạo ảnh thay thế).
- Bố cục một cột: header thu gọn → breadcrumb/tiêu đề/mô tả → khối bộ lọc → tìm kiếm → sắp xếp → danh sách thẻ đề tài. Chi tiết ở mục 6.1 và mục 7.
- Quyết định áp dụng cho danh sách đề tài/đề xuất tương ứng trên điện thoại, không tự duyệt lại bố cục trang chi tiết, form, landing hoặc tablet.
- Ảnh từng dùng là tham chiếu thị giác. Dùng Be Vietnam Pro thật khi triển khai; không suy ra cỡ chữ, mã màu hoặc kích thước CSS bằng cách đo ảnh AI. Các sai lệch giữa khung ảnh riêng/ảnh mặc định trong ảnh minh họa cần được chuẩn hóa thành cùng một khung khi viết CSS.

### Bộ kích thước đã được phép dùng để dựng thử

- Người dùng xác nhận ngày 28/10/2026; các giá trị cụ thể tại mục 4.1 là thông số khởi đầu được phép áp dụng khi dựng thử, có thể tinh chỉnh sau khi đánh giá trên trình duyệt.
- Ảnh tham khảo (`output/design-references/trial-sizing-approved-2026-10-28.png`): hiện chưa có tài nguyên tham khảo này trong kho mã nguồn (thư mục `output/` chưa có trong repo; không tự tạo ảnh thay thế). Dòng “chưa chốt” trong ảnh cũ đã được thay thế bởi xác nhận này đối với bộ kích thước.
- Ảnh chỉ xác nhận hướng kích thước, không khôi phục bộ lọc cột trái hoặc thay thế bản điện thoại đã duyệt. Việc xác nhận bộ kích thước không đồng nghĩa đã duyệt hai trang thử hoặc yêu cầu bắt đầu sửa mã nguồn ngay. Phạm vi CSS/JavaScript đã được thống nhất riêng theo hai giai đoạn tại mục 11.1.

## 1. Phạm vi và cách sử dụng

- Đọc `PRODUCT.md` để hiểu người dùng, phạm vi và công nghệ; đọc tài liệu này trước khi đề xuất, dựng hoặc rà soát giao diện.
- Yêu cầu đã xác nhận: giao diện có tiếng Việt và tiếng Anh; HTML5, CSS3 và JavaScript thuần; ưu tiên sinh viên và giảng viên, quản trị viên bổ sung sau.
- Phần màu/cách chọn header, họ font, vị trí bộ lọc trên máy tính và bản danh sách đề xuất trên điện thoại đã chốt theo mục trên. Bộ kích thước ở mục 4.1 được phép dùng để dựng thử. Những thông số hoặc thành phần ở mục 4–10 chưa được đánh dấu đã chốt hoặc được phép dùng thử tiếp tục là đề xuất; chỉ triển khai khi người dùng yêu cầu.
- Sau khi được chốt, dùng một bản DESIGN.md làm quy chuẩn thiết kế chính, không tự chọn lại phong cách cho mỗi trang hoặc tạo tài liệu MASTER.md có quy định cạnh tranh.
- Giữ cấu trúc trang, thuật ngữ, đường dẫn và nghiệp vụ đã có; đối chiếu mã nguồn vì một số README/tài liệu khung trang chưa cập nhật đầy đủ.
- Tài liệu tham khảo hoặc kết quả tìm kiếm chỉ cung cấp gợi ý. Yêu cầu của người dùng và quy chuẩn đã chốt quyết định cách áp dụng.

## 2. Hướng thiết kế đề xuất

- Giao diện quản lý học thuật rõ ràng, bình tĩnh, dễ quét thông tin và sử dụng lâu.
- Hướng màu B đã chốt: nền sáng, bề mặt trắng; tiêu đề/nhãn đậm trong nội dung đen thuần; xanh dương làm màu hành động chính, navy dành cho nhận diện; màu trạng thái có ý nghĩa riêng.
- Bố cục phẳng, phân nhóm bằng khoảng cách, tiêu đề và đường viền nhẹ. Chỉ dùng card khi có một đơn vị nội dung hoặc một tác vụ độc lập.
- Hạn chế trang trí gây nhiễu, gradient mặc định, bóng nặng hoặc làm mọi thành phần thành khối bo tròn giống nhau.
- Trang công khai được phép có tiêu đề lớn và khoảng thở rộng hơn. Màn hình sinh viên/giảng viên ưu tiên điều hướng, tìm kiếm, bảng, form và thông tin cần xử lý.
- Màu, font, hệ thống khoảng cách, nút và trạng thái được dùng chung giữa các vai trò; không tạo thương hiệu riêng cho từng vai trò.
- Chỉ đề xuất light theme trong bản này. Dark theme là quyết định mở, không tự sinh thêm.

## 3. Màu sắc và vai trò

Các tên dưới đây là semantic token dành cho hướng màu đã chốt (đang được áp dụng thử nghiệm trong phạm vi `.student-overview-page` tại `assets/css/tong-quan-sinh-vien.css`, dự kiến tách thành `assets/css/tokens.css` khi mở rộng toàn trang):

- `--color-background: #F8FAFC` — nền trang.
- `--color-surface: #FFFFFF` — bề mặt nội dung, bảng và modal.
- `--color-heading: #000000` — tiêu đề trang/section, tên đề tài/card và nhãn nhóm in đậm trong phần nội dung; ưu tiên token này thay cho navy/primary ở các vị trí đó.
- `--color-brand: #2F429F` — nhận diện ở tên hệ thống, không dùng thay màu đen của các tiêu đề nội dung đã chốt; đây là màu diễn giải từ phương án B, không phải tuyên bố mã brand chính thức của khoa.
- `--color-foreground: #0F172A` — nội dung chính.
- `--color-muted-foreground: #475569` — mô tả và thông tin phụ vẫn cần đọc rõ.
- `--color-border: #E2E8F0` — đường phân chia trang trí; không dùng làm dấu hiệu duy nhất để nhận diện control.
- `--color-control-border: #64748B` — viền nhận diện input và control cần tương phản với nền.
- `--color-primary: #1D4ED8` — nút chính, liên kết và dấu hiệu lựa chọn; không dùng màu này cho tiêu đề nội dung.
- `--color-primary-hover: #1E40AF` — hover của hành động chính.
- `--color-primary-active: #1E3A8A` — trạng thái đang nhấn.
- `--color-on-primary: #FFFFFF` — chữ trên nền hành động chính.
- `--color-focus: #1D4ED8` — chỉ báo focus; dùng outline có offset để tách khỏi thành phần.
- `--header-current-background: transparent` — mục đang chọn không tô nền cả ô, hiển thị nền trắng của header.
- `--header-current-indicator: var(--color-primary)` — gạch xanh dưới mục hiện tại; không gọi gạch chỉ báo này là một slider điều khiển giá trị.

Cặp chữ/nền dành cho trạng thái:

- Thành công: `--color-success-fg: #166534`, `--color-success-bg: #F0FDF4`.
- Cảnh báo/chờ xử lý: `--color-warning-fg: #92400E`, `--color-warning-bg: #FFFBEB`.
- Lỗi/nguy hiểm: `--color-danger-fg: #991B1B`, `--color-danger-bg: #FEF2F2`.
- Thông tin: `--color-info-fg: #1E40AF`, `--color-info-bg: #EFF6FF`.
- Trung tính: `--color-neutral-fg: #334155`, `--color-neutral-bg: #F1F5F9`.

Các cặp chữ/nền trạng thái trên đã được tính tương phản ở màu đặc và đạt tối thiểu 4.5:1. Chữ trắng trên primary đạt khoảng 6.70:1. Cần kiểm tra lại khi triển khai nếu đổi nền, opacity, font hoặc trạng thái; đây không phải chứng nhận accessibility cho toàn giao diện.

## 4. Typography và nội dung song ngữ — họ font đã chốt, cỡ chữ được phép dùng thử

- Font chính đã chốt: `"Be Vietnam Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif`, dùng chung cho tiêu đề, nội dung và control. Khi font chính chưa tải xong hoặc tải lỗi, dùng font dự phòng.
- Các tệp Be Vietnam Pro 400 và 600 từng dùng cho bản so sánh tại `output/font-comparison/fonts/` hiện chưa có trong kho mã nguồn (thư mục `output/` chưa có tài nguyên tham khảo) và chưa tích hợp vào website. Chưa chốt tải font từ dịch vụ ngoài hay lưu cùng mã nguồn. Khi triển khai, cần có tệp cho các độ đậm thực sự sử dụng.
- Website có cả tiếng Việt và tiếng Anh, cùng dùng Be Vietnam Pro. Khi triển khai, kiểm tra dấu tiếng Việt, độ dài bản dịch, xuống dòng và kích thước control ở cả hai ngôn ngữ.
- Cỡ chữ dùng thử theo mục 4.1. Khoảng cách dòng `1.5`, tiêu đề phần `1.125–1.25rem` và cỡ caption không nhỏ hơn `0.75rem` vẫn là đề xuất; caption không dùng cho nội dung tác vụ chính. Chữ trong bảng được phân theo vai trò nội dung, không tự giảm toàn bộ bảng xuống cỡ chữ phụ.
- Landing có thể dùng heading lớn hơn theo chiều rộng, nhưng không ép nội dung tràn hoặc tạo khoảng trống quá lớn trên mobile.
- Font-weight: 400 cho nội dung, 500 cho label/nút, 600–700 cho tiêu đề. Không viết hoa toàn bộ nhãn dài hoặc đoạn văn.
- Tên đề tài và tên người được xuống dòng tự nhiên; mã/URL dài được wrap khi cần. Không dùng ellipsis khiến mất thông tin thiết yếu nếu không có cách xem đầy đủ.
- Thông báo nêu rõ việc gì đã xảy ra và người dùng cần làm gì. Giữ thuật ngữ nhất quán như “đề tài”, “đăng ký”, “đề xuất”, “bài nộp”.
- Màu và hình thức không được tự quyết định nghiệp vụ hoặc đổi nhãn trạng thái đang có.

### 4.1. Thông số được phép áp dụng khi dựng thử

- **Chữ nội dung chính:** 16px (`1rem` khi cỡ chữ gốc là 16px).
- **Chữ thông tin phụ:** 14px (`0.875rem` ở cùng cỡ gốc).
- **Tiêu đề trang quản lý:** 28px trên máy tính (`1.75rem`), 24px trên điện thoại (`1.5rem`). Cỡ tiêu đề trên tablet được kiểm tra khi dựng responsive, chưa coi một breakpoint cụ thể là đã duyệt.
- **Nút, input một dòng và select:** chiều cao tối thiểu 44px; cho phép cao thêm khi chữ xuống dòng hoặc người dùng phóng to. Đây là chiều cao thành phần, không phải cỡ chữ. Không áp dụng chiều cao này cho ô nhập nhiều dòng.
- **Bo góc:** nút/input/select 8px; card/modal 12px.
- **Khung ảnh đề tài:** ảnh riêng và ảnh mặc định dùng cùng khung; áp dụng thử tỷ lệ 16:9. Giữ tỷ lệ nội dung ảnh, không kéo méo.
- Đây là bộ khởi đầu được người dùng cho phép dựng thử, không phải bộ thông số cuối cùng đã được kiểm chứng trên giao diện chạy. Sau khi tinh chỉnh, cập nhật tài liệu và CSS tương ứng.
- Ưu tiên đơn vị `rem` cho cỡ chữ để hỗ trợ tùy chọn trình duyệt; các giá trị px trên là mốc thiết kế, không dùng để khóa khả năng tăng chữ/zoom.

## 5. Khoảng cách, bo góc và chiều sâu

- Thang spacing theo rem: `0.25`, `0.5`, `0.75`, `1`, `1.5`, `2`, `3`; tương ứng 4, 8, 12, 16, 24, 32, 48px khi cỡ chữ gốc là 16px.
- Padding trang: 16px trên mobile, 24–32px khi đủ rộng; khoảng cách giữa các nhóm nội dung 24–32px.
- Bo góc được phép dùng thử: 8px cho nút/input/select, 12px cho card/modal theo mục 4.1. Bo góc 4px cho badge/chip vẫn là đề xuất. Avatar có thể tròn; không áp dụng bo tròn dạng viên thuốc cho mọi thành phần.
- Card và bảng mặc định không có bóng, sử dụng đường viền nhẹ nếu cần phân nhóm.
- Bóng chỉ dành cho bề mặt nổi như menu và modal: đề xuất `0 12px 32px rgb(15 23 42 / 0.14)`; modal có backdrop riêng.
- Phân lớp z-index dự kiến: base 0, sticky 10, dropdown 20, backdrop 40, modal 50, toast 60. Ưu tiên top layer tự nhiên của dialog/popover khi sử dụng API tương ứng.

## 6. Bố cục và responsive

- **Đã chốt trên máy tính:** tại trang cần lọc, đặt khối bộ lọc phía trên hàng tìm kiếm/sắp xếp; danh sách kết quả bên dưới sử dụng chiều rộng khung nội dung. Không bố trí panel lọc bên trái. Chỉ hiện bộ lọc ở trang có nhu cầu lọc.

### 6.1. Danh sách đề xuất trên điện thoại — đã chốt

- Một cột theo chiều rộng khả dụng, cuộn dọc tự nhiên; không thu nhỏ giao diện máy tính để vừa màn hình. Giữ lề hai bên và chữ dễ đọc.
- Header nền trắng: logo khoa và tên hệ thống ở trái; nút biểu tượng menu kèm chữ “Menu” ở phải. Điều hướng đầy đủ nằm trong menu thu gọn. Vị trí cụ thể của tài khoản và chuyển ngôn ngữ khi mở menu cần được thiết kế tiếp; vẫn phải hỗ trợ cả tiếng Việt và tiếng Anh.
- Sau header là breadcrumb, tiêu đề trang màu đen và mô tả. Tên trang trong ảnh là dữ liệu tham khảo, không tự đổi tên trang hoặc đường dẫn mã nguồn theo ảnh.
- **Thứ tự cố định:** khối bộ lọc → ô tìm kiếm → ô chọn sắp xếp → tiêu đề danh sách → các thẻ đề tài.
- **Bộ lọc:** khối trắng rộng theo vùng nội dung, nằm trong luồng trang phía trên tìm kiếm; không phải cột trái hoặc hộp thoại phủ lên danh sách. Ảnh đã duyệt thể hiện trạng thái mở, dùng làm trạng thái ban đầu của bản này. Tiêu đề “Bộ lọc” có biểu tượng và nút mũi tên để thu gọn/mở lại; thu gọn không làm mất lựa chọn.
- Các nhóm lọc xếp dọc, có nhãn đậm và đường phân chia nhẹ: “Vai trò trong đề tài”, “Loại đề tài”, “Môn học”. Các lựa chọn dùng checkbox với nhãn chữ; tiêu chí thực tế phải khớp nghiệp vụ của trang.
- Nhóm môn học có “Xem thêm” khi còn lựa chọn chưa hiển thị. Cuối khối lọc, hai nút “Xóa bộ lọc” dạng viền và “Áp dụng” nền xanh/chữ trắng đặt cạnh nhau như mẫu; cho phép xuống dòng nếu bản dịch hoặc mức phóng to khiến chúng thiếu chỗ.
- **Tìm kiếm:** một hàng riêng, rộng toàn vùng nội dung; có biểu tượng tìm kiếm và gợi ý tìm theo tên đề tài, sinh viên hoặc MSSV.
- **Sắp xếp:** một hàng riêng ngay dưới tìm kiếm, **rộng bằng ô tìm kiếm, canh thẳng cả mép trái và mép phải**. Nhãn dạng “Sắp xếp: Cũ nhất” hoặc “Sắp xếp: Mới nhất”, mũi tên ở phải. Không quay lại kiểu ô sắp xếp ngắn căn phải hoặc đặt cạnh nút lọc trên bản điện thoại này.
- Hai chiều sắp xếp đã được yêu cầu là mới nhất/cũ nhất; trường ngày dùng để sắp xếp (ngày gửi, ngày tạo hay ngày cập nhật) là quyết định nghiệp vụ còn mở, không suy ra từ ảnh.
- Danh sách là các thẻ xếp dọc, mỗi thẻ dùng toàn chiều rộng nội dung. Ảnh đại diện nằm đầu thẻ, tiếp theo là tên đề tài, thông tin và nút “Xem đề xuất” như quy định tại mục 7.
- Không ép số thẻ phải vừa một màn hình; tên dài và thông tin nhiều được xuống dòng, làm thẻ cao thêm. Không bỏ thông tin thiết yếu để khớp chiều cao ảnh tham khảo.

### 6.2. Các quy tắc bố cục khác — còn là đề xuất

- Mốc responsive cụ thể và bố cục tablet/iPad chưa được chốt; xác định theo chiều rộng khả dụng và kiểm tra cả xoay máy/chia đôi màn hình.
- Tiếp tục dùng khung header, menu theo vai trò, breadcrumb, tiêu đề và footer hiện có. Không chuyển sang sidebar hoặc đổi sitemap như một phần của việc tinh chỉnh thông thường.
- Container màn hình quản lý có max-width đề xuất 1280px, căn giữa và giữ gutter hai bên.
- Breakpoint đề xuất: dưới 768px là một cột; từ 768px cho phép hai cột khi nội dung phù hợp; từ 1024px dùng bố cục rộng hơn. Kiểm tra thêm tại 375px và 1440px.
- Grid dùng cột linh hoạt; các vùng chứa tên đề tài hoặc nội dung dài cần cho phép co lại (`min-width: 0`) và wrap.
- Form một cột trên mobile; chỉ đặt trường cạnh nhau khi vẫn đọc và thao tác tốt.
- Không gây cuộn ngang toàn trang. Bảng dữ liệu nhiều cột có thể có vùng cuộn ngang riêng, được đặt tên dễ hiểu và thao tác bằng bàn phím khi triển khai.
- Không tự ẩn cột hoặc thông tin nghiệp vụ quan trọng trên mobile; nếu đổi sang thẻ, phải giữ đủ nhãn và giá trị cần thiết.
- Sticky header phải chừa không gian và không che phần tử đang focus. Hạn chế nhiều vùng cuộn lồng nhau.

## 7. Thành phần dùng chung

### Nút và liên kết

- Primary: nền primary, chữ trắng, dùng cho hành động chính của màn hình hoặc khu vực tác vụ.
- Secondary: nền trắng, chữ chính, viền control; ghost dùng cho hành động ít nổi bật.
- Destructive: nhãn rõ hậu quả và màu danger; yêu cầu xác nhận phù hợp khi dữ liệu thực sự bị xóa.
- Chiều cao control chính được phép dùng thử tối thiểu 44px theo mục 4.1. Với thao tác trong bảng, bảo đảm vùng bấm đủ rộng, khoảng cách rõ và không làm nội dung chật.
- Có default, hover, focus-visible, active, disabled và loading khi có xử lý bất đồng bộ thực tế.
- Điều hướng dùng thẻ `a`, thao tác dùng `button`. Không biến một phần tử thành nút chỉ bằng màu hoặc con trỏ.

### Form

- Label hiển thị và liên kết với input; placeholder chỉ là gợi ý nhập, không thay label.
- Input nền trắng, viền control, bo góc 8px; trạng thái focus dùng outline 2px có offset 2px.
- Thông báo lỗi đặt gần trường, liên kết bằng `aria-describedby` và dùng `aria-invalid` khi lỗi đã được xác định.
- Trường bắt buộc có giải thích rõ; không dựa vào màu hoặc dấu sao không được giải nghĩa.
- Khi lỗi, giữ dữ liệu người dùng đã nhập. Thông báo thành công chỉ xuất hiện khi thao tác thật sự hoàn thành.

### Bảng và phân trang

- Dùng HTML table có caption hoặc tên phần rõ ràng, header có scope phù hợp; không dùng bảng để bố trí trang.
- Cột chữ căn trái, số liệu định lượng căn phải; ngày tháng và trạng thái có định dạng nhất quán.
- Padding ô đề xuất 12–16px; tên đề tài wrap. Hành động của mỗi dòng phải có tên dễ hiểu và phân biệt được đối tượng.
- Có vùng dữ liệu trống và vùng lỗi riêng. Chỉ thêm loading khi tồn tại quá trình tải dữ liệu.
- Phân trang nêu trang hiện tại và có accessible name cho nút biểu tượng. Không tạo các nút trông hoạt động khi chưa có xử lý.

### Badge trạng thái

- **Đã chốt cho thẻ đề tài trên điện thoại:** nhãn nằm đè ở **góc trên bên phải khung ảnh**, áp dụng giống nhau cho ảnh riêng và ảnh mặc định. Không đặt thêm một nhãn trùng dưới tên đề tài hoặc gần nút ở cuối thẻ.
- Nhãn dùng nền đặc, chữ tương phản rõ và viền nhẹ để đọc được trên ảnh nhiều màu; có khoảng cách với mép trên/phải, không che biểu tượng giữa ảnh mặc định. Khoảng cách 8–12px và chiều cao khoảng 24–28px là thông số đề xuất để kiểm tra khi triển khai, chưa phải số đo được duyệt từ ảnh.
- Luôn có nhãn chữ; icon chỉ bổ sung ý nghĩa, không thay nhãn.
- Map trạng thái từ dữ liệu hiện có sang semantic màu, không tự đổi workflow: ví dụ “Chờ duyệt” dùng warning, “Đã duyệt” dùng success, “Từ chối” dùng danger khi những trạng thái đó thực sự tồn tại.
- “Quá hạn” và “Cần chỉnh sửa” phải giữ nhãn cụ thể; không gộp tất cả thành một nhãn chung “Lỗi”.
- Badge không phải nút nếu không có tương tác. Bộ chip lọc có tương tác phải có semantics và trạng thái được công bố đúng.
- Với nhãn dài hoặc bản tiếng Anh, giữ chữ dễ đọc và cho phép nhãn cao thêm/xuống dòng; không để tràn khung hoặc che kín ảnh. Ba nhãn trong ảnh chỉ minh họa màu và vị trí, không xác nhận toàn bộ tập trạng thái nghiệp vụ.

### Thẻ đề tài trên điện thoại — đã chốt

- Bề mặt trắng, đường viền nhẹ, bo góc vừa phải; các thẻ có khoảng cách rõ. Nền trang sáng theo hệ màu chung.
- Ảnh đại diện đặt ở đầu thẻ, rộng theo vùng nội dung thẻ; tên đề tài màu đen, đậm và căn trái ở dưới ảnh. Không tiếp tục dùng ảnh vuông nhỏ cạnh tên cho bản danh sách điện thoại này.
- Có ảnh riêng thì hiển thị ảnh đó. Chưa có ảnh hoặc tải ảnh lỗi thì dùng ảnh mặc định nền xanh nhạt, biểu tượng thư mục/tài liệu màu xanh ở giữa, có khoảng trống quanh biểu tượng.
- Ảnh riêng và ảnh mặc định dùng **cùng khung hiển thị** giữa các thẻ; giữ tỷ lệ ảnh, không kéo méo. Tỷ lệ 16:9 đã được phép dùng để dựng thử theo mục 4.1; kiểm tra trên bản HTML/CSS, không coi các chiều cao lệch nhau trong ảnh minh họa là quy chuẩn.
- Dưới tên là các dòng thông tin có nhãn rõ: loại đề tài, môn học khi có, sinh viên/MSSV và vai trò hướng dẫn. Biểu tượng nhỏ chỉ hỗ trợ, không thay nhãn chữ. Giữ thông tin của trang thực tế, không chép dữ liệu mẫu vào nghiệp vụ.
- Nút “Xem đề xuất” nằm cuối thẻ, rộng toàn vùng nội dung bên trong, nền xanh và chữ trắng. Nội dung nút ở trang khác phải khớp hành động thực tế, không đổi đồng loạt mọi hành động thành “Xem đề xuất”.
- Trạng thái “Chờ duyệt” dùng warning, “Đã duyệt” dùng success và “Từ chối” dùng danger theo token mục 3 nếu có trong dữ liệu. Phải nhận biết được qua chữ/biểu tượng, không chỉ qua màu.
- Ảnh mẫu có ghi “Dữ liệu và ảnh minh họa”; giữ dấu hiệu dữ liệu mẫu trong bản demo phù hợp, không coi các tên, MSSV hoặc trạng thái trong ảnh là dữ liệu thực tế.

### Modal, menu và thông báo

- Modal ưu tiên `dialog` khi phù hợp; có tiêu đề, đường đóng, hành vi Escape phù hợp và quản lý focus khi triển khai JavaScript.
- Không dùng popover như dialog modal nếu nó không thực hiện hành vi modal. Giữ các bản demo HTML hiện có cho tới khi được yêu cầu nâng cấp.
- Nút xác nhận nêu rõ hành động như “Xóa công việc”, “Gửi đăng ký”; tránh “OK” khi không rõ hậu quả.
- Giữ các control HTML tự nhiên như details/summary đang có, không ghi trạng thái ARIA cố định trái với trạng thái thực tế.
- Thông báo lỗi hoặc kết quả quan trọng có thể dùng live region phù hợp, tránh thông báo lặp hoặc tự chuyển focus gây gián đoạn.

## 8. Icon, hình ảnh và chuyển động

- Dùng một hệ icon SVG thống nhất về nét và kích thước. Dùng SVG trực tiếp được; không thêm gói React chỉ để sử dụng icon.
- Icon trang trí có `aria-hidden="true"`; nút chỉ có icon phải có accessible name theo hành động.
- Xác minh nguồn và ý nghĩa trước khi dùng logo có sẵn; không tự thêm tuyên bố chứng thực của trường.
- Transition màu/opacity khoảng 120–180ms, không làm thay đổi kích thước bố cục khi hover.
- Tôn trọng `prefers-reduced-motion`; không cần GSAP hoặc thư viện animation để đạt các trạng thái cơ bản.

## 9. Accessibility và trạng thái bất thường

- Đặt `lang="vi"`; giữ heading có thứ bậc, landmark, skip link và nhãn form có nghĩa.
- Mọi tương tác hoạt động bằng bàn phím, focus nhìn thấy và không bị che. Tránh control chỉ xuất hiện khi hover.
- Mục tiêu tương phản: chữ thường ít nhất 4.5:1; ranh giới control và chỉ báo trạng thái thiết yếu ít nhất 3:1 với màu kề, trừ các ngoại lệ phù hợp. Kiểm tra trên kết quả render trước khi kết luận đạt.
- Kiểm tra tăng cỡ chữ/zoom, tên đề tài dài, lỗi form, dữ liệu trống, danh sách nhiều hàng và màn hình hẹp.
- Không truyền đạt trạng thái chỉ bằng màu. Không khóa zoom.
- Bản demo phải ghi rõ thao tác chưa xử lý; không sinh thông báo lưu, duyệt, upload hoặc đăng xuất thành công giả.

## 10. Chuyển tài liệu sang CSS thuần

- **Hiện trạng CSS/JavaScript thực tế trong mã nguồn:**
  - `assets/css/` hiện có `.gitkeep`, stylesheet dựng thử riêng theo trang `assets/css/tong-quan-sinh-vien.css` (giới hạn trong `.student-overview-page` tại `pages/sinh-vien/tong-quan-sinh-vien.html`), cùng hai stylesheet cục bộ kiểu wireframe: `assets/css/deadline-calendar.css` (gắn ở `pages/sinh-vien/lich-han-nop.html`) và `assets/css/supervisor-dialog.css` (gắn ở `pages/sinh-vien/tao-de-xuat.html`). Chưa tạo các file `tokens.css`, `base.css`, `components.css`.
  - Hai trang `pages/sinh-vien/chi-tiet-dang-ky-va-de-xuat-sinh-vien.html` và `pages/sinh-vien/chi-tiet-de-tai-sinh-vien.html` có `<style>` nội tuyến tối thiểu để ẩn/hiện nội dung theo URL fragment (`:target`).
  - `assets/js/` hiện có `.gitkeep` và hai script cục bộ chạy trên dữ liệu mẫu: `assets/js/deadline-calendar.js` (tại `pages/sinh-vien/lich-han-nop.html`) và `assets/js/supervisor-dialog.js` (tại `pages/sinh-vien/tao-de-xuat.html`).
- **Kế hoạch cấu trúc CSS dùng chung khi mở rộng:**
  - Token CSS dự kiến đặt trong `assets/css/tokens.css`, chia ba phần: primitive → semantic → component.
  - Ví dụ quan hệ token: `--blue-700: #1D4ED8` → `--color-primary: var(--blue-700)` → `--button-primary-bg: var(--color-primary)`.
  - CSS nền và thành phần dùng chung dự kiến đặt trong `assets/css/base.css` và `assets/css/components.css`; CSS từng trang hoặc từng cụm tính năng chỉ mô tả nhu cầu riêng và cần đồng bộ sang hệ token chung khi nâng cấp, không định nghĩa lại thương hiệu.
- Khi đã có `assets/css/tokens.css`, giá trị token trong CSS phải khớp `DESIGN.md`. Thay đổi quyết định chung cần cập nhật cả tài liệu và token, sau đó rà soát các trang liên quan.
- Nếu mã nguồn đã có cấu trúc CSS tương đương tại thời điểm triển khai, tái sử dụng cấu trúc đó thay vì tạo một hệ thống song song.
- Không dùng lớp Tailwind, Bootstrap hoặc cú pháp component của framework trong mã đầu ra.

## 11. Phân vai công cụ và quy trình

- **Awesome DESIGN.md:** tài liệu tham khảo về cấu trúc và cách diễn đạt quy tắc; không phải plugin bắt buộc hay quy chuẩn thương hiệu mặc định.
- **UI/UX Pro Max:** tìm gợi ý ban đầu và tra cứu UX có mục tiêu; chỉ áp dụng kết quả phù hợp ngữ cảnh học thuật.
- **Impeccable:** critique/audit/polish sau khi trang hoạt động; giữ các quyết định đã chốt, chỉ sửa trong phạm vi được yêu cầu và giữ hook tự động tắt.
- **DESIGN.md:** ghi nhận các quyết định thiết kế sau khi người dùng chốt và cách áp dụng nhất quán giữa các trang.
- Lựa chọn quy trình đã xác nhận trước đó (landing và trang giới thiệu tạo ảnh thiết kế trước rồi viết code; màn hình quản lý dựng trực tiếp bằng code): tệp `.impeccable/config.json` hiện chưa có trong kho mã nguồn (thư mục `.impeccable/` hiện chỉ có `config.local.json`), nhưng quy ước quy trình này vẫn được giữ nguyên và không tự thay đổi qua tài liệu thiết kế.
- Tạo file Markdown không tự áp dụng CSS và không tự bảo đảm mọi phiên làm việc đều đọc nó. Cần nhắc đọc tài liệu trong prompt, hoặc tuân theo quy tắc đã có trong `AGENTS.md`.

### 11.1. Tách hai giai đoạn triển khai — đã chốt ngày 28/10/2026

- **Giai đoạn 1 — tập trung CSS:** dựng màu, font, kích thước, khoảng cách, bố cục responsive và các trạng thái thị giác theo quy chuẩn đã duyệt/bộ kích thước dùng thử. Chưa bổ sung JavaScript mới. Chỉ điều chỉnh HTML cần thiết để gắn CSS hoặc phục vụ trình bày, bảo toàn nội dung/nghiệp vụ ngoài phạm vi.
- Giữ nguyên các script cục bộ sẵn có (`assets/js/deadline-calendar.js`, `assets/js/supervisor-dialog.js`) và tận dụng hành vi HTML/CSS sẵn có, ví dụ `details`/`summary`, `popover`, `dialog` và chuyển mục bằng `:target` hiện có. Hành vi mới cần JavaScript được làm ở giai đoạn 2, không phải điều kiện hoàn thành phần CSS.
- Danh sách, form và trạng thái nghiệp vụ có thể dùng dữ liệu mẫu. Chưa làm mới tìm kiếm/lọc/sắp xếp/phân trang dữ liệu, đăng nhập, nộp bài hoặc duyệt đề tài trong giai đoạn 1. Việc mở bộ lọc khác với áp dụng điều kiện lọc vào dữ liệu.
- **Giai đoạn 2:** bổ sung tương tác cần JavaScript, sau đó chức năng và xử lý dữ liệu theo phạm vi nghiệp vụ, từ dữ liệu mẫu đến kết nối backend khi có. Đăng nhập, phân quyền, lưu bài nộp và duyệt dùng chung giữa nhiều người cần xử lý phía backend; chưa tự chọn hoặc thêm backend ở bước chốt quy trình.
- Chỉ hiển thị kết quả thành công khi thao tác thực sự được xử lý. Giữ rõ ranh giới dữ liệu mẫu, chức năng chưa triển khai và chức năng đã hoạt động.
- `PRODUCT.md` ghi phạm vi chi tiết của hai giai đoạn. Việc chốt quy trình không thay đổi các quyết định màu/font/bố cục, không xác nhận thay người dùng lựa chọn hai trang thử và không bắt đầu sửa mã nguồn trong lượt ghi nhận này.

## 12. Nguồn và phân loại trạng thái quyết định

- Cấu trúc nội dung tham khảo: [Awesome DESIGN.md](https://github.com/VoltAgent/awesome-design-md). Bản này là tài liệu riêng của dự án, không sao chép nguyên nhận diện của thương hiệu mẫu.
- Đã tra cứu UI/UX Pro Max với `academic project management dashboard` và thử lại `education learning management`. Các kết quả nghiêng về marketing hoặc giáo dục trẻ em, chưa được xác minh là phù hợp. Không dùng chúng làm quyết định đã chốt hoặc lưu thành MASTER.md.
- Bản khởi đầu được đề xuất dựa trên nguyên tắc UX chung và kiến trúc token của skill design-system; không trình bày là preset phù hợp do công cụ tìm kiếm xác nhận.
- Các tài nguyên tham khảo trong `output/` (`output/design-references/color-b-header-underline-black-headings.png`, `output/font-comparison/so-sanh-font-tieng-viet.png`, `output/font-comparison/fonts/`, `output/design-references/mobile-proposals-approved-2026-10-28.png`, `output/design-references/trial-sizing-approved-2026-10-28.png`) hiện chưa có trong kho mã nguồn. Không tự tạo ảnh hoặc tệp font thay thế khi chưa có yêu cầu; áp dụng các quy định đã ghi thành văn bản trong tài liệu này.
- **Tổng hợp phân loại trạng thái hiện tại:**
  - **Đã chốt (bắt buộc tuân thủ):** phương án màu B (“Trắng – xanh cân bằng”), mục đang chọn trên header dùng gạch xanh bên dưới trên nền trắng, tiêu đề/nhãn nhóm in đậm trong nội dung dùng `#000000` (mục 3); họ font chính `Be Vietnam Pro` dùng chung cho tiếng Việt và tiếng Anh (mục 4); khối bộ lọc trên máy tính đặt phía trên hàng tìm kiếm/sắp xếp (mục 6); bố cục danh sách đề xuất trên điện thoại, thẻ đề tài và nhãn trạng thái góc trên bên phải khung ảnh trên điện thoại (mục 6.1, mục 7); quy trình hai giai đoạn CSS trước, JavaScript sau (mục 11.1).
  - **Được phép dùng để dựng thử (mục 4.1, tinh chỉnh sau khi xem bản chạy):** cỡ chữ nội dung chính `16px` (`1rem`), thông tin phụ `14px` (`0.875rem`), tiêu đề trang quản lý `28px`/`24px` (`1.75rem`/`1.5rem`) trên máy tính/điện thoại, chiều cao tối thiểu `44px` cho nút/input một dòng/select, bo góc `8px` (nút/input/select) và `12px` (card/modal), khung ảnh đề tài dùng chung tỷ lệ `16:9`. Không suy rộng thành phê duyệt bố cục cột lọc trái trong ảnh tham khảo cũ hoặc triển khai toàn dự án ngay.
  - **Đang đề xuất / Quyết định mở (chỉ áp dụng khi người dùng yêu cầu):** độ đậm (`font-weight`), khoảng cách dòng (`line-height`), cỡ tiêu đề phần (`1.125–1.25rem`), cỡ caption (`0.75rem`), cách tải/nhúng font, thang spacing, padding trang, bo góc badge/chip (`4px`), shadow, z-index, kích thước/khoảng cách chi tiết của badge (`8–12px`, cao `24–28px`), số cột trong khối bộ lọc trên máy tính, các mốc breakpoint và bố cục tablet/iPad, bố cục các trang ngoài danh sách trên điện thoại, nội dung menu thu gọn trên điện thoại, trường ngày dùng để sắp xếp mới nhất/cũ nhất và lựa chọn hai trang thử cụ thể.
- Sau khi duyệt thêm, cập nhật trạng thái ở đầu tài liệu và ghi lại những thay đổi chung thay vì tạo một bản quy chuẩn riêng cho từng trang.

### Đồng bộ ba trang cũ với CSS chung — 28/10/2026

- Tổng quan sinh viên, Tổng quan giảng viên và Lịch hạn nộp sinh viên nạp theo thứ tự `tokens.css` → `base.css` → `components.css` → CSS riêng của trang.
- Dùng font Be Vietnam Pro 400/500/600/700 cục bộ trong `assets/fonts/be-vietnam-pro/` theo `base.css` vừa pull, không tiếp tục tải Google Fonts cho ba trang này.
- Màu/font/control và khung nội dung dùng bộ mới trong `tokens.css`: khung tối đa 80rem, lề 2rem (1rem dưới 48rem). Đây là kích thước dựng thử, không thay đổi quyết định màu/font đã chốt. CSS riêng giữ bố cục nội dung hiện có; không định nghĩa lại bộ màu và header/footer.
- Các token phụ còn cần cho CSS cũ được tập trung trong `tokens.css`: chữ caption 12px, spacing 20/40px, bo nhãn 4px, cặp viền trạng thái và transition. Chúng là lựa chọn dựng thử; số liệu thống kê và kích thước lịch vẫn nằm trong CSS riêng.
- `components.css` hỗ trợ cả markup mới (`.site-navigation`, `nav-indicator.js`) và markup cũ (`.site-header__menu` đứng cạnh nav, `main-nav.js`), không sửa script. Menu cũ thu gọn dưới 68rem theo breakpoint header mới; luôn có gạch xanh dưới mục đang chọn, nền không tô xanh. Giữ nguyên ID, liên kết và dữ liệu.
- Các mô tả hiện trạng ở phần trước về việc chưa có CSS chung/font cục bộ là ghi nhận trước khi pull; mục này ghi hiện trạng sau đồng bộ trong phạm vi ba trang trên. Hook tự động tiếp tục tắt.
