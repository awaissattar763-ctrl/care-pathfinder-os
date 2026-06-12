-- RBAC hardening: index for access-control audit queries
-- (admin screen filters audit_logs by action + recency)
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON public.audit_logs (action, created_at DESC);

-- No schema changes required: user_roles, app_role enum, has_role(),
-- audit_logs, and admin-only RLS policies on user_roles already exist.
