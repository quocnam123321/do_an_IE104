# Kế hoạch dựng khung HTML — Sinh viên / Đề tài của tôi / Chi tiết đề tài / Tiến độ

Ngày lập: **17/10/2026**. Người thực hiện: **Antigravity**.

## 1. Nhiệm vụ và thư mục làm việc

Hãy thực hiện kế hoạch này trực tiếp trong repository:

```text
/Users/ngien2306/Documents/ChatGPT/Đồ án IE104/do_an_IE104
```

Repository GitHub tương ứng: `https://github.com/quocnam123321/do_an_IE104`.

Mục tiêu là dựng **khung HTML có ngữ nghĩa cho tab Tiến độ của trang Chi tiết đề tài phía sinh viên**, theo wireframe được đính kèm trong repository. Đây là màn hình sinh viên theo dõi và cập nhật công việc khi đề tài đã được duyệt và đang thực hiện.

**Lần này chỉ viết HTML; chưa làm CSS, JavaScript hoặc chức năng lưu dữ liệu.** Không dùng ảnh wireframe làm nội dung thay thế cho các phần tử HTML.

Không làm việc trong `/Users/ngien2306/IE104_FE`: đó là repository tham khảo. Không tạo mã nguồn trong `pages/` của thư mục cha. `Plan.md`, `HANDOFF.md`, `REVIEW.md` ở thư mục cha thuộc nhiệm vụ khác, không phải tệp đích của kế hoạch này.

## 2. Đọc và kiểm tra trước khi sửa

1. Đọc toàn bộ kế hoạch này.
2. Xem ảnh `docs/wireframes/sinh-vien-chi-tiet-de-tai-tien-do.png`.
3. Đọc `Huong_dan_su_dung_khung_trang.md` và `khung-sinh-vien.html` để giữ cấu trúc, class, menu tài khoản, chân trang và quy ước HTML của nhóm.
4. Đối chiếu `tong-quan-sinh-vien.html`, `lich-han-nop.html`, `index.html` và các trang chi tiết hiện có để phân biệt màn theo dõi đề tài với màn đăng ký/đề xuất.
5. Chạy `git status --short --branch`, xác nhận thư mục Git và remote trước khi sửa. Đọc hướng dẫn AGENTS.md nếu có trong phạm vi áp dụng.
6. Kiểm tra lại tệp hiện tại trước khi thực hiện, vì thành viên khác có thể đã bổ sung trang kể từ lúc lập kế hoạch.

### Hiện trạng đã kiểm tra khi lập kế hoạch

- Repository đang ở nhánh `main`, theo dõi `origin/main`.
- Các trang HTML được đặt trực tiếp ở gốc repository, không ở `pages/sinh-vien/`.
- Chưa có `de-tai-cua-toi-sinh-vien.html` và `chi-tiet-de-tai-cua-toi-sinh-vien.html`.
- `Chi_tiet_de_tai.html` tồn tại nhưng đang trống và chưa được Git theo dõi. **Giữ nguyên file này**, không tự điền, đổi tên hoặc xóa vì chưa xác định được phần việc của người tạo.
- Hướng dẫn repo cũ còn dữ liệu cá nhân cho DT002. Yêu cầu hiện tại của người dùng là màn làm việc theo nhóm; không tự chuyển đổi dữ liệu mẫu của tất cả các trang khác.
- Hai file khung đang có bốn mục điều hướng chính và menu tài khoản. Wireframe của nhiệm vụ này có thêm mục **Chung**.

## 3. Phạm vi và sản phẩm bàn giao

### Các file được tạo/sửa

