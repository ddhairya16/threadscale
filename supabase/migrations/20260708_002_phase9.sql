-- =============================================================
-- Migration 007: Phase 9 Schema Updates (Payouts & Profile)
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Profiles Table Updates
-- Add payment details for the contributor QR code workflow
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'upi',
ADD COLUMN IF NOT EXISTS account_holder_name TEXT,
ADD COLUMN IF NOT EXISTS payment_qr_ref JSONB;

-- ─────────────────────────────────────────────────────────────
-- 2. Trigger Fix: Snapshot Task Reward Instead of Contributor Rate
-- In Phase 9 we agreed that assignments should simply inherit the
-- exact reward specified by the admin on the task.
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.snapshot_assignment_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_base_reward NUMERIC(12,2);
BEGIN
  -- Get the base_reward_inr explicitly set on the task
  SELECT base_reward_inr INTO v_base_reward
  FROM public.tasks
  WHERE id = NEW.task_id;

  IF v_base_reward IS NULL THEN
    -- Fallback to 0 if for some reason the task doesn't have it, but tasks table enforces NOT NULL
    v_base_reward := 0;
  END IF;

  -- Set the assignment's rate to match the task's reward
  NEW.rate_snapshot_inr := v_base_reward;
  RETURN NEW;
END;
$$;

-- Note: No need to recreate the trigger trg_assignments_snapshot_rate itself 
-- because we just OR REPLACE'd the function it executes.

-- ─────────────────────────────────────────────────────────────
-- 3. Note on assignment_status
-- We are deprecating the use of the 'paid' enum value in 
-- assignment_status to separate assignment lifecycle from 
-- payment lifecycle. The 'payments' table will track payment status.
-- ─────────────────────────────────────────────────────────────
