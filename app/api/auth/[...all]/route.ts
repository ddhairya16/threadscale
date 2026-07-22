import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

/**
 * Better Auth catch-all route handler.
 * Handles all auth endpoints:
 *   GET/POST /api/auth/sign-in/magic-link
 *   GET      /api/auth/magic-link/verify  (callback from email link)
 *   POST     /api/auth/sign-out
 *   GET      /api/auth/get-session
 *   etc.
 */
export const { GET, POST } = toNextJsHandler(auth)
