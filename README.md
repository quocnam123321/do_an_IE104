# Quản lý đồ án và khóa luận — IE104, Nhóm 7

Đồ án môn **IE104 — Internet và Công nghệ Web, UIT**. Website hỗ trợ sinh viên
và giảng viên quản lý đề tài, đăng ký/đề xuất, tiến độ, hạn nộp, bài nộp và đánh giá.
Dự án dùng **HTML5, CSS3, JavaScript thuần**; hiện là bản demo với dữ liệu minh họa.

## Chạy dự án

Mở [web/index.html](web/index.html) để xem danh mục màn hình, hoặc phục vụ
thư mục `web/` bằng **Live Server**. Bản tĩnh chạy trực tiếp bằng HTML, CSS và
JavaScript. Dùng cùng địa chỉ HTTP và trình duyệt để kiểm tra dữ liệu demo giữa các tab.

## Backend & PostgreSQL

Backend Express nằm trong `server/` và dùng Node.js 24 trở lên. Chuẩn bị một
database PostgreSQL riêng cho phát triển. Ví dụ, dùng tài khoản quản trị PostgreSQL
để chạy từng câu lệnh dưới đây trong cơ sở dữ liệu `postgres`.

```sql
CREATE ROLE ie104_dev LOGIN PASSWORD 'mat_khau_cua_ban';
CREATE DATABASE ie104_dev OWNER ie104_dev;
```

Từ gốc repo, cài thư viện và tạo tệp cấu hình local.

```powershell
cd server
npm.cmd ci
Copy-Item .env.example .env
```

Chỉnh `DATABASE_URL` trong `server/.env` theo tài khoản, mật khẩu và cổng
PostgreSQL trên máy. Mã hóa theo URL các ký tự đặc biệt trong mật khẩu. Git
bỏ qua `.env` để giữ thông tin kết nối trên máy phát triển.

Chạy migration rồi khởi động backend.

```powershell
npm.cmd run db:migrate
npm.cmd start
```

Mở cửa sổ PowerShell khác và gọi endpoint kiểm tra kết nối trên cổng `PORT` của
backend. Ví dụ bên dưới dùng cổng mặc định `3000`. Kết quả là HTTP
`200` với `{"status":"ok","database":"connected"}` nếu truy vấn PostgreSQL thành
công. Khi kết nối lỗi, endpoint trả HTTP `503`.

```powershell
Invoke-RestMethod http://localhost:3000/api/health
```

`npm.cmd run db:migrate` ghi nhận các migration đã chạy, nên có thể gọi lại
sau mỗi lần cập nhật repo. Trong database phát triển, có thể chạy
`npm.cmd run db:seed` để tạo ba hồ sơ mẫu đại diện cho sinh viên, giảng viên và
quản trị viên. Các hồ sơ mẫu chỉ phục vụ kiểm tra dữ liệu.

### Khởi động Express trong VS Code

Mở thư mục `do_an_IE104` trong VS Code. Sau khi đã cài thư viện và chạy migration,
mở **Run and Debug**, chọn **IE104: Chạy Express (cổng 5000)** và nhấn **F5**.
VS Code sẽ khởi động Express và mở trang đăng nhập trên `http://localhost:5000`.
Nếu Express đã chạy từ terminal, có thể mở trực tiếp địa chỉ đó.

## Kiểm thử tài khoản và phân quyền

Chạy `npm.cmd ci` và `npm.cmd run db:migrate` trong `server/` trước khi chạy
`npm.cmd start`. Dùng địa chỉ Express để tải giao diện và API cùng nguồn.
Trên máy phát triển hiện tại, mở `http://localhost:5000/pages/chung/dang-nhap.html`.
Trên máy khác, dùng cổng `PORT` được cấu hình trong `server/.env`.

Để cấp tài khoản quản trị viên đầu tiên, chạy các lệnh sau trong PowerShell.
Thay `quantri-ie104` bằng tên đăng nhập mới do nhóm chọn. Mật khẩu dài ít nhất
6 ký tự. Các tài khoản do `db:seed` tạo chỉ dùng để kiểm tra dữ liệu.

```powershell
$adminName = 'quantri-ie104'
$adminPassword = Read-Host 'Mật khẩu quản trị' -AsSecureString
$env:IE104_ADMIN_PASSWORD = [PSCredential]::new($adminName, $adminPassword).GetNetworkCredential().Password
try {
  npm.cmd run auth:create-admin -- $adminName
} finally {
  Remove-Item Env:IE104_ADMIN_PASSWORD
}
```

1. Từ **Đăng nhập**, chọn **Tạo tài khoản**. Đăng ký một sinh viên và một giảng
   viên với hai tên khác nhau, để trống email. Cả hai có thể đăng nhập ngay
   và được đưa đến tổng quan tương ứng. Thử mở trang quản trị bằng tài khoản
   sinh viên hoặc giảng viên để kiểm tra phản hồi HTTP `403`.
2. Đăng nhập bằng tài khoản quản trị vừa tạo. Hai tài khoản sẽ xuất hiện trong
   **Quản lý tài khoản**. Chọn **Cấp mã đặt lại** ở hàng sinh viên và chuyển mã
   cho tài khoản thử nghiệm đó. Mã chỉ hiển thị khi cấp và có hiệu lực 20 phút.
3. Ở trang **Quên mật khẩu**, nhập tên sinh viên, mã vừa cấp và mật khẩu mới.
   Kiểm tra mã cũ không dùng được lần hai, phiên đăng nhập trước bị thu hồi
   và tài khoản đăng nhập được bằng mật khẩu mới.
