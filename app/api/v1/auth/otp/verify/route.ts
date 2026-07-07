import { createClient, createAdminClient } from '@/lib/supabase/server'
import { verifyOtpSchema } from '@/lib/validators/auth.schemas'
import { success, error, handleRouteError } from '@/lib/utils/api-response'
import { getSession } from '@/lib/auth/get-session'
import { logAudit, getRequestMeta } from '@/lib/audit/log'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, token } = verifyOtpSchema.parse(body)

    const supabase = await createClient()

    const { data, error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })

    if (authError || !data.user) {
      return error(
        'Invalid or expired code. Please try again or request a new code.',
        400,
        'INVALID_OTP'
      )
    }

    // Update last_login_at via the admin client (bypasses RLS)
    const admin = await createAdminClient()
    await admin
      .from('profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id)

    // Now that the session cookie is set, read the profile
    const session = await getSession()
    const role = session?.profile.role ?? 'contributor'
    const redirect = role === 'admin' ? '/admin' : '/dashboard'

    await logAudit({
      actorId: data.user.id,
      actorRole: role,
      action: 'auth.login',
      targetType: 'user',
      targetId: data.user.id,
      ...getRequestMeta(request),
    })

    return success({ role, redirect })
  } catch (err) {
    return handleRouteError(err)
  }
}
