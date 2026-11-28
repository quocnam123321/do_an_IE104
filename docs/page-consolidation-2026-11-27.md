# Rà soát và gộp trang — 27/11/2026

Bản GPT: gop-trang-main-a1904a6-2026-11-27. Nền main a1904a64defe8fb73c5519b25d219fdf088b618f. Không sửa thư mục GitHub, chưa commit/push/deploy.

## Đã thực hiện

- Gộp 6 bố cục danh sách thông báo thành một thong-bao.html.
- Loại bỏ đúng 5 file trùng bố cục: thong-bao-ke-hoach-hoc-vu.html, thong-bao-bao-cao-nop-bai.html, thong-bao-lich-bao-ve.html, thong-bao-tong-ket-vinh-danh.html, thong-bao-trang-2.html.
- Giữ dữ liệu các thông báo và toàn bộ nội dung bài viết; giữ CSS, thứ tự dữ liệu, 12 thông báo/trang, điều khiển lọc trên desktop/mobile.
- Chuyển bộ lọc sang ?loai=ke-hoach-hoc-vu (tương tự các loại khác), phân trang sang ?trang=2. Kết hợp được loại + số trang. Tải lại và Back/Forward đọc trạng thái từ URL.
- Cập nhật liên kết lọc, phân trang và các đường quay lại từ chi tiết. Giữ fragment #thong-bao-ID để trỏ tới thông báo như trước.
- Thêm 5 redirect 301 vào firebase.json để địa chỉ danh sách cũ không bị mất khi triển khai Firebase. Khi chạy máy chủ tĩnh đơn giản, chỉ các URL mới hoạt động; redirect cũ cần Firebase Hosting/emulator.
- Tách xử lý URL thành bộ hàm nhỏ dùng chung trong notifications-data.js, kiểm tra riêng được mà không cần giả lập giao diện.

## Đã phát hiện và giữ riêng

- thong-bao-uit.html: nguồn dữ liệu UIT và giao diện danh sách/đọc bài khác; không phải bản sao danh sách của khoa.
- chi-tiet-thong-bao.html: đã là một template nhận ?id=..., không cần gộp vào danh sách.
- chi-tiet-de-tai-mo-dang-ky.html và chi-tiet-de-tai-gv-mo-dang-ky.html: hai nguồn đề tài mẫu và đề tài GV công bố; cần kiểm tra hợp đồng dữ liệu trước khi thống nhất, chưa gộp trong đợt này.
- Các trang chi tiết đề xuất SV: có trang chuyển tiếp, trang biên nhận và trang xử lý yêu cầu đã lưu; giữ nguyên để không làm mất luồng chỉnh sửa/rút/gửi lại.
- Các nhóm thông báo đã nêu là nhóm xác nhận được trùng bố cục. Không coi các file có tên gần giống hoặc không nằm trên menu là dư thừa.

## Kiểm tra

- 3 kiểm tra tự động đạt: URL loại/trang hợp lệ và dữ liệu sai; toàn bộ đường quay lại của các bài viết; đủ redirect cho 5 file đã bỏ và giữ các trang khác.
- JavaScript liên quan qua kiểm tra cú pháp. Rà liên kết HTML không còn trỏ đến 5 file đã bỏ.
- Chưa kiểm tra trực quan thao tác lọc, cuộn tới fragment, bàn phím và responsive trên trình duyệt. Cần thực hiện trước khi bàn giao để push.
- Khi đóng gói cần liệt kê rõ cả 5 file cần xóa và ghép firebase.json theo main mới nhất; không dùng script copy cũ để xóa file hoặc ghi đè cấu hình mới của nhóm.
