import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * GET /api/v1/auth/clear-session
 * Clears all Supabase auth cookies — useful when a corrupted cookie
 * causes "invalid header value" errors on the client.
 * After clearing, redirects to /login.
 */
export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const response = NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'https://threadscale.vercel.app'}/login`
  )

  // Delete every Supabase auth cookie
  for (const cookie of allCookies) {
    if (
      cookie.name.startsWith('sb-') ||
      cookie.name.includes('supabase') ||
      cookie.name.includes('auth-token')
    ) {
      response.cookies.delete(cookie.name)
    }
  }

  return response
}
