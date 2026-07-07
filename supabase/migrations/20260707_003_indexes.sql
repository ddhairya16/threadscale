-- =============================================================
-- Migration 003: Indexes
-- =============================================================
-- Every index has a comment explaining which query it supports.
-- Partial indexes (WHERE clause) are used where possible to keep
-- index size small \u2014 they only index rows that will be queried.
-- =============================================================

-- ── profiles ─────────────────────────────────────────────────

-- Fast email lookup (login, admin search)
CREATE INDEX idx_profiles_email
  ON public.profiles(email);

-- Discord notification routing
CREATE INDEX idx_profiles_discord_id
  ON public.profiles(discord_id)
  WHERE discord_id IS NOT NULL;

-- Referral link signup: /join?ref=CODE
CREATE INDEX idx_profiles_referral_code
  ON public.profiles(referral_code);

-- ── reddit_accounts ──────────────────────────────────────────

-- Admin username search across all accounts
CREATE INDEX idx_reddit_accounts_username
  ON public.reddit_accounts(username);

-- Contributor's active account list (dashboard)
CREATE INDEX idx_reddit_accounts_profile_active
  ON public.reddit_accounts(profile_id)
  WHERE is_active = TRUE;

-- ── tasks ────────────────────────────────────────────────────

-- Open task discovery \u2014 the most common contributor query
-- Partial index keeps this very fast even with many cancelled/completed tasks
CREATE INDEX idx_tasks_open
  ON public.tasks(created_at DESC)
  WHERE status = 'open';

-- Task type + status filter (admin list)
CREATE INDEX idx_tasks_type_status
  ON public.tasks(task_type, status);

-- Full-text search on title + instructions
CREATE INDEX idx_tasks_search
  ON public.tasks USING GIN(search_vector);

-- Admin: all tasks ordered by creation date
CREATE INDEX idx_tasks_created_at
  ON public.tasks(created_at DESC);

-- Project tasks (admin project view)
CREATE INDEX idx_tasks_project
  ON public.tasks(project_id, created_at DESC);

-- ── contributor_rates ────────────────────────────────────────

-- Effective rate lookup at assignment time
-- Query: task_type=comment, profile_id=X OR NULL, ORDER BY profile_id NULLS LAST, effective_from DESC
CREATE INDEX idx_rates_lookup
  ON public.contributor_rates(task_type, profile_id, effective_from DESC);

-- ── assignments ──────────────────────────────────────────────

-- Contributor dashboard: "my assignments by status"
CREATE INDEX idx_assignments_profile_status
  ON public.assignments(profile_id, status);

-- Cron: find assignments approaching deadline for reminders
-- Partial index: only active assignments matter for deadline tracking
CREATE INDEX idx_assignments_deadline
  ON public.assignments(deadline_at)
  WHERE status IN ('assigned', 'in_progress');

-- Admin: all assignments for a task
CREATE INDEX idx_assignments_task
  ON public.assignments(task_id);

-- Admin: assignments by status
CREATE INDEX idx_assignments_status
  ON public.assignments(status, created_at DESC);

-- ── submissions ──────────────────────────────────────────────

-- Admin review queue: pending submissions
-- Partial index on only the rows that need review
CREATE INDEX idx_submissions_review_queue
  ON public.submissions(submitted_at DESC)
  WHERE status IN ('pending', 'under_review');

-- Cron retry: approved submissions not yet logged to Google Sheets
CREATE INDEX idx_submissions_sheets_retry
  ON public.submissions(submitted_at)
  WHERE sheets_logged = FALSE AND status = 'approved';

-- All submissions for an assignment (contributor history)
CREATE INDEX idx_submissions_assignment
  ON public.submissions(assignment_id, attempt_number DESC);

-- Contributor's submission history
CREATE INDEX idx_submissions_profile
  ON public.submissions(profile_id, submitted_at DESC);

-- ── payments ─────────────────────────────────────────────────

-- Contributor payment history
CREATE INDEX idx_payments_profile_status
  ON public.payments(profile_id, status);

-- Admin: pending payment approval queue
CREATE INDEX idx_payments_pending
  ON public.payments(created_at DESC)
  WHERE status = 'pending';

-- Admin: approved but not yet paid
CREATE INDEX idx_payments_approved
  ON public.payments(approved_at DESC)
  WHERE status = 'approved';

-- ── notifications ────────────────────────────────────────────

-- Unread badge count \u2014 queried on every page load
-- Partial index: only unread rows counted
CREATE INDEX idx_notifications_unread
  ON public.notifications(profile_id)
  WHERE is_read = FALSE;

-- Contributor notification list (most recent first)
CREATE INDEX idx_notifications_profile
  ON public.notifications(profile_id, created_at DESC);

-- Cron retry: notifications not yet sent to Discord
CREATE INDEX idx_notifications_discord_retry
  ON public.notifications(created_at)
  WHERE discord_sent = FALSE;

-- ── referrals ────────────────────────────────────────────────

-- Admin: pending referral bonuses to award
CREATE INDEX idx_referrals_pending
  ON public.referrals(referrer_id)
  WHERE bonus_status = 'pending';

-- ── audit_logs ───────────────────────────────────────────────

-- Admin: actions by a specific actor
CREATE INDEX idx_audit_actor
  ON public.audit_logs(actor_id, created_at DESC);

-- Admin: actions on a specific resource
CREATE INDEX idx_audit_target
  ON public.audit_logs(target_id, target_type, created_at DESC);

-- Admin: filter by action type
CREATE INDEX idx_audit_action
  ON public.audit_logs(action, created_at DESC);
