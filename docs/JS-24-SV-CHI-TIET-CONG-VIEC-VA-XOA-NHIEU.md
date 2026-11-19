# Luồng công việc và bài nộp — bản làm lại 19/11/2026

Bản này thay thiết kế ngay trước chưa được duyệt. Giữ phần ảnh SV/GV đã đồng bộ; không sửa GitHub.

progress.js của SV giữ các xử lý quyền, lưu và revision cũ. Bấm thẻ mở Chi tiết công việc, nút sửa ở cuối hộp. Xóa bật một chế độ: hiện dấu −, bấm dấu đó để xác nhận xóa, có thể tiếp tục với thẻ khác rồi bấm Xong. Không chọn bằng checkbox. Xóa mỗi lần vẫn kiểm tra nhóm trưởng/trạng thái và bản dữ liệu, không xóa dựa trên thông tin cũ ở tab khác. Lịch sử cập nhật cũ vẫn được giữ.

workflow-dialog.js và workflow-detail-shared.css dùng chung cho hộp xem công việc của SV/GV và yêu cầu của GV. Các trường readonly hiển thị thông tin; nút sửa chỉ mở form xử lý cũ, không tự lưu. SV/GV có quyền khác nhau: GV xem và nhận xét tiến độ, không tự sửa task của SV. Yêu cầu đã có bài nộp vẫn không được xóa.

Bài nộp: Yêu cầu chia Chưa nộp/Đã nộp, còn bài nhóm chia Chờ phản hồi/Đã phản hồi. Việc tách này tránh hai cột cùng tên Đã phản hồi và giữ khác biệt giữa yêu cầu với các lần nộp. Nộp đúng hạn là thông tin riêng trên thẻ; không đồng nghĩa đã được phản hồi.

Cách thử:
1. Ctrl+F5 trên localhost, mở Tiến độ SV. Bấm thẻ bất kỳ: hộp readonly phải hiện, không có nút Xem chi tiết trên thẻ.
2. Đề tài đang thực hiện do mình làm nhóm trưởng: Sửa công việc -> lưu -> tải lại. Với đề tài Hoàn thành, vẫn xem được nhưng không sửa/xóa.
3. Xóa -> dấu − -> Hủy: thẻ còn nguyên. Xác nhận xóa: thẻ mất, chế độ xóa còn để làm tiếp. Xong: dấu − biến mất.
4. GV: màu ba cột tiến độ giống SV, bấm thẻ mở cùng kiểu hộp readonly. Bài nộp chỉ có một cột Đã phản hồi ở phần dưới; bấm yêu cầu để xem/sửa hoặc khóa nhận bài.
5. Dùng Tab/Enter/Escape; thử 320/768/1440px và cuộn từng vùng. Không xóa localStorage để cập nhật giao diện.

Ảnh kiểm tra: docs/qa/workflow-redo/. Thử trạng thái đang thực hiện trong bài kiểm tra dùng phiên riêng, không đổi trạng thái dữ liệu mẫu của bạn.

## Đề tài để thử chức năng

Mở danh sách Đề tài của tôi, mục đầu DA005 — Website quản lý hoạt động học tập đang Đang thực hiện. Tài khoản SV hiện tại là nhóm trưởng nên có thể thử thêm/sửa/xóa việc và cập nhật tiến độ. DA005 có nhóm/tiến độ riêng; tải lại giữ thay đổi. DA001/DA002 vẫn Hoàn thành. Các thẻ trong Bài nộp của trang này vẫn là nội dung minh họa giao diện, không tự tạo ra lần nộp thật.

Các icon trạng thái dùng SVG cùng bộ trong workflow-dialog.js, không thêm thư viện. Hai vai trò dùng cách xuống dòng nhãn/giá trị như nhau; ngày giờ GV được định dạng theo giờ Việt Nam. Nút tải xuống GV chỉ bật khi có tệp thật.

## Gọn lịch sử và phân biệt trễ hạn