1. **Tạo `tien-do-de-tai-sinh-vien.html`** ở gốc repository, chứa đầy đủ màn Tiến độ theo mục 5.
2. **Sửa tối thiểu `index.html`**: thêm một liên kết trong danh sách màn sinh viên để mở `tien-do-de-tai-sinh-vien.html`, nhãn “Chi tiết đề tài — Tiến độ (mẫu nhóm)”. Giữ nguyên các liên kết và nội dung khác.
3. **Tạo `HANDOFF_TIEN_DO.md`** để bàn giao kết quả, đường dẫn, kiểm tra thực tế và phần chưa xử lý.
4. Chỉ đánh dấu hoàn thành các ô nghiệm thu trong `Plan.md` sau khi thực sự kiểm tra.

Ảnh tham chiếu đã được đặt tại `docs/wireframes/sinh-vien-chi-tiet-de-tai-tien-do.png`; không cần sửa ảnh.

### Ngoài phạm vi

- Không dựng trang danh sách Đề tài của tôi hoặc nội dung ba tab Tổng quan, Bài nộp, Kết quả đánh giá.
- Không dựng các hộp thoại Thêm công việc, Sửa công việc, Xóa công việc, Cập nhật tiến độ trong nhiệm vụ này. Chỉ đặt đúng các nút gọi chúng để làm ở bước sau.
- Không thêm CSS dưới bất kỳ hình thức nào: không thuộc tính `style`, không thẻ `<style>`, không file CSS mới, không thuộc tính trình bày cũ như `border`, `width`, `bgcolor` trên bảng.
- Không thêm JavaScript, thuộc tính sự kiện `onclick`, framework, thư viện ngoài, package hoặc công cụ build.
- Không thêm backend, xác thực, phân quyền thực tế, localStorage hoặc dữ liệu lưu bền.
- Không sửa khung chung gốc, không định dạng lại toàn repo, không đổi tên hoặc di chuyển file của thành viên khác.
- Không commit, push, tạo Pull Request hoặc đổi remote nếu người dùng chưa yêu cầu riêng.

**HTML chưa có CSS sẽ hiển thị theo mặc định của trình duyệt. Kết quả cần đúng thứ tự, cấu trúc và nội dung của wireframe; chưa cần giống ảnh về màu xám, chiều rộng cột, font hay bố cục ngang.**

## 4. Luồng sử dụng và cách ghép trang

Luồng sản phẩm dự kiến:

```text
Đề tài của tôi
→ Xem chi tiết một đề tài đang thực hiện
→ Chi tiết đề tài
→ Chọn Tiến độ
→ Màn Tiến độ được dựng trong nhiệm vụ này
```

Ảnh chỉ thể hiện trạng thái tab **Tiến độ đang được chọn**; không suy ra rằng mọi nút Xem chi tiết phải mở thẳng Tiến độ thay vì Tổng quan.

### Quy tắc cho đường dẫn hiện tại

- File `tien-do-de-tai-sinh-vien.html` là trang riêng cho tab Tiến độ, không thay thế file chi tiết tổng thể dự kiến của nhóm.
- Không tạo `chi-tiet-de-tai-cua-toi-sinh-vien.html` chỉ chứa Tiến độ: file này đã được các trang khác dự kiến dùng cho phần nộp bài `#de-cuong` và `#bao-cao-tien-do`.
- Không sửa các liên kết nộp bài trong Tổng quan/Lịch hạn nộp sang trang Tiến độ.
- Khi một trang đích thực sự tồn tại, dùng `<a>` với đường dẫn tương đối đúng chữ hoa/thường và đúng nội dung trang đích.
- Khi trang đích chưa tồn tại, dùng `<span>` với nhãn trạng thái “đang cập nhật”; có thể giữ đường dẫn dự kiến trong `data-pending-href`. Không dùng `href="#"`, `javascript:void(0)` hoặc liên kết tới một trang không liên quan.
- Nếu trang Đề tài của tôi vẫn chưa có, chỉ mô tả điểm ghép trong bàn giao; không tự tạo danh sách giả để báo rằng luồng Xem chi tiết đã hoạt động.
- Nếu trang Đề tài của tôi đã xuất hiện khi thực hiện, đọc trang và ghi lại điểm ghép phù hợp trong bàn giao. Không tự thay đổi hành vi Xem chi tiết hoặc các trang khác ngoài phạm vi đã liệt kê.

