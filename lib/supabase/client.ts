import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

/**
 * Creates a Supabase client for use in browser (Client Components).
 * Uses the public anon key — RLS policies protect all data.
 * Call this inside Client Components, not Server Components.
 */
export function createClient() {
  return createBrowserClient<Database>(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim(),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  )
}
