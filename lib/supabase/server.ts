import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

/**
 * Supabase splits large session tokens across multiple cookies like:
 *   sb-xxx-auth-token.0, sb-xxx-auth-token.1, etc.
 * When reassembled incorrectly (e.g., by browser bugs or Vercel edge caching),
 * the token can be doubled, causing "invalid header value" errors.
 * This helper merges chunked cookies and deduplicates any doubled tokens.
 */
function sanitizeCookieValue(value: string): string {
  // Remove all whitespace (handles newlines, spaces pasted into env vars)
  value = value.replace(/\s+/g, '')

  // If the value looks like a doubled JWT (base64url.base64url.base64url repeated),
  // detect repetition by checking if the first half equals the second half
  if (value.length > 100) {
    const half = Math.floor(value.length / 2)
    if (value.slice(0, half) === value.slice(half)) {
      return value.slice(0, half)
    }
  }

  return value
}

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\s+/g, '')
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').replace(/\s+/g, '')
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/\s+/g, '')

/**
 * Creates a Supabase client for use in Server Components and API Routes.
 * Uses the public anon key — RLS policies still apply.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({
            name,
            value: sanitizeCookieValue(value),
          }))
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from Server Component — safe to ignore.
            // Middleware handles token refresh.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase admin client using the service role key.
 * BYPASSES ROW LEVEL SECURITY — use only in API routes for admin operations.
 * NEVER import this in Client Components or pass to the browser.
 */
export async function createAdminClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll().map(({ name, value }) => ({
            name,
            value: sanitizeCookieValue(value),
          }))
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
