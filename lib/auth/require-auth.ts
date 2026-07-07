import { getSession, type Session } from './get-session'
import { HttpError } from '@/lib/utils/errors'

export type { Session }

/**
 * Returns the current session or throws a 401 HttpError.
 * Use in API Route handlers where authentication is required.
 *
 * @throws {HttpError} 401 if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession()

  if (!session) {
    throw new HttpError(401, 'Authentication required. Please log in.')
  }

  if (session.profile.status === 'suspended') {
    throw new HttpError(403, 'Your account has been suspended. Please contact support.')
  }

  if (session.profile.status === 'blacklisted') {
    throw new HttpError(403, 'Your account has been permanently disabled.')
  }

  return session
}
