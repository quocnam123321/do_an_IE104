INSERT INTO accounts (username, role, status)
VALUES
  ('demo-sinh-vien', 'student', 'active'),
  ('demo-giang-vien', 'lecturer', 'active'),
  ('demo-quan-tri', 'admin', 'active')
ON CONFLICT (username) DO NOTHING;
