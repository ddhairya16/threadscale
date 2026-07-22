import { success, handleRouteError } from '@/lib/utils/api-response'
import { getSession } from '@/lib/auth/get-session'
import { logAudit, getRequestMeta } from '@/lib/audit/log'

export async function POST(request: Request) {
  try {
    const session = await getSession()

    const origin = new URL(request.url).origin

    // Forward sign-out to Better Auth's built-in endpoint
    await fetch(`${origin}/api/auth/sign-out`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: request.headers.get('cookie') || '',
      },
    })

    if (session) {
      await logAudit({
        actorId: session.userId,
        actorRole: session.profile.role,
        action: 'auth.logout',
        targetType: 'user',
        targetId: session.userId,
        ...getRequestMeta(request),
      })
    }

    return success({ logged_out: true })
  } catch (err) {
    return handleRouteError(err)
  }
}