4. Để thử Google, đặt `GOOGLE_CLIENT_ID` trong `server/.env` bằng OAuth Web
   Client ID của nhóm rồi khởi động lại API. Thêm đúng địa chỉ website, gồm
   giao thức và cổng, vào danh sách *Authorized JavaScript origins* của client.
   Cấu hình local hiện tại dùng `http://localhost:5000`. Nếu ứng dụng Google
   đang ở chế độ thử nghiệm, dùng tài khoản có trong danh sách người dùng thử.
5. Đăng nhập tài khoản tạo trên web rồi vào **Hồ sơ cá nhân → Liên kết tài khoản**.
   Sau khi liên kết, đăng xuất và thử **Đăng nhập bằng Google**. Kiểm tra Google
   đưa bạn vào cùng vai trò của tài khoản. Để thử đăng ký mới, dùng một tài
   khoản Google khác và chọn vai trò trên trang **Tạo tài khoản**.

Khi bật chế độ minh họa, hai tab cùng hồ sơ trình duyệt có thể đăng nhập
hai vai trò khác nhau. Mỗi lần đăng nhập chỉ thay phiên của cùng vai trò.
Khi chạy luồng xác thực thông thường, dùng các hồ sơ trình duyệt riêng để
kiểm tra song song hai vai trò.

Đăng ký tài khoản và quyền truy cập qua Express dùng PostgreSQL. Khi chạy
website tĩnh qua Live Server, các luồng tài khoản demo và Firebase của bản tĩnh
vẫn dùng cơ chế cũ.

## Kiểm thử đề xuất lưu trong PostgreSQL

Trong `server/`, chạy `npm.cmd run db:migrate` và khởi động lại Express.
Trên máy phát triển hiện tại, website chạy tại `http://localhost:5000`.

Giữ `IE104_DEMO_MODE=0` hoặc bỏ biến này để kiểm thử luồng gửi trực tiếp
đến tài khoản giảng viên được chọn.

1. Dùng hai hồ sơ trình duyệt hoặc hai thiết bị. Đăng ký và đăng nhập một tài
   khoản sinh viên và một tài khoản giảng viên. Hộp chọn hiển thị danh mục cũ
   và đánh dấu những giảng viên chưa có tài khoản nhận đề xuất. Chọn tài
   khoản giảng viên bạn vừa tạo. Nếu giảng viên đăng nhập hoặc liên kết
   Google bằng địa chỉ đã được Google xác minh và trùng email trong danh mục,
   hồ sơ trong danh mục sẽ hiển thị tên và bộ môn của giảng viên đó.
2. Ở tài khoản sinh viên, vào **Đăng ký đề tài → Tạo đề xuất**. Chọn giảng viên
   vừa đăng ký, điền nội dung và ba mốc ngày, sau đó bấm **Gửi đề xuất**.
   Kiểm tra mã đề tài và trạng thái **Chờ duyệt** trong **Đề tài của tôi**.
3. Ở tài khoản giảng viên, tải lại **Yêu cầu chờ duyệt**, mở đúng đề xuất và
   duyệt hoặc từ chối. Khi từ chối, nhập lý do ít nhất 10 ký tự.
4. Tải lại **Đề tài của tôi** ở phía sinh viên để xem kết quả. Thử thêm một đề
   xuất để sửa và rút khi đang chờ duyệt. Tài khoản sinh viên khác và giảng
   viên khác chỉ xem được hồ sơ thuộc tài khoản của họ.

Để đối chiếu trong pgAdmin, mở `ie104_dev` và chạy truy vấn dưới đây.

```sql
SELECT topic_code, title, student_account_id, lecturer_account_id,
       status, revision, created_at, decided_at
FROM public.proposals
ORDER BY created_at DESC;
```

### Kiểm thử chế độ minh họa trên hai thiết bị

Bật `IE104_DEMO_MODE=1` trong `server/.env`, chạy migration và khởi động
lại Express. Hai thiết bị mở cùng địa chỉ website Express. Nếu dùng hai tab
trong một hồ sơ trình duyệt, phiên đăng nhập vẫn được giữ riêng theo vai trò.

1. Đăng nhập sinh viên trên máy A. Dùng tài khoản tự đăng ký hoặc nút
   **Nguyễn Minh Anh**. Tại **Tạo đề xuất**, chọn bất kỳ giảng viên nào trong
   danh mục rồi gửi đề xuất.
2. Trên máy B, đăng nhập bằng một tài khoản giảng viên bất kỳ hoặc nút
   **ThS. Nguyễn Văn An**. Mở hoặc tải lại **Yêu cầu chờ duyệt**, tìm theo
   mã đề tài rồi duyệt hoặc từ chối.
3. Tải lại **Đề tài của tôi** trên máy A để kiểm tra kết quả. Khi được duyệt,
   đề tài cũng xuất hiện trong **Đang hướng dẫn** phía giảng viên.

Mọi tài khoản sinh viên dùng giao diện Nguyễn Minh Anh và bộ đề xuất minh
họa chung. Mọi tài khoản giảng viên dùng giao diện ThS. Nguyễn Văn An và có
thể xử lý đề xuất minh họa đang chờ. Hồ sơ vẫn hiển thị giảng viên được chọn
trong danh mục và lưu tài khoản đã xử lý. Đề xuất minh họa từ các hồ sơ trình
duyệt trước đây cũng xuất hiện trong danh sách chung. Luồng gửi trực tiếp
được kiểm thử khi tắt chế độ minh họa và áp dụng quyền theo tài khoản.