Tab Tiến độ SV không hiện khối lịch sử chung nữa. Dữ liệu không bị xóa; chi tiết công việc vẫn có cập nhật gần nhất. Nút Cập nhật tiến độ chuyển lên thanh thao tác công việc.

Quá hạn · Chưa nộp khác Đã nộp trễ: nhãn đầu nói yêu cầu chưa có bài, nhãn sau so sánh thời điểm nộp với hạn. Qua deadline không tự khóa nhận bài. Hàm submissionAccess cho phép late=true khi còn mở; chỉ chặn khi sai nhóm, đề tài không còn thực hiện hoặc yêu cầu/toàn đề tài bị khóa. Phần thẻ nộp SV vẫn là bản trình bày của nhóm, không tạo lần nộp thật từ nút chưa xử lý.

## Điền tiến độ hiện tại và thông tin người cập nhật

Trong hộp Cập nhật tiến độ, chọn công việc sẽ điền trạng thái và phần trăm hiện tại. Đổi lựa chọn sẽ lấy giá trị của công việc mới; trở về Chọn công việc sẽ xóa hai giá trị này. Phần trăm chưa biết giữ trống, không tự coi là 0%. Nội dung báo cáo mới luôn trống khi mở lại hộp, không chép báo cáo cũ vào lần cập nhật mới. Quy tắc kiểm tra nội dung và trạng thái/phần trăm vẫn giữ nguyên.

Chi tiết công việc SV và GV dùng chung phần lịch sử trong workflow-dialog.js để đọc các lần cập nhật của đúng task. Mỗi lần có người thực hiện (tên và mã), thời gian theo giờ Việt Nam, phần trăm tại thời điểm đó và nội dung báo cáo. Công việc chưa có cập nhật không tự sinh tên hoặc thời gian. Các thông tin này lấy từ lịch sử đã lưu, không lấy người đang mở trang làm tác giả.

Cách thử: ở DA005 chọn Cập nhật tiến độ, chọn việc đang 50% rồi đổi sang việc hoàn thành; ô trạng thái và % phải đổi đúng. Nhập báo cáo, lưu, bấm lại thẻ: người cập nhật và thời gian phải xuất hiện. Mở lại hộp cập nhật: % lấy bản vừa lưu, nội dung mới vẫn trống. Hủy hoặc Escape không tạo bản cập nhật. Với GV, thông tin chỉ hiện khi đúng công việc có bản cập nhật; không ghép hai mã đề tài SV/GV khác nhau.

## Lịch sử riêng cho từng công việc

Theo xác nhận tiếp theo, phần chỉ có bản cập nhật gần nhất được thay bằng Lịch sử cập nhật ngay trong hộp chi tiết. Các thông tin công việc và tiến độ hiện tại vẫn ở trên. Dữ liệu lịch sử được lọc theo taskId, sắp thời gian mới nhất trước trên một mảng riêng, không sửa thứ tự hay nội dung đã lưu.

Mỗi dòng dùng details/summary của HTML: tên và mã người cập nhật, thời gian Việt Nam, phần trăm của lần cập nhật đó. Bấm hoặc dùng Tab rồi Enter/Space để mở và đóng nội dung báo cáo. Không mở thêm hộp thoại. Nội dung dùng textContent nên chuỗi giống mã HTML chỉ hiển thị như chữ; xuống dòng báo cáo được giữ lại. Chưa có bản cập nhật thì hiện trạng thái trống. Khối lịch sử chung bên ngoài hộp vẫn được ẩn.

Cách thử thêm: cập nhật cùng một công việc hai lần, bấm lại thẻ, kiểm tra đủ hai dòng và lần mới ở trên; mở từng dòng để so báo cáo. Thử công việc khác để chắc chắn không lẫn lịch sử, tải lại để kiểm tra dữ liệu còn nguyên, dùng điện thoại hoặc bàn phím để mở/đóng từng dòng. Lịch sử không thay đổi quyền sửa công việc.