## 5. Cấu trúc HTML phải dựng

### 5.1. Khung tài liệu

- Dùng `<!doctype html>`, `<html lang="vi">`, UTF-8 và meta viewport.
- Title: **“Tiến độ đề tài | Đề tài của tôi | Quản lý đồ án”**.
- Meta description mô tả theo dõi công việc và lịch sử cập nhật tiến độ của nhóm.
- Sao chép cấu trúc từ `khung-sinh-vien.html` vào file mới, giữ nguyên file khung.
- Giữ class chung `site-header`, `site-header__inner`, `site-brand`, `main-nav`, `account-menu`, `breadcrumb`, `page-header`, `page-content`, `site-footer` và các class con liên quan.
- Giữ skip-link tới `#main-content`, main có `id="main-content"` và `tabindex="-1"`.
- Thụt lề hai khoảng trắng, nhãn giao diện tiếng Việt có dấu.
- Chỉ một `<h1>` trong trang. Mỗi khu vực chính có heading và ID riêng.

### 5.2. Header và điều hướng

Theo cấu trúc repo và thứ tự trong wireframe:

1. Tên website: dùng thương hiệu chữ hiện có trong khung. Chưa có asset logo thì không tự tải logo hoặc dùng ảnh lỗi; không biến tên website thành h1.
2. Các mục chính: **Tổng quan → Đăng ký đề tài → Đề tài của tôi → Lịch hạn nộp → Chung**.
3. Tài khoản sinh viên bên cạnh menu, giữ `<details>/<summary>` cùng các class của repo.

Các liên kết Tổng quan, Đăng ký đề tài, Lịch hạn nộp dùng đúng các file có sẵn. Với Đề tài của tôi, chỉ dùng link nếu file đã có; khi chưa có dùng span `aria-current="location"` và `data-pending-href="de-tai-cua-toi-sinh-vien.html"`. Nếu có link thật thì đặt `aria-current="location"` trên link này. Chỉ một mục trong menu chính được đánh dấu.

Mục **Chung** nằm sau Lịch hạn nộp, dùng cấu trúc danh sách điều hướng thông thường. Có thể dùng `<details><summary>Chung</summary><ul>…</ul></details>` để đóng/mở bằng HTML tự nhiên; không gắn vai trò ARIA menu hoặc trạng thái mở cố định. Hai mục con **Liên hệ**, **Thông báo** dùng link thật nếu có trang, nếu chưa có thì dùng span “đang cập nhật”. Không tạo hai trang này trong nhiệm vụ.

Giữ menu tài khoản và dialog đăng xuất như khung. Nút Đăng xuất vẫn disabled nếu chưa có xử lý; không tạo thêm một dialog đăng xuất trùng ID. Hồ sơ chưa có trang thì thay link thiếu đích ở bản sao mới bằng span có trạng thái chờ, không sửa file khung gốc.

### 5.3. Breadcrumb, quay lại và thông tin đề tài

Trong main, theo thứ tự:

1. Breadcrumb: **Sinh viên / Đề tài của tôi / Chi tiết đề tài / Tiến độ**; cấp cuối `aria-current="page"`. Cấp chưa có trang dùng span, cấp đã có trang dùng link thật.
2. Liên kết **“← Quay lại Đề tài của tôi”**. Nếu trang chưa có, dùng span với nhãn chờ và `data-pending-href`, không tạo nút bấm giả.
3. H1 **“Chi tiết đề tài”**.
4. Dòng thông tin **“Tên đồ án / khóa luận”**, dùng placeholder này thay vì gán nhầm đề tài đang chờ duyệt. Có class riêng để sau này làm thanh xám.
5. Một ghi chú ngắn: **“Dữ liệu tiến độ minh họa của nhóm; các thao tác thêm, sửa, xóa và cập nhật chưa được xử lý.”** Có thể dùng ID `progress-demo-notice` để các nút tham chiếu.

