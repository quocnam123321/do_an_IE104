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

### Chế độ tối

- Giao diện sáng là mặc định. Nút “Chế độ tối” đặt ở thanh đầu trang hoặc thanh công cụ của trang xác thực. Nút thể hiện trạng thái bằng `aria-pressed` và có thể dùng bằng bàn phím. Lựa chọn được lưu trong trình duyệt theo cùng nguồn với khóa `ie104-theme`.
- Chế độ tối dùng nền xanh đen `#0C1422`, bề mặt `#152234`, tiêu đề `#F8FAFC`, chữ chính `#E4EDF8` và chữ phụ `#AFC0D4`. Liên kết và focus dùng xanh sáng `#93C5FD`. Chữ trên nút nền xanh sáng dùng `#0C1B31`.
- Dùng bộ token trong `assets/css/tokens.css` cho biểu mẫu, bảng, hộp thoại và các cặp nền/chữ trạng thái. Header giữ gạch xanh dưới mục đang chọn, còn logo giữ nền sáng để nhận diện. Các ảnh nội dung giữ màu gốc.

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

### Chuyển ngôn ngữ giao diện

- Tiếng Việt là mặc định. Nút EN / VI nằm cạnh nút chế độ sáng/tối, có tên thao tác cho trình đọc màn hình. Khi chuyển, cập nhật thuộc tính `lang` trên trang và ghi nhớ lựa chọn trong trình duyệt.
- Trang Đăng nhập và Quên mật khẩu áp dụng chế độ màu và ngôn ngữ đã lưu. Cả hai trang ẩn thanh chứa nút chuyển.
- Dùng bản dịch chung cho header, footer, điều hướng và tên thao tác. Giữ nguyên tên riêng, mã hồ sơ, giá trị biểu mẫu và nội dung do người dùng nhập.
- Kiểm tra chữ dài ở cả hai ngôn ngữ trên màn hình hẹp. Tên thao tác và liên kết có thể xuống dòng khi thiếu chỗ.

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

- Các media query theo chiều rộng dùng `rem` để đáp ứng cỡ chữ mặc định của trình duyệt. Khi chuyển từ `px`, giữ nguyên ngưỡng của từng bố cục với cỡ chữ mặc định 16px.
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
- Bộ chọn mốc thực hiện và hạn nộp vô hiệu hóa ngày, giờ đã qua theo giờ Việt Nam. Trường chỉ có ngày vẫn cho chọn hôm nay. Khi chỉnh sửa, có thể giữ nguyên mốc đã lưu, còn mốc thay đổi phải hợp lệ tại thời điểm lưu.

### Trạng thái bộ lọc

- Bộ lọc trên các trang danh sách của sinh viên và giảng viên mặc định mở. Mũi tên xanh ở mép phải hướng lên khi mở và hướng xuống khi thu gọn, trên cả máy tính và điện thoại. Có thể bấm hoặc dùng bàn phím trên cả hàng tiêu đề cao tối thiểu 44px.
- Các danh sách của sinh viên và giảng viên dùng cùng biểu tượng phễu cạnh tiêu đề “Bộ lọc”. Khi có ít nhất một ô tiêu chí được tích, hiện dấu tick ở góc trên bên phải phễu. Vòng tròn dùng màu chính, dấu tick dùng màu chữ trên nền chính và viền mảnh lấy màu nền trang.
- Dấu tick vẫn hiển thị khi thu gọn. Bỏ tích tiêu chí cuối cùng hoặc xóa bộ lọc sẽ ẩn dấu tick. Tiêu đề giữ nguyên khi đổi cách sắp xếp. Trình đọc màn hình có nhãn “Đã chọn tiêu chí lọc” khi dấu tick xuất hiện.
- Bộ lọc Trạng thái ở Đề tài đã tạo tập trung vào tình trạng nhận đăng ký, với hai lựa chọn “Đang mở đăng ký” và “Đã đóng đăng ký”. Giảng viên theo dõi các nhóm trong tab Đề tài hướng dẫn.
- Thanh Lịch hạn nộp hiển thị trực tiếp bộ chọn đề tài và tháng. Hai nhãn “Đề tài” và “Tháng” vẫn được đọc bởi trình đọc màn hình. Các ô và nút cùng hàng cao tối thiểu 44px, xếp lại theo chiều rộng khả dụng.
- Danh sách lọc đề tài trên Lịch hạn nộp chỉ liệt kê đề tài có ít nhất một hạn bài nộp ở bất kỳ tháng nào. Lựa chọn “Tất cả đề tài” vẫn hiển thị hạn đề tài của các nhóm chỉ có mốc chung.
- Bộ chọn ngày của công việc, bộ chọn tháng của Lịch hạn nộp và các danh sách lọc dùng màu, viền, trạng thái chọn và vòng focus chung. Giữ ô chọn gốc làm phương án dự phòng khi trình duyệt thiếu hỗ trợ cần thiết.
- Menu lọc thả xuống giữ viền trung tính khi dùng chuột. Mục đang rê chuột đổi màu nền và chữ. Khi dùng bàn phím, vòng focus cho biết ô hoặc mục đang thao tác.

### Bảng và phân trang

- Dùng HTML table có caption hoặc tên phần rõ ràng, header có scope phù hợp; không dùng bảng để bố trí trang.
- Cột chữ căn trái, số liệu định lượng căn phải; ngày tháng và trạng thái có định dạng nhất quán.
- Padding ô đề xuất 12–16px; tên đề tài wrap. Hành động của mỗi dòng phải có tên dễ hiểu và phân biệt được đối tượng.
- Có vùng dữ liệu trống và vùng lỗi riêng. Chỉ thêm loading khi tồn tại quá trình tải dữ liệu.
- Phân trang nêu trang hiện tại và có accessible name cho nút biểu tượng. Không tạo các nút trông hoạt động khi chưa có xử lý.
- Hai tab Quản lý đề tài, Yêu cầu chờ duyệt, Đăng ký đề tài và Đề tài của tôi dùng cụm phân trang theo mẫu Quản lý đề tài. Các nút có vùng bấm tối thiểu 44px, bo góc 8px, nền trắng và viền xám ở chế độ sáng. Trang hiện tại dùng nền xanh và chữ trắng. Cụm nút nằm dưới danh sách, sát mép phải và căn phải cả khi xuống dòng.

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

- Trên các trang chung, khi có phiên đăng nhập, header hiển thị menu tài khoản thay cho nút Đăng nhập. Menu có lối về Tổng quan, Hồ sơ cá nhân và Đăng xuất theo vai trò.
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
- Header dùng chung `<details class="site-navigation" open>`, `components.css` và `nav-indicator.js`. Dưới 68rem, script thu gọn menu khi mở trang, còn HTML vẫn cho người dùng mở và đóng menu khi tắt JavaScript. Mục hiện tại dùng gạch xanh dưới nhãn.


## Đồng bộ Tiến độ, Bài nộp và ảnh SV/GV — 19/11/2026

- Tiêu đề các cột trong tab Tiến độ và Bài nộp chỉ hiển thị biểu tượng và tên trạng thái ở cả hai vai trò.
- Tiến độ: bấm thẻ công việc để mở chi tiết, nút Sửa công việc ở cuối theo quyền; Xóa/Xong bật dấu trừ để xác nhận và xóa liên tiếp. Ba cột màu và icon giống nhau, tên người phụ trách và hạn hoàn thành xuống dòng; bảng được bao bằng block trắng. Ẩn lịch sử chung ngoài bảng và giữ dữ liệu đã lưu.
- Hộp cập nhật tự điền trạng thái và % hiện tại của công việc được chọn, nội dung báo cáo mới trống khi mở. Chi tiết có lịch sử riêng theo task: tên/mã, giờ Việt Nam, % từng lần, mới nhất trước; details/summary mở nội dung. Chưa có lịch sử hiện trạng thái trống, không sinh người/thời gian giả.
- Bài nộp: phía trên Chưa nộp/Đã nộp, phía dưới Chờ phản hồi/Đã phản hồi. Giữ nhãn thời hạn riêng: Quá hạn · Chưa nộp, Đã nộp trễ, Đúng hạn. Các nút có khoảng cách, Tạo yêu cầu và Thêm công việc dùng primary. Tiêu đề thẻ GV trải hàng đầu, chừa chỗ nhãn thời hạn.
- DA005 là đề tài đang thực hiện để thử; giữ DA001/DA002 Hoàn thành. Giữ quyền, revision và quy tắc nộp muộn khi chưa khóa. Bài nộp SV chưa có xử lý tải lên thực tế.
- Khung ảnh danh sách/chi tiết SV/GV dùng topic-media-shared.css: vuông 168px desktop, 128px dưới 64rem, contain/padding/nền chung; không đổi avatar và logo header. Giữ token, font và các sửa riêng của nhóm ngoài phạm vi. Ảnh tóm tắt trong chi tiết đề tài đã tạo và đang hướng dẫn của giảng viên dùng cùng khung ngang 16:9, theo kích thước của trang đang hướng dẫn ở `d53e746`.

