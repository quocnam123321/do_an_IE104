# Báo cáo bàn giao tiến độ

- **Mã nhiệm vụ:** `NV-TIEN-DO-SV`
- **Nội dung nhiệm vụ:** Dựng khung HTML ngữ nghĩa cho tab Tiến độ của trang Chi tiết đề tài phía sinh viên (theo wireframe và Plan.md).
- **Ngày thực hiện:** 17/10/2026
- **Người thực hiện:** Antigravity
- **Kho lưu trữ:** `quocnam123321/do_an_IE104`
- **Nhánh làm việc riêng:** `feature/html-tien-do-de-tai-sinh-vien`

---

## 1. Danh sách file đã tạo / chỉnh sửa

| Tên file | Trạng thái | Mục đích |
|---|---|---|
| `tien-do-de-tai-sinh-vien.html` | Tạo mới | Khung HTML có ngữ nghĩa hoàn chỉnh cho tab Tiến độ phía sinh viên theo wireframe. |
| `index.html` | Chỉnh sửa | Bổ sung 1 liên kết vào khu vực Sinh viên: *Chi tiết đề tài — Tiến độ (mẫu nhóm)*. |
| `Plan.md` | Chỉnh sửa | Cập nhật checklist nghiệm thu [x] sau khi kiểm tra thực tế và cập nhật quy định commit. |
| `HANDOFF_TIEN_DO.md` | Tạo mới | Báo cáo bàn giao nhiệm vụ theo đúng quy trình 5 bước. |

*(Lưu ý: Tệp baseline untracked `Chi_tiet_de_tai.html` và thư mục `docs/` được giữ nguyên trạng, không can thiệp hay xóa).*

---

## 2. Chi tiết cấu trúc đã dựng

1. **Header & Điều hướng:**
   - Thương hiệu: `QUẢN LÝ ĐỒ ÁN & KHÓA LUẬN` dẫn về `tong-quan-sinh-vien.html`.
   - Menu chính: *Tổng quan* (link), *Đăng ký đề tài* (link), *Đề tài của tôi* (`span`, `aria-current="location"`, `data-pending-href`), *Lịch hạn nộp* (link), *Chung* (`details`/`summary` gồm *Liên hệ* và *Thông báo* đang chờ).
   - Menu tài khoản sinh viên: Toggle disclosure, avatar `SV`, *Hồ sơ cá nhân* (đang chờ), nút *Đăng xuất* (disabled + dialog modal).
2. **Breadcrumb & Thông tin đề tài:**
   - Breadcrumb 4 cấp với cấp cuối `Tiến độ` mang `aria-current="page"`.
   - Liên kết quay lại: `← Quay lại Đề tài của tôi (đang cập nhật)`.
   - Tiêu đề duy nhất `<h1>Chi tiết đề tài</h1>`, thanh thông tin `Tên đồ án / khóa luận`, ghi chú demo `progress-demo-notice`.
3. **Bốn tab chi tiết:**
   - Cụm điều hướng `<nav>` gồm: *Tổng quan* (chờ), *Tiến độ* (đang chọn), *Bài nộp* (chờ), *Kết quả đánh giá* (chờ).
4. **Khu vực Tiến độ tổng thể:**
   - `<progress max="100" value="40">40%</progress>` có nhãn truy cập `Thanh tiến độ tổng thể`.
   - Chữ hiển thị: `40% — dữ liệu minh họa`.
   - Danh sách `<dl>`: Tổng công việc: **5**, Đã hoàn thành: **2**, Còn lại: **3**.
5. **Khu vực Danh sách công việc:**
   - Bảng 4 cột: *Công việc*, *Người phụ trách*, *Hạn hoàn thành dự kiến*, *Thao tác*.
   - 5 công việc mẫu (`cv-01` đến `cv-05`), nút *Sửa* và *Xóa* riêng biệt ở trạng thái `disabled`, có `aria-label` chi tiết.
   - Nút `+ Thêm công việc` `disabled`, tham chiếu `progress-demo-notice`.
6. **Khu vực Lịch sử cập nhật:**
   - Bảng 5 cột: *Ngày cập nhật*, *Công việc*, *Nội dung đã làm*, *Trạng thái*, *Mức hoàn thành (%)*.
   - 3 bản ghi mẫu (sắp xếp mới nhất đến cũ nhất, ăn khớp với 2/5 công việc hoàn thành).
   - Nút `+ Cập nhật tiến độ` `disabled`.
7. **Template & Footer:**
   - 2 thẻ `<template>` cho trạng thái danh sách công việc và lịch sử rỗng.
   - Chân trang chung đúng mẫu nhóm, copyright © 2026.

---

## 3. Các bước kiểm tra đã thực hiện và kết quả