Không đưa nền đen, nhãn frame ngoài website hoặc ảnh chụp Figma vào nội dung HTML.

### 5.4. Điều hướng bốn tab chi tiết

Dùng `<nav aria-label="Các mục chi tiết đề tài">` chứa danh sách theo thứ tự:

- **Tổng quan**.
- **Tiến độ**, đang được chọn.
- **Bài nộp**.
- **Kết quả đánh giá**.

Đây là khung điều hướng trang, không phải widget chuyển panel bằng JS. Không dùng `role="tablist"`, `role="tab"`, `aria-selected` hoặc `aria-controls` khi chưa có hành vi tương ứng.

Tiến độ dùng span `aria-current="page"`. Ba mục còn lại dùng link chỉ khi trang/fragment đích có nội dung thật; nếu chưa có dùng span kèm trạng thái chờ, không gán tất cả về `#` hoặc trỏ đến chính Tiến độ.

Giữ tên tab của sinh viên là **Kết quả đánh giá**, không đổi thành Đánh giá như phía giảng viên.

### 5.5. Tiến độ tổng thể

Tạo `<section>` có heading **“Tiến độ tổng thể”** và tên lớp riêng, ví dụ `project-progress`.

- Có nhãn rõ **“Tiến độ tổng thể”** và một `<progress max="100" value="40">40%</progress>` với nhãn truy cập bằng `aria-labelledby` hoặc label hợp lệ.
- Hiển thị thêm chữ **“40% — dữ liệu minh họa”** để người xem không phải chỉ suy ra từ thanh.
- Bên dưới có ba thông tin, nên dùng `<dl>`: **Tổng công việc: 5**, **Đã hoàn thành: 2**, **Còn lại: 3**.
- Đây là giá trị tĩnh cho bộ mẫu ở mục 5.6; không tự cập nhật, không viết phép tính JavaScript.
- Dùng mẫu 2/5 hoàn thành tương ứng 40%; không kết luận đây là quy tắc tính chính thức của môn học hoặc tiến độ thời gian. Ghi giả định minh họa này trong bàn giao.
- Không dùng `<meter>` cho tiến độ công việc; không thay progress bằng hình ảnh hay ô nhập có thể sửa.

### 5.6. Danh sách công việc

Tạo section có heading **“Danh sách công việc”** và nút **“+ Thêm công việc”**.

Bảng có đúng **4 cột** theo ảnh:

1. **Công việc**.
2. **Người phụ trách**.
3. **Hạn hoàn thành dự kiến**.
4. **Thao tác**.

Yêu cầu cấu trúc:

- Dùng `<table>`, `<caption>`, `<thead>`, `<tbody>`, `<th scope="col">`; tên công việc trong mỗi dòng có thể dùng `<th scope="row">`.
- Có đúng **5 dòng mẫu**, mỗi dòng có nút **Sửa** và **Xóa** riêng biệt.
- Người phụ trách hiển thị theo mẫu **“Họ tên thành viên · MSSV”**, không dùng người phụ trách là giảng viên.
- Hạn hiển thị **“dd/mm/yyyy”**. Vì đây là placeholder, không bọc bằng `<time datetime="dd/mm/yyyy">`; chỉ dùng time khi có ngày ISO hợp lệ.
- Có thể dùng các ID tĩnh `cv-01` đến `cv-05` trên hàng và `data-task-id` để chuẩn bị cho bước JS. ID phải duy nhất.
- Không thêm cột Trạng thái hoặc phần trăm vào bảng này vì wireframe đặt chúng trong bảng lịch sử.
- Các nút `type="button"`, **disabled** do chưa có xử lý. Nút Sửa/Xóa có tên truy cập phân biệt công việc, chẳng hạn “Sửa công việc: Khảo sát yêu cầu”.
- Nút Thêm, Sửa, Xóa tham chiếu ghi chú `progress-demo-notice` nếu cần; không dùng alert giả hoặc form GET để mô phỏng CRUD.