## GV phục hồi theo 1ddf0d3 — 20/11/2026

Theo xác nhận của người dùng, phần GV dùng giao diện 1ddf0d3 và các thao tác của bản đó, không mang chức năng/bố cục ngày 19/11 vào. Gộp cột Đã phản hồi ở Yêu cầu bài nộp vào Đã nộp; giữ hai cột Bài nộp nhóm. Metadata: 10 đã tạo, 8 hướng dẫn, 6 chờ duyệt không giao với hướng dẫn. ISE-005 dùng vai trò Đồng hướng dẫn. Phân công task và popover theo đúng authors từng đề tài; các bước công việc là mẫu trung tính. Thông tin chưa biết dùng placeholder xxxxxxxx hoặc nội dung trong ngoặc vuông. GV phần Đề tài đã tạo dùng Nguyễn Văn A, giangvien@example.com, hướng nghiên cứu chung Khoa học dữ liệu và Hệ thống thông tin. Bỏ ghi chú nguồn/demo trên giao diện theo yêu cầu; nguồn và giới hạn ghi riêng trong docs/RESTORE-GV-2026-11-20.md. Giữ các file dùng chung của SV; hai script cần lấy từ commit cũ được tách thành uit-topic-list.js và uit-teacher-approved-proposals.js chỉ nạp bởi GV.

Ngày 21/11/2026, danh sách Đề tài đã tạo hiện tên tác giả, khóa hoặc đợt bảo vệ và giảng viên hướng dẫn theo 10 hồ sơ UIT trong Git. Các thẻ này dùng nhãn Hồ sơ UIT. Trang chi tiết dùng lại bản `75bca90`, gồm khung ảnh 16:9 và luồng đề tài lưu trên trình duyệt.

Hai tab Quản lý đề tài và trang Yêu cầu chờ duyệt của giảng viên dùng chung menu Sắp xếp với ba lựa chọn Mới nhất, Cũ nhất và Tên A–Z. Menu mở đè lên nội dung, mục đã chọn có nền xanh nhạt và chữ xanh. Tab Đề tài hướng dẫn ưu tiên ngày bắt đầu thực hiện, dùng ngày duyệt hoặc ngày ghi nhận nếu có và xếp hồ sơ thiếu ngày ở cuối khi sắp xếp theo thời gian.

Trong hai tab Quản lý đề tài, danh sách nằm ngay dưới tiêu đề với khoảng cách 16px trên máy tính và 12px trên điện thoại. Dòng đếm kết quả được đọc bởi trình đọc màn hình. Trạng thái trống và cảnh báo dữ liệu hiển thị dưới tiêu đề.

Tổng quan, Quản lý đề tài và Yêu cầu chờ duyệt dùng cùng khoảng cách ở đầu trang giảng viên. Đường dẫn cách thanh điều hướng 24px trên máy tính và 16px trên điện thoại. Hàng tiêu đề cách đường dẫn 12px, cách khối tiếp theo 24px trên máy tính và 16px trên điện thoại.

### Tổng quan chi tiết đề tài sinh viên — 21/11/2026

- Mỗi thẻ trong Đề tài của tôi có một dòng về người thực hiện. Đề tài nhóm dùng Nhóm X - Tên nhóm, đề tài cá nhân dùng họ tên và MSSV. Thẻ và trang chi tiết dùng chung cách xác định tên với danh sách Đề tài đang hướng dẫn.
- Sinh viên thực hiện một mình mặc định là Nhóm trưởng. Mục Sinh viên thực hiện trên trang chi tiết hiển thị nhãn Nhóm trưởng sau họ tên và MSSV. Nhãn dùng cùng kiểu ở hai vai trò và xuống dòng khi thiếu chỗ.
- Hai danh sách Đề tài của tôi và Đề tài mở đăng ký dùng mẫu thẻ Quản lý đề tài của giảng viên cho khung ảnh 16:9, khoảng đệm, cỡ chữ và cột thao tác. Nút Xem chi tiết cao tối thiểu 44px, dùng chữ 16px và cùng biểu tượng mũi tên. Trên điện thoại, nút rộng bằng khung ảnh và nhãn trạng thái nằm ở góc trên bên phải ảnh khi đủ chỗ. Mỗi trang giữ nội dung và màu trạng thái theo nghiệp vụ.
- Hai trang dùng khoảng cách quanh tiêu đề theo mẫu Quản lý đề tài. Từ đường dẫn đến khối tiêu đề là 12px, từ hàng tìm kiếm đến tiêu đề danh sách là 8px. Thẻ đầu cách tiêu đề danh sách 16px trên máy tính và 12px trên điện thoại.
- Khối tiêu đề trang Đề tài mở đăng ký và Đề tài của tôi gồm tên trang và thao tác Tạo đề xuất khi có. Khoảng cách từ khối tiêu đề đến bộ lọc hoặc hàng tab là 16px trên máy tính và 12px trên điện thoại.

- Tab Tổng quan của Đề tài của tôi dùng chung khung ảnh tóm tắt 16:9, bố cục thẻ, danh sách mục tiêu và kết quả, cách hiển thị thành viên và mốc thời gian với trang Đề tài hướng dẫn. Khối Yêu cầu thực hiện xuất hiện khi đề tài đăng ký có dữ liệu tương ứng. Khối Giảng viên hướng dẫn đặt sau Mốc thời gian chính. Các thao tác nhóm và lời mời hiển thị theo quyền hiện có của sinh viên.
- Lời mời đồng hướng dẫn gửi từ đề tài xuất hiện trong mục Lời mời hướng dẫn của giảng viên và sinh viên. Hai bên trao đổi khi lời mời đang chờ và sau khi giảng viên đồng ý. Giảng viên đồng ý hoặc từ chối trong cuộc trao đổi. Chi tiết đề tài của sinh viên hiển thị trạng thái và liên kết Xem trao đổi. Bản thử dùng chung dữ liệu trong cùng trình duyệt và địa chỉ web.
- Tab Lời mời hướng dẫn của sinh viên dùng huy hiệu số giống giảng viên. Số đếm các lời mời sinh viên đã gửi đang chờ quyết định và ẩn khi bằng 0. Các cuộc trao đổi có phản hồi chưa đọc hiện số riêng trong danh sách lời mời.
- Hộp thư giảng viên tự xác định người nhận theo email tài khoản và danh mục giảng viên. Thanh chọn tự hiển thị tên người nhận của lời mời được mở qua liên kết hoặc của lời mời mới nhất khi vào hộp thư. Khi có lời mời mới, hộp thư tự chọn người nhận và mở lời mời. Phiên demo cho phép chuyển giữa các giảng viên có lời mời đã lưu trong trình duyệt.
- Thông báo giới hạn thành viên đặt ngay dưới tên nhóm với biểu tượng thông tin và cụm “tối đa X thành viên” in đậm. Dùng nền vàng nhạt, viền vàng mảnh, chữ và biểu tượng màu nâu ở mọi trạng thái sức chứa.
- Sau khi lưu thành viên mới, hộp thoại “Đã thêm thành viên” dùng dấu tích xanh và nút × ở góc trên bên phải như thông báo gửi lời mời hướng dẫn. Bấm × hoặc Esc để đưa tiêu điểm về nút Thêm thành viên nếu nút còn dùng được, hoặc về tiêu đề Nhóm thực hiện khi nhóm đã đủ người.

### Tổng quan chi tiết đề tài đang hướng dẫn — 23/11/2026

