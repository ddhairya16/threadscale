# System Architecture

## Overview

```
Browser (Next.js)
  ↓ HTTPS
Vercel (Next.js API Routes)
  ↓               ↓              ↓             ↓
Supabase       Google Drive   Google Sheets  Discord Bot
(DB + Auth)    (Phase 8)      (Phase 9)      (Phase 10)
```

## Key Design Decisions

### 1. Supabase as the Single Source of Truth
All business data lives in Supabase. Google Drive, Sheets, and Discord are
output-only integrations. If any integration fails, the database record is
still correct and the integration is retried via cron.

### 2. Three-Layer Security
```
Layer 1: Next.js middleware.ts      → Redirects unauthenticated users
Layer 2: API route require-auth.ts  → Validates session server-side
Layer 3: Supabase RLS policies      → Database enforces data isolation
```
Each layer independently protects the data. All three must pass.

### 3. Provider Pattern for Integrations
All integrations (Storage, Notifications, Reporting) implement a TypeScript
interface. To swap Google Drive for Supabase Storage, change one line in
`lib/providers/storage/index.ts`. No application code changes required.

### 4. Background Job Retry with DB Flags
Instead of a paid message queue, we use a simple approach:
- When an integration call fails (Sheets, Discord), we set a `*_logged = false` flag
- A Vercel Cron job at `/api/internal/cron/run` runs hourly and retries all failed flags
- This gives the same reliability guarantee at ₹0/month

### 5. Rate Snapshots (Immutable History)
When a task is assigned, a database trigger snapshots the current rate into
`assignments.rate_snapshot_inr`. This value never changes, even if the admin
updates the rate later. Historical payment accuracy is guaranteed at the
database level, not in application code.

### 6. Client Identity Protection
Contributors never see who the client is. The `clients` and `projects` tables
are completely hidden from contributors via RLS. Tasks contain no client
references in their API responses.

## Free Tier Budget

| Service | Limit | Our Usage |
|---|---|---|
| Vercel Hobby | 100GB bandwidth, unlimited deploys | Well within |
| Supabase Free | 500MB DB, 50k MAU, 2GB bandwidth | Fine until ~200 active users |
| Google Drive | 15GB (you have 5TB) | ✅ |
| Google Sheets | Free | ✅ |
| Oracle Cloud Always Free | 2 AMD VMs | Discord bot lives here |
| **Total** | | **₹0/month** |
