ALTER TABLE projects
  DROP CONSTRAINT projects_source_check,
  ADD COLUMN demo_catalog_id text UNIQUE,
  ADD CONSTRAINT projects_source_check CHECK (num_nonnulls(proposal_id, registration_id, demo_catalog_id) = 1);

-- Các đề tài đang thực hiện trong danh mục mẫu dùng chung của hai vai trò.
INSERT INTO projects (demo_catalog_id, supervisor_account_id)
SELECT sample.id, lecturer.id
FROM (VALUES
  ('UIT-SV-ISE-001'), ('UIT-SV-ISE-002'), ('UIT-SV-ISE-003'), ('UIT-SV-ISE-016'),
  ('UIT-SV-ISEDATN-001'), ('UIT-SV-ISEDATN-002'), ('UIT-SV-ISEDATN-003'), ('UIT-SV-ISEDATN-005'),
  ('UIT-SV-ISEDAMH-004'), ('UIT-SV-ISEDAMH-007'), ('UIT-SV-ISEDAMH-008'), ('UIT-SV-ISEDAMH-009'),
  ('UIT-SV-ISEDAMH-010'), ('UIT-SV-ISEDAMH-011'), ('UIT-SV-ISEDAMH-012'), ('UIT-SV-ISEDAMH-013'),
  ('UIT-SV-ISEDAMH-014'), ('UIT-SV-ISEDAMH-015')
) AS sample(id)
CROSS JOIN accounts AS lecturer
WHERE lecturer.is_demo AND lecturer.role = 'lecturer';