- Dùng tab Tổng quan của Đề tài của tôi làm mẫu. Khối tóm tắt dùng ảnh 16:9 và nhãn vai trò cạnh tên đề tài. Hướng dẫn chính dùng nền xanh nhạt, Đồng hướng dẫn dùng nền xám nhạt như danh sách. Phần thông tin có ba hàng ngăn bằng khoảng cách: Mã đề tài và Loại đề tài, Môn học và Trạng thái, Học kỳ và Năm học. Trạng thái hiển thị bằng văn bản. Khi ảnh nằm bên trái, khung rộng tối đa 24rem và căn giữa theo chiều dọc. Trên điện thoại, ảnh rộng theo khung nội dung và phần thông tin xếp thành một cột khi màn hình hẹp. Cột trái hiển thị các thẻ nội dung. Cột phải lần lượt là Nhóm thực hiện, Mốc thời gian chính và Giảng viên hướng dẫn. Hai cột xếp dọc trên màn hình hẹp.
- Dùng cùng giao diện cho đề tài từ danh mục, đề tài đăng ký và đề xuất đã duyệt. Chỉ hiện giới hạn thành viên, đề cương, phương pháp và kế hoạch khi có dữ liệu tương ứng. Thông tin nhóm ở Tổng quan phía giảng viên hiển thị dưới dạng chỉ đọc.
- Nhãn Hướng dẫn chính trong Quản lý đề tài dùng cùng kiểu trên thẻ và trong phần tóm tắt chi tiết. Ở chế độ sáng, nhãn có nền xanh nhạt, chữ màu xanh đậm ở độ đậm 600, căn giữa trong khung bo góc.
- Khối Giảng viên hướng dẫn phía giảng viên là danh sách chỉ đọc. Mỗi dòng có avatar, họ tên, bộ môn và vai trò nếu có dữ liệu. Đề tài thiếu người đồng hướng dẫn dùng thêm một hồ sơ mẫu có ghi Minh họa. Hồ sơ minh họa chỉ phục vụ trình bày.

### Chi tiết đề xuất đề tài của sinh viên và giảng viên — 22/11/2026

