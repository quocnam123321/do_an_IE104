# Bổ sung hồ sơ chờ duyệt — 25/11/2026

Bản nền: `main`, commit `a7b43e9c13da501495d0f7e7223e4883e567f801`. Chỉnh trong bản GPT riêng, không chép vào hoặc sửa checkout GitHub.

## Nội dung

- Thay toàn bộ danh sách mẫu cũ bằng 10 hồ sơ mới: 3 KLTN, 3 ĐATN, 4 ĐAMH. Tổng 10 hồ sơ ban đầu nếu trình duyệt chưa lưu quyết định; số đang chờ giảm khi duyệt hoặc từ chối.
- ĐAMH thuộc IE104, IE101, IE103 và IE105. Danh sách giữ 5 hồ sơ mỗi trang.
- Đối chiếu toàn bộ hồ sơ chờ với danh mục hướng dẫn: không trùng tên; mã hồ sơ mới không trùng mã đề tài đang hướng dẫn.
- Nhãn vai trò thay nhãn trạng thái vàng. Nhãn Hướng dẫn chính theo đúng màu, kích thước và khoảng cách của trang quản lý đề tài hiện tại. Theo chốt mới nhất: toàn bộ hồ sơ chờ duyệt đều Hướng dẫn chính, bỏ lựa chọn Đồng hướng dẫn khỏi bộ lọc. Bỏ dòng vai trò trùng ở metadata bên trái.
- Không chỉnh CSS, HTML hoặc dữ liệu hiện có của danh sách quản lý đề tài; mảng records/created/supervised được kiểm tra giữ nguyên.
- Bỏ ghi chú demo ở danh sách và phần giải thích demo trong trang chi tiết đề xuất. Bộ xử lý lưu trên trình duyệt hiện có được giữ nguyên.

## Nguồn và giới hạn dữ liệu

Xem `pending-topic-sources-2026-11-25.json` để đối chiếu từng hồ sơ.

- KLTN: giữ tên đề tài, tác giả đại diện và liên kết tóm tắt từ bảng KLTN của khoa. Mô tả/mục tiêu/kết quả trong 3 hồ sơ mới là diễn giải từ tên đề tài, chưa xác thực nội dung trong các tệp tóm tắt.
- Theo xác nhận trực tiếp của người dùng: ĐAMH/ĐATN được biên soạn theo đề cương, không coi là các đồ án đã thực hiện thật. IE104 dựa nội dung xây dựng website; IE101 dựa thiết kế và vận hành hạ tầng; IE103 dựa tổ chức và tích hợp thông tin; IE105 dựa kiểm soát truy cập, bảo vệ mạng và an ninh mạng không dây.
- ĐATN là các bài toán tích hợp kỹ năng từ các đề cương này, không khẳng định đã kiểm chứng đề cương IE501 riêng.
- Mã đề tài, MSSV, trạng thái chờ, ngày gửi, học kỳ và năm học dùng để minh họa luồng. MSSV được sinh cố định theo các tiền tố 2252/2352/2452/2552, không phải MSSV đã xác thực của tác giả. Mỗi hồ sơ có PDF đề cương minh họa tải được, phân biệt với tài liệu gốc.

## Kiểm tra

- 13/13 kiểm tra liên quan đạt: 5 kiểm tra mới về dữ liệu, tính duy nhất, đọc chi tiết và duyệt/tải lại; 7 kiểm tra kho đề xuất; 1 kiểm tra nhãn môn học.
- Toàn bộ bộ kiểm tra: 61 bài, 52 đạt, 9 lỗi. Đã chạy lại trên bản main nguyên gốc trong đúng thư mục: 56 bài, 47 đạt, cũng 9 lỗi cùng tên. Các lỗi có sẵn thuộc nhóm tổng quan và quy ước mã cũ; chưa chỉnh ngoài phạm vi.
- Đã kiểm tra trực tiếp trên trình duyệt: lọc ĐATN còn 3 hồ sơ, lọc IE101 còn 1 hồ sơ; tìm không có kết quả; phân trang hai trang, 5 hồ sơ/trang; tìm theo tên; mở chi tiết ĐATN đúng IE501 và đúng nội dung; nút quay lại giữ bộ lọc.
- Đã xem giao diện ở 1440×1000 và 390×844, sáng/tối. Kiểm tra bàn phím chuyển từ tìm kiếm qua sắp xếp vào vùng danh sách; nhãn trên điện thoại nằm trong luồng, không che ảnh.
- Không thiếu đường dẫn tài nguyên nội bộ ở hai HTML thay đổi. JavaScript sửa qua kiểm tra cú pháp.

## File thay đổi

