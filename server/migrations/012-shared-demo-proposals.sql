ALTER TABLE proposals
  DROP CONSTRAINT proposals_decision_actor,
  ADD CONSTRAINT proposals_decision_actor CHECK (
    decided_by_account_id IS NULL OR (
      decided_at IS NOT NULL AND (
        demo_directory_id IS NOT NULL
        OR decided_by_account_id = lecturer_account_id
        OR decided_by_account_id IS NOT DISTINCT FROM reviewer_account_id
      )
    )
  );

CREATE INDEX proposals_shared_demo_timeline_idx ON proposals (created_at DESC, id)
  WHERE demo_directory_id IS NOT NULL;
