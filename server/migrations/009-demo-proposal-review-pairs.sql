CREATE TABLE demo_proposal_review_pairs (
  student_username text PRIMARY KEY,
  lecturer_username text NOT NULL
);

INSERT INTO demo_proposal_review_pairs (student_username, lecturer_username)
VALUES ('sv2', 'gv2');

CREATE FUNCTION demo_proposal_reviewer(student_account uuid) RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT lecturer.id
  FROM accounts AS student
  JOIN demo_proposal_review_pairs AS pair ON pair.student_username = student.username
  JOIN accounts AS lecturer ON lecturer.username = pair.lecturer_username
  WHERE student.id = student_account AND student.role = 'student' AND NOT student.is_demo
    AND lecturer.role = 'lecturer' AND lecturer.status = 'active' AND NOT lecturer.is_demo
    AND (lecturer.password_hash IS NOT NULL
      OR EXISTS (SELECT 1 FROM google_identities WHERE account_id = lecturer.id));
$$;