Trên Express, khi chọn loại đề tài, PostgreSQL giữ trước một mã cho biểu mẫu.
Mã đó được dùng khi sinh viên gửi đề xuất hoặc giảng viên lưu đề tài. Mã đã
cấp cho biểu mẫu bỏ dở có thể khiến dãy số bị ngắt quãng. API chỉ cho sửa,
rút hoặc xử lý đúng phiên bản đang chờ duyệt. Các đề xuất demo trước đây
tiếp tục chạy trong bản website tĩnh.
Đề xuất trên Express lưu tài liệu và ảnh bìa tải lên trong `public.files`.

### Kiểm thử đề tài đang thực hiện

Migration `011-projects-from-proposals.sql` tạo bảng `projects` và
`project_members`, đồng thời tạo bản ghi tương ứng cho các đề xuất đã duyệt.
Mã đề tài và liên kết chi tiết dùng trước đó vẫn giữ nguyên. Khi giảng viên
duyệt đề xuất mới, PostgreSQL lưu đề tài và thành viên trong cùng giao dịch.

Sau khi duyệt, mở **Đề tài của tôi** ở phía sinh viên và **Quản lý đề tài →
Đang hướng dẫn** ở phía giảng viên. Hai trang chi tiết phải hiển thị cùng mã
và danh sách thành viên sau khi tải lại. Có thể đối chiếu các bản ghi bằng
`GET /api/projects` và `GET /api/projects/<mã-trên-đường-dẫn>` trong phiên
đăng nhập tương ứng. Ở chế độ thông thường, tài khoản ngoài đề tài không đọc
được bản ghi qua API. Ở chế độ minh họa, các tài khoản sinh viên và giảng viên
cùng đọc được đề tài minh họa.

Nhóm trưởng được gắn với tài khoản gửi đề xuất. Thành viên được ghi từ đề
cương, còn quyền truy cập dựa trên tài khoản đã được liên kết. Danh sách
thành viên hiện chỉ đọc sau khi duyệt.

### Kiểm thử giảng viên mở đề tài và sinh viên đăng ký

Chạy migration `013-lecturer-topics-and-registrations.sql` bằng
`npm.cmd run db:migrate` trong thư mục `server/`, rồi khởi động lại Express.
Để thử với nhiều tài khoản demo, giữ `IE104_DEMO_MODE=1`. Hai máy hoặc hai
hồ sơ trình duyệt mở cùng địa chỉ Express.

1. Trên máy A, đăng nhập giảng viên. Vào **Quản lý đề tài → Đã tạo → Tạo đề
   tài**. Nhập tên riêng cho lượt thử, các mốc ngày theo thứ tự, hạn đăng ký
   trong tương lai và số thành viên từ 2 đến 3. Bấm **Tạo đề tài** và ghi lại
   mã trên trang chi tiết. Đề tài mới mở đăng ký ngay.
2. Trên máy B, đăng nhập sinh viên, tải lại **Đăng ký đề tài** và tìm theo
   mã. Mở đề tài, thử đăng ký một mình để thấy lỗi thiếu thành viên, rồi
   thêm một người thử và xác nhận đăng ký. Tài khoản gửi được gắn với nhóm
   trưởng. Các thành viên nhập tay là thông tin nhóm.
3. Sinh viên mở **Đề tài của tôi** và giảng viên tải lại **Đang hướng dẫn**.
   Kiểm tra cùng mã, trạng thái **Đang thực hiện** và danh sách thành viên.
   Mở lại liên kết đăng ký đã lưu để kiểm tra trạng thái **Đã có nhóm đăng
   ký**. Đề tài sẽ rời danh sách mở đăng ký.
4. Tạo đề tài khác để kiểm tra **Đóng đăng ký**, sau đó **Mở lại đăng ký**
   với hạn mới trong tương lai. Kiểm tra lại danh sách phía sinh viên sau
   mỗi thao tác.

Tại Query Tool của `ie104_dev`, thay `MA_DE_TAI` bằng mã vừa ghi.

```sql
SELECT t.code, t.title, t.deadline, r.id AS registration_id,
       p.status AS project_status, m.display_name, m.role
FROM public.lecturer_topics AS t
LEFT JOIN public.registrations AS r ON r.topic_code = t.code
LEFT JOIN public.projects AS p ON p.registration_id = r.id
LEFT JOIN public.project_members AS m ON m.project_id = p.id
WHERE t.code = 'MA_DE_TAI'
ORDER BY m.position;
```

Mỗi đề tài có một lượt đăng ký. PostgreSQL lưu lượt đăng ký, đề tài đang
thực hiện và thành viên trong cùng giao dịch. Đề tài tạo trước đây trong
bản demo trình duyệt vẫn nằm ở nguồn dữ liệu cũ. Đề tài trên Express lưu
tài liệu và ảnh bìa tải lên trong `public.files`.

Migration `025` bổ sung 16 đề tài mở đăng ký từ danh mục mẫu. Với
`IE104_DEMO_MODE=1`, chọn đề tài mẫu từ **Đăng ký đề tài** hoặc liên kết đã lưu,
xác nhận đăng ký rồi mở **Đề tài của tôi** và **Đang hướng dẫn** để đối chiếu.
Các lượt đăng ký từ bản tĩnh trước đây vẫn nằm ở trình duyệt đã lưu.

### Kiểm thử tiến độ đề tài và bình luận

Chạy migration `014-project-progress.sql` và khởi động lại Express. Mở một
đề tài **Đang thực hiện** đã lưu ở PostgreSQL từ luồng đề xuất đã duyệt hoặc
đăng ký thành công. Dùng cùng địa chỉ Express ở hai máy hoặc hai hồ sơ
trình duyệt.

