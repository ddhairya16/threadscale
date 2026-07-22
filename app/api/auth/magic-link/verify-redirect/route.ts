import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

/**
 * GET /api/auth/magic-link/verify-redirect
 *
 * Better Auth's magic link plugin calls this callbackURL after verifying
 * the token. At this point the session cookie is already set by Better Auth.
 * We look up the user's profile to determine where to redirect them,
 * and create a profile if this is their first login.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  try {
    // Session is already established by Better Auth's verify step
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session?.user?.email) {
      return NextResponse.redirect(`${origin}/login?error=Session+not+found`)
    }

    const email = session.user.email
    const supabase = await createAdminClient()

    // Look up existing profile
    let { data: profile } = await supabase
      .from('profiles')
      .select('role, status, referred_by_id, id, referral_code')
      .eq('email', email)
      .single()

    // First-time login — create a profile
    if (!profile) {
      const referralCode = `${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      const newId = session.user.id // Use Better Auth's user ID

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: newId,
          email,
          referral_code: referralCode,
          role: 'contributor',
          status: 'pending',
        })
        .select('role, status, referred_by_id, id, referral_code')
        .single()

      if (createError || !created) {
        console.error('[verify-redirect] Failed to create profile:', createError)
        return NextResponse.redirect(`${origin}/login?error=Profile+creation+failed`)
      }

      profile = created
    }

    // Auto-approve referred users
    let currentStatus = profile.status
    if (currentStatus === 'pending' && profile.referred_by_id) {
      await supabase
        .from('profiles')
        .update({ status: 'approved' })
        .eq('id', profile.id)
      currentStatus = 'approved'
    }

    // Route by role/status
    if (profile.role === 'admin') {
      return NextResponse.redirect(`${origin}/admin`)
    }
    if (currentStatus === 'pending') {
      return NextResponse.redirect(`${origin}/waiting`)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  } catch (err) {
    console.error('[auth/verify-redirect]', err)
    return NextResponse.redirect(`${origin}/login?error=Auth+error`)
  }
}