1. `assets/js/uit-lecturer-catalog.js`
2. `assets/js/pending-proposals.js`
3. `assets/css/teacher-pending-proposals.css`
4. `pages/giang-vien/yeu-cau-cho-duyet.html`
5. `pages/giang-vien/chi-tiet-de-xuat-giang-vien.html`
6. `assets/js/proposal-store.js`

File bổ sung để đối chiếu: tài liệu nguồn JSON, bản rà soát này và `tests/pending-catalog.test.cjs`. Chưa commit hoặc push.

Kiểm tra bổ sung bộ lọc: chọn nhiều loại; kết hợp loại và môn; tìm không dấu; giữ lựa chọn sau tải lại; đổi lọc từ trang 4 tự về trang 1. Tất cả đạt. Kiểm tra dữ liệu đảm bảo mọi hồ sơ chờ đều Hướng dẫn chính.

Chốt cuối: bỏ toàn bộ nhóm lọc Vai trò trong đề tài vì tất cả hồ sơ đều Hướng dẫn chính; nhãn trên thẻ giữ nguyên. URL lọc vai trò cũ được loại bỏ khi cập nhật URL, không ảnh hưởng kết quả.

Chốt số lượng cuối: 10 hồ sơ mới thay cho tất cả hồ sơ mẫu cũ đang chờ. Kiểm tra tên và mã với toàn bộ catalog quản lý, gồm cả đã tạo và đang hướng dẫn. Quyết định đã xử lý của mẫu cũ vẫn đọc được; không trộn hồ sơ cũ chưa xử lý vào danh sách chờ.

Gói chỉnh số lượng ghép lại trên main fec7a477ff4cc4c1e246e65679646e6d9ea165ef sau khi người dùng push bản trước. Nhãn bộ lọc chờ duyệt đổi đầy đủ thành Khóa luận tốt nghiệp.

Đã kiểm tra trực tiếp bộ lọc môn học chỉ còn bốn môn của danh sách mới: IE101, IE104, IE105, IE103; lọc Quản lý thông tin ra đúng 1 hồ sơ.


## Đồng bộ đề cương SV–GV và tài liệu — cập nhật cuối 25/11/2026

- Cả 10 hồ sơ có MSSV 8 chữ số duy nhất, khớp tên và danh sách thành viên trong chi tiết. Đây là số minh họa theo yêu cầu, không khẳng định MSSV thực tế của tác giả.
- Bổ sung mô tả, mục tiêu, kết quả dự kiến, phương pháp/phạm vi, kế hoạch/phân công; mỗi đoạn dài khoảng 2–3 dòng hoặc hơn tùy chiều rộng màn hình. Nội dung mở rộng do biên soạn, không trích nguyên văn đề cương tác giả.
- Ba ngày bắt đầu, báo cáo tiến độ, báo cáo cuối cùng là ngày giả định theo học kỳ và đúng thứ tự thời gian.
- Hai hồ sơ dùng chung trên Đề tài của tôi SV: DX-ISEKTLN-101 (Nguyễn Hữu Hưng, 22520155) và DX-ISEDATN-101 (Trần Hoàng Nam, 25529187). Trạng thái ban đầu Chờ duyệt; đọc cùng kho quyết định với GV.
- Thêm assets/documents/de-cuong-de-xuat-mau.pdf, một trang A4 dùng font Be Vietnam Pro. Tên tải xuống De_cuong_de_xuat_mau.pdf. SHA256: E7924D2F92E2FA61069AB54CD1B7D10F023DCBC3E48A4021D3BA098097372918.
- Mở PDF mẫu từ cả SV và GV đã thành công trên trình duyệt; đối chiếu hai bản tải về có cùng SHA256 với tệp nguồn. Đã kiểm tra PDF bằng trích xuất chữ và ảnh render.
- Sửa thứ tự nạp catalog trước proposal-store trong các trang liên quan; tránh SV đọc danh mục seed cũ. Mã đề tài tạo mới tính cả 10 mã hồ sơ này để tránh trùng.
- 15/15 kiểm tra liên quan đạt, gồm hai kiểm tra mới: hai hồ sơ mẫu SV–GV và phản hồi quyết định; tạo đề xuất với đề cương phiên bản 3, lưu và đọc lại các trường/tham chiếu tệp ở GV. Các kiểm tra này không thay thế thao tác chọn tệp và tải từ IndexedDB trên trình duyệt.
- Bộ kiểm tra chung vẫn có 9 lỗi có sẵn ở nhóm tổng quan/quy ước mã cũ, không mở rộng sửa trong nhiệm vụ này.
- Kiểm tra cú pháp JavaScript sửa, thứ tự nạp script và tài nguyên nội bộ của bốn trang liên quan đều đạt.
- Lượt thử UI gửi đề xuất mới kèm PDF trên origin riêng 8783 đã bắt đầu nhưng chưa gửi xong: quyền điều khiển trình duyệt không còn khả dụng sau gián đoạn. Vì vậy chưa xác nhận end-to-end thao tác chọn tệp mới → gửi → GV tải đúng byte trên UI. Đường lưu tệp có sẵn dùng proposalFiles.stage (IndexedDB), lưu fileKey/name/size vào hồ sơ; phía GV nhận các trường này và dùng proposalFiles.read để tải. Phần này đã đọc mã và kiểm tra trao đổi metadata, chưa chứng minh thao tác UI cuối.
- Phạm vi đồng bộ là cùng trình duyệt và cùng origin (host + port). Chưa có backend để chia sẻ tệp sang máy hoặc trình duyệt khác.
- Chỉ chỉnh bản GPT, chưa chép/commit/push checkout GitHub. Gói copy cần đối chiếu lại main mới nhất khi người dùng yêu cầu.


