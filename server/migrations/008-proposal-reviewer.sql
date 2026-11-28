ALTER TABLE proposals
  ADD COLUMN reviewer_account_id uuid REFERENCES accounts (id),
  ADD COLUMN decided_by_account_id uuid REFERENCES accounts (id),
  ADD CONSTRAINT proposals_additional_reviewer CHECK (
    reviewer_account_id IS NULL OR (demo_directory_id IS NOT NULL AND reviewer_account_id <> lecturer_account_id)
  ),
  ADD CONSTRAINT proposals_decision_actor CHECK (
    decided_by_account_id IS NULL OR (
      decided_at IS NOT NULL AND (
        decided_by_account_id = lecturer_account_id OR decided_by_account_id IS NOT DISTINCT FROM reviewer_account_id
      )
    )
  );

CREATE INDEX proposals_reviewer_timeline_idx ON proposals (reviewer_account_id, created_at DESC)
  WHERE reviewer_account_id IS NOT NULL;
