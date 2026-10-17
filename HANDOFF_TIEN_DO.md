# Báo cáo bàn giao tiến độ

- **Kho lưu trữ:** `quocnam123321/do_an_IE104`
- **Nhánh làm việc riêng:** `feature/html-tien-do-de-tai-sinh-vien`
- **Người thực hiện:** Antigravity
- **Ngày cập nhật:** 17/10/2026

---

# PHẦN 1: BÀN GIAO NHIỆM VỤ NV-TIEN-DO-SV (LỊCH SỬ)

- **Mã nhiệm vụ:** `NV-TIEN-DO-SV`
- **Nội dung nhiệm vụ:** Dựng khung HTML ngữ nghĩa cho tab Tiến độ của trang Chi tiết đề tài phía sinh viên (theo wireframe và Plan.md mục 1–10).
- **Mã commit lưu trữ:** `769081a` (đã hiệu chỉnh từ mã tham chiếu cũ `2a79326`).
- **File đã tạo/sửa:**
  - `tien-do-de-tai-sinh-vien.html` (tạo mới)
  - `index.html` (thêm liên kết xem trước)
  - `Plan.md` (nghiệm thu mục 8)
  - `HANDOFF_TIEN_DO.md` (tạo mới)

---

# PHẦN 2: BÀN GIAO NHIỆM VỤ NV-HOP-TIEN-DO-SV (HIỆN TẠI)

- **Mã nhiệm vụ:** `NV-HOP-TIEN-DO-SV`
- **Nội dung nhiệm vụ:** Bổ sung giao diện minh họa bốn loại hộp (Thêm công việc, Sửa công việc, Xác nhận xóa công việc, Cập nhật tiến độ) vào trang `tien-do-de-tai-sinh-vien.html` sử dụng cơ chế Popover HTML khai báo thuần (`popover="auto"`), nối đúng 12 nút mở/đóng theo ngữ cảnh 5 công việc mẫu, không dùng CSS hay JavaScript.

## 1. Danh sách file đã tạo / chỉnh sửa trong nhiệm vụ mới

| Tên file | Trạng thái | Mục đích |
|---|---|---|
| `tien-do-de-tai-sinh-vien.html` | Chỉnh sửa | Bổ sung 12 vùng `div[popover="auto"]` cho 4 loại hộp; gỡ disabled và nối `popovertarget` trên 12 nút mở; cập nhật `progress-demo-notice`. |
| `Plan.md` | Chỉnh sửa | Cập nhật checklist nghiệm thu mục 16 sang `[x]` sau khi kiểm tra thực tế. |
| `HANDOFF_TIEN_DO.md` | Chỉnh sửa | Cập nhật báo cáo bàn giao chi tiết cho nhiệm vụ `NV-HOP-TIEN-DO-SV`, điều chỉnh mã commit cũ về `769081a`. |
| `docs/wireframes/sinh-vien-chi-tiet-de-tai-tien-do.png` | Theo dõi | Ảnh wireframe trang chính tham chiếu trong Plan.md. |
| `docs/wireframes/tien-do-them-cong-viec.png` | Theo dõi | Ảnh wireframe hộp Thêm công việc. |
| `docs/wireframes/tien-do-sua-cong-viec.png` | Theo dõi | Ảnh wireframe hộp Sửa công việc. |
| `docs/wireframes/tien-do-xac-nhan-xoa-cong-viec.png` | Theo dõi | Ảnh wireframe hộp Xác nhận xóa công việc. |
| `docs/wireframes/tien-do-cap-nhat-tien-do.png` | Theo dõi | Ảnh wireframe hộp Cập nhật tiến độ. |

*(Lưu ý: Giữ nguyên trạng `Chi_tiet_de_tai.html`, không stage `.agents/`, `skills-lock.json` hay các file không liên quan).*

---

## 2. Chi tiết 12 vùng Popover đã dựng

1. **Hộp Thêm công việc (`task-add-popover`):**
   - Tiêu đề: *Thêm công việc*, nút `×` (`aria-label="Đóng hộp Thêm công việc"`).
   - Trường: *Tên công việc* (text input, placeholder, `autofocus`), *Người phụ trách* (select chọn thành viên nhóm 1–3), *Hạn hoàn thành dự kiến* (input date để trống value).
   - Nút: *Hủy* (đóng hộp), *+ Thêm công việc* (`type="submit" disabled`).
2. **Năm hộp Sửa công việc (`task-edit-cv-01` đến `task-edit-cv-05`):**
   - Mỗi dòng công việc trong bảng có hộp riêng nối với nút Sửa của dòng đó.
   - Trường *Tên công việc* có sẵn giá trị text thực tế khớp chính xác với dòng gọi hộp (`Khảo sát yêu cầu`, `Phân tích chức năng`, `Thiết kế giao diện`, `Xây dựng chức năng`, `Kiểm thử và hoàn thiện báo cáo`).
   - Trường *Người phụ trách* chọn sẵn thành viên mẫu, *Hạn hoàn thành dự kiến* để trống chờ nhập.
   - Nút: *Hủy* (đóng hộp), *Lưu thay đổi* (`type="submit" disabled`).
3. **Năm hộp Xác nhận xóa (`task-delete-cv-01` đến `task-delete-cv-05`):**
   - Tiêu đề: *Xác nhận xóa công việc*, nút `×`.
   - Câu hỏi: *Bạn có chắc muốn xóa công việc này?*
   - Khối thông tin cố định hiển thị đúng tên công việc của dòng gọi hộp (thẻ `<p><strong>`, không phải ô nhập sửa được).
   - Nút: *Hủy* (đóng hộp, `autofocus`), *Xóa công việc* (`type="submit" disabled`).
