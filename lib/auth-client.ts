import { createAuthClient } from 'better-auth/react'

/**
 * Better Auth browser client.
 * Use this in Client Components to interact with auth (sign in, sign out, get session, etc.)
 *
 * Example:
 *   const { data: session } = authClient.useSession()
 *   await authClient.signIn.magicLink({ email })
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || '',
})
