# Deployment Guide

## Prerequisites

- Supabase project created and migrations run (see PROJECT_SETUP.md)
- GitHub repository with the platform code pushed

## Deploy to Vercel

### Step 1 — Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your repository
4. Set **Root Directory** to `platform` (since the bot code is in the root)
5. Framework will auto-detect as **Next.js**

### Step 2 — Environment Variables

In Vercel: **Project Settings → Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL          = your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     = your anon key
SUPABASE_SERVICE_ROLE_KEY         = your service role key
CRON_SECRET                       = your generated secret
```

Leave Google and Discord variables empty until Phase 8/10.

### Step 3 — Deploy

1. Click **Deploy**
2. Vercel will build and deploy automatically
3. Your app will be at `https://your-project.vercel.app`

## Cron Job Setup (Vercel)

Create `vercel.json` in the platform root:

```json
{
  "crons": [
    {
      "path": "/api/internal/cron/run",
      "schedule": "0 * * * *"
    }
  ]
}
```

This runs the cron job every hour (free on Vercel Hobby).

## Connecting a Custom Domain (Later)

1. Vercel: **Project Settings → Domains → Add**
2. Add your domain and follow the DNS instructions
3. Vercel provisions SSL automatically

## Production Checklist

- [ ] All environment variables set in Vercel
- [ ] Migrations run on production Supabase project
- [ ] Admin user promoted via `promote_to_admin('ddhairya16@gmail.com')`
- [ ] Smoke test: login, create task, assign, submit, approve
- [ ] Cron job configured in vercel.json