- Mục Ảnh đại diện đề tài nằm sau Tài liệu đính kèm trong biểu mẫu sinh viên. Khi chưa chọn ảnh, hiện nút Chọn ảnh và ghi chú dùng ảnh mặc định. Khi đã chọn, hiện biểu tượng ảnh, tên tệp và nút bỏ ảnh trên một hàng nền trắng. Ảnh PNG hoặc JPG tối đa 5 MB được lưu trong IndexedDB khi gửi hoặc lưu chỉnh sửa.
- Biểu mẫu tạo đề xuất hiện mã dự kiến dưới dạng văn bản sau khi chọn loại đề tài. Mã chính thức có tiền tố ISEKLTN, ISEDAMH hoặc ISEDATN và ba chữ số, được cấp khi lưu. Mã đã cấp xuất hiện trong biểu mẫu chỉnh sửa và trang chi tiết ở cả hai vai trò.
- Biểu mẫu đề xuất của sinh viên có tên tiếng Việt và bốn hàng hai cột gồm Loại đề tài và Môn học, Mã đề tài và Học kỳ, Năm học và Ngày bắt đầu thực hiện, rồi hai ngày nộp báo cáo. Trên điện thoại, các trường xếp thành một cột. Cả ba ngày bắt buộc và mỗi ngày phải sau ngày liền trước.
- Khi mở phần chọn tháng và năm, nhãn Năm nằm trên ô nhập rộng hết phần chọn tháng. Có thể nhập năm trực tiếp hoặc dùng hai nút Năm trước và Năm sau ở đầu bộ chọn.
- Biểu mẫu Tạo đề tài của giảng viên dùng một khung nền trắng liền mạch như biểu mẫu tạo đề xuất của sinh viên. Đường kẻ ngang mảnh đặt ngay trên tiêu đề của mỗi phần sau Thông tin đề tài. Hàng thao tác nằm bên dưới khung.
- Biểu mẫu Chỉnh sửa đề tài dùng cùng thứ tự trường, nhóm nội dung và bộ chọn ngày giờ với Tạo đề tài. Cả hai dùng nhãn Tên đề tài và hiển thị mã trong khung xám nhạt có viền mảnh. Khi chỉnh sửa, dữ liệu hiện có được điền sẵn và mã đã cấp ở dạng chỉ đọc. Các hồ sơ cũ chưa có ngày báo cáo có thể để trống các mốc mới.
- Ô số thành viên và ô điểm đánh giá dùng nút giảm bên trái, giá trị căn giữa và nút tăng bên phải. Hai nút dùng nền xanh nhạt, vùng bấm tối thiểu 44px và vô hiệu hóa ở giới hạn tương ứng. Người dùng có thể nhập số trực tiếp hoặc dùng phím mũi tên trong ô.
- Sau khi giảng viên lưu chỉnh sửa thành công, hộp thoại Đã lưu thay đổi hiển thị dấu tích xanh trên nền tròn xanh nhạt và nút xanh Xem chi tiết đề tài ở giữa. Nút × ở góc trên bên phải hoặc phím Esc đóng hộp thoại và đưa tiêu điểm về liên kết xem đề tài ở cuối biểu mẫu.
- Trang Chi tiết đề tài đã tạo dùng bố cục Chi tiết đề xuất của sinh viên. Khối đầu đặt ảnh bên trái và nhãn đăng ký cạnh tên đề tài. Học kỳ, năm học, mã đề tài và ba mốc thực hiện xếp theo cùng thứ tự. Hạn đăng ký nằm ở hàng cuối, bên phải Hạn hoàn thành đề tài khi có mốc này. Thẻ Tổng quan đề tài đặt ngay sau khối đầu vì giảng viên đang xem đề tài của mình. Mục tiêu, Kết quả dự kiến, Yêu cầu đối với sinh viên, Số thành viên và Tài liệu đính kèm nằm trong các thẻ riêng. Hai thẻ phương pháp và kế hoạch chỉ hiện khi có dữ liệu. Các thao tác chỉnh sửa, mở và đóng đăng ký nằm cuối trang. Với đề tài cũ, hạn hoàn thành vẫn hiển thị với nhãn riêng và ba mốc mới chỉ ghi ngày khi có dữ liệu tương ứng.
- Nút Đóng đăng ký có nền trắng, viền và chữ đỏ, với biểu tượng ổ khóa nét mảnh trước nhãn. Nút nằm ngay trước Chỉnh sửa đề tài ở cuối trang chi tiết.
- Khi đã đóng đăng ký, nút Mở lại đăng ký xuất hiện trước Chỉnh sửa đề tài. Nút có nền trắng, viền và chữ xanh dương, với biểu tượng ổ khóa mở trước nhãn.
- Hộp thoại Đóng đăng ký đề tài hiển thị câu hỏi có tên đề tài in đậm. Nút × và phím Esc đóng hộp thoại. Nút đỏ Xác nhận đóng đăng ký nằm ở cuối bên phải, với đường kẻ mảnh dưới tiêu đề và trên hàng nút.
- Hộp thoại Mở lại đăng ký đề tài hiển thị giờ đóng của đợt và nút Xác nhận mở lại đăng ký. Giảng viên chỉ mở lại đề tài trong thời gian đợt đang mở. Đề tài cũ chưa gắn đợt vẫn dùng bộ chọn hạn đăng ký để mở lại.
- Sau khi lưu thao tác đóng hoặc mở lại đăng ký, hộp thoại thành công dùng khung gọn, dấu tích xanh và tiêu đề căn giữa theo thao tác vừa lưu. Nút × ở góc trên bên phải hoặc phím Esc đóng thông báo và đưa tiêu điểm về nút đăng ký đang hiển thị.
- Thẻ tra cứu lịch trên trang Đề tài mở đăng ký của sinh viên và hai tab Quản lý đề tài của giảng viên hiển thị Đợt đăng ký, Học kỳ, Giờ mở, Giờ đóng và nhãn trạng thái theo thứ tự đó. Tên đợt nằm trong ô chọn. Học kỳ và hai mốc giờ là các ô chỉ đọc, hiển thị đủ giờ và ngày theo giờ Việt Nam. Các ô cùng hàng trên máy tính và tự xuống hàng khi màn hình hẹp.
- Trong form Tạo đề xuất của sinh viên và Tạo đề tài của giảng viên, ô Đợt đăng ký và Giờ đóng của đợt nằm cạnh nhau dưới học kỳ và năm học, rồi xếp dọc trên màn hình hẹp. Danh sách đợt lọc theo học kỳ, năm học và loại đề tài. Giờ đóng hiển thị theo giờ Việt Nam và chỉ đọc. Môn học hiển thị mã trước tên. Cả hai biểu mẫu giữ ba mốc thực hiện và nộp báo cáo.
- Cả hai biểu mẫu khóa ô Môn học với dòng “Chọn loại đề tài trước” khi chưa chọn loại. Đồ án môn học mở danh sách để chọn. Đồ án tốt nghiệp và Khóa luận tốt nghiệp tự điền môn tương ứng. Khi đổi loại đề tài, bỏ môn cũ nếu môn đó không thuộc loại vừa chọn.
- Với Khóa luận tốt nghiệp, hai ô Phương pháp và phạm vi thực hiện và Kế hoạch thực hiện và phân công có dấu sao và bắt buộc nhập khi tạo hoặc chỉnh sửa đề tài. Với các loại còn lại, hai ô là tùy chọn.
- Nút Tạo đề tài nằm ở góc dưới bên phải biểu mẫu của giảng viên. Khi có lỗi nhập liệu, thông báo hiện dưới trường cần sửa và tiêu điểm chuyển đến trường lỗi đầu tiên. Khi đang lưu, nút khóa thao tác và hiện trạng thái Đang tạo đề tài. Sau khi lưu, hộp thoại dùng cùng kiểu với xác nhận lưu đề xuất của sinh viên, có dấu tích xanh, tiêu đề “Tạo đề tài thành công” và nút Xem đề tài. Nút mở trang chi tiết đề tài vừa tạo và vẫn có ở cuối biểu mẫu khi đóng hộp thoại.
- Biểu mẫu tạo và chỉnh sửa đề tài của giảng viên dùng cùng nút chọn tệp, biểu tượng theo loại tệp và nút gỡ với biểu mẫu đề xuất của sinh viên. Tài liệu đính kèm nằm trước Ảnh đại diện đề tài. Mỗi mục nhận một tệp. Tệp được lưu khi giảng viên lưu đề tài.
- Trong cả hai biểu mẫu, ghi chú giới hạn đính kèm nằm dưới nút Chọn tệp, ẩn khi có tệp và xuất hiện lại khi gỡ tệp.
- Nút Lưu thay đổi kiểm tra và lưu trực tiếp từ biểu mẫu. Sau khi lưu thành công, hiện hộp thoại Đã lưu thay đổi với dấu tích xanh, nút đóng và nút Xem chi tiết trỏ đến đề xuất vừa lưu.
- Hộp thoại Rút đề xuất đề tài phía sinh viên dùng một câu xác nhận với tên đề tài in đậm, nút đóng ở góc phải trên và một nút đỏ Xác nhận rút ở cuối. Hai đường kẻ mảnh ngăn tiêu đề, câu xác nhận và vùng nút.
- Trên trang chi tiết đề tài mở đăng ký của sinh viên, hàng đầu đặt thông tin đề tài và ảnh đại diện thu gọn bên trái, khối Lưu ý khi đăng ký bên phải. Các khối bên dưới nối tiếp với khoảng cách đều trong từng cột. Khi màn hình hẹp, khối lưu ý nằm ngay dưới thông tin đề tài và trước khối Giảng viên hướng dẫn. Các mục lưu ý dùng cùng kiểu với Lưu ý khi đề xuất, gồm số thứ tự xanh, tiêu đề đậm, mô tả ngắn và đường kẻ mảnh giữa các mục.
- Trang sinh viên xem đề tài do giảng viên mở dùng bố cục thẻ đầu của Chi tiết đề tài đã tạo, với khung ảnh hoặc biểu tượng thư mục, nhãn trạng thái và cùng thứ tự các mốc thực hiện và hạn đăng ký. Thẻ thu gọn theo chiều rộng cột thông tin.
- Thẻ Giảng viên hướng dẫn chính của trang chi tiết đề tài mở đăng ký đặt avatar chữ viết tắt nền xanh nhạt bên trái, họ tên, bộ môn hoặc khoa và liên kết email bên phải. Thông tin lấy từ giảng viên của đề tài.
- Khối Nhóm thực hiện dùng ô Nhập tên nhóm cùng kiểu với ô họ tên trong hộp thoại thành viên. Hạn đăng ký hiển thị ở khối thông tin đầu trang đề tài do giảng viên mở.
- Thẻ Tài liệu đính kèm trên trang chi tiết đề tài đã tạo và mở đăng ký dùng hàng chung gồm biểu tượng và tên tệp bên trái, nút Tải xuống có biểu tượng bên phải. Đề tài ISEKTLN-002 có PDF minh họa để thử tải ở cả hai vai trò.
- Trang chi tiết đề xuất của giảng viên theo bố cục đã duyệt phía sinh viên. Khung ảnh đứng nằm bên trái trên máy tính và chuyển sang khung ngang phía trên thông tin trên điện thoại. Nhãn trạng thái nằm cạnh tên đề tài. Hồ sơ có lịch ba mốc dùng bốn hàng gồm Loại đề tài và Môn học, Học kỳ và Năm học, Mã đề tài và Ngày bắt đầu thực hiện, rồi hai ngày nộp báo cáo. Hồ sơ cũ hiển thị hai ngày dự kiến theo dữ liệu đã lưu. Tên tiếng Anh đã lưu nằm ngay dưới tên tiếng Việt.
- Trang chi tiết đề xuất phía sinh viên hiển thị tên tiếng Việt và lưới bốn hàng hai cột, ngăn các hàng bằng khoảng trắng. Học kỳ và Năm học có hai ô riêng. Mốc chưa có dữ liệu hiển thị “Chưa có thông tin”. Hồ sơ cũ có ngày kết thúc dự kiến giữ ngày và nhãn đã lưu ở ô cuối.
- Sau khối tóm tắt, trang sinh viên hiển thị giảng viên hướng dẫn với avatar, tên, bộ môn và email. Trang giảng viên hiển thị sinh viên gửi đề xuất với avatar, họ tên, MSSV và thời điểm gửi.
- Chi tiết đề xuất ở trạng thái Từ chối hoặc Đã rút dùng tiêu đề Giảng viên nhận đề xuất. Các hồ sơ minh họa có mã theo loại đề tài, ba mốc thực hiện, nội dung đề cương và tệp minh họa tải được.
- Chi tiết đề xuất đã rút hiển thị nhãn “Đã rút” cạnh tên đề tài. Dòng thông báo trạng thái ở đầu trang được ẩn.
- Chi tiết đề xuất bị từ chối hiển thị khung “Lý do từ chối” ngay dưới tiêu đề trang và trước thẻ thông tin đề tài. Khung dùng nền đỏ nhạt, viền mảnh và biểu tượng dấu chấm than cạnh tiêu đề. Nội dung dùng màu chữ chính và giữ cách xuống dòng của lý do đã lưu.
- Tổng quan đề tài, Mục tiêu, Kết quả dự kiến, Phương pháp và phạm vi thực hiện, Kế hoạch thực hiện và phân công hiển thị theo từng thẻ với đường kẻ mảnh dưới tiêu đề. Hai thẻ phương pháp và kế hoạch xuất hiện khi có nội dung. Thẻ Tài liệu đính kèm có đường kẻ dưới tiêu đề. Biểu tượng, tên tệp và nút Tải xuống nằm trực tiếp trên nền thẻ. Nội dung tệp được lưu trong IndexedDB khi gửi hoặc cập nhật đề xuất để hai vai trò tải trong cùng trình duyệt và cùng địa chỉ web. Hồ sơ mẫu DX001 có tệp đề cương mẫu tải được từ cả hai trang. Với hồ sơ cũ chỉ có thông tin tệp, nút bị khóa và có hướng dẫn đính kèm lại tệp gốc bên dưới. Hàng nút cuối trang theo vai trò và trạng thái hồ sơ.

### Tiến độ chi tiết đề tài sinh viên — 21/11/2026

