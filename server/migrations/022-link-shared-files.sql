ALTER TABLE proposals
  ADD COLUMN attachment_file_id uuid REFERENCES files (id),
  ADD COLUMN cover_file_id uuid REFERENCES files (id);

ALTER TABLE lecturer_topics
  ADD COLUMN attachment_file_id uuid REFERENCES files (id),
  ADD COLUMN cover_file_id uuid REFERENCES files (id);

ALTER TABLE accounts ADD COLUMN avatar_file_id uuid REFERENCES files (id);

-- Existing download IDs also identify the copied files.
INSERT INTO files (id, file_name, content, created_at)
SELECT attachment.id, attachment.file_name, attachment.content, submission.submitted_at
FROM project_submission_files AS attachment
JOIN project_submissions AS submission ON submission.id = attachment.submission_id;

INSERT INTO files (id, file_name, content, created_at)
SELECT attachment.id, attachment.file_name, attachment.content,
  COALESCE((SELECT min(published_at) FROM project_evaluations WHERE attachment_id = attachment.id), now())
FROM project_evaluation_attachments AS attachment;

INSERT INTO files (id, file_name, content, created_at)
SELECT id, file_name, file_content, sent_at
FROM supervision_invitation_messages WHERE file_content IS NOT NULL;

ALTER TABLE project_submission_files
  ADD FOREIGN KEY (id) REFERENCES files (id),
  DROP COLUMN size_bytes,
  DROP COLUMN file_name,
  DROP COLUMN content;

ALTER TABLE project_evaluation_attachments
  ADD FOREIGN KEY (id) REFERENCES files (id),
  DROP COLUMN size_bytes,
  DROP COLUMN file_name,
  DROP COLUMN content;

ALTER TABLE supervision_invitation_messages ADD COLUMN file_id uuid REFERENCES files (id);
UPDATE supervision_invitation_messages SET file_id = id WHERE file_content IS NOT NULL;
ALTER TABLE supervision_invitation_messages
  DROP COLUMN size_bytes,
  DROP COLUMN file_name,
  DROP COLUMN file_content;
