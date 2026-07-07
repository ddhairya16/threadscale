-- =============================================================
-- Migration 001: Custom ENUM Types
-- =============================================================
-- Enums enforce valid values at the database level.
-- Using enums instead of TEXT + CHECK means:
--   1. Invalid values are caught by PostgreSQL, not just the app
--   2. Type information is visible in pg_type and Supabase UI
--   3. Generated TypeScript types are more specific (union types)
-- =============================================================

-- User roles
CREATE TYPE public.user_role AS ENUM (
  'contributor',  -- Standard platform contributor
  'admin',        -- Platform administrator (full access)
  'client'        -- Future: business client portal (not built yet)
);

-- User account status
CREATE TYPE public.user_status AS ENUM (
  'active',
  'suspended',    -- Temporarily blocked; can be re-activated
  'blacklisted'   -- Permanently banned
);

-- Reddit account verification status
CREATE TYPE public.reddit_verification AS ENUM (
  'unverified',   -- Default: not yet reviewed
  'pending',      -- Admin review in progress
  'verified',     -- Account approved for use
  'rejected'      -- Failed verification
);

-- Task type (determines copy UI template and default rates)
CREATE TYPE public.task_type AS ENUM (
  'comment',
  'post',
  'moderation'
);

-- Task lifecycle
CREATE TYPE public.task_status AS ENUM (
  'draft',            -- Created but not yet published
  'open',             -- Accepting new assignments
  'fully_assigned',   -- All slots filled; no new assignments
  'completed',        -- All assignments approved
  'cancelled'         -- Removed by admin
);

-- Assignment lifecycle
CREATE TYPE public.assignment_status AS ENUM (
  'assigned',       -- Assigned, not yet started
  'in_progress',    -- Contributor marked as started
  'submitted',      -- Proof submitted, pending review
  'under_review',   -- Admin opened the submission
  'approved',       -- Admin approved the work
  'rejected',       -- Admin rejected (contributor can resubmit)
  'paid'            -- Payment processed
);

-- Submission review status
CREATE TYPE public.submission_status AS ENUM (
  'pending',
  'under_review',
  'approved',
  'rejected'
);

-- Payment type
CREATE TYPE public.payment_type AS ENUM (
  'task',            -- Payment for completing a task
  'referral_bonus'   -- Bonus for referring a new contributor
);

-- Payment lifecycle
CREATE TYPE public.payment_status AS ENUM (
  'pending',   -- Awaiting admin approval
  'approved',  -- Admin approved; transfer not yet sent
  'paid'       -- Payment confirmed sent to contributor
);

-- Referral bonus status
CREATE TYPE public.referral_status AS ENUM (
  'pending',  -- Referred user has not completed first task yet
  'awarded',  -- Bonus payment has been made
  'revoked'   -- Admin revoked the bonus
);
