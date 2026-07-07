import { requireAuth, type Session } from './require-auth'
import { HttpError } from '@/lib/utils/errors'
import type { Enums } from '@/types/database.types'

type UserRole = Enums<'user_role'>

/**
 * Returns the session or throws 403 if the user does not have the required role.
 * Always calls requireAuth first (also checks suspended/blacklisted status).
 *
 * @throws {HttpError} 401 if not authenticated
 * @throws {HttpError} 403 if wrong role
 */
export async function requireRole(role: UserRole): Promise<Session> {
  const session = await requireAuth()

  if (session.profile.role !== role) {
    throw new HttpError(
      403,
      `Forbidden. This action requires the '${role}' role.`
    )
  }

  return session
}

/**
 * Shorthand for requireRole('admin').
 * Use at the top of all admin API route handlers.
 */
export async function requireAdmin(): Promise<Session> {
  return requireRole('admin')
}

/**
 * Returns session if user is a contributor OR admin.
 * (Admins can access all contributor-level endpoints)
 */
export async function requireContributor(): Promise<Session> {
  const session = await requireAuth()

  if (session.profile.role !== 'contributor' && session.profile.role !== 'admin') {
    throw new HttpError(403, 'Forbidden.')
  }

  return session
}