- Tab Tiến độ dùng chung bố cục tổng thể và bảng ba cột với giảng viên. Thẻ công việc hiển thị hạn hoàn thành, ảnh đại diện người phụ trách và nhãn “Quá hạn” chỉ có chữ khi phù hợp. Hiển thị avatar của từng thành viên được phân công với hai tông nền xanh nhạt luân phiên theo thứ tự thành viên trong nhóm. Khi thiếu chỗ, avatar xuống hàng và thẻ tự tăng chiều cao. Trên màn hình hẹp, cuộn ngang bảng để xem các cột. Khối Tiến độ tổng thể hiển thị thanh tiến độ và số liệu. Thêm công việc và Xóa nằm ở bảng công việc. Các thao tác và lịch sử theo từng công việc dùng quyền và dữ liệu hiện có của sinh viên.
- Khối Tiến độ tổng thể của sinh viên và giảng viên đặt ô Quá hạn sau Còn lại. Bốn ô dùng cùng nền, viền và số đếm màu đen. Biểu tượng lịch của ô Quá hạn dùng màu đỏ. Trên màn hình hẹp, bốn ô xếp thành hai hàng. Số quá hạn đếm các công việc chưa hoàn thành có hạn trước ngày hiện tại theo giờ Việt Nam, cùng quy tắc với nhãn Quá hạn trên thẻ.
- Hộp Thêm công việc có ô mô tả và danh sách người phụ trách thả xuống với checkbox chọn nhiều thành viên. Dấu sao đỏ đánh dấu tên, người phụ trách và hạn hoàn thành. Trạng thái ban đầu chọn giữa Chưa bắt đầu và Đang thực hiện, nhận biết lựa chọn bằng nền và viền. Hộp Sửa công việc điền sẵn dữ liệu và đặt ba lựa chọn Trạng thái ngay dưới Mô tả, trước Người phụ trách và Hạn hoàn thành. Chọn Hủy, dấu × hoặc Esc đưa về chi tiết của cùng công việc với dữ liệu đã lưu.
- Khi đề tài đã hoàn thành, Bảng công việc hiển thị thông báo nền xanh nhạt “Đề tài đã hoàn thành. Bạn có thể xem công việc và tiến độ đã lưu.” Hai nút Xóa và Thêm công việc giữ vị trí và dùng trạng thái vô hiệu hóa với nền xám nhạt, chữ xám đậm và viền xám.
- Khi bật thao tác xóa, nút Xóa chuyển thành Xong với dấu tích, nền trắng, viền xám và chữ đậm. Dấu trừ đỏ xuất hiện trên các thẻ công việc để chọn công việc cần xóa. Bấm Xong đưa bảng về chế độ xem.
- Hộp Xóa công việc dùng bố cục của hộp Hủy lời mời giảng viên với tên công việc in đậm ngay trong câu hỏi. Dấu × hoặc Esc đóng hộp. Cuối hộp có một nút đỏ Xác nhận xóa.
- Hộp chi tiết công việc bên sinh viên dùng tên công việc làm tiêu đề. Trạng thái có nhãn xám, xanh dương hoặc xanh lá theo ba cột của bảng. Hạn hoàn thành, tên người phụ trách và mô tả lấy theo dữ liệu công việc. Dấu × và phím Esc dùng để đóng hộp. Cuối hộp thoại hiển thị nút Sửa công việc khi người xem có quyền sửa. Khi đề tài đã hoàn thành, nút Sửa công việc giữ vị trí ở cuối hộp thoại và dùng trạng thái vô hiệu hóa.
- Khi đổi trạng thái trong hộp Sửa công việc, Lưu thay đổi chuyển thẻ sang cột tương ứng. Chưa bắt đầu dùng 0%, Đã hoàn thành dùng 100%. Khi chuyển sang Đang thực hiện, công việc chưa có phần trăm cụ thể. Nếu trạng thái giữ nguyên, mức đã ghi tiếp tục được dùng.
- Sau khi lưu thành công trong hộp Sửa công việc, hộp Đã lưu thay đổi hiển thị dấu tích xanh, dòng “Công việc đã được cập nhật.” và dấu × ở góc trên bên phải. Bấm × hoặc Esc đưa tiêu điểm về thẻ vừa sửa.

### Tiến độ chi tiết đề tài giảng viên — 23/11/2026

- Tab Tiến độ của hai vai trò kết thúc ở Bảng công việc và chừa khoảng cách 32px trước chân trang. Nhận xét về từng công việc nằm trong phần Bình luận của hộp thoại chi tiết công việc.
- Dùng chung thẻ công việc với sinh viên, gồm tiêu đề, cảnh báo quá hạn, hạn hoàn thành và đầy đủ avatar của người phụ trách. Avatar dùng hai tông xanh nhạt và xuống hàng khi thiếu chỗ.
- Chọn thẻ bằng chuột hoặc bàn phím để mở hộp thoại có tên công việc, trạng thái, hạn hoàn thành, người phụ trách và mô tả. Hộp chi tiết công việc của cả hai vai trò chỉ hiển thị nhãn trong mục Trạng thái. Đóng hộp thoại đưa tiêu điểm về thẻ vừa mở.

### Bình luận trong chi tiết công việc — 23/11/2026

- Sinh viên và giảng viên hướng dẫn dùng chung luồng Bình luận của mỗi công việc. Khối nằm ngay dưới Mô tả, với avatar, tên, thời gian gửi và nhãn Giảng viên bên cạnh tác giả là giảng viên. Hộp chi tiết dùng khối Bình luận ở vị trí này và bỏ dòng Lịch sử cập nhật.
- Ô chính gợi ý “Viết bình luận”. Nút Gửi màu xám và bị vô hiệu hóa khi nội dung trống hoặc chỉ có khoảng trắng. Khi chưa có bình luận, vùng nội dung chỉ hiển thị khung soạn. Hiện ba bình luận mới nhất trước. Mỗi lần bấm Xem thêm bình luận, mở thêm tối đa mười bình luận cũ.
- Phản hồi mở ô nhập ngay dưới bình luận gốc, có tên người được phản hồi, nút Hủy và Gửi. Phản hồi đã gửi thụt vào một cấp, bỏ đường nối. Khi gửi thành công, đóng ô nhập và mở danh sách đến phản hồi vừa gửi.
- Mỗi bình luận có một nút chữ đen bên dưới để mở hoặc thu gọn phản hồi. Dạng thu gọn hiển thị số phản hồi và mũi tên xuống, mở tối đa năm phản hồi. Khi còn phản hồi, nút đổi thành “Xem thêm phản hồi” và mỗi lần bấm hiện thêm tối đa năm. Khi đã hiện hết, nút đổi thành “Ẩn phản hồi” với mũi tên lên. Thu gọn rồi mở lại bắt đầu từ năm phản hồi đầu.
- Trong hộp chi tiết công việc của sinh viên và giảng viên, Phản hồi có chữ và viền xanh, nền chuyển xanh nhạt khi rê chuột. Hủy có nền trắng, chữ và viền đỏ như nút Xóa, nền chuyển đỏ nhạt khi rê chuột. Hủy và Gửi có cùng chiều cao.
- Bản hiện tại lưu bình luận trong IndexedDB của cùng hồ sơ trình duyệt và địa chỉ web. Các công việc mẫu chỉ xem trong danh mục giảng viên hiển thị thông báo về luồng bình luận.

### Nhãn thời hạn bài nộp bên sinh viên — 21/11/2026