Bộ công việc mẫu đề nghị, chỉ phục vụ trang mới:

- `cv-01`: **Khảo sát yêu cầu** — đã hoàn thành trong bộ mẫu.
- `cv-02`: **Phân tích chức năng** — đã hoàn thành trong bộ mẫu.
- `cv-03`: **Thiết kế giao diện** — chưa hoàn thành.
- `cv-04`: **Xây dựng chức năng** — chưa hoàn thành.
- `cv-05`: **Kiểm thử và hoàn thiện báo cáo** — chưa hoàn thành.

Không cần hiển thị trạng thái này thành cột mới; dùng bộ mẫu để giữ số liệu tổng quan và lịch sử nhất quán. Người phụ trách vẫn dùng placeholder, không bịa thêm tài khoản thật.

### 5.7. Lịch sử cập nhật

Tạo section có heading **“Lịch sử cập nhật”** và nút **“+ Cập nhật tiến độ”**.

Bảng có đúng **5 cột**:

1. **Ngày cập nhật**.
2. **Công việc**.
3. **Nội dung đã làm**.
4. **Trạng thái**.
5. **Mức hoàn thành (%)**.

- Dùng caption, thead, tbody và th có scope đúng như bảng trên.
- Có **3 bản ghi mẫu** liên quan tới công việc đã có trong danh sách, xếp từ bản ghi mới đến cũ.
- Đề nghị bộ mẫu: Phân tích chức năng / Đã hoàn thành / 100%; Khảo sát yêu cầu / Đã hoàn thành / 100%; Khảo sát yêu cầu / Đang thực hiện / 50%. Bản ghi 50% là lịch sử trước bản ghi hoàn thành của cùng công việc, không được coi là trạng thái hiện tại thứ hai.
- Ngày dùng placeholder `dd/mm/yyyy`; nội dung ngắn tương ứng công việc, ví dụ “Hoàn tất danh sách chức năng”, “Hoàn tất khảo sát”, “Tổng hợp yêu cầu ban đầu”.
- Không gộp lịch sử thành một dòng hiện trạng cho mỗi công việc: một công việc có thể có nhiều lần cập nhật.
- Không thêm cột nút Sửa/Xóa vào lịch sử vì ảnh không có.
- Nút Cập nhật `type="button"`, disabled, tham chiếu ghi chú chưa xử lý. Chưa tạo form hoặc dialog cho nút này.
- Phân biệt **hạn hoàn thành công việc** ở bảng trên và **ngày cập nhật tiến độ** ở bảng này. Không đổi thành ngày nộp báo cáo.

### 5.8. Trạng thái rỗng để ghép JavaScript sau

Có thể đặt hai `<template>` không hiển thị mặc định:

- Danh sách công việc rỗng: **“Chưa có công việc. Hãy thêm công việc để theo dõi tiến độ.”**
- Lịch sử rỗng: **“Chưa có cập nhật tiến độ.”**

Không để người xem thấy cả trạng thái rỗng lẫn bảng dữ liệu mẫu cùng lúc. Không viết JS để chọn trạng thái. Trạng thái thật khi chưa có công việc sẽ được xác định ở bước xử lý dữ liệu; không tự chốt 0/0 thành một quy tắc nghiệp vụ.

### 5.9. Footer

- Dùng footer hiện có trong `khung-sinh-vien.html`, giữ class và thông tin chung của nhóm.
- Giữ các nhãn Điều khoản sử dụng, Quy chế đồ án/khóa luận, Chính sách bảo mật ở trạng thái “đang cập nhật” nếu chưa có trang.
- Giữ copyright 2026.
- Các khối xám trong wireframe chỉ chỉ dẫn bố cục tương lai; không cần tải logo, đặt ảnh hoặc dựng màu xám bằng CSS trong bước này.

