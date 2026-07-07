# Project Setup Guide

This guide walks you through setting up everything from scratch.
No prior experience required. Follow every step in order.

---

## Step 0 — Prerequisites

Make sure you have these installed on your computer:

- **Node.js 20+**: Download from [nodejs.org](https://nodejs.org)
- **Git**: Download from [git-scm.com](https://git-scm.com)
- **VS Code** (recommended): Download from [code.visualstudio.com](https://code.visualstudio.com)

Verify Node.js is installed by opening PowerShell and running:
```
node --version
```
You should see something like `v20.x.x`.

---

## Step 1 — Create Your Supabase Project

Supabase is the database and authentication service. It has a generous free tier.

### 1.1 Create an Account

1. Go to [supabase.com](https://supabase.com)
2. Click **Start your project** and sign up with GitHub (recommended)

### 1.2 Create a New Project

1. Click **New project**
2. Choose an **Organization** (create one if needed)
3. Fill in:
   - **Project name**: `community-growth-platform`
   - **Database password**: choose a strong password and save it somewhere safe
   - **Region**: select the region closest to India (e.g., **Singapore** or **Mumbai**)
4. Click **Create new project**
5. Wait 2–3 minutes for the project to provision

### 1.3 Get Your API Keys

1. In your Supabase project, click **Project Settings** (gear icon in the left sidebar)
2. Click **API** in the settings menu
3. Copy these three values:

   | What | Where to find it | Copy to |
   |---|---|---|
   | **Project URL** | Under "Project URL" | `NEXT_PUBLIC_SUPABASE_URL` |
   | **anon public key** | Under "Project API keys" | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | **service_role key** | Under "Project API keys" (click to reveal) | `SUPABASE_SERVICE_ROLE_KEY` |

   > ⚠️ The **service_role key** bypasses all security. Never put it in the frontend. Keep it secret.

### 1.4 Create Your .env.local File

1. In VS Code, open the `platform` folder
2. Copy `.env.local.example` to a new file called `.env.local`
3. Fill in the three Supabase values you copied above
4. Generate a `CRON_SECRET` by running in PowerShell:
   ```powershell
   [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
   ```
5. Paste the result as your `CRON_SECRET`

---

## Step 2 — Run Database Migrations

The migrations create all the tables, triggers, and security policies.

### 2.1 Open the Supabase SQL Editor

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**

### 2.2 Run Migration Files In Order

For each file in `platform/supabase/migrations/`, **in order**:

1. Open the file in VS Code
2. Select all the text (Ctrl+A)
3. Copy it (Ctrl+C)
4. Paste it into the Supabase SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. Confirm it says "Success"

Run them in this exact order:
1. `20260707_001_enums.sql`
2. `20260707_002_tables.sql`
3. `20260707_003_indexes.sql`
4. `20260707_004_triggers.sql`
5. `20260707_005_rls.sql`
6. `20260707_006_seed.sql`

### 2.3 Confirm Tables Exist

After running all migrations:
1. Click **Table Editor** in the Supabase sidebar
2. You should see ~15 tables (profiles, tasks, assignments, etc.)

---

## Step 3 — First Login and Admin Setup

### 3.1 Start the Development Server

In PowerShell, from the `platform` folder:
```
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3.2 Sign Up With Your Admin Email

1. Go to [http://localhost:3000/login](http://localhost:3000/login)
2. Enter: `ddhairya16@gmail.com`
3. Check your email for the 6-digit OTP code
4. Enter the code on the verify page
5. You will be redirected to the contributor dashboard (not admin yet)

### 3.3 Promote Yourself to Admin

1. Go back to the Supabase **SQL Editor**
2. Run this query:
   ```sql
   SELECT public.promote_to_admin('ddhairya16@gmail.com');
   ```
3. You should see: `Successfully promoted "ddhairya16@gmail.com" to admin.`
4. Log out of the platform and log back in
5. You will now be redirected to `/admin`

---

## Step 4 — Google Cloud (Phase 8)

Skip this step for now. You will return to it in Phase 8 when we build the
Google Drive integration. The platform works completely without Google credentials.

---

## Step 5 — Discord Bot (Phase 10)

Skip this step for now. You will return to it in Phase 10.
During development, all Discord notifications are printed to the server console.

---

## Step 6 — Verify Everything Works

1. Start the dev server: `npm run dev`
2. Open [http://localhost:3000](http://localhost:3000)
3. Log in with `ddhairya16@gmail.com`
4. Verify you are redirected to `/admin`

If you see any errors, check:
- Is `.env.local` filled in with your Supabase credentials?
- Did all 6 migrations run without errors?
- Did you run `promote_to_admin`?

For help, check the error messages in the VS Code terminal where `npm run dev` is running.

---

## Useful Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start development server at localhost:3000 |
| `npm run build` | Build for production (check for errors) |
| `npm run lint` | Check code for style issues |
