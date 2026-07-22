import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { sendOtpSchema } from '@/lib/validators/auth.schemas'
import { success, error, handleRouteError } from '@/lib/utils/api-response'
import { logAudit, getRequestMeta } from '@/lib/audit/log'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = sendOtpSchema.parse(body)

    const origin = new URL(request.url).origin

    // Send magic link via Better Auth's magic link plugin.
    // The callbackURL is where the user lands after clicking the email link.
    const result = await auth.api.signInMagicLink({
      body: {
        email,
        callbackURL: `${origin}/api/auth/magic-link/verify-redirect`,
      },
      headers: await headers(),
    })

    if (result && 'error' in result) {
      return error((result as any).error?.message || 'Failed to send magic link', 400)
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
