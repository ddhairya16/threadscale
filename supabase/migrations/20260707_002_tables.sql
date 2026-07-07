-- =============================================================
-- Migration 002: Tables
-- =============================================================
-- Design rules applied to every table:
--   - UUID primary keys (gen_random_uuid())
--   - TIMESTAMPTZ for all timestamps (timezone-aware)
--   - NUMERIC(12,2) for money (never FLOAT — avoids precision errors)
--   - Explicit ON DELETE action on every foreign key
--   - COMMENT ON COLUMN for any non-obvious field
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- profiles
-- Extends auth.users. One row is created automatically by a
-- trigger (see migration 004) whenever a user signs up via OTP.
-- Never query auth.users directly \u2014 use this table instead.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email             TEXT NOT NULL,
  full_name         TEXT,
  discord_id        TEXT UNIQUE,
  discord_username  TEXT,
  referral_code     TEXT UNIQUE NOT NULL,
  referred_by_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  role              public.user_role    NOT NULL DEFAULT 'contributor',
  status            public.user_status  NOT NULL DEFAULT 'active',
  onboarding_steps  TEXT[]              NOT NULL DEFAULT '{}',
  notify_email      BOOLEAN             NOT NULL DEFAULT TRUE,
  notify_discord    BOOLEAN             NOT NULL DEFAULT TRUE,
  upi_id            TEXT,
  created_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  last_login_at     TIMESTAMPTZ
);

COMMENT ON TABLE public.profiles IS
  'Extended user profile. One row per auth.users entry. Created by trigger on signup.';
COMMENT ON COLUMN public.profiles.referral_code IS
  'Auto-generated unique 8-character code. Used for referral links.';
COMMENT ON COLUMN public.profiles.onboarding_steps IS
  'Completed onboarding steps: ["profile", "reddit_account", "referral_seen"]';
COMMENT ON COLUMN public.profiles.upi_id IS
  'UPI ID for payment transfers (e.g. contributor@upi).';

-- ─────────────────────────────────────────────────────────────
-- reddit_accounts
-- Contributors can have multiple Reddit accounts.
-- admin_notes is hidden from contributors via RLS.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.reddit_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  username              TEXT NOT NULL,
  karma                 INTEGER,
  account_age_days      INTEGER,
  cqs_score             NUMERIC(5,2),
  verification_status   public.reddit_verification NOT NULL DEFAULT 'unverified',
  admin_notes           TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, username)
);

COMMENT ON COLUMN public.reddit_accounts.admin_notes IS
  'Admin-only field. RLS prevents contributors from reading this column.';
COMMENT ON COLUMN public.reddit_accounts.cqs_score IS
  'Comment Quality Score (0\u2013100). Platform-specific metric tracked externally.';

-- ─────────────────────────────────────────────────────────────
-- clients
-- Business clients who commission tasks.
-- COMPLETELY HIDDEN from contributors via RLS.
-- Contributors must never know who the client is.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.clients IS
  'Business clients. NEVER expose to contributors. Admin-only access.';

-- ─────────────────────────────────────────────────────────────
-- client_users
-- Future: portal access for business clients.
-- Designed now so adding the portal later is UI work only,
-- no schema changes required.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.client_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(profile_id, client_id)
);

COMMENT ON TABLE public.client_users IS
  'Future: links business portal users to their client. Schema ready, UI not yet built.';

