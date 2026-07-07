-- =============================================================
-- Migration 006: Seed Data
-- =============================================================
-- This migration:
--   1. Seeds the default contributor rates
--   2. Provides a helper function to promote the first admin user
--
-- IMPORTANT: The admin user (ddhairya16@gmail.com) must sign up
-- via the OTP flow FIRST. The trigger in migration 004 will
-- automatically create their profile row.
--
-- After signing up, run in the Supabase SQL Editor:
--   SELECT public.promote_to_admin('ddhairya16@gmail.com');
-- =============================================================

-- ── Default Rates ────────────────────────────────────────────
-- profile_id = NULL means "global default for all contributors"
-- These rates apply to everyone unless overridden per-contributor.

INSERT INTO public.contributor_rates (profile_id, task_type, rate_inr)
VALUES
  (NULL, 'comment',    25.00),
  (NULL, 'post',       50.00),
  (NULL, 'moderation', 200.00);

-- ── Admin Promotion Function ─────────────────────────────────
-- Promotes any user to admin by email.
-- Run AFTER the user has signed up via OTP.
--
-- Usage from Supabase SQL Editor:
--   SELECT public.promote_to_admin('ddhairya16@gmail.com');

CREATE OR REPLACE FUNCTION public.promote_to_admin(p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE email = lower(trim(p_email));

  IF NOT FOUND THEN
    RAISE EXCEPTION
      'User with email "%" not found. Have they signed up via OTP yet?',
      p_email;
  END IF;

  RAISE NOTICE 'Successfully promoted "%" to admin.', p_email;
END;
$$;

COMMENT ON FUNCTION public.promote_to_admin IS
  'Promotes a user to admin role. Run after first OTP login: SELECT promote_to_admin(''email@example.com'');';