1. Ở phía sinh viên, vào **Đề tài của tôi → Chi tiết đề tài → Tiến độ**.
   Chọn **Thêm công việc**, nhập tên, hạn hoàn thành và người phụ trách.
2. Mở thẻ công việc, chọn **Cập nhật tiến độ**, rồi lưu trạng thái
   **Đang thực hiện**, mức **40%** và nội dung đã làm. Kiểm tra thẻ chuyển
   sang cột tương ứng và xuất hiện một dòng trong **Lịch sử cập nhật**.
3. Ở phía giảng viên, tải lại **Đang hướng dẫn → Chi tiết đề tài → Tiến độ**.
   Mở cùng công việc và xem **40%** cùng nội dung cập nhật gần nhất. Gửi một bình luận rồi mở lại công việc
   phía sinh viên để xem và phản hồi.
4. Khi thử xóa, dùng một công việc test. Thẻ sẽ biến mất, lịch sử cập nhật
   vẫn còn. Bình luận thuộc công việc sẽ được xóa cùng công việc.

Trong pgAdmin 4, mở **Query Tool** của `ie104_dev`. Thay `MA_DE_TAI`
bằng mã trên giao diện và chạy câu SQL dưới đây.

```sql
SELECT p.id AS ma_noi_bo, p.progress_revision, t.id AS task_id,
       t.title, t.deadline, t.status, t.percent,
       (SELECT string_agg(m.display_name, ', ' ORDER BY a.member_position)
        FROM public.project_task_assignees AS a
        JOIN public.project_members AS m
          ON m.project_id = a.project_id AND m.position = a.member_position
        WHERE a.task_id = t.id) AS nguoi_phu_trach
FROM public.projects AS p
LEFT JOIN public.proposals AS d ON d.id = p.proposal_id
LEFT JOIN public.registrations AS r ON r.id = p.registration_id
LEFT JOIN public.project_tasks AS t ON t.project_id = p.id
WHERE COALESCE(d.topic_code, r.topic_code) = 'MA_DE_TAI'
ORDER BY t.created_at;
```

Dùng `ma_noi_bo` từ kết quả để xem lịch sử cập nhật và bình luận.

```sql
SELECT task_title, status, percent, content, actor_name, created_at
FROM public.project_progress_updates
WHERE project_id = 'UUID_CUA_DE_TAI'
ORDER BY created_at DESC;

SELECT t.title, c.author_role, c.author_name, c.content, c.parent_id
FROM public.project_task_comments AS c
JOIN public.project_tasks AS t ON t.id = c.task_id
WHERE t.project_id = 'UUID_CUA_DE_TAI'
ORDER BY c.created_at;
```

Nhóm trưởng quản lý công việc. Thành viên có tài khoản liên kết có thể cập
nhật công việc được giao. Giảng viên hướng dẫn có thể xem và bình luận.
Trong chế độ minh họa, tài khoản cùng vai trò dùng quyền minh họa chung.
Dữ liệu tiến độ từng lưu trên trình duyệt vẫn ở nguồn lưu cũ.

### Kiểm thử bài nộp và phản hồi

Chạy migration `015-project-submissions.sql` bằng `npm.cmd run db:migrate`
trong thư mục `server/`, rồi khởi động lại Express. Dùng cùng địa chỉ Express
ở hai máy hoặc hai hồ sơ trình duyệt.

1. Giảng viên mở **Đang hướng dẫn → Chi tiết đề tài → Bài nộp**. Chọn
   **Tạo yêu cầu**, nhập tên, nội dung và hạn nộp theo giờ Việt Nam.
2. Sinh viên mở cùng đề tài trong **Đề tài của tôi → Bài nộp**. Sau khi tải
   lại, mở yêu cầu vừa tạo, chọn **Nộp bài**, đính kèm một hoặc hai tệp nhỏ,
   điền ghi chú nếu cần rồi chọn **Xác nhận nộp bài**. Mỗi lần nộp tối đa
   10 tệp, tổng dung lượng tối đa 20 MiB.
3. Giảng viên tải lại tab **Bài nộp**, xem bài ở cột **Chờ phản hồi**, tải
   tệp và mở **Phản hồi**. Sinh viên tải lại và chọn **Xem phản hồi**.
4. Để thử nộp lại, sinh viên mở yêu cầu và chọn **Cập nhật bài nộp**. Bảng
   hiển thị lần nộp mới nhất. Các lần trước và phản hồi tương ứng vẫn được
   lưu trong PostgreSQL. Nếu yêu cầu bị khóa, máy chủ từ chối lượt nộp mới.

Trong pgAdmin 4, mở **Query Tool** của `ie104_dev`, thay `MA_DE_TAI` bằng
mã đề tài và chạy câu SQL dưới đây. Mỗi dòng là một tệp của một lần nộp.

```sql
SELECT q.title AS yeu_cau, s.attempt AS lan_nop, s.submitted_at, s.notes,
       f.file_name, f.size_bytes, fb.content AS phan_hoi, fb.lecturer_name
FROM public.projects AS p
LEFT JOIN public.proposals AS d ON d.id = p.proposal_id
LEFT JOIN public.registrations AS r ON r.id = p.registration_id
JOIN public.project_submission_requirements AS q ON q.project_id = p.id
JOIN public.project_submissions AS s ON s.requirement_id = q.id
JOIN public.project_submission_files AS attachment ON attachment.submission_id = s.id
JOIN public.files AS f ON f.id = attachment.id
LEFT JOIN LATERAL (
  SELECT content, lecturer_name
  FROM public.project_submission_feedback
  WHERE submission_id = s.id
  ORDER BY revision DESC
  LIMIT 1
) AS fb ON true
WHERE COALESCE(d.topic_code, r.topic_code) = 'MA_DE_TAI'
ORDER BY q.title, s.attempt, attachment.position;
```

