import { sendOtpSchema } from '@/lib/validators/auth.schemas'
import { success, error, handleRouteError } from '@/lib/utils/api-response'
import { logAudit, getRequestMeta } from '@/lib/audit/log'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = sendOtpSchema.parse(body)

    const origin = new URL(request.url).origin

    // Forward to Better Auth's built-in magic link endpoint.
    // The catch-all handler at /api/auth/[...all] processes this.
    const baResponse = await fetch(`${origin}/api/auth/sign-in/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify({
        email,
        callbackURL: `${origin}/api/auth/magic-link/verify-redirect`,
      }),
    })

    if (!baResponse.ok) {
      const errData = await baResponse.json().catch(() => ({}))
      return error(errData.message || 'Failed to send magic link', 400)
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
