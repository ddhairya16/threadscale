-- =============================================================
-- Migration 004: Triggers & Functions
-- =============================================================
-- All functions are created with SECURITY DEFINER where they
-- need elevated privileges (e.g. writing to auth schema).
--
-- Every trigger has a single responsibility.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Helper: Auto-update updated_at on any table
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with an updated_at column
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_reddit_accounts_updated_at
  BEFORE UPDATE ON public.reddit_accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_task_templates_updated_at
  BEFORE UPDATE ON public.task_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_insights_updated_at
  BEFORE UPDATE ON public.insights
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_client_revenue_updated_at
  BEFORE UPDATE ON public.client_revenue
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─────────────────────────────────────────────────────────────
-- Trigger: Auto-create profile on new user signup
--
-- When a user signs up via Supabase OTP, this trigger:
--   1. Generates a unique referral code
--   2. Creates a profile row
--   3. If a referral code was passed in metadata, links the referral
--
-- The referral code is passed as user_metadata when calling
-- supabase.auth.signInWithOtp({ options: { data: { referral_code: 'ABC12345' } } })
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral_code  TEXT;
  v_referred_by_id UUID;
  v_ref_code       TEXT;
BEGIN
  -- Generate a unique 8-character referral code
  -- Uses unambiguous characters (no 0, O, I, 1, L)
  LOOP
    SELECT upper(
      translate(
        substr(encode(extensions.gen_random_bytes(6), 'base64'), 1, 8),
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
        'ABCDEFGHJKMNPQRSTUVWXYZ23456789ABCDEFGHJKMNPQRSTUVWXYZ23456789'
      )
    ) INTO v_referral_code;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.profiles WHERE referral_code = v_referral_code
    );
  END LOOP;

  -- Check if a referral code was passed in user metadata at signup
  v_ref_code := NEW.raw_user_meta_data->>'referral_code';
  IF v_ref_code IS NOT NULL AND v_ref_code != '' THEN
    SELECT id INTO v_referred_by_id
    FROM public.profiles
    WHERE referral_code = upper(trim(v_ref_code));
  END IF;

  -- Create profile row
  INSERT INTO public.profiles (
    id,
    email,
    referral_code,
    referred_by_id
  ) VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_referral_code,
    v_referred_by_id
  );

  -- Create referral record if they signed up via a referral link
  IF v_referred_by_id IS NOT NULL THEN
    INSERT INTO public.referrals (referrer_id, referred_id)
    VALUES (v_referred_by_id, NEW.id)
    ON CONFLICT (referred_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- Trigger: Snapshot contributor rate at assignment time
--
-- WHY THIS EXISTS:
-- Rates can change at any time (per-contributor overrides, global changes).
-- If we calculated the rate at payment time, an admin changing a rate
-- would retroactively change what old assignments pay. That's wrong.
-- By snapshotting at assignment time, historical accuracy is guaranteed.
--
-- HOW IT WORKS:
-- Priority: user-specific rate > global default
-- Recency:  most recently effective rate wins
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.snapshot_assignment_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_task_type  public.task_type;
  v_rate       NUMERIC(12,2);
BEGIN
  -- Get the task type for this assignment
  SELECT task_type INTO v_task_type
  FROM public.tasks
  WHERE id = NEW.task_id;

  -- Find the effective rate:
  --   1. Look for a contributor-specific override first (profile_id = this user)
  --   2. Fall back to the global default (profile_id IS NULL)
  --   In both cases: most recent effective_from wins
  SELECT rate_inr INTO v_rate
  FROM public.contributor_rates
  WHERE task_type = v_task_type
    AND (profile_id = NEW.profile_id OR profile_id IS NULL)
  ORDER BY
    CASE WHEN profile_id = NEW.profile_id THEN 0 ELSE 1 END,
    effective_from DESC
  LIMIT 1;

  IF v_rate IS NULL THEN
    RAISE EXCEPTION
      'No rate found for task_type=%. Run migration 006 to seed default rates.',
      v_task_type;
  END IF;

  NEW.rate_snapshot_inr := v_rate;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assignments_snapshot_rate
  BEFORE INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_assignment_rate();

-- ─────────────────────────────────────────────────────────────
-- Trigger: Set assignment deadline at insert time
-- deadline_at = NOW() + tasks.deadline_hours
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_assignment_deadline()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_deadline_hours INTEGER;
BEGIN
  SELECT deadline_hours INTO v_deadline_hours
  FROM public.tasks
  WHERE id = NEW.task_id;

  NEW.deadline_at := NOW() + (v_deadline_hours || ' hours')::INTERVAL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assignments_set_deadline
  BEFORE INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.set_assignment_deadline();

-- ─────────────────────────────────────────────────────────────
-- Trigger: Auto-increment submission attempt number
-- Allows unlimited resubmissions (after rejection).
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_submission_attempt_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_attempt INTEGER;
BEGIN
  SELECT COALESCE(MAX(attempt_number), 0) INTO v_max_attempt
  FROM public.submissions
  WHERE assignment_id = NEW.assignment_id;

  NEW.attempt_number := v_max_attempt + 1;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_submissions_attempt_number
  BEFORE INSERT ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_submission_attempt_number();

-- ─────────────────────────────────────────────────────────────
-- Trigger: Sync task status when assignments change
-- open -> fully_assigned when all slots are taken
-- fully_assigned -> completed when all assignments are approved
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_task_status_on_assignment_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_max_assignments INTEGER;
  v_active_count    INTEGER;
  v_approved_count  INTEGER;
  v_new_status      public.task_status;
BEGIN
  SELECT max_assignments INTO v_max_assignments
  FROM public.tasks
  WHERE id = NEW.task_id;

  -- Count assignments that are active (not failed/cancelled)
  SELECT COUNT(*) INTO v_active_count
  FROM public.assignments
  WHERE task_id = NEW.task_id
    AND status NOT IN ('rejected');

  -- Count assignments that are fully done
  SELECT COUNT(*) INTO v_approved_count
  FROM public.assignments
  WHERE task_id = NEW.task_id
    AND status IN ('approved', 'paid');

  -- Determine new task status
  IF v_approved_count >= v_max_assignments THEN
    v_new_status := 'completed';
  ELSIF v_active_count >= v_max_assignments THEN
    v_new_status := 'fully_assigned';
  ELSE
    v_new_status := 'open';
  END IF;

  -- Only update if status actually needs to change
  -- and the task isn't already cancelled/draft
  UPDATE public.tasks
  SET status = v_new_status
  WHERE id = NEW.task_id
    AND status NOT IN ('cancelled', 'draft')
    AND status IS DISTINCT FROM v_new_status;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assignments_sync_task_status
  AFTER INSERT OR UPDATE OF status ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.sync_task_status_on_assignment_change();