4. **Hộp Cập nhật tiến độ (`progress-update-popover`):**
   - Tiêu đề: *Cập nhật tiến độ*, nút `×`.
   - Trường: *Công việc* (select chọn 1 trong 5 công việc mẫu), *Nội dung đã làm* (textarea 4 dòng), *Trạng thái* (select: *Chưa thực hiện*, *Đang thực hiện*, *Đã hoàn thành*), *Mức hoàn thành (%)* (input number 0–100 kèm nhãn gợi ý và ký hiệu `%` độc lập).
   - Nút: *Hủy* (đóng hộp), *+ Cập nhật tiến độ* (`type="submit" disabled`).

---

## 3. Các bước kiểm tra đã thực hiện và kết quả

| STT | Bước kiểm tra | Phương pháp thực hiện | Kết quả thực tế |
|---|---|---|---|
| 1 | Tính đóng mở và cân bằng thẻ HTML | Parser tự động (`HTMLParser`) quét 100% tài liệu | **ĐẠT:** Toàn bộ thẻ đóng mở khớp hoàn hảo, không có thẻ lỗi. |
| 2 | Kiểm tra tính duy nhất của ID | Quét toàn bộ 76 ID trong trang | **ĐẠT:** 0 ID trùng lặp. Tiền tố phân biệt rõ ràng giữa các hộp. |
| 3 | Kiểm tra tham chiếu ARIA & Popover | Đối chiếu 100% `aria-labelledby`, `aria-describedby`, `for`, `popovertarget` | **ĐẠT:** 0 tham chiếu mồ côi; toàn bộ 36 nút popovertarget đều trỏ đúng ID hộp tồn tại. |
| 4 | Kiểm tra cơ chế Popover trên trình duyệt | Kết xuất DOM và kiểm tra hành vi native qua Google Chrome headless | **ĐẠT:** Các hộp thoại mặc định ở trạng thái ẩn; mở được khi kích hoạt nút tương ứng. |
| 5 | Kiểm tra độc lập từng dòng Sửa / Xóa | Kiểm tra ma trận nút bấm 5 dòng của bảng Danh sách công việc | **ĐẠT:** Cả 5 nút Sửa và 5 nút Xóa đều trỏ chính xác vào hộp riêng của từng công việc. |
| 6 | Kiểm tra nút đóng, phím Escape & bấm ngoài | Kiểm tra cơ chế `popover="auto"` | **ĐẠT:** Nút `×` và `Hủy` có `popovertargetaction="hide"`, đóng hộp an toàn không tải lại trang; hỗ trợ light-dismiss (Escape / bấm ngoài). |
| 7 | Kiểm tra an toàn biểu mẫu | Thử nghiệm các nút trong form | **ĐẠT:** Nút xác nhận nghiệp vụ đều `disabled`; các nút đóng có `type="button"` nên không kích hoạt submit hay reload. |
| 8 | Kiểm tra phạm vi công nghệ | Quét toàn bộ mã nguồn | **ĐẠT:** 100% HTML thuần, không thẻ `<style>`, không thuộc tính `style`, không thẻ `<script>`, không event `onclick`. |

---

## 4. Những phần chưa làm được hoặc làm khác kế hoạch, kèm lý do

1. **Khác biệt so với modal hoàn chỉnh:**
   - *Lý do:* Sử dụng Popover API khai báo HTML thuần theo đúng yêu cầu mục 12 Plan.md để người dùng xem thử giao diện mà không cần JavaScript. Popover này hoạt động như một khung nổi trên top layer, không tạo overlay che mờ toàn màn hình hay bẫy tiêu điểm (focus trap) như modal dialog JavaScript đầy đủ.
2. **Chưa có CSS định dạng layout nhiều cột / màu sắc:**
   - *Lý do:* Yêu cầu môn học và kế hoạch tách biệt giai đoạn HTML; các trường form đang xếp dọc tự nhiên theo mặc định của trình duyệt.
3. **Chưa xử lý lưu trữ, tính toán tiến độ hay xóa dữ liệu:**
   - *Lý do:* Các nút xác nhận nghiệp vụ vẫn ở trạng thái `disabled` để bảo toàn dữ liệu mẫu; chưa tích hợp JavaScript xử lý logic tính lại % hay gọi API backend.
4. **Nhập thử trong hộp chưa thay đổi dữ liệu bảng chính & Hủy chưa reset form:**
   - *Lý do:* Đây là hành vi cần JavaScript can thiệp ở bước lập trình tương tác tiếp theo. Khi tải lại trang, dữ liệu sẽ quay về trạng thái mặc định của HTML.

---

## 5. Thông tin nhánh làm việc và commit trên máy

- **Nhánh làm việc riêng:** `feature/html-tien-do-de-tai-sinh-vien`
- **Mã commit nhiệm vụ trước (`NV-TIEN-DO-SV`):** `769081a`
- **Mã commit nhiệm vụ hiện tại (`NV-HOP-TIEN-DO-SV`):** Được cấp sau khi thực hiện commit (xem mục tiếp theo trong phản hồi).
- **Trạng thái:** Commit cục bộ trên máy; chưa push lên remote và chưa merge vào `main`.
