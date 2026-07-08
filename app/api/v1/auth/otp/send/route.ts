import { createClient } from '@/lib/supabase/server'
import { sendOtpSchema } from '@/lib/validators/auth.schemas'
import { success, error, handleRouteError } from '@/lib/utils/api-response'
import { logAudit, getRequestMeta } from '@/lib/audit/log'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = sendOtpSchema.parse(body)

    // Optional referral code passed at signup
    const referralCode: string | undefined =
      typeof body.referral_code === 'string' && body.referral_code
        ? body.referral_code
        : undefined

    const supabase = await createClient()

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Pass referral code into user metadata so the signup trigger
        // (handle_new_user) can link the referral automatically.
        data: referralCode ? { referral_code: referralCode } : undefined,
        emailRedirectTo: `${new URL(request.url).origin}/api/v1/auth/callback`,
      },
    })

    if (authError) {
      return error(authError.message, 400)
    }

    await logAudit({
      actorId: null,
      action: 'auth.otp.send',
      targetType: 'email',
      afterState: { email },
      ...getRequestMeta(request),
    })

    return success({ sent: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