## 6. Quy tắc nghiệp vụ và giới hạn của bản mẫu

- Màn hình thuộc **sinh viên, đề tài đang thực hiện, làm theo nhóm**. Không đặt biểu mẫu đăng ký đề tài hoặc nút duyệt của giảng viên tại đây.
- Sinh viên là phía dự kiến cập nhật công việc và tiến độ. Không tự giới hạn chỉ nhóm trưởng hoặc cho phép mọi thành viên sửa mọi công việc khi chưa có quy tắc quyền được chốt.
- Không tự thêm giới hạn thành viên, số công việc, dung lượng tệp, hạn đăng ký hoặc quy tắc nộp muộn.
- Bản mẫu không thể hiện đã lưu, xóa, đồng bộ hoặc gửi tiến độ cho giảng viên.
- Không gán bộ mẫu nhóm này cho DT002 trong các trang khác vì dữ liệu repo hiện mô tả DT002 là cá nhân. Giữ mẫu trang này độc lập và ghi rõ trong bàn giao; chưa làm đợt chuyển đổi dữ liệu toàn repo.
- Không tự sửa các trạng thái đăng ký, đề xuất, bài nộp hoặc đánh giá để làm cho tiến độ mẫu có vẻ đã tích hợp.

## 7. Trình tự thực hiện

1. Kiểm tra repo, file hiện có và thay đổi chưa commit; ghi lại baseline.
2. Đọc ảnh và khung sinh viên. Xác nhận file đích chưa có; nếu đã có thì đọc và sửa trong file đó, không tạo bản sao v2.
3. Dựng cấu trúc tài liệu, header/menu, breadcrumb, quay lại và thông tin đề tài.
4. Dựng điều hướng bốn tab và đánh dấu Tiến độ.
5. Dựng progress và ba số liệu tĩnh nhất quán.
6. Dựng bảng 5 công việc và bảng 3 bản ghi cập nhật, các nút chưa xử lý disabled.
7. Giữ footer chung, thêm template rỗng nếu áp dụng.
8. Thêm đúng một link xem trước ở index trong khu vực sinh viên.
9. Mở HTML bằng trình duyệt, kiểm tra nội dung và điều hướng thực tế, xem diff để tránh sửa lan.
10. Viết `HANDOFF_TIEN_DO.md`; cập nhật checklist theo kết quả thật. Dừng tại bàn giao, chưa commit/push.

Không cần npm hoặc server build cho HTML thuần. Có thể mở `index.html` hoặc file Tiến độ trực tiếp bằng trình duyệt. Nếu dùng trình xem trước sẵn có, không cài thêm thư viện chỉ để kiểm tra nhiệm vụ này.

## 8. Tiêu chí nghiệm thu

Chỉ đánh dấu `[x]` sau khi đã kiểm tra:

