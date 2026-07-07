# Community Growth Platform

A production-ready platform for managing community growth contributors, tasks, and payments.

## What It Does

- Contributors log in with email OTP (no passwords)
- Admins create tasks and assign them to contributors
- Contributors complete tasks, submit proof (screenshots + Reddit URL)
- Admins review and approve work
- Payments are tracked and paid via UPI
- Everything is logged to Google Sheets (reporting)
- Contributors receive notifications via Discord

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Framer Motion |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Email OTP |
| Authorization | Supabase Row Level Security |
| Storage | Google Drive API (Phase 8) |
| Reporting | Google Sheets API (Phase 9) |
| Notifications | Discord Bot webhook (Phase 10) |
| Hosting | Vercel Free Tier |

## Monthly Cost

**₹0/month** — all services run on free tiers.

## Quick Start

See [PROJECT_SETUP.md](./PROJECT_SETUP.md) for the complete setup guide.

## Documentation Index

| Document | Description |
|---|---|
| [PROJECT_SETUP.md](./PROJECT_SETUP.md) | Complete beginner setup guide |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design and decisions |
| [DATABASE.md](./DATABASE.md) | Schema, triggers, and RLS reference |
| [API.md](./API.md) | All API endpoints |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment to Vercel |
| [TODO.md](./TODO.md) | Current progress and next steps |
