# Quy tắc làm việc cho dự án

## Tài liệu cần đọc

Trước khi thực hiện nhiệm vụ giao diện:
- Đọc PRODUCT.md để hiểu sản phẩm và phạm vi.
- Đọc DESIGN.md để hiểu hệ thống thiết kế.
- Các đường dẫn trên tính từ thư mục gốc chứa AGENTS.md.
- Giữ nguyên các quyết định thiết kế đã chốt trong DESIGN.md và phân biệt rõ với các thông số được phép dựng thử hoặc đang đề xuất. Phần còn là đề xuất chỉ áp dụng khi người dùng yêu cầu.

## Công nghệ và mã nguồn

- Thư mục chứa AGENTS.md, PRODUCT.md và DESIGN.md là thư mục gốc mã nguồn website (`index.html`, `pages/`, `assets/`, `templates/`).
- Chỉ dùng HTML5, CSS3 và JavaScript thuần.
- Không tự thêm framework hoặc thư viện CSS.
- Giao diện hỗ trợ tiếng Việt và tiếng Anh. Giữ nhất quán typography/component giữa hai ngôn ngữ; nội dung trao đổi với người dùng mặc định bằng tiếng Việt.
- Giữ cấu trúc, nội dung và nghiệp vụ ngoài phạm vi nhiệm vụ.

## Phân vai công cụ

- UI/UX Pro Max hỗ trợ đề xuất thiết kế ban đầu và tra cứu UX.
- DESIGN.md ghi các quyết định thiết kế dùng chung.
- Impeccable rà soát và tinh chỉnh sau khi trang hoạt động.
- Giữ hook tự động của Impeccable tắt.
- Không chọn lại màu, font và phong cách cho từng trang.

## Triển khai và kiểm tra

- Tái sử dụng CSS variables và thành phần dùng chung.
- Thay đổi quy chuẩn chung phải cập nhật DESIGN.md
  và CSS tương ứng.
- Kiểm tra responsive, bàn phím, focus và lỗi nhập liệu
  phù hợp với thay đổi.
- Phân biệt dữ liệu mẫu với chức năng thực tế.
- Không báo thao tác thành công khi chưa có xử lý.
