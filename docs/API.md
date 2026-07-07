# API Reference

All routes follow this pattern:
- Base URL: `/api/v1/`
- Auth: Supabase session cookie (set automatically by `@supabase/ssr`)
- Response format: `{ data: T, error: null }` or `{ data: null, error: { message, code?, fields? } }`

## Authentication

```
POST /api/v1/auth/otp/send     { email }                → 200
POST /api/v1/auth/otp/verify   { email, token }         → { session }
POST /api/v1/auth/logout                                → 200
GET  /api/v1/auth/me                                    → ProfileDto
```

## Profile

```
GET   /api/v1/profile                                   → ProfileDto
PATCH /api/v1/profile           { full_name?, discord_id?, upi_id? }
PATCH /api/v1/profile/notifications  { notify_email, notify_discord }
GET   /api/v1/profile/onboarding                        → OnboardingDto
PATCH /api/v1/profile/onboarding    { step }
```

## Reddit Accounts

```
GET    /api/v1/reddit-accounts
POST   /api/v1/reddit-accounts   { username, karma?, account_age_days?, cqs_score? }
PATCH  /api/v1/reddit-accounts/:id
DELETE /api/v1/reddit-accounts/:id
```

## Tasks (Contributor)

```
GET  /api/v1/tasks              ?type=&page=             → TaskCardDto[]
GET  /api/v1/tasks/:id                                  → TaskDetailDto
```

## Assignments

```
GET   /api/v1/assignments       ?status=&page=           → AssignmentDto[]
GET   /api/v1/assignments/:id                           → AssignmentDto
PATCH /api/v1/assignments/:id/start
```

## Submissions

```
POST /api/v1/submissions        { assignment_id, reddit_url, screenshot_refs?, insight_text? }
GET  /api/v1/submissions/:id                            → SubmissionDto
```

## Upload

```
POST /api/v1/upload/screenshot  multipart/form-data     → UploadResultDto
POST /api/v1/upload/insight     multipart/form-data     → UploadResultDto
```

## Payments

```
GET /api/v1/payments            ?status=&page=           → PaymentDto[]
GET /api/v1/payments/summary                            → EarningsSummaryDto
```

## Referrals

```
GET /api/v1/referrals                                   → ReferralDashboardDto
```

## Notifications

```
GET   /api/v1/notifications     ?unread=true&page=       → NotificationDto[]
PATCH /api/v1/notifications/:id/read
PATCH /api/v1/notifications/read-all
```

## Admin Endpoints

All admin routes require `role = 'admin'`.

```
GET   /api/v1/admin/contributors
GET   /api/v1/admin/contributors/:id
PATCH /api/v1/admin/contributors/:id

GET   /api/v1/admin/tasks
POST  /api/v1/admin/tasks
PATCH /api/v1/admin/tasks/:id
DELETE /api/v1/admin/tasks/:id
POST  /api/v1/admin/tasks/:id/assign

GET   /api/v1/admin/submissions    ?status=pending
POST  /api/v1/admin/submissions/:id/approve
POST  /api/v1/admin/submissions/:id/reject

GET   /api/v1/admin/payments
POST  /api/v1/admin/payments/approve    { payment_ids[] }
POST  /api/v1/admin/payments/:id/paid

GET   /api/v1/admin/clients
POST  /api/v1/admin/clients
GET   /api/v1/admin/projects
POST  /api/v1/admin/projects

GET   /api/v1/admin/rates
POST  /api/v1/admin/rates

GET   /api/v1/admin/analytics/overview
GET   /api/v1/admin/audit-logs
```

## Internal (Cron)

Protected by `Authorization: Bearer CRON_SECRET` header.

```
GET /api/internal/cron/run  → Retries failed Sheets/Discord + deadline reminders
```