Tệp mới của đề tài PostgreSQL được lưu cùng lượt nộp trong một giao dịch.
Các bài từng lưu trong IndexedDB của bản cũ chưa được nhập vào PostgreSQL.

### Kiểm thử tiến độ và bài nộp của đề tài mẫu

Chạy `npm.cmd run db:migrate` trong `server/` để áp dụng migration `024`, rồi
chạy Express với `IE104_DEMO_MODE=1`. Migration nhập dữ liệu đi kèm của 23 đề tài
mẫu từ danh mục, gồm công việc, yêu cầu, bài nộp, tệp và phản hồi mẫu. Dữ liệu do
người dùng từng tạo trong trình duyệt vẫn nằm tại trình duyệt đã lưu.

Dùng hai phiên trình duyệt ở cùng địa chỉ Express và mở cùng mã đề tài,
ví dụ `UIT-SV-ISEDAMH-013`. Thử cập nhật tiến độ và gửi bình luận từ phía
sinh viên. Tạo yêu cầu và phản hồi bài nộp từ phía giảng viên. Sau mỗi lần lưu,
tải lại trang của vai trò còn lại để đối chiếu. Đề tài mẫu đã hoàn thành
hiển thị bài nộp, phản hồi và tệp mẫu đã lưu.

### Kiểm thử đồng bộ lịch hạn nộp

Dùng cùng địa chỉ Express trên hai trình duyệt và chọn một đề tài **Đang
thực hiện** được lưu trong PostgreSQL. Có thể dùng `IE104_DEMO_MODE=1`.

1. Trên trình duyệt giảng viên, vào **Đang hướng dẫn → Chi tiết đề tài →
   Bài nộp → Tạo yêu cầu**, đặt tên dễ tìm và chọn hạn theo giờ Việt Nam.
2. Trên trình duyệt sinh viên, mở **Lịch hạn nộp**, chọn đề tài và tháng của
   hạn vừa tạo. Bấm mốc để xem ngày, giờ và trạng thái **Chưa nộp**.
3. Giảng viên chọn **Sửa yêu cầu** và đổi hạn sang một ngày khác trong cùng
   tháng. Quay lại tab lịch đã mở bên sinh viên. Mốc chuyển sang ngày mới mà
   không cần tải lại trang. Bộ lọc tháng và đề tài vẫn giữ lựa chọn.
4. Sinh viên mở **Bài nộp** và nộp thử. Khi quay lại lịch, mốc hiện
   **Chờ phản hồi**. Sau khi giảng viên phản hồi, quay lại lịch lần nữa để
   thấy **Đã phản hồi**. Có thể thử khóa một yêu cầu chưa nộp để đối chiếu
   trạng thái **Đã khóa nhận bài**.

Trong **Query Tool** của `ie104_dev`, thay `MA_DE_TAI` bằng mã đề tài.
Truy vấn đọc hạn theo giờ Việt Nam và trạng thái của lần nộp mới nhất.

```sql
SELECT COALESCE(d.topic_code, r.topic_code) AS ma_de_tai,
       q.title AS yeu_cau, q.deadline AT TIME ZONE 'Asia/Ho_Chi_Minh' AS han_nop,
       s.attempt AS lan_nop_moi_nhat, f.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS gio_phan_hoi,
       CASE WHEN f.revision IS NOT NULL THEN 'Đã phản hồi'
            WHEN s.id IS NOT NULL THEN 'Chờ phản hồi'
            WHEN q.locked OR p.submissions_locked THEN 'Đã khóa nhận bài'
            WHEN q.deadline < clock_timestamp() THEN 'Quá hạn'
            ELSE 'Chưa nộp' END AS trang_thai
FROM public.projects AS p
LEFT JOIN public.proposals AS d ON d.id = p.proposal_id
LEFT JOIN public.registrations AS r ON r.id = p.registration_id
JOIN public.project_submission_requirements AS q ON q.project_id = p.id
LEFT JOIN LATERAL (
  SELECT id, attempt FROM public.project_submissions
  WHERE requirement_id = q.id ORDER BY attempt DESC LIMIT 1
) AS s ON true
LEFT JOIN LATERAL (
  SELECT revision, created_at FROM public.project_submission_feedback
  WHERE submission_id = s.id ORDER BY revision DESC LIMIT 1
) AS f ON true
WHERE COALESCE(d.topic_code, r.topic_code) = 'MA_DE_TAI'
  AND p.status = 'dang-thuc-hien'
ORDER BY q.deadline, q.id;
```

### Kiểm thử kết quả đánh giá

Chạy các migration đến `017-demo-catalog-evaluations.sql` bằng `npm.cmd run db:migrate`
trong `server/`, rồi khởi động lại Express. Hai máy hoặc hai hồ sơ trình
duyệt dùng cùng địa chỉ Express. Dùng một đề tài thử nghiệm đã được duyệt
hoặc đăng ký thành công vì công bố sẽ chuyển đề tài sang **Hoàn thành**.

Với `IE104_DEMO_MODE=1`, cũng có thể chấm đề tài đang thực hiện trong danh
mục mẫu, chẳng hạn `UIT-SV-ISE-001`. Nếu đã chấm trước khi cập nhật, tải lại trang
giảng viên trên trình duyệt đã chấm rồi công bố để lưu bản đánh giá đó lên máy chủ.