- [x] Đúng repository `quocnam123321/do_an_IE104`, đúng thư mục clone; giữ nguyên thay đổi của người khác.
- [x] Có file `tien-do-de-tai-sinh-vien.html` ở gốc repo và mở được từ link mới trong index.
- [x] Không sửa hoặc ghi đè `Chi_tiet_de_tai.html`, hai file khung hay các trang khác ngoài index.
- [x] Tài liệu có lang vi, UTF-8, viewport, title và meta description đúng; chỉ một h1 “Chi tiết đề tài”.
- [x] Header đúng vai trò; có các mục chính và Chung; menu tài khoản giữ cấu trúc của nhóm.
- [x] Đề tài của tôi được đánh dấu location, breadcrumb cấp Tiến độ được đánh dấu page.
- [x] Có quay lại, tên đồ án/khóa luận và bốn tab; Tiến độ là mục hiện tại.
- [x] Không có ARIA tab widget giả, href `#`, JavaScript URL, ID trùng hoặc ARIA tham chiếu tới ID không tồn tại.
- [x] Progress có nhãn truy cập; mẫu 40%, 5 tổng, 2 hoàn thành, 3 còn lại nhất quán.
- [x] Bảng công việc có đúng 4 cột, 5 dòng; mỗi dòng đủ người phụ trách, hạn dự kiến, Sửa và Xóa.
- [x] Bảng lịch sử có đúng 5 cột, 3 bản ghi; công việc khớp danh sách và lịch sử phần trăm không mâu thuẫn với hai công việc hoàn thành.
- [x] Các bảng có caption, thead/tbody, th/scope; không dùng thuộc tính trình bày HTML cũ.
- [x] Không dùng ngày placeholder làm thuộc tính datetime; phần trăm nằm trong khoảng 0–100.
- [x] Các nút Thêm/Sửa/Xóa/Cập nhật disabled và có ghi chú rõ; chưa có thông báo lưu/xóa thành công giả.
- [x] Footer đúng khung chung; các trang chưa tồn tại được nhận diện rõ, không báo rằng đã ghép luồng Xem chi tiết hoàn chỉnh.
- [x] Không thêm CSS, JS, framework, ảnh UI thay HTML hoặc package mới.
- [x] Kiểm tra bằng trình duyệt: không mất nội dung tiếng Việt, skip-link và menu HTML tự nhiên dùng được bằng bàn phím, link index mở đúng file.
- [x] Xem `git diff` và `git status` cuối cùng; chỉ có thay đổi thuộc phạm vi nhiệm vụ và các thay đổi baseline được giữ nguyên.
- [x] Có `HANDOFF_TIEN_DO.md` ghi đúng file đã làm, kiểm tra đã chạy, giới hạn, điểm ghép và phần còn chờ.
- [x] Commit trên nhánh làm việc riêng (`feature/html-tien-do-de-tai-sinh-vien`); chưa push hoặc merge vào main theo yêu cầu mới.

## 9. Nội dung bàn giao bắt buộc

Trong `HANDOFF_TIEN_DO.md`, ghi ngắn gọn nhưng đủ:

1. File mới/sửa và mục đích từng file.
2. Cách mở trang từ index và đường dẫn trực tiếp.
3. Cấu trúc đã dựng và dữ liệu minh họa tiến độ 2/5 công việc.
4. Những gì đã kiểm tra bằng trình duyệt; không đánh dấu kiểm tra chưa thực hiện.
5. Các trang đích/điểm ghép còn thiếu: Đề tài của tôi, Tổng quan chi tiết, Bài nộp, Kết quả đánh giá, các dialog CRUD/cập nhật.
6. Nêu rõ HTML chưa có CSS nên chưa giống wireframe về bố cục; các nút nghiệp vụ chưa hoạt động và chưa lưu dữ liệu.
7. Ghi nhận `Chi_tiet_de_tai.html` được giữ nguyên và không thay đổi dữ liệu cá nhân/nhóm của các màn khác.
8. Tóm tắt git status cuối cùng, không gom file tham khảo, ảnh cá nhân hoặc thay đổi không liên quan vào một commit.

## 10. Lệnh giao việc có thể gửi cho Antigravity

> Hãy đọc và thực hiện Plan.md trong thư mục do_an_IE104 hiện đang mở. Xem ảnh docs/wireframes/sinh-vien-chi-tiet-de-tai-tien-do.png và hướng dẫn khung trang trước khi code. Chỉ dựng HTML cho tab Tiến độ phía sinh viên theo phạm vi kế hoạch; không thêm CSS/JavaScript và không ghi đè Chi_tiet_de_tai.html. Kiểm tra trang trong trình duyệt, cập nhật checklist đúng thực tế và bàn giao qua HANDOFF_TIEN_DO.md. Chưa commit hoặc push lên GitHub.
