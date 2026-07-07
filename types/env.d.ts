/**
 * Environment variable type augmentation.
 *
 * This file tells TypeScript what shape process.env has.
 * If a variable is missing from .env.local, TypeScript will
 * warn you at compile time rather than failing at runtime.
 *
 * IMPORTANT: Variables prefixed with NEXT_PUBLIC_ are safe to
 * expose to the browser. All others are server-only.
 * NEVER add NEXT_PUBLIC_ to sensitive credentials.
 */

declare namespace NodeJS {
  interface ProcessEnv {
    // ── Supabase (required) ───────────────────────────────
    /** Public Supabase project URL. Safe to expose to browser. */
    NEXT_PUBLIC_SUPABASE_URL: string
    /** Public anon key. Safe to expose to browser (RLS protects data). */
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string
    /** Service role key. SERVER ONLY. Bypasses RLS. Never expose to browser. */
    SUPABASE_SERVICE_ROLE_KEY: string

    // ── Google (Phase 8 & 9 — not needed until then) ──────
    /** Stringified Google service account JSON. SERVER ONLY. */
    GOOGLE_SERVICE_ACCOUNT_JSON: string
    /** Root Google Drive folder ID for all uploads. */
    GOOGLE_DRIVE_ROOT_FOLDER_ID: string
    /** Google Sheets spreadsheet ID for reporting. */
    GOOGLE_SHEETS_SPREADSHEET_ID: string

    // ── Discord Bot (Phase 10 — not needed until then) ────
    /** Base URL of the Discord bot HTTP server on Oracle Cloud. */
    DISCORD_BOT_URL: string
    /** Shared secret for Discord bot request validation. */
    DISCORD_BOT_SECRET: string

    // ── Internal ──────────────────────────────────────────
    /** Secret used to authenticate Vercel Cron calls. Generate with: openssl rand -base64 32 */
    CRON_SECRET: string

    // ── Node.js built-in ─────────────────────────────────
    NODE_ENV: 'development' | 'production' | 'test'
  }
}