1. Giảng viên vào **Đang hướng dẫn → Chi tiết đề tài → Kết quả đánh giá**.
   Nhập **Nội dung 8**, **Sản phẩm 9**, **Báo cáo 7**. Trọng số hiện hành
   là 40%, 40% và 20%, nên điểm tổng kết là **8,2/10**.
2. Điền nhận xét, có thể đính kèm một tệp tối đa 20 MiB, rồi chọn
   **Công bố đánh giá → Xác nhận công bố**.
3. Sinh viên tải lại **Đề tài của tôi → Chi tiết cùng đề tài → Kết quả đánh
   giá**. Đối chiếu điểm, nhận xét, ngày công bố và tệp đính kèm. Đề tài
   xuất hiện ở trạng thái **Hoàn thành**. Các công việc và bài nộp đã có
   vẫn xem hoặc tải được theo quyền tương ứng.
4. Giảng viên chọn **Sửa kết quả đánh giá**, thay điểm Sản phẩm từ 9 thành
   10 rồi **Công bố lại**. Sinh viên tải lại để thấy **8,6/10**. PostgreSQL
   lưu từng lần công bố. Tệp cũ được giữ nếu giảng viên không thay hoặc bỏ.

Trong pgAdmin 4, mở **Query Tool** của `ie104_dev` và thay `MA_DE_TAI` bằng
mã đề tài đã đề xuất hoặc đã đăng ký. Với đề tài trong danh mục mẫu, dùng
giá trị `project` trên thanh địa chỉ, ví dụ `UIT-SV-ISE-001` cho đề tài có mã
hiển thị `ISEKTLN-001`. Một lần công bố có ba dòng tương ứng với ba tiêu chí.

```sql
SELECT e.revision AS lan_cong_bo, p.status AS trang_thai_de_tai,
       g.title AS tieu_chi, g.weight AS trong_so, g.score AS diem_tieu_chi,
       e.score AS diem_tong, e.feedback AS nhan_xet,
       e.published_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS gio_cong_bo,
       f.file_name, f.size_bytes
FROM public.projects AS p
LEFT JOIN public.proposals AS d ON d.id = p.proposal_id
LEFT JOIN public.registrations AS r ON r.id = p.registration_id
JOIN public.project_evaluations AS e ON e.project_id = p.id
JOIN public.project_evaluation_scores AS g ON g.evaluation_id = e.id
LEFT JOIN public.files AS f ON f.id = e.attachment_id
WHERE COALESCE(d.topic_code, r.topic_code, p.demo_catalog_id) = 'MA_DE_TAI'
ORDER BY e.revision DESC, g.position;
```

Máy chủ kiểm tra quyền, tính điểm theo trọng số và lưu kết quả, điểm từng
tiêu chí, tệp đính kèm cùng trạng thái đề tài trong một giao dịch. Dữ liệu
đánh giá cũ trên trình duyệt chỉ được đưa lên PostgreSQL khi giảng viên công bố lại.

Migration `025` cũng nhập điểm, nhận xét và ngày đánh giá mẫu của 5 đề tài
đã hoàn thành. Hai vai trò có thể đối chiếu tại **Kết quả đánh giá** khi
mở cùng đề tài trên bản Express ở chế độ minh họa.

### Kiểm thử lời mời hướng dẫn và thành viên nhóm

Chạy các migration đến `020-demo-catalog-teams.sql` rồi khởi động lại Express.
Mở cùng địa chỉ Express bằng hai trình duyệt, đăng nhập sinh viên và giảng viên.

1. Sinh viên mở **Chung → Hướng nghiên cứu**, chọn **Liên hệ xin hướng dẫn**
   ở một giảng viên, điền tiêu đề, lời nhắn và chọn một tệp tối đa 10 MB.
2. Giảng viên mở **Yêu cầu chờ duyệt → Lời mời hướng dẫn**, chọn giảng viên
   nhận lời mời nếu có nhiều người nhận, tải tệp, gửi phản hồi rồi chọn
   **Đồng ý hướng dẫn** hoặc **Từ chối**. Tải lại bên sinh viên để xem phản hồi.
   Nếu được đồng ý, nút **Tạo đề xuất** điền sẵn giảng viên đã chọn.
3. Sinh viên mở đề tài **Đang thực hiện** từ một lượt đăng ký thành công hoặc
   đề xuất đã duyệt. Trong chế độ minh họa, cũng có thể dùng đề tài mẫu đang
   thực hiện như `UIT-SV-ISEDAMH-013`. Nhóm trưởng vào **Tổng quan**, thêm thành viên với MSSV
   khác, rồi thử **Sửa** và **Xóa**. Tải lại chi tiết phía giảng viên để đối
   chiếu danh sách. Khi xóa thành viên, công việc của người đó vẫn còn và
   được bỏ phân công cho người đó.
4. Ở cùng đề tài, chọn **Mời GVHD** và chọn người khác giảng viên hướng dẫn
   chính. Giảng viên phản hồi từ tab **Lời mời hướng dẫn**. Tải lại tab
   **Tổng quan** của sinh viên để xem người được mời có vai trò
   **Đồng hướng dẫn** sau khi đồng ý. Thử hủy một lời mời còn đang chờ.

Với `IE104_DEMO_MODE=1`, các tài khoản theo cùng vai trò dùng chung hộp lời
mời minh họa. Người được chọn vẫn hiển thị trên lời mời. Khi tắt chế độ này,
chỉ tài khoản gửi và tài khoản giảng viên nhận có quyền vào cuộc trao đổi
và tải tệp. Thành viên thêm bằng họ tên và MSSV là mục trong danh sách nhóm.
Lời mời và tệp từng lưu trên trình duyệt cũ chưa được đưa sang PostgreSQL.

