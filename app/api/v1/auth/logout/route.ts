import { createClient } from '@/lib/supabase/server'
import { success, handleRouteError } from '@/lib/utils/api-response'
import { getSession } from '@/lib/auth/get-session'
import { logAudit, getRequestMeta } from '@/lib/audit/log'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    const supabase = await createClient()

    await supabase.auth.signOut()

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