| STT | Bước kiểm tra | Phương pháp thực hiện | Kết quả thực tế |
|---|---|---|---|
| 1 | Tính đóng mở và cân bằng thẻ HTML | Parser tự động (`HTMLParser`) duyệt toàn bộ cây DOM | **ĐẠT:** 100% thẻ đóng/mở cân bằng, không có thẻ lỗi. |
| 2 | Tính duy nhất của ID & ARIA | Quét toàn bộ ID và các thuộc tính `aria-labelledby`, `aria-describedby`, `aria-controls`, `for` | **ĐẠT:** 0 ID trùng lặp; 100% tham chiếu ARIA/for trỏ đúng ID có tồn tại. |
| 3 | Kiểm tra số lượng thẻ `<h1>` | Parser đếm số lượng thẻ `<h1>` trong trang | **ĐẠT:** Duy nhất 1 thẻ `<h1>Chi tiết đề tài</h1>`. |
| 4 | Kiểm tra đường dẫn & liên kết | Phân tích toàn bộ `href` trong trang | **ĐẠT:** 0 link `href="#"`, 0 link `javascript:`, skip-link trỏ đúng `#main-content`, các file HTML đều có thực trên ổ đĩa. |
| 5 | Kiểm tra giới hạn CSS / JS / Thư viện | Quét mã tìm `<style>`, `<script>`, thuộc tính `style`, sự kiện `on*` | **ĐẠT:** 0 CSS, 0 JS, 0 thư viện ngoài; 100% HTML thuần. |
| 6 | Render trình duyệt thực tế & tiếng Việt | Khởi chạy Google Chrome headless, kết xuất DOM và chụp màn hình trang | **ĐẠT:** Tiếng Việt UTF-8 hiển thị đầy đủ có dấu; các control native (`<details>`, `<progress>`, `<table>`) hoạt động chuẩn. |
| 7 | Kiểm tra liên kết từ trang chủ | Kiểm tra sự tồn tại và liên kết của file trong `index.html` | **ĐẠT:** Mục mới mở chính xác file `tien-do-de-tai-sinh-vien.html`. |
| 8 | Kiểm tra phạm vi Git | Chạy `git status` và `git diff` | **ĐẠT:** Chỉ sửa đúng `index.html` và thêm các file thuộc nhiệm vụ. Không đụng chạm file baseline của người khác. |

---

## 4. Những phần chưa làm được hoặc làm khác kế hoạch, kèm lý do

1. **Chưa làm các dialog modal CRUD:**
   - *Lý do:* Theo đúng phạm vi của Plan.md (mục 3 & 5.6/5.7), nhiệm vụ lần này chỉ dựng khung HTML ngữ nghĩa và đặt sẵn các nút gọi ở trạng thái `disabled`. Các dialog thêm/sửa/xóa công việc và cập nhật tiến độ sẽ được xây dựng ở bước tiếp theo cùng với JavaScript.
2. **Chưa có CSS định dạng màu xám, lưới và bố cục giống ảnh:**
   - *Lý do:* Kế hoạch và quy định môn học (IE104 Project Guide) yêu cầu tách biệt các giai đoạn; lần này chỉ viết HTML ngữ nghĩa thuần. Trình duyệt hiển thị bố cục dọc mặc định.
3. **Chưa có JavaScript và lưu dữ liệu:**
   - *Lý do:* Nằm ngoài phạm vi của nhiệm vụ HTML; chưa tích hợp `localStorage` hay backend.
4. **Các trang liên kết phụ chưa tồn tại:**
   - *Lý do:* Các trang `de-tai-cua-toi-sinh-vien.html`, các tab chi tiết khác, `ho-so-ca-nhan.html`, `lien-he.html`, `thong-bao.html` chưa có file trong repo. Đã dùng thẻ `<span>` kèm nhãn `(đang cập nhật)` và `data-pending-href` để tránh sinh ra link hỏng 404 hoặc link `#` giả.
5. **Điều chỉnh quy trình commit:**
   - *Lý do:* Thực hiện theo yêu cầu mới từ người dùng: Thay thế yêu cầu “chưa commit” ban đầu bằng việc “tạo commit trên nhánh làm việc riêng trên máy (`feature/html-tien-do-de-tai-sinh-vien`), chưa push lên GitHub hay merge vào main”.

---

## 5. Thông tin nhánh làm việc và commit trên máy

- **Nhánh làm việc riêng:** `feature/html-tien-do-de-tai-sinh-vien`
- **Mã commit (short SHA):** `2a79326`
- **Mã commit đầy đủ:** `2a79326fa4fc987c843e0ef476fc1e14ba0f011c`
- **Thông điệp commit:** `feat(NV-TIEN-DO-SV): dựng khung HTML tab Tiến độ trang Chi tiết đề tài sinh viên`
- **Trạng thái:** Đã commit an toàn trên máy cục bộ; chưa push lên remote và chưa merge vào `main`.