## Sửa luồng sau khi duyệt đề xuất — 25/11/2026

- Dữ liệu đề xuất phiên bản 3 được ánh xạ sang startsAt/progressReportDate/finalReportDate và hai nội dung phương pháp/kế hoạch khi chuyển sang đề tài đang thực hiện. Cả SV và GV dùng chung bộ định dạng mốc ngày, ưu tiên ngày đã nhập; không gán ngày duyệt làm ngày bắt đầu. Đề cương phiên bản cũ giữ ngày kết thúc làm hạn cuối khi không có hạn cuối mới.
- Các trường ngày, thành viên, GVHD, phương pháp và kế hoạch được đặt vào khung tương ứng trong Tổng quan. Khung Đề cương chi tiết không in lặp toàn bộ hồ sơ; thông tin bổ sung chưa có chỗ riêng (tên tiếng Anh, người hướng dẫn phụ trong đề cương) vẫn được giữ nếu có, ẩn khung nếu trống.
- Hai hồ sơ mẫu chung chuyển liên kết SV sang trang đang thực hiện sau duyệt. Giữ đề cương và nhóm trong bản đã duyệt; tài khoản demo được xem hai hồ sơ đã chỉ định nhưng không có quyền sửa nhóm, cập nhật tiến độ hoặc nộp bài thay sinh viên khác.
- Tham chiếu tài liệu được giữ trong dữ liệu dự án đã duyệt; không biến tài liệu đề xuất thành bài nộp.
- 28/28 kiểm tra liên quan duyệt đề xuất, đăng ký và lời mời đạt. Tổng bộ kiểm tra trước bổ sung kiểm tra quyền xem bài nộp: 69 kiểm tra, 60 đạt và 9 lỗi cũ ở tổng quan/quy ước mã. Không chỉnh ngoài phạm vi để làm xanh các kiểm tra cũ.
- Trình duyệt vẫn không được kết nối trong chat này. Chưa xác nhận lại bố cục desktop/mobile và thao tác UI sau sửa; kiểm tra bằng dữ liệu và hàm hiển thị không thay thế kiểm tra trực quan.
- Bản GitHub main đã lên 609e3941d3234d790f5b50326d703922a1bb9a47 và sạch; chỉ đọc để đối chiếu. Không sửa checkout GitHub.

Kiểm tra cuối sau bổ sung quyền đọc hồ sơ mẫu: 37/37 đạt, gồm kiểm tra đồng bộ bài nộp/tải tệp/đánh giá đã có. Kiểm tra cú pháp các script sửa đạt. Không có bằng chứng kiểm thử UI mới.


## Chốt bổ sung tên đề tài/bộ lọc/thẻ chờ duyệt

- Không hiển thị tên đề tài tiếng Anh dưới tiêu đề chi tiết hoặc trong khung thông tin bổ sung; không xóa dữ liệu gốc để bảo toàn đề cương cũ.
- Hai bộ lọc quản lý đề tài GV (Đã tạo/Đang hướng dẫn) dùng nhãn Khóa luận tốt nghiệp, giữ nguyên giá trị lọc.
- Thẻ Chờ duyệt ở Đề tài của tôi SV dùng tên giảng viên nhận hồ sơ, biểu tượng cá nhân và nhãn trợ năng tương ứng; không dùng tên/MSSV sinh viên. Các trạng thái khác giữ cách hiển thị cũ.
- 18/18 kiểm tra liên quan đề xuất/dữ liệu/môn học và cú pháp script đạt; thay đổi UI chưa được kiểm tra trực quan do thiếu kết nối trình duyệt.
- Các thay đổi bổ sung này chưa có trong gói 24 file goi-sua-sau-duyet-main-609e394-2026-11-25 đã gửi trước đó; khi đóng gói tiếp cần đối chiếu main hiện tại.
