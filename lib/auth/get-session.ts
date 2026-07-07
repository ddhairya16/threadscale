import { createClient } from '@/lib/supabase/server'
import type { Tables } from '@/types/database.types'

export type Profile = Tables<'profiles'>

export interface Session {
  userId: string
  profile: Profile
}

/**
 * Returns the current session and profile, or null if not authenticated.
 * Safe to call in Server Components and API Routes.
 * Does not throw — callers decide what to do with null.
 */
export async function getSession(): Promise<Session | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return null
    }

    return { userId: user.id, profile }
  } catch {
    return null
  }
}
