-- =============================================================
-- Migration 005: Row Level Security Policies
-- =============================================================
-- Security principle: authorization lives in the DATABASE,
-- not just in the frontend or API layer.
--
-- Even if someone bypasses the Next.js middleware or API route
-- checks (e.g. by calling Supabase directly with the anon key),
-- RLS policies still prevent unauthorized data access.
--
-- Policy naming convention: <table>_<operation>_<who>
--   e.g. profiles_select_own, tasks_all_admin
--
-- Helper function: public.get_my_role()
--   Returns the current user's role from their profile row.
--   Used in policies to check admin access without joining profiles.
-- =============================================================

-- Enable RLS on every table
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reddit_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_templates     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributor_rates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_revenue     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drive_folder_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────
-- Helper function: current user's role
-- STABLE = can be called multiple times per query without re-executing
-- SECURITY DEFINER = runs as the function owner, can see all profiles
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────
-- profiles
-- Contributors: read/update own row (limited fields via API)
-- Admin: read/update all rows
-- ─────────────────────────────────────────────────────────────
CREATE POLICY profiles_select_own
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY profiles_select_admin
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY profiles_update_own
  ON public.profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
  -- Note: API route enforces that contributors cannot change role/status.
  -- Database-level column restriction would require generated columns or views.

CREATE POLICY profiles_update_admin
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- reddit_accounts
-- Note: admin_notes column is sensitive. The API route selects
-- only non-sensitive columns when responding to contributors.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY reddit_accounts_select_own
  ON public.reddit_accounts FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY reddit_accounts_select_admin
  ON public.reddit_accounts FOR SELECT
  USING (public.get_my_role() = 'admin');

CREATE POLICY reddit_accounts_insert_own
  ON public.reddit_accounts FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY reddit_accounts_update_own
  ON public.reddit_accounts FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY reddit_accounts_update_admin
  ON public.reddit_accounts FOR UPDATE
  USING (public.get_my_role() = 'admin');

CREATE POLICY reddit_accounts_delete_own
  ON public.reddit_accounts FOR DELETE
  USING (profile_id = auth.uid());

CREATE POLICY reddit_accounts_delete_admin
  ON public.reddit_accounts FOR DELETE
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- clients — Admin only. Contributors see NOTHING.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY clients_all_admin
  ON public.clients FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- client_users — Admin only
-- ─────────────────────────────────────────────────────────────
CREATE POLICY client_users_all_admin
  ON public.client_users FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- projects — Admin only. Contributors see NOTHING.
-- ─────────────────────────────────────────────────────────────
CREATE POLICY projects_all_admin
  ON public.projects FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- task_templates — Admin only
-- ─────────────────────────────────────────────────────────────
CREATE POLICY task_templates_all_admin
  ON public.task_templates FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- contributor_rates
-- Contributors: read only their own rates (and global defaults)
-- Admin: full control
-- ─────────────────────────────────────────────────────────────
CREATE POLICY rates_select_contributor
  ON public.contributor_rates FOR SELECT
  USING (
    profile_id = auth.uid()   -- Their own override
    OR profile_id IS NULL     -- Global defaults (visible to all)
  );

CREATE POLICY rates_all_admin
  ON public.contributor_rates FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- tasks
-- Contributors see:
--   - Any task with status = 'open'
--   - Any task they are assigned to (regardless of status)
-- Contributors NEVER see: project_id, internal_notes
-- (These are excluded by the API route's SELECT query)
-- ─────────────────────────────────────────────────────────────
CREATE POLICY tasks_select_contributor
  ON public.tasks FOR SELECT
  USING (
    status = 'open'
    OR id IN (
      SELECT task_id FROM public.assignments
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY tasks_all_admin
  ON public.tasks FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- assignments
-- Contributors: read own, update own (status to 'in_progress' only)
-- Admin: full control
-- ─────────────────────────────────────────────────────────────
CREATE POLICY assignments_select_own
  ON public.assignments FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY assignments_update_own
  ON public.assignments FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (
    profile_id = auth.uid()
    AND status = 'in_progress'  -- Contributors can only set to in_progress
  );

CREATE POLICY assignments_all_admin
  ON public.assignments FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- submissions
-- Contributors: read own, insert own
-- Admin: full control
-- ─────────────────────────────────────────────────────────────
CREATE POLICY submissions_select_own
  ON public.submissions FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY submissions_insert_own
  ON public.submissions FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY submissions_all_admin
  ON public.submissions FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- insights
-- Contributors: full control of own insights
-- Admin: full control
-- ─────────────────────────────────────────────────────────────
CREATE POLICY insights_own
  ON public.insights FOR ALL
  USING (profile_id = auth.uid());

CREATE POLICY insights_all_admin
  ON public.insights FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- payments
-- Contributors: read own payments only (cannot modify)
-- Admin: full control
-- ─────────────────────────────────────────────────────────────
CREATE POLICY payments_select_own
  ON public.payments FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY payments_all_admin
  ON public.payments FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- referrals
-- Contributors: read own referrals (as referrer only)
-- Admin: full control
-- ─────────────────────────────────────────────────────────────
CREATE POLICY referrals_select_own
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid());

CREATE POLICY referrals_all_admin
  ON public.referrals FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- notifications
-- Contributors: read own, mark as read (UPDATE is_read only)
-- Admin: full control
-- ─────────────────────────────────────────────────────────────
CREATE POLICY notifications_select_own
  ON public.notifications FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY notifications_update_own
  ON public.notifications FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY notifications_all_admin
  ON public.notifications FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- client_revenue — Admin only
-- ─────────────────────────────────────────────────────────────
CREATE POLICY client_revenue_all_admin
  ON public.client_revenue FOR ALL
  USING (public.get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- drive_folder_cache
-- No user-level access. Service role only (used by API routes).
-- Service role bypasses RLS automatically.
-- No policies needed \u2014 absence of policies = no access for users.
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- audit_logs
-- Admin: read only (no writes via RLS \u2014 only service role can INSERT)
-- Contributors: no access
-- ─────────────────────────────────────────────────────────────
CREATE POLICY audit_logs_select_admin
  ON public.audit_logs FOR SELECT
  USING (public.get_my_role() = 'admin');

-- No INSERT/UPDATE/DELETE policies for any user.
-- Only the service role (used in API routes via createAdminClient)
-- can write to audit_logs.
