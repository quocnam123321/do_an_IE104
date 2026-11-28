UPDATE accounts
SET status = 'active'
WHERE role = 'lecturer' AND status = 'pending_approval';
