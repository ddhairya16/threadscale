import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import type { Tables } from '@/types/database.types'

export type Profile = Tables<'profiles'>

export interface Session {
  userId: string
  email: string
  profile: Profile
}

/**
 * Returns the current session and profile, or null if not authenticated.
 * Uses Better Auth for session validation, then looks up the profile
 * from Supabase by email for app-specific fields (role, status, etc.).
 */
export async function getSession(): Promise<Session | null> {
  try {
    // 1. Get the Better Auth session from the request headers
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.email) {
      return null
    }

    const email = session.user.email

    // 2. Look up the profile in the Supabase profiles table by email
    const supabase = await createAdminClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return null
    }

    return {
      userId: profile.id,
      email,
      profile,
    }
  } catch {
    return null
  }
}