Trong **Query Tool** của `ie104_dev`, đối chiếu lời mời, nội dung trao đổi và
dung lượng tệp. `project_id` trống ở lời mời từ trang Hướng nghiên cứu.

```sql
SELECT i.id, i.project_id, i.student_name, i.teacher_name, i.subject, i.status,
       m.position, m.author_role, m.message, f.file_name, f.size_bytes,
       m.sent_at AT TIME ZONE 'Asia/Ho_Chi_Minh' AS gio_gui
FROM public.supervision_invitations AS i
JOIN public.supervision_invitation_messages AS m ON m.invitation_id = i.id
LEFT JOIN public.files AS f ON f.id = m.file_id
ORDER BY i.created_at DESC, m.position;
```

Thay `MA_DE_TAI` bằng mã của đề tài vừa thêm thành viên. Với đề tài mẫu,
dùng mã sau `?project=`, ví dụ `UIT-SV-ISEDAMH-013`.

```sql
SELECT COALESCE(d.topic_code, r.topic_code, p.demo_catalog_id) AS ma_de_tai,
       p.team_revision, m.student_code, m.display_name, m.role
FROM public.projects AS p
LEFT JOIN public.proposals AS d ON d.id = p.proposal_id
LEFT JOIN public.registrations AS r ON r.id = p.registration_id
JOIN public.project_members AS m ON m.project_id = p.id
WHERE COALESCE(d.topic_code, r.topic_code, p.demo_catalog_id) = 'MA_DE_TAI'
ORDER BY m.position;
```

### Kiểm thử kho tệp dùng chung

Chạy migration đến `022-link-shared-files.sql` và khởi động lại Express.
Dùng hai trình duyệt mở cùng địa chỉ máy chủ.

1. **Sinh viên** gửi đề xuất kèm tệp và ảnh PNG hoặc JPG. **Giảng viên** mở
   đúng đề xuất trong **Yêu cầu chờ duyệt**, xem ảnh và tải tệp.
2. **Giảng viên** tạo đề tài có hạn đăng ký trong tương lai, kèm một tài liệu
   và một ảnh. **Sinh viên** mở **Đăng ký đề tài**, xem ảnh và tải tài liệu
   trong màn hình chi tiết. Thử sửa đề tài, thay ảnh hoặc bỏ tài liệu rồi tải
   lại chi tiết ở trình duyệt sinh viên.
3. Mở bài nộp, kết quả đánh giá và lời mời hướng dẫn đã có tệp, rồi tải lại
   tệp. Có thể tải tệp mới trong từng luồng để đối chiếu thêm trong pgAdmin.
4. Dùng cùng tài khoản ở hai trình duyệt, đổi ảnh trong **Hồ sơ cá nhân** và
   mở lại hồ sơ ở trình duyệt còn lại. Thử với cả sinh viên và giảng viên.

Trong **Query Tool** của `ie104_dev`, chạy truy vấn sau. Kết quả hiển thị hồ
sơ liên kết, tên, loại và dung lượng tệp. Các tệp chuyển từ cơ sở dữ liệu cũ
dùng `application/octet-stream` vì dữ liệu cũ chỉ lưu tên và nội dung.

```sql
WITH links AS (
  SELECT 'Đề xuất' AS luong, p.topic_code AS ho_so, x.muc, x.file_id
  FROM public.proposals AS p
  CROSS JOIN LATERAL (VALUES ('Tài liệu', p.attachment_file_id), ('Ảnh bìa', p.cover_file_id)) AS x(muc, file_id)
  UNION ALL
  SELECT 'Đề tài', t.code, x.muc, x.file_id
  FROM public.lecturer_topics AS t
  CROSS JOIN LATERAL (VALUES ('Tài liệu', t.attachment_file_id), ('Ảnh bìa', t.cover_file_id)) AS x(muc, file_id)
  UNION ALL
  SELECT 'Bài nộp', submission_id::text, 'Tệp nộp', id FROM public.project_submission_files
  UNION ALL
  SELECT 'Kết quả đánh giá', project_id::text, 'Tài liệu', id FROM public.project_evaluation_attachments
  UNION ALL
  SELECT 'Lời mời hướng dẫn', invitation_id::text, 'Tệp tin nhắn', file_id FROM public.supervision_invitation_messages
  UNION ALL
  SELECT 'Hồ sơ', COALESCE(username, email, id::text), 'Ảnh đại diện', avatar_file_id FROM public.accounts
)
SELECT l.luong, l.ho_so, l.muc, f.file_name, f.content_type, f.size_bytes, f.created_at
FROM links AS l JOIN public.files AS f ON f.id = l.file_id
ORDER BY f.created_at DESC, l.luong;
```

## Triển khai bản demo Express

Bản demo online dùng Express để phục vụ cả website trong `web/` và API từ
`server/` trên cùng một địa chỉ. Tạo **Web Service** trên Render và để trống
**Root Directory** để Render dùng cả hai thư mục. Các lệnh sau chạy từ gốc repo.

```sh
npm --prefix server ci
npm --prefix server run db:migrate
npm --prefix server run start:demo
```

Đặt `DATABASE_URL` trong biến môi trường của dịch vụ và dùng cổng `PORT` mà
dịch vụ cấp. Đặt `APP_ORIGIN` bằng URL HTTPS công khai của website. Tùy chọn
`GOOGLE_CLIENT_ID` sử dụng cùng URL trong danh sách origin được cấp phép của
Google. Tệp `server/deploy-demo.env` bật hai tài khoản minh họa để cả hai xuất
hiện trên trang đăng nhập. Thông tin kết nối PostgreSQL nằm trong cấu hình
của dịch vụ triển khai.