-- ─────────────────────────────────────────────────────────────
-- projects
-- Each client can have multiple projects.
-- Admin-only. Contributors never see projects.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- task_templates
-- Reusable task blueprints. Admin creates, admin uses.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.task_templates (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  task_type           public.task_type NOT NULL,
  instructions        TEXT NOT NULL,
  subreddit           TEXT,
  post_title          TEXT,
  post_body           TEXT,
  thread_url          TEXT,
  default_reward_inr  NUMERIC(12,2),
  default_deadline_h  INTEGER NOT NULL DEFAULT 24,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- contributor_rates
-- Rate table with global defaults and per-contributor overrides.
--
-- How it works:
--   Effective rate = most recent row WHERE
--     (profile_id = $contributor OR profile_id IS NULL)
--   Ordered by: profile_id NULLS LAST, effective_from DESC
--   → User-specific rate always takes priority over global default.
--
-- This design means you never need to update old rows \u2014
-- just INSERT a new row to change a rate. Full history preserved.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.contributor_rates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE,  -- NULL = global default
  task_type      public.task_type NOT NULL,
  rate_inr       NUMERIC(12,2) NOT NULL CHECK (rate_inr > 0),
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.contributor_rates.profile_id IS
  'NULL = global default for all contributors. Non-null = per-contributor override.';
COMMENT ON COLUMN public.contributor_rates.effective_from IS
  'Rate is valid from this timestamp. Insert a new row to change a rate.';

-- ─────────────────────────────────────────────────────────────
-- tasks
-- Core work unit. Contributors see a filtered view:
--   - No project_id (client identity is hidden)
--   - No internal_notes (admin-only)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  template_id      UUID REFERENCES public.task_templates(id) ON DELETE SET NULL,
  task_type        public.task_type NOT NULL,
  title            TEXT NOT NULL,
  instructions     TEXT NOT NULL,
  subreddit        TEXT,
  thread_url       TEXT,
  post_title       TEXT,
  post_body        TEXT,
  base_reward_inr  NUMERIC(12,2) NOT NULL,
  deadline_hours   INTEGER NOT NULL DEFAULT 24,
  max_assignments  INTEGER NOT NULL DEFAULT 1,
  status           public.task_status NOT NULL DEFAULT 'open',
  internal_notes   TEXT,
  created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Auto-maintained full-text search vector
  search_vector    TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english',
      COALESCE(title, '') || ' ' || COALESCE(instructions, '')
    )
  ) STORED
);

COMMENT ON COLUMN public.tasks.internal_notes IS
  'Admin-only field. RLS ensures contributors never receive this column.';
COMMENT ON COLUMN public.tasks.search_vector IS
  'Generated column for full-text search. Do not write to this column directly.';

-- ─────────────────────────────────────────────────────────────
-- assignments
-- Links a task to a contributor for a specific Reddit account.
--
-- Key invariant: rate_snapshot_inr is set by a database trigger
-- on INSERT and is NEVER updated afterward. This ensures that
-- historical payment amounts are always accurate, even if the
-- contributor's rate changes later.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.assignments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             UUID NOT NULL REFERENCES public.tasks(id) ON DELETE RESTRICT,
  profile_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reddit_account_id   UUID NOT NULL REFERENCES public.reddit_accounts(id) ON DELETE RESTRICT,
  rate_snapshot_inr   NUMERIC(12,2) NOT NULL,   -- Set by trigger; immutable
  status              public.assignment_status NOT NULL DEFAULT 'assigned',
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deadline_at         TIMESTAMPTZ NOT NULL,       -- Set by trigger from tasks.deadline_hours
  started_at          TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  admin_notes         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, profile_id)  -- One assignment per contributor per task
);

COMMENT ON COLUMN public.assignments.rate_snapshot_inr IS
  'Rate locked at assignment time by trigger. Never changes. Historical accuracy guaranteed.';
COMMENT ON COLUMN public.assignments.deadline_at IS
  'Calculated by trigger: assigned_at + tasks.deadline_hours. Always stored in UTC.';

-- ─────────────────────────────────────────────────────────────
-- submissions
-- Records each attempt by a contributor to complete an assignment.
-- Unlimited resubmissions are allowed (after admin rejection).
-- attempt_number is auto-incremented by a database trigger.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.submissions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id      UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  profile_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reddit_url         TEXT NOT NULL,
  detected_type      TEXT,           -- 'post' | 'comment' | 'unknown' (classified server-side)
  screenshot_refs    JSONB NOT NULL DEFAULT '[]',
  insight_text       TEXT,
  contributor_notes  TEXT,
  attempt_number     INTEGER NOT NULL DEFAULT 1,  -- Auto-incremented by trigger
  status             public.submission_status NOT NULL DEFAULT 'pending',
  submitted_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at        TIMESTAMPTZ,
  review_notes       TEXT,
  -- Integration retry flags
  sheets_logged      BOOLEAN NOT NULL DEFAULT FALSE,
  discord_sent       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.submissions.screenshot_refs IS
  'Array of objects: [{drive_id, web_url, filename, size_bytes}]. File references only.';
COMMENT ON COLUMN public.submissions.sheets_logged IS
  'TRUE once successfully appended to Google Sheets. FALSE = needs retry by cron job.';
COMMENT ON COLUMN public.submissions.discord_sent IS
  'TRUE once Discord notification sent. FALSE = needs retry by cron job.';