- Ba nhãn chỉ hiển thị chữ và dùng chung kiểu chữ, khoảng đệm, bo góc với nhãn bên giảng viên. “Đúng hạn” dùng nền xanh lá nhạt, “Quá hạn” dùng nền đỏ nhạt và “Nộp sau hạn” dùng nền vàng nhạt, chữ nâu và viền vàng mảnh. Cột Chờ phản hồi dùng nền vàng nhạt, cột Đã phản hồi dùng nền xanh lá nhạt như bên giảng viên. Ở Yêu cầu bài nộp → Đã nộp, nhãn vàng theo lần nộp gần nhất. Ở Bài nộp của nhóm, nhãn theo thời điểm gửi của từng bài ở cả hai cột phản hồi.
- Thẻ yêu cầu bài nộp của sinh viên dùng cùng kích thước và khoảng cách 8px như thẻ của giảng viên. Chưa nộp và Đã nộp là tiêu đề cột. Trong thẻ, tiêu đề và nhãn thời hạn cùng hàng khi đủ chỗ, với nhãn ở bên phải. Hạn nộp nằm ở hàng dưới, có biểu tượng lịch. Thẻ Quá hạn dùng chữ đỏ cho ngày giờ và nhãn.
- Khi giảng viên bấm Xóa ở bảng Yêu cầu bài nộp, nút Xong có dấu tích, nền trắng, viền xám và chữ đậm. Nút dấu trừ chỉ xuất hiện trên các thẻ trong cột Chưa nộp.
- Khi đề tài đã hoàn thành, Xóa và Tạo yêu cầu giữ vị trí trong bảng Yêu cầu bài nộp và dùng cùng kiểu vô hiệu hóa với nút Phản hồi.
- Hộp thoại Xóa yêu cầu bài nộp in đậm tên yêu cầu trong câu hỏi. Cuối hộp có nút đỏ Xác nhận xóa. Dùng dấu × hoặc phím Esc để đóng.
- Hộp thoại yêu cầu bài nộp ở cả hai vai trò dùng tên yêu cầu làm tiêu đề, giống hộp thoại chi tiết công việc. Nội dung yêu cầu hiển thị trực tiếp dưới mốc thời gian. Nút Sửa yêu cầu nằm cuối hộp thoại phía giảng viên. Nút Mở nhận bài xuất hiện cho yêu cầu đã khóa từ trước. Ngày giờ nộp của lần gửi gần nhất nằm dưới hạn nộp. Tệp nằm dưới nội dung yêu cầu. Bài mẫu có tệp liên kết dùng nút Tải xuống cùng kiểu với Bài nộp của nhóm. Nút mở biểu mẫu mẫu có tên Nộp bài hoặc Cập nhật bài nộp theo trạng thái yêu cầu.
- Biểu mẫu nộp bài lấy tên yêu cầu làm tiêu đề. Cả hàng trắng mở trình chọn tệp khi danh sách trống. Nút Chọn tệp và Thêm tệp dùng viền xanh, biểu tượng mũi tên hướng lên và cùng một trình chọn nhiều tệp. Mỗi hàng có biểu tượng thùng rác đỏ để gỡ tệp. Bản nộp gồm các tệp và ghi chú được lưu trong IndexedDB trên trình duyệt hiện tại. Sau khi lưu, hộp xác nhận hiển thị dấu tích xanh, “Nộp bài thành công” và dấu × ở góc trên bên phải.
- Thẻ Bài nộp của nhóm hiện tên tệp đầu tiên trên một dòng. Khi thiếu chỗ, tên tệp kết thúc bằng dấu ba chấm và hiện đầy đủ khi rê chuột. Với nhiều tệp, nút +N tệp mở danh sách các tệp còn lại trong khung nổi, căn mép phải theo nút, lật lên khi thiếu chỗ bên dưới và đóng khi cuộn bảng. Tiêu đề đứng yên, phần danh sách hiện tối đa hai hàng và cuộn riêng. Nút Tải xuống tải cả bộ ZIP khi có nhiều tệp, tải trực tiếp khi chỉ có một tệp.
- Thẻ Bài đã nộp phía giảng viên dùng cùng kiểu nút Tải xuống nền trắng viền xám có biểu tượng và dùng cùng nút +N tệp cạnh tên tệp đầu tiên. Thời gian nộp trên thẻ hiển thị theo dạng `DD/MM/YYYY · HH:mm`.
- Hai cột Chờ phản hồi và Đã phản hồi dùng cùng khoảng cách 8px giữa các thẻ ở cả hai vai trò. Bài gửi sau hạn dùng nhãn Nộp sau hạn với nền vàng nhạt, viền vàng và chữ nâu.
- Ở thẻ Bài đã nộp phía giảng viên, nút Phản hồi dùng nền xanh và biểu tượng bút trong khung màu trắng. Nút Xem phản hồi ở cả hai vai trò dùng nền trắng, viền xanh, chữ và biểu tượng con mắt màu xanh. Hai biểu tượng nằm trước nhãn.
- Hộp thoại Phản hồi bài nộp phía giảng viên hiển thị tên yêu cầu và dòng “Đã nộp lúc HH:mm ngày DD/MM/YYYY” ngay trên ô Nội dung phản hồi. Tên tệp nằm trên thẻ bài nộp. Hộp soạn phản hồi có nút Lưu phản hồi ở cuối và dùng dấu × hoặc phím Esc để đóng. Đường phân cách nằm trong lề nội dung.
- Trong tab Bài nộp của sinh viên, hộp thoại Xem phản hồi hiển thị tên bài, giờ nộp và nội dung phản hồi theo cùng bố cục cho mọi bài nộp. Đường kẻ mảnh ngăn hàng tiêu đề với nội dung. Phản hồi trước, ghi chú cho giảng viên hoặc tên giảng viên xuất hiện bên dưới nếu có. Hộp thoại đóng bằng dấu × ở góc trên bên phải hoặc phím Esc.
- Khi giảng viên mở Xem phản hồi, tiêu đề dùng cùng cỡ chữ, độ đậm và chiều cao dòng với hộp thoại bên sinh viên. Nội dung hiển thị trực tiếp dưới tiêu đề Nội dung phản hồi. Bấm Sửa phản hồi để mở ô nhập có viền và chuyển tiêu điểm vào nội dung đã có. Nút Lưu thay đổi lưu bản sửa.
- Khi đề tài đã hoàn thành, các nút Phản hồi và Sửa phản hồi phía giảng viên giữ vị trí và dùng cùng nền xám nhạt, chữ xám đậm và viền xám của nút vô hiệu hóa bên sinh viên. Giảng viên vẫn dùng Xem phản hồi và Tải xuống để tra cứu bài đã nộp.
- Trong chi tiết yêu cầu đã nộp ở cả hai vai trò, khối Tệp đã nộp hiển thị tên tệp và rút gọn bằng dấu ba chấm khi thiếu chỗ. Danh sách hiện tối đa bốn hàng và cuộn riêng khi có thêm. Tải xuống nằm ở từng hàng có tệp. Khi có nhiều tệp, nút Tải tất cả ở cạnh tiêu đề dùng chữ và biểu tượng tải xuống màu xanh trên nền trắng.
- Khi cập nhật bài nộp, biểu mẫu điền tệp và ghi chú sẵn có. Thêm hoặc gỡ tệp chỉ thay đổi bản nháp cho đến khi bấm Lưu thay đổi và lưu thành công. Hộp xác nhận cập nhật hiển thị dấu tích xanh, “Đã lưu thay đổi” và dấu × ở góc trên bên phải. Bấm × hoặc Esc trong cả hai thông báo đưa tiêu điểm về thẻ yêu cầu tương ứng.
- Khi đề tài đã hoàn thành, nút Nộp bài hoặc Cập nhật bài nộp hiển thị ở cuối hộp thoại yêu cầu với cùng kiểu vô hiệu hóa của các nút trong tab Tiến độ.
- Đề tài DA005 dùng chung yêu cầu, bài nộp mẫu và phản hồi giữa sinh viên và giảng viên. Tệp sinh viên nộp và phản hồi của giảng viên cho lần nộp đó dùng chung dữ liệu lưu trên cùng trình duyệt và địa chỉ web.
- Từ 24/11/2026, đề tài DA005 “Website quản lý hoạt động học tập” xuất hiện trong Đề tài của tôi với trạng thái Hoàn thành. Sinh viên dùng trang chi tiết để xem dữ liệu hiện có.
- Nút × trong các hộp thoại dùng nét bo đầu, khung biểu tượng 20px và vùng bấm 44px không viền.

### Trạng thái đề tài trên Tổng quan giảng viên

- Biểu đồ vòng và chú giải tạo thành một cụm căn giữa. Trên màn hình rộng, chú giải nằm bên phải biểu đồ. Trên điện thoại, chú giải nằm bên dưới. Tâm vòng hiển thị tổng số đề tài. Chú giải dùng ô màu vuông bo góc và số lượng ngay sau tên trạng thái.
- Hai lát Đang mở đăng ký và Đã đóng đăng ký đếm theo trạng thái trong danh sách Đề tài đã tạo. Hồ sơ đang hướng dẫn được tính theo trạng thái thực hiện của hồ sơ đó, kể cả khi dùng chung tên với một đề tài đã tạo. Số ở tâm vòng bằng tổng của bốn lát.
- Tỷ lệ từ 8% trở lên có nhãn trên vòng. Chú giải luôn hiển thị đủ bốn trạng thái khi có dữ liệu, còn mô tả của biểu đồ cung cấp tỷ lệ của cả các phần nhỏ.

### Tổng quan đề tài đang hướng dẫn

- Trên trang Tổng quan giảng viên, mục Tiến độ đề tài đang hướng dẫn hiển thị tối đa năm đề tài Đang thực hiện theo thứ tự Mới nhất của tab Đề tài hướng dẫn. Các hàng trải hết khung, dùng nền bề mặt và nền trang xen kẽ, ngăn bằng đường kẻ mảnh. Bên trái là tên đề tài, bên dưới là biểu tượng thẻ và mã đề tài, tiếp đến biểu tượng và tên người hoặc nhóm thực hiện. Tỷ lệ và thanh tiến độ nằm ở giữa. Nút Xem đề tài ở bên phải dùng nền bề mặt, viền xanh, chữ và mũi tên xanh. Trên điện thoại, thông tin và tiến độ xếp dọc, nút căn phải bên dưới.