Bản Express dùng chung dữ liệu đề xuất và đề tài minh họa trong PostgreSQL
cho mọi tài khoản sinh viên, giảng viên đăng nhập cùng website. Các trình
duyệt và thiết bị có thể mở danh sách để đọc kết quả đã lưu.

Render phục vụ các URL `/pages/`, `/assets/` và `/api/` qua Express.
Mã đồng bộ Google Calendar và cấu hình Firebase liên quan nằm trong repo để
tiếp tục chuyển xác thực. Luồng Calendar hiện vẫn cần Firebase.

## Cấu trúc và luồng chính

- [web/pages/chung/](web/pages/chung/) có đăng nhập, quên mật khẩu, giới thiệu, hướng nghiên cứu, thông báo và liên hệ.
- [web/pages/sinh-vien/](web/pages/sinh-vien/) có tổng quan, đăng ký đề tài, đề tài của tôi, tạo đề xuất, lịch hạn nộp và hồ sơ.
- [web/pages/giang-vien/](web/pages/giang-vien/) có tổng quan, quản lý đề tài và yêu cầu chờ duyệt.
- [web/pages/quan-tri/](web/pages/quan-tri/) chứa các màn hình quản trị.
- `web/assets/` chứa CSS, JavaScript, font Be Vietnam Pro và hình ảnh. `tests/` chứa bộ kiểm thử tự động.


## Chức năng demo và giới hạn

- Có điều hướng, tab, hộp thoại, hiện/ẩn mật khẩu; tìm kiếm/lọc/sắp xếp các danh sách đề tài; chọn giảng viên, môn học và lịch hạn nộp mẫu.
- Yêu cầu chờ duyệt có tìm kiếm, lọc, sắp xếp, phân trang và mở đúng hồ sơ. Trên bản tĩnh, quyết định duyệt hoặc từ chối lưu bằng `localStorage` và cập nhật giữa các tab cùng nguồn URL.
- Thông báo có lọc theo loại, phân trang và giữ trạng thái khi tải lại hoặc Back/Forward. Khi sửa bài, cập nhật cả `web/assets/js/notifications-data.js` và HTML dự phòng.

Backend Express xác thực tài khoản, phân quyền và lưu đề xuất, đề tài giảng
viên mở đăng ký, lượt đăng ký, đề tài đang thực hiện, thành viên, tiến độ,
bài nộp, kết quả đánh giá và lời mời hướng dẫn trong PostgreSQL.
Migration `023-account-profiles.sql` lưu họ tên, email liên hệ, số điện thoại
và chuyên môn của giảng viên trong hồ sơ theo tài khoản. Email đăng nhập
được quản lý riêng. Bản website tĩnh tiếp tục lưu thay đổi hồ sơ trên trình duyệt.
Chưa triển khai chuyển Việt/Anh. Lịch mẫu cố định “hôm nay” là 18/10/2026.

### Liên hệ xin hướng dẫn trên bản tĩnh

1. Mở [Hướng nghiên cứu](web/pages/chung/huong-nghien-cuu.html) qua Live Server. Chọn **Liên hệ xin hướng dẫn**. Nếu chưa đăng nhập bằng tài khoản sinh viên, dùng biểu mẫu đăng nhập chung để tiếp tục đến đúng giảng viên. Điền và gửi lời mời.
2. Trên tab thứ hai cùng địa chỉ máy chủ, mở [Yêu cầu chờ duyệt → Lời mời hướng dẫn](web/pages/giang-vien/yeu-cau-cho-duyet.html#loi-moi-huong-dan). Chọn giảng viên đã nhận lời mời và trả lời.
3. Trên tab sinh viên, xem và trả lời trong [Đề tài của tôi → Lời mời hướng dẫn](web/pages/sinh-vien/de-tai-cua-toi-sinh-vien.html#loi-moi-huong-dan). Giảng viên có thể **Đồng ý hướng dẫn** hoặc **Từ chối** và kèm lời nhắn. Sau khi đồng ý, sinh viên có thể mở **Tạo đề xuất**. Nếu giảng viên chưa có trong danh mục nhận đề xuất thử, biểu mẫu hiển thị thông tin lời mời để đối chiếu.

Luồng này dùng chung phiên đăng nhập trong tab. Lời mời và phản hồi lưu bằng `localStorage` và cập nhật giữa các tab cùng nguồn URL. Sinh viên xem lời mời theo tài khoản đang đăng nhập. Quyết định kết thúc trao đổi trên lời mời. Việc đồng ý hướng dẫn ghi nhận trong lời mời, còn việc gửi đề xuất chính thức vẫn theo luồng riêng.

Tab **Lời mời hướng dẫn** cũng mở được từ **Tổng quan** của mỗi vai trò. Sinh viên thấy phản hồi gần nhất. Giảng viên thấy số lời mời demo đang chờ phản hồi.

Mỗi lời mời hoặc phản hồi có thể đính kèm một tệp tối đa 10 MB. Bản demo lưu tệp trong IndexedDB. Hai vai trò có thể tải tệp từ cuộc trao đổi khi dùng cùng trình duyệt và cùng nguồn URL.

Kiểm thử kho dữ liệu demo bằng Node.js, không cần thư viện:

```sh
node --test tests/proposal-store.test.cjs tests/supervision-store.test.cjs
```

Hướng dẫn phát triển nằm trong **AGENTS.md, PRODUCT.md và DESIGN.md ở thư mục cha**;
đọc PRODUCT và DESIGN trước khi sửa HTML/CSS/JavaScript.