-- ─────────────────────────────────────────────────────────────
-- insights
-- Standalone research/analysis submitted by contributors.
-- Can be linked to a submission or standalone.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.insights (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id   UUID REFERENCES public.submissions(id) ON DELETE SET NULL,
  text_content    TEXT,
  image_refs      JSONB NOT NULL DEFAULT '[]',
  drive_folder_id TEXT,   -- Google Drive folder ID for this insight's images
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- payments
-- One row per approved assignment or referral bonus.
-- amount_inr comes from assignment.rate_snapshot_inr \u2014 never recalculated.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  assignment_id   UUID UNIQUE REFERENCES public.assignments(id) ON DELETE RESTRICT,
  amount_inr      NUMERIC(12,2) NOT NULL,
  payment_type    public.payment_type   NOT NULL DEFAULT 'task',
  status          public.payment_status NOT NULL DEFAULT 'pending',
  approved_at     TIMESTAMPTZ,
  approved_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_at         TIMESTAMPTZ,
  paid_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_method  TEXT,
  transaction_ref TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.payments.assignment_id IS
  'UNIQUE constraint ensures one payment row per assignment. NULL for referral bonuses.';

-- ─────────────────────────────────────────────────────────────
-- referrals
-- Tracks who referred whom and the bonus status.
-- Bonus is unlocked when referred user completes their first approved assignment.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.referrals (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  referred_id             UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE RESTRICT,
  bonus_amount_inr        NUMERIC(12,2) NOT NULL DEFAULT 25.00,
  bonus_status            public.referral_status NOT NULL DEFAULT 'pending',
  unlocking_assignment_id UUID REFERENCES public.assignments(id) ON DELETE SET NULL,
  awarded_at              TIMESTAMPTZ,
  payment_id              UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  revoked_at              TIMESTAMPTZ,
  revoked_by              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  revoke_reason           TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (referrer_id != referred_id)  -- Cannot refer yourself
);

COMMENT ON COLUMN public.referrals.referred_id IS
  'UNIQUE ensures each user can only be referred once.';
COMMENT ON COLUMN public.referrals.unlocking_assignment_id IS
  'The first approved assignment of the referred user. Triggers the bonus.';

-- ─────────────────────────────────────────────────────────────
-- notifications
-- In-app notifications + Discord send tracking.
-- Append-only from the user's perspective (they cannot delete notifications).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type             TEXT NOT NULL,   -- e.g. 'new_assignment', 'payment_approved'
  title            TEXT NOT NULL,
  body             TEXT,
  action_url       TEXT,
  metadata         JSONB NOT NULL DEFAULT '{}',
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  discord_sent     BOOLEAN NOT NULL DEFAULT FALSE,
  discord_sent_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- client_revenue
-- Admin-entered monthly revenue per client/project.
-- Used to calculate profit margin (revenue - payouts).
-- period_month should always be the first day of the month.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.client_revenue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE RESTRICT,
  project_id   UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  period_month DATE NOT NULL,   -- Always first day of month: e.g. 2026-07-01
  revenue_inr  NUMERIC(12,2) NOT NULL,
  notes        TEXT,
  entered_by   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(client_id, project_id, period_month)
);

COMMENT ON COLUMN public.client_revenue.period_month IS
  'Always the first day of the month. Example: 2026-07-01 not 2026-07-15.';

-- ─────────────────────────────────────────────────────────────
-- drive_folder_cache
-- Caches Google Drive folder IDs to avoid repeated API calls.
-- Without this cache, every upload would require 3\u20135 API calls
-- just to resolve the folder structure.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.drive_folder_cache (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_key        TEXT UNIQUE NOT NULL,    -- e.g. 'task_proofs/2026/July/abc12345'
  drive_folder_id TEXT NOT NULL,           -- Google Drive folder ID
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.drive_folder_cache IS
  'Caches Google Drive folder IDs. Avoids 3\u20135 API calls per upload. Service role only.';

-- ─────────────────────────────────────────────────────────────
-- audit_logs
-- Append-only record of all important admin actions.
-- No UPDATE or DELETE policies exist on this table ever.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE public.audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_role   TEXT,
  action       TEXT NOT NULL,    -- e.g. 'assignment.approve', 'rate.update', 'user.suspend'
  target_type  TEXT,             -- 'assignment' | 'user' | 'payment' | 'rate' | etc.
  target_id    UUID,
  before_state JSONB,
  after_state  JSONB,
  ip_address   INET,
  user_agent   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.audit_logs IS
  'Append-only audit trail. No UPDATE or DELETE RLS policies exist on this table.';
