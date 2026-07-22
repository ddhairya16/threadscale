/**
 * API request/response DTOs (Data Transfer Objects).
 *
 * These types are shared between the frontend and API routes.
 * They define exactly what data crosses the API boundary.
 *
 * Rule: API routes return these DTOs, not raw database rows.
 * This decouples the API surface from the database schema.
 */

// ── Generic response envelope ──────────────────────────────────

export type ApiSuccess<T> = {
  data: T
  error: null
}

export type ApiError = {
  data: null
  error: {
    message: string
    code?: string
    fields?: Record<string, string[]>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── Pagination ────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

// ── Profile DTOs ──────────────────────────────────────────────

export interface ProfileDto {
  id: string
  email: string
  full_name: string | null
  discord_username: string | null
  referral_code: string
  role: 'contributor' | 'admin' | 'client'
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  onboarding_steps: string[]
  notify_email: boolean
  notify_discord: boolean
  upi_id: string | null
  created_at: string
  last_login_at: string | null
}

export interface OnboardingDto {
  completed_steps: string[]
  next_step: 'profile' | 'reddit_account' | 'referral_seen' | 'done'
  is_complete: boolean
}

// ── Reddit Account DTOs ───────────────────────────────────────

export interface RedditAccountDto {
  id: string
  profile_id: string
  username: string
  karma: number | null
  account_age_days: number | null
  cqs_score: number | null
  verification_status: 'unverified' | 'pending' | 'verified' | 'rejected'
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Task DTOs ─────────────────────────────────────────────────

/** Minimal task data for list views */
export interface TaskCardDto {
  id: string
  task_type: 'comment' | 'post' | 'moderation'
  title: string
  base_reward_inr: number
  deadline_hours: number
  status: string
  created_at: string
}

/** Full task data for detail view — no client/project info */
export interface TaskDetailDto extends TaskCardDto {
  instructions: string
  subreddit: string | null
  thread_url: string | null
  post_title: string | null
  post_body: string | null
  is_assigned: boolean         // Whether the current user has this task
}

// ── Assignment DTOs ───────────────────────────────────────────

export interface AssignmentDto {
  id: string
  task_id: string
  profile_id: string
  reddit_account_id: string
  rate_snapshot_inr: number
  status: string
  assigned_at: string
  deadline_at: string
  started_at: string | null
  completed_at: string | null
  task: TaskDetailDto
  reddit_account: Pick<RedditAccountDto, 'id' | 'username' | 'verification_status'>
  latest_submission: SubmissionDto | null
}

// ── Submission DTOs ───────────────────────────────────────────

export interface ScreenshotRef {
  drive_id: string
  web_url: string
  filename: string
  size_bytes: number
}

export interface SubmissionDto {
  id: string
  assignment_id: string
  profile_id: string
  reddit_url: string
  detected_type: string | null
  screenshot_refs: ScreenshotRef[]
  insight_text: string | null
  contributor_notes: string | null
  attempt_number: number
  status: string
  submitted_at: string
  review_notes: string | null
}

// ── Upload ────────────────────────────────────────────────────

export interface UploadResultDto {
  drive_id: string
  web_url: string
  filename: string
  size_bytes: number
}

// ── Payment DTOs ──────────────────────────────────────────────

export interface PaymentDto {
  id: string
  profile_id: string
  assignment_id: string | null
  amount_inr: number
  payment_type: 'task' | 'referral_bonus'
  status: 'pending' | 'approved' | 'paid'
  approved_at: string | null
  paid_at: string | null
  payment_method: string | null
  transaction_ref: string | null
  created_at: string
}

export interface EarningsSummaryDto {
  lifetime_inr: number
  pending_inr: number
  approved_inr: number     // Approved but not yet paid
  paid_inr: number
  this_month_inr: number
  referral_earned_inr: number
}

// ── Referral DTOs ─────────────────────────────────────────────

export interface ReferralItemDto {
  id: string
  referred_email: string        // Partial: only first part before @
  referred_name: string | null
  bonus_amount_inr: number
  bonus_status: 'pending' | 'awarded' | 'revoked'
  awarded_at: string | null
  created_at: string
}

export interface ReferralDashboardDto {
  code: string
  link: string
  total_referrals: number
  pending_count: number
  awarded_count: number
  total_earned_inr: number
  referrals: ReferralItemDto[]
}

// ── Notification DTOs ─────────────────────────────────────────

export interface NotificationDto {
  id: string
  type: string
  title: string
  body: string | null
  action_url: string | null
  is_read: boolean
  created_at: string
}

// ── Admin DTOs ────────────────────────────────────────────────

export interface ContributorListItemDto {
  id: string
  email: string
  full_name: string | null
  discord_username: string | null
  status: string
  role: string
  referral_count: number
  total_reddit_accounts: number
  active_assignments: number
  completed_assignments: number
  posts_count: number
  comments_count: number
  moderation_count: number
  pending_payment_inr: number
  lifetime_earned_inr: number
  last_assignment_at: string | null
  last_login_at: string | null
  created_at: string
}

export interface AdminAssignmentDto {
  id: string
  task_id: string
  task_title: string
  task_type: string
  profile_id: string
  contributor_email: string
  contributor_name: string | null
  reddit_account_username: string
  rate_snapshot_inr: number
  status: string
  assigned_at: string
  deadline_at: string
  submission_count: number
}

export interface AdminSubmissionDto extends SubmissionDto {
  contributor_email: string
  contributor_name: string | null
  task_title: string
  task_type: string
  reddit_account_username: string
  rate_snapshot_inr: number
}

export interface ClientDto {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface ProjectDto {
  id: string
  client_id: string
  client_name: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface RateDto {
  id: string
  profile_id: string | null
  task_type: 'comment' | 'post' | 'moderation'
  rate_inr: number
  effective_from: string
}

export interface MonthlyProfitDto {
  month: string             // 'YYYY-MM'
  revenue_inr: number       // Sum of client_revenue.revenue_inr
  payout_inr: number        // Sum of paid payments
  profit_inr: number        // revenue - payout
  margin_percent: number    // profit / revenue * 100
}

export interface AdminOverviewDto {
  total_contributors: number
  active_contributors_30d: number
  active_assignments: number
  pending_review: number
  pending_payments_inr: number
  paid_this_month_inr: number
  tasks_completed_this_month: number
}

export interface TemplateDto {
  id: string
  name: string
  task_type: 'comment' | 'post' | 'moderation'
  instructions: string
  subreddit: string | null
  post_title: string | null
  thread_url: string | null
  default_reward_inr: number | null
  default_deadline_h: number
  is_active: boolean
  created_at: string
}