- Thẻ đề tài hiển thị Nhóm X - Tên nhóm khi có từ hai thành viên và họ tên kèm MSSV khi thực hiện cá nhân. Trang chi tiết dùng cùng tên nhóm với thẻ. Nhóm chưa có tên hiển thị tên mẫu theo đề tài hoặc tên người đại diện.

- Đề tài giảng viên đã tạo vẫn nằm trong danh sách Đề tài đã tạo sau khi có nhóm đăng ký thành công hoặc được duyệt. Thẻ và trang chi tiết dùng nhãn Đã có nhóm đăng ký. Giảng viên chỉnh sửa hồ sơ gốc từ trang chi tiết và theo dõi nhóm trong danh sách Đề tài hướng dẫn.

- Đề tài trong danh mục và đề tài phát sinh từ đăng ký hoặc đề xuất dùng chung khung ảnh 16:9, thẻ thông tin, bố cục nội dung và cột nhóm thực hiện, mốc thời gian. Đề cương, phương pháp và kế hoạch xuất hiện khi đề tài có dữ liệu tương ứng.

### Yêu cầu chờ duyệt trên Tổng quan giảng viên

- Trang Yêu cầu chờ duyệt chỉ hiển thị hồ sơ đang chờ giảng viên xử lý. Sau khi lưu quyết định từ chối, hồ sơ rời khỏi danh sách của giảng viên. Sinh viên xem quyết định và lý do trong chi tiết hồ sơ.
- Khi lưu từ chối thành công, hộp thoại hiển thị dấu tích xanh, tiêu đề “Đã từ chối yêu cầu” và nút ×. Bấm × hoặc Esc để quay về Yêu cầu chờ duyệt với bộ lọc trước đó nếu có.

- Hiển thị tối đa bốn yêu cầu chờ duyệt mới nhất trong một khung chung. Mỗi yêu cầu trải hết một hàng, với nền xen kẽ và đường kẻ ngang mảnh như mục Tiến độ.
- Trên màn hình rộng, tên đề tài, họ tên sinh viên, MSSV và thời điểm gửi nằm bên trái. Nút Xem đề xuất viền xanh nằm bên phải. Trên điện thoại, thông tin tự xuống dòng và nút căn phải bên dưới.

### Tổng quan sinh viên

- Dùng bố cục Tổng quan giảng viên cho bốn thẻ thống kê, biểu đồ vòng và các hàng xem trước. Bốn thẻ hiển thị tổng số đề tài, đang thực hiện, hoàn thành và chờ duyệt, liên kết đến bộ lọc tương ứng của Đề tài của tôi. Biểu đồ dùng cùng nguồn và đếm từng đề tài một lần theo trạng thái.
- Lời mời hướng dẫn hiển thị tối đa hai lời mời đã gửi gần nhất, với tên giảng viên nhận lời mời và thời gian gửi, mỗi thông tin có biểu tượng riêng. Nút Xem trao đổi mở đúng lời mời ở mục Lời mời hướng dẫn. Hồ sơ mẫu của Nguyễn Minh Anh có bốn lời mời gửi tới bốn giảng viên khác nhau và dùng cùng bản ghi ở hai vai trò.
- Tiến độ hiển thị tối đa năm đề tài đang thực hiện từ Đề tài của tôi, kèm mã đề tài, người hoặc nhóm thực hiện và tỷ lệ tiến độ theo dữ liệu công việc của đề tài. Yêu cầu chờ duyệt hiển thị tối đa bốn đăng ký hoặc đề xuất mới nhất đang chờ duyệt, kèm giảng viên nhận và thời gian gửi.

### Công bố đánh giá bên giảng viên

- Bảng Đánh giá theo tiêu chí dùng cùng tỷ lệ cột ở giảng viên và sinh viên. Tiêu chí chiếm 27%, Mô tả tiêu chí hoặc Nhận xét chiếm 39%, Trọng số (%) và Điểm / 10 mỗi cột chiếm 17%. Trên màn hình hẹp, cuộn ngang trong khung bảng. Ô Nhập điểm của giảng viên dùng nền trắng và viền xám bo góc. Chữ gợi ý và số điểm nhập vào được căn giữa.
- Tab lần lượt hiển thị bốn thẻ Đánh giá theo tiêu chí, Điểm tổng kết, Nhận xét và Tệp đánh giá đính kèm. Nút Công bố đánh giá kiểm tra điểm và nhận xét đang nhập, sau đó mở hộp xác nhận có điểm tổng kết. Xác nhận lưu kết quả để sinh viên xem trong cùng trình duyệt và cùng địa chỉ web. Giao diện hiển thị thông báo sau khi lưu thành công.
- Hộp thoại xác nhận công bố hiển thị đề tài, nhóm, điểm tổng kết và tên tệp đính kèm nếu có. Khi công bố lần đầu cho đề tài đang thực hiện, hộp thoại báo đề tài sẽ chuyển sang Hoàn thành. Hộp thoại có dấu × và một nút xác nhận màu xanh. Bản xem mẫu dùng câu hỏi ngắn với tên nhóm và điểm tổng kết in đậm.
- Khi lưu công bố thành công, đề tài Đang thực hiện chuyển sang Hoàn thành. Hộp thoại có dấu tích xanh, tiêu đề “Đã công bố đánh giá” hoặc “Đã công bố lại đánh giá” và dấu × ở góc trên bên phải. Đóng bằng dấu × hoặc phím Esc đưa tiêu điểm về thao tác của phần đánh giá.
- Thẻ Điểm tổng kết phía giảng viên hiển thị điểm bằng số đen in đậm trên nền trắng như phía sinh viên. Khi chưa có điểm hợp lệ, hiển thị “Chưa tính”. Dòng Kết quả hiển thị nội dung đã công bố bên dưới điểm tương ứng, với nhãn xanh lá nhạt cho “Đạt yêu cầu”. Khi đề tài đã hoàn thành mà chưa có kết quả, nhãn “Chưa công bố” nằm cạnh nút công bố.
- Nút Công bố đánh giá nằm bên phải dưới thẻ Tệp đánh giá đính kèm, dùng nền xanh, chữ trắng và biểu tượng loa cho cả đề tài Đang thực hiện và Hoàn thành. Với đề tài Hoàn thành đã công bố, điểm và nhận xét hiển thị để đọc, nút Sửa kết quả đánh giá dùng biểu tượng bút. Trong chế độ sửa, Hủy quay về kết quả đã công bố. Công bố lại mở hộp xác nhận trước khi thay thế kết quả sinh viên đang xem.
- Tệp đánh giá đính kèm nằm trong thẻ riêng ngay sau thẻ Nhận xét. Giảng viên có thể chọn tối đa một tệp, xem tên tệp và gỡ hoặc chọn tệp khác khi sửa đánh giá. Tệp được lưu vào IndexedDB khi xác nhận công bố để cả hai vai trò tải trong cùng trình duyệt và địa chỉ web.

### Kết quả đánh giá bên sinh viên

- Dùng cùng kiểu thẻ, bảng và thang điểm với tab của giảng viên. Phía sinh viên có thêm Thông tin đánh giá và hiển thị nhận xét theo tiêu chí, điểm và thông tin công bố dưới dạng chỉ đọc. Khi chưa công bố, hiển thị tên nhóm và trạng thái.
- Khi chưa công bố, hiển thị giảng viên hướng dẫn nếu có dữ liệu, nhãn vàng “Chưa công bố” chỉ có chữ và thông báo xanh nhạt. Tiêu đề thông báo là “Đề tài đang thực hiện.” khi đề tài đang thực hiện, hoặc “Kết quả đánh giá chưa được công bố.” khi đề tài đã hoàn thành.
- Nhận xét của giảng viên là văn bản trải rộng trực tiếp trên thẻ. Hàng tệp đánh giá dùng nền nhạt không viền, biểu tượng tệp và nút Tải xuống. Khi chỉ có tên tệp, nút bị khóa và hiện giải thích. Hai bản đánh giá mẫu có PDF minh họa để thử tải.
- Thẻ Điểm tổng kết bên sinh viên chỉ hiển thị dòng Điểm tổng kết của nhóm. Điểm dùng số đen in đậm trực tiếp trên nền trắng.

