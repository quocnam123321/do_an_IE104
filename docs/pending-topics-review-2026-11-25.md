# Bổ sung hồ sơ chờ duyệt — 25/11/2026

Bản nền: `main`, commit `a7b43e9c13da501495d0f7e7223e4883e567f801`. Chỉnh trong bản GPT riêng, không chép vào hoặc sửa checkout GitHub.

## Nội dung

- Thay toàn bộ danh sách mẫu cũ bằng 10 hồ sơ mới: 3 KLTN, 3 ĐATN, 4 ĐAMH. Tổng 10 hồ sơ ban đầu nếu trình duyệt chưa lưu quyết định; số đang chờ giảm khi duyệt hoặc từ chối.
- ĐAMH thuộc IE104, IE101, IE103 và IE105. Danh sách giữ 5 hồ sơ mỗi trang.
- Đối chiếu toàn bộ hồ sơ chờ với danh mục hướng dẫn: không trùng tên; mã hồ sơ mới không trùng mã đề tài đang hướng dẫn.
- Nhãn vai trò thay nhãn trạng thái vàng. Nhãn Hướng dẫn chính theo đúng màu, kích thước và khoảng cách của trang quản lý đề tài hiện tại. Theo chốt mới nhất: toàn bộ hồ sơ chờ duyệt đều Hướng dẫn chính, bao gồm 2 hồ sơ mẫu cũ; bỏ lựa chọn Đồng hướng dẫn khỏi bộ lọc. Bỏ dòng vai trò trùng ở metadata bên trái.
- Không chỉnh CSS, HTML hoặc dữ liệu hiện có của danh sách quản lý đề tài; mảng records/created/supervised được kiểm tra giữ nguyên.
- Bỏ ghi chú demo ở danh sách và phần giải thích demo trong trang chi tiết đề xuất. Bộ xử lý lưu trên trình duyệt hiện có được giữ nguyên.

## Nguồn và giới hạn dữ liệu

Xem `pending-topic-sources-2026-11-25.json` để đối chiếu từng hồ sơ.

- KLTN: giữ tên đề tài, tác giả đại diện và liên kết tóm tắt từ bảng KLTN của khoa. Mô tả/mục tiêu/kết quả trong 3 hồ sơ mới là diễn giải từ tên đề tài, chưa xác thực nội dung trong các tệp tóm tắt.
- Theo xác nhận trực tiếp của người dùng: ĐAMH/ĐATN được biên soạn theo đề cương, không coi là các đồ án đã thực hiện thật. IE104 dựa nội dung xây dựng website; IE101 dựa thiết kế và vận hành hạ tầng; IE103 dựa tổ chức và tích hợp thông tin; IE105 dựa kiểm soát truy cập, bảo vệ mạng và an ninh mạng không dây.
- ĐATN là các bài toán tích hợp kỹ năng từ các đề cương này, không khẳng định đã kiểm chứng đề cương IE501 riêng.
- Mã đề tài, MSSV, trạng thái chờ, ngày gửi, học kỳ và năm học dùng để minh họa luồng. MSSV chưa xác thực để `xxxxxxxx`. Không tạo tên tệp đính kèm giả; hồ sơ không có tệp hiển thị trạng thái trống.

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
