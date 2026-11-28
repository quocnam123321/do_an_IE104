CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL UNIQUE REFERENCES proposals (id),
  supervisor_account_id uuid NOT NULL REFERENCES accounts (id),
  status text NOT NULL DEFAULT 'dang-thuc-hien' CHECK (status IN ('dang-thuc-hien', 'hoan-thanh')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX projects_supervisor_timeline_idx ON projects (supervisor_account_id, created_at DESC);

CREATE TABLE project_members (
  project_id uuid NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position > 0),
  account_id uuid REFERENCES accounts (id),
  student_code text NOT NULL,
  display_name text NOT NULL CHECK (btrim(display_name) <> ''),
  role text NOT NULL CHECK (role IN ('nhom-truong', 'thanh-vien')),
  PRIMARY KEY (project_id, position)
);

CREATE UNIQUE INDEX project_members_leader_key ON project_members (project_id) WHERE role = 'nhom-truong';
CREATE UNIQUE INDEX project_members_account_key ON project_members (account_id, project_id) WHERE account_id IS NOT NULL;

CREATE FUNCTION create_project_from_proposal(approved proposals) RETURNS void LANGUAGE sql AS $$
  WITH project AS (
    -- Giữ UUID để liên kết DT-DX trước đây vẫn mở cùng đề tài.
    INSERT INTO projects (id, proposal_id, supervisor_account_id, created_at)
    VALUES (approved.id, approved.id, COALESCE(approved.decided_by_account_id, approved.lecturer_account_id), approved.decided_at)
    ON CONFLICT (proposal_id) DO NOTHING
    RETURNING id
  ), outlined AS (
    SELECT member, position
    FROM jsonb_array_elements(
      CASE WHEN jsonb_typeof(approved.content #> '{outline,members}') = 'array'
        THEN approved.content #> '{outline,members}' ELSE '[]'::jsonb END
    ) WITH ORDINALITY AS item (member, position)
  ), leader AS (
    SELECT member FROM outlined WHERE member->>'role' = 'nhom-truong' ORDER BY position LIMIT 1
  )
  INSERT INTO project_members (project_id, position, account_id, student_code, display_name, role)
  SELECT project.id, 1, student.id, COALESCE(leader.member->>'code', ''),
    COALESCE(NULLIF(btrim(leader.member->>'name'), ''), student.display_name, student.username, student.email, 'Chưa có thông tin'),
    'nhom-truong'
  FROM project
  JOIN accounts AS student ON student.id = approved.student_account_id
  LEFT JOIN leader ON true
  UNION ALL
  SELECT project.id, (row_number() OVER (ORDER BY outlined.position))::integer + 1, NULL,
    COALESCE(outlined.member->>'code', ''), COALESCE(NULLIF(btrim(outlined.member->>'name'), ''), 'Chưa có thông tin'),
    'thanh-vien'
  FROM project CROSS JOIN outlined
  WHERE outlined.member->>'role' = 'thanh-vien';
$$;

CREATE FUNCTION save_approved_project() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM create_project_from_proposal(NEW);
  RETURN NEW;
END;
$$;

CREATE TRIGGER proposals_save_approved_project
  AFTER INSERT OR UPDATE OF status ON proposals
  FOR EACH ROW WHEN (NEW.status = 'da-duyet')
  EXECUTE FUNCTION save_approved_project();

SELECT create_project_from_proposal(proposals) FROM proposals WHERE status = 'da-duyet';