## Menu tài khoản và đăng xuất — chốt ngày 25/11/2026

- Khung menu avatar tự ôm nội dung, không giữ chiều rộng cố định 16rem; đệm 8px, khoảng cách hai mục 4px. Giữ vùng bấm tối thiểu 44px và màu/font dùng chung; áp dụng cả SV, GV và menu tài khoản ở trang công khai.
- Bấm Đăng xuất thực hiện ngay, không mở hộp thoại xác nhận. Trong khi xử lý, các nút đăng xuất bị khóa và hiện “Đang đăng xuất…”. Chỉ chuyển về đăng nhập sau khi xử lý đăng xuất hoàn tất; lỗi được thông báo để thử lại, không báo thành công giả.
- Khi mở liên kết nội bộ ở tab khác cùng địa chỉ web, trang dùng phiên của vai trò tương ứng. Đăng xuất kết thúc phiên của vai trò đang dùng trên các tab.

## Footer dùng chung

- Dùng nền xanh đậm #122E59 theo mẫu UIT áp dụng cho dự án, chữ phụ #DBEAFE và đường phân chia #50688A. Logo ngang màu trắng lấy từ footer của website UIT và lưu trong dự án.
- Bố cục có bốn cột trên màn hình rộng, hai cột dưới 64rem và một cột đến 36rem. Hai liên kết điều khoản và bảo mật mở từng trang trong cùng một PDF.
- Cột Truy cập nhanh chứa liên kết Liên hệ. Cột Tài nguyên UIT liên kết đến website của khoa và Cổng thông tin UIT. Khoảng đệm dọc của phần cột là 24px.


## Chốt hiển thị tên đề tài và thẻ chờ duyệt — 25/11/2026

- Phần chi tiết chỉ hiển thị tên đề tài tiếng Việt, bỏ dòng tên tiếng Anh đi kèm và không lặp tên tiếng Anh trong khung thông tin bổ sung. Giữ dữ liệu đề cương đã lưu để không làm hỏng hồ sơ cũ.
- Trên thẻ Đề tài của tôi, dòng có biểu tượng cá nhân hiển thị tên giảng viên nhận hồ sơ ở các trạng thái Chờ duyệt, Từ chối và Đã rút. Đề tài Đang thực hiện hoặc Hoàn thành hiển thị người thực hiện.
- Bộ lọc loại đề tài ở hai danh sách quản lý GV ghi đầy đủ Khóa luận tốt nghiệp; không đổi giá trị lọc nội bộ.


## Dropdown vai trò trong hộp thoại đăng ký — 25/11/2026

- Tái sử dụng picker chọn có sẵn: cùng token, mũi tên, trạng thái chọn và focus. Danh sách vai trò mở bằng popover top layer với vị trí fixed, cùng chiều rộng ô chọn; tự lật lên nếu thiếu chỗ phía dưới, không làm thay đổi kích thước dialog.
- Duy trì chọn bằng bàn phím, Escape/Tab đóng danh sách, click ngoài đóng; đóng dialog cũng đóng danh sách. Giá trị select gốc giữ nguyên cho kiểm tra và lưu đăng ký. Khi trình duyệt không hỗ trợ Popover API, giữ select native.


## Gộp danh sách thông báo — 27/11/2026

- Một bố cục danh sách tại thong-bao.html. Bộ lọc dùng ?loai=..., phân trang dùng ?trang=..., giữ giao diện hiện có, 12 thông báo/trang, Back/Forward và link chia sẻ/tải lại.
- Bài viết vẫn dùng chi-tiet-thong-bao.html?id=...; nguồn thông báo đại học UIT giữ trang riêng vì khác dữ liệu và cách đọc nội dung. Các URL danh sách cũ chuyển hướng về trang chung khi chạy Firebase Hosting.


## Hồ sơ SV/GV và số đếm tab — 28/11/2026

- Các số cạnh tên tab quản lý đề tài và lời mời được ẩn khỏi giao diện; giữ dữ liệu và thông tin hỗ trợ trình đọc màn hình. Số lượng trong cột công việc/bài nộp không thuộc thay đổi này.
- Hộp đổi mật khẩu GV dùng cùng `profile-dialog`, `password-field`, `password-input` như SV, có nút hiện/ẩn mật khẩu và lỗi nhập liệu. Không đổi màu, font hay token.
- Sau khi lưu hồ sơ, ảnh hoặc mật khẩu thành công, mở hộp thông báo ngắn dùng header/nút X và nội dung; không lặp nút Đóng. Lỗi lưu giữ tại biểu mẫu, không mở hộp thành công.
- Nút X của hộp chỉnh sửa không có viền; hàng thao tác căn phải, xuống dòng khi thiếu chỗ. Hộp thoại giới hạn theo viewport, Escape đóng và trả focus về nút mở.
- Giữ avatar mặc định trung tính. Thông tin tài khoản minh họa phải phân biệt trong bàn giao; không gán thông tin cá nhân thật cho một tài khoản mẫu khác người.


## Căn nội dung ô chọn — 28/11/2026

- Ô chọn dùng proposal-picker-trigger hoặc proposal-month-trigger: nhãn căn đầu dòng, chiếm phần chiều rộng còn lại; mũi tên ở cuối ô và không bị co. Không để CSS căn giữa nút của từng trang gom chữ và mũi tên vào giữa.
- Nhãn đã chọn giữ một dòng và rút gọn bằng dấu … khi dài. Danh sách mở và tên hỗ trợ trình đọc màn hình vẫn giữ đầy đủ; không cắt dữ liệu lựa chọn.
- Áp dụng cùng quy tắc cho bộ lọc giảng viên, hướng nghiên cứu, lịch hạn nộp, chọn vai trò thành viên và các ô chọn trong biểu mẫu SV/GV; giữ màu, font, khoảng đệm và thao tác hiện có.


## Hộp thoại thao tác sinh viên — 28/11/2026

- Trong phạm vi SV, bỏ nút Hủy dùng để đóng hộp nếu đã có X ở góc. Giữ Hủy ở biểu mẫu không có X và các thao tác mang nghĩa riêng như hủy lời mời; không xóa điều khiển hủy phần trả lời đang soạn trong một hộp khác.
- Sau khi thao tác tạo/xóa/sửa/gửi/cập nhật hoàn tất, mở thông báo thành công dùng thiết kế hộp hiện có. Không báo thành công từ sự kiện bấm nút hoặc chỉ kiểm tra form. Lỗi giữ ở biểu mẫu, dữ liệu đang nhập không bị xóa khi lưu thất bại.
- Hộp thông báo bổ sung dùng token chung, tiêu đề/nội dung ngắn và X không khung. Escape đóng, trả focus về vị trí thao tác; giữ danh sách phản hồi sau khi gửi.
- Thao tác thành viên trong biểu mẫu đăng ký chỉ cập nhật bản nháp: thông báo ghi rõ cần đăng ký đề tài để gửi; không mô tả đã gửi dữ liệu.
- Đồng bộ Google Calendar chỉ thông báo thành công khi toàn bộ kết quả là đã thêm/cập nhật/đã có; lỗi hoặc kết quả một phần giữ trong hộp chọn lịch.
- Chưa triển khai thay đổi UI phía GV. Các hook thêm trong mã dùng chung chỉ chạy cho vai trò SV.

### Điều chỉnh phản hồi thao tác SV

- Không mở hộp thành công khi thêm thành viên (biểu mẫu đăng ký hoặc nhóm đề tài); cập nhật danh sách và giữ focus phù hợp.
- Không mở hộp thành công cho tin nhắn trong lời mời hoặc bình luận/phản hồi công việc; hiện nội dung vừa gửi ngay trong cuộc trao đổi và giữ thông báo lỗi tại chỗ.
- Đây là ngoại lệ cho quy tắc thông báo thao tác ở trên, theo yêu cầu mới nhất của người dùng.

### Biểu tượng đóng hộp SV

- Nút X hộp thoại/popover SV dùng biểu tượng SVG 24px, nét 1.75px, vùng bấm 44×44px; không dùng độ đậm của ký tự × để vẽ icon.
- Màu theo foreground của theme, không khung mặc định, giữ nhãn truy cập và focus bàn phím. Quy tắc chỉ được nạp vào trang SV, không đổi GV.
