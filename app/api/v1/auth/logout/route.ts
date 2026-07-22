import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { success, handleRouteError } from '@/lib/utils/api-response'
import { getSession } from '@/lib/auth/get-session'
import { logAudit, getRequestMeta } from '@/lib/audit/log'

export async function POST(request: Request) {
  try {
    const session = await getSession()

    // Sign out via Better Auth
    await auth.api.signOut({
      headers: await headers(),
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
