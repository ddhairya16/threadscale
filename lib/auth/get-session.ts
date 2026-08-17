import { auth } from '@/lib/auth'
import { Pool } from 'pg'
import { headers } from 'next/headers'
import type { Tables } from '@/types/database.types'

export type Profile = Tables<'profiles'>

export interface Session {
  userId: string
  email: string
  profile: Profile
}

// Reuse connection pool from PostgreSQL connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

/**
 * Returns the current session and profile, or null if not authenticated.
 * Uses Better Auth for session validation, then looks up the profile
 * directly from Postgres by email for app-specific fields (role, status, etc.).
 * Completely bypasses Supabase client SDK to prevent API key errors.
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

    // 2. Look up the profile in Postgres directly by email
    const result = await pool.query('SELECT * FROM profiles WHERE email = $1 LIMIT 1', [email])
    const profile = result.rows[0] as Profile | undefined

    if (!profile) {
      return null
    }

    return {
      userId: profile.id,
      email,
      profile,
    }
  } catch (error) {
    console.error('[getSession Error]:', error)
    return null
  }
}
