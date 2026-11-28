ALTER TABLE projects ADD COLUMN demo_team_snapshot jsonb;

-- Giữ nguyên danh sách của danh mục mẫu khi chuyển nhóm sang PostgreSQL.
WITH sample(catalog_id, title, lecturer, max_members, members) AS (VALUES
  ('UIT-SV-ISE-001', 'Xây dựng mô hình dự đoán kết quả thi đấu bóng đá', 'Nguyễn Gia Tuấn Anh', 3, '[{"code":"24520001","name":"Văn Cặp Hùng","role":"nhom-truong"}]'::jsonb),
  ('UIT-SV-ISE-002', 'Nhận diện tính xây dựng và tính độc hại của bình luận Tiếng Việt', 'Nguyễn Thị Anh Thư', 3, '[{"code":"24520001","name":"Nguyễn Thành Luân","role":"nhom-truong"}]'::jsonb),
  ('UIT-SV-ISE-003', 'Dự đoán chuỗi hành động liên quan tới nhau của con người', 'Võ Tấn Khoa', 3, '[{"code":"24520001","name":"Bùi Thị Ngọc Mai","role":"nhom-truong"}]'::jsonb),
  ('UIT-SV-ISE-016', 'Xây dựng hệ thống quản lý và truy xuất nguồn gốc thực phẩm trên nền tảng website áp dụng công nghệ blockchain', 'Võ Tấn Khoa', 3, '[{"code":"24520001","name":"Lê Trung Kiên","role":"nhom-truong"},{"code":"24520002","name":"Trần Ngọc Duy","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDATN-001', 'Xây dựng hệ thống quản lý mượn và trả thiết bị phòng thí nghiệm', 'Lưu Thanh Sơn', 3, '[{"code":"24520001","name":"Đặng Minh Khôi","role":"nhom-truong"},{"code":"24520002","name":"Lê Ngọc Hà My","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDATN-002', 'Xây dựng cổng quản lý thực tập và đánh giá sinh viên', 'Tạ Thu Thủy', 3, '[{"code":"24520001","name":"Trần Gia Phúc","role":"nhom-truong"},{"code":"24520002","name":"Nguyễn Thảo An","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDATN-003', 'Xây dựng hệ thống số hóa và tra cứu văn bản nội bộ', 'Nguyễn Gia Tuấn Anh', 3, '[{"code":"24520001","name":"Phạm Hải Đăng","role":"nhom-truong"},{"code":"24520002","name":"Võ Khánh Linh","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDATN-005', 'Cổng hỗ trợ sinh viên tìm kiếm và đăng ký hoạt động tình nguyện', 'Võ Tấn Khoa', 3, '[{"code":"24520001","name":"Lê Hoàng Phúc","role":"nhom-truong"},{"code":"24520002","name":"Phạm Thảo Vy","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-004', 'Website trao đổi giáo trình và sách cũ cho sinh viên', 'Võ Tấn Khoa', 3, '[{"code":"24520001","name":"Đặng Quốc Bảo","role":"nhom-truong"},{"code":"24520002","name":"Mai Phương Anh","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-007', 'Website giới thiệu và đăng ký workshop kỹ năng số', 'Võ Tấn Khoa', 3, '[{"code":"24520001","name":"Tạ Hoàng Nam","role":"nhom-truong"},{"code":"24520002","name":"Đinh Thùy Dương","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-008', 'Thiết kế cơ sở dữ liệu quản lý đặt suất ăn tại căn tin', 'Nguyễn Gia Tuấn Anh', 3, '[{"code":"24520001","name":"Cao Minh Triết","role":"nhom-truong"},{"code":"24520002","name":"Hồ Ngọc Hân","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-009', 'Thiết kế hạ tầng công nghệ thông tin cho trung tâm đào tạo quy mô nhỏ', 'Nguyễn Thị Anh Thư', 3, '[{"code":"24520001","name":"Phạm Minh Đức","role":"nhom-truong"},{"code":"24520002","name":"Trần Thị B","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-010', 'Khảo sát và đề xuất phương án nâng cấp hạ tầng CNTT cho thư viện trường học', 'Nguyễn Thị Anh Thư', 3, '[{"code":"24520001","name":"Nguyễn Hoàng Phúc","role":"nhom-truong"},{"code":"24520002","name":"Trần Thị B","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-011', 'Hệ thống tổ chức và tra cứu hồ sơ hoạt động câu lạc bộ sinh viên', 'Nguyễn Gia Tuấn Anh', 3, '[{"code":"24520001","name":"Lê Quốc Huy","role":"nhom-truong"},{"code":"24520002","name":"Trần Thị B","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-012', 'Tích hợp và quản lý thông tin học bổng từ nhiều nguồn dữ liệu', 'Nguyễn Gia Tuấn Anh', 3, '[{"code":"24520001","name":"Đỗ Tuấn Kiệt","role":"nhom-truong"},{"code":"24520002","name":"Trần Thị B","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-013', 'Xây dựng mô hình phân quyền và kiểm soát truy cập tài liệu nội bộ', 'Lưu Thanh Sơn', 3, '[{"code":"24520001","name":"Trương Gia Bảo","role":"nhom-truong"},{"code":"24520002","name":"Trần Thị B","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-014', 'Thiết kế phương án bảo vệ mạng nội bộ cho văn phòng nhỏ', 'Lưu Thanh Sơn', 3, '[{"code":"24520001","name":"Bùi Nhật Minh","role":"nhom-truong"},{"code":"24520002","name":"Trần Thị B","role":"thanh-vien"}]'::jsonb),
  ('UIT-SV-ISEDAMH-015', 'Phân tích và thiết kế phần mềm quản lý lịch tư vấn học tập', 'Nguyễn Gia Tuấn Anh', 3, '[{"code":"24520001","name":"Phạm Minh Đức","role":"nhom-truong"},{"code":"24520002","name":"Trần Thị B","role":"thanh-vien"}]'::jsonb)
), seeded AS (
  UPDATE projects AS project
  SET demo_team_snapshot = jsonb_build_object(
    'title', sample.title, 'lecturer', sample.lecturer, 'maxMembers', sample.max_members)
  FROM sample
  WHERE project.demo_catalog_id = sample.catalog_id
  RETURNING project.id, project.demo_catalog_id
)
INSERT INTO project_members (project_id, position, student_code, display_name, role)
SELECT seeded.id, entry.position, entry.member->>'code', entry.member->>'name', entry.member->>'role'
FROM seeded JOIN sample ON sample.catalog_id = seeded.demo_catalog_id
CROSS JOIN LATERAL jsonb_array_elements(sample.members) WITH ORDINALITY AS entry(member, position)
ON CONFLICT (project_id, position) DO NOTHING;
