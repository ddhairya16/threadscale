# Database Reference

## Tables

| Table | Purpose | Access |
|---|---|---|
| `profiles` | One per user. Extends auth.users | Contributor (own), Admin (all) |
| `reddit_accounts` | Multiple per contributor | Contributor (own), Admin (all) |
| `clients` | Business clients | Admin only |
| `client_users` | Future portal access | Admin only |
| `projects` | Per-client projects | Admin only |
| `task_templates` | Reusable task blueprints | Admin only |
| `contributor_rates` | Global + per-user rates | Contributor (read own), Admin (all) |
| `tasks` | Work units | Contributor (open + assigned), Admin (all) |
| `assignments` | Task ↔ Contributor link | Contributor (own), Admin (all) |
| `submissions` | Work proof per assignment | Contributor (own), Admin (all) |
| `insights` | Research submissions | Contributor (own), Admin (all) |
| `payments` | Payment records | Contributor (read own), Admin (all) |
| `referrals` | Referral tracking | Contributor (read as referrer), Admin (all) |
| `notifications` | In-app notifications | Contributor (own), Admin (all) |
| `client_revenue` | Monthly revenue input | Admin only |
| `drive_folder_cache` | GDrive folder ID cache | Service role only |
| `audit_logs` | Append-only action log | Admin (read only) |

## Rate System

Rates use an append-only history table. The effective rate for a contributor is:

```sql
SELECT rate_inr FROM contributor_rates
WHERE task_type = $type
  AND (profile_id = $user_id OR profile_id IS NULL)
ORDER BY
  CASE WHEN profile_id = $user_id THEN 0 ELSE 1 END,
  effective_from DESC
LIMIT 1;
```

To change a rate: INSERT a new row. Never UPDATE existing rows.

## Triggers

| Trigger | Table | What It Does |
|---|---|---|
| `on_auth_user_created` | auth.users | Creates profile + referral on signup |
| `trg_assignments_snapshot_rate` | assignments | Locks rate at assignment time |
| `trg_assignments_set_deadline` | assignments | Calculates deadline_at from deadline_hours |
| `trg_submissions_attempt_number` | submissions | Auto-increments attempt_number |
| `trg_assignments_sync_task_status` | assignments | Updates task status (open → fully_assigned → completed) |
| `trg_*_updated_at` | all tables | Maintains updated_at timestamp |

## Key Constraints

- `assignments.rate_snapshot_inr` — immutable after insert (set by trigger)
- `assignments.UNIQUE(task_id, profile_id)` — one assignment per contributor per task
- `referrals.UNIQUE(referred_id)` — each user can only be referred once
- `payments.UNIQUE(assignment_id)` — one payment row per assignment
- `referrals.CHECK(referrer_id != referred_id)` — cannot refer yourself

## Monetary Values

All money is stored as `NUMERIC(12,2)`. Never use FLOAT for money.

## Timestamps

All timestamps are `TIMESTAMPTZ` (timezone-aware UTC). Always stored and compared in UTC.

## Admin Promotion

After the first OTP login, run in the Supabase SQL Editor:
```sql
SELECT public.promote_to_admin('ddhairya16@gmail.com');
```
