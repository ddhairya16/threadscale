import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Next.js Proxy (formerly Middleware) — Layer 1 of 3 in our security model.
 *
 * Responsibilities:
 *   1. Refresh the Supabase session cookie on every request
 *   2. Redirect unauthenticated users away from protected routes
 *   3. Redirect non-admin users away from admin routes
 *   4. Redirect already-logged-in users away from auth pages
 *
 * This is the FIRST security layer. Even if this is bypassed,
 * Layer 2 (API route require-auth.ts) and Layer 3 (RLS) still protect data.
 *
 * Protected routes:
 *   /dashboard/*  → requires any authenticated user
 *   /admin/*      → requires role = 'admin'
 *
 * Auth routes (redirect if already logged in):
 *   /login        → redirect to /dashboard or /admin
 *   /verify       → redirect to /dashboard or /admin
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always call getUser() to refresh the session.
  // Never use getSession() in middleware — it reads from the cookie only
  // and can be spoofed. getUser() validates with the Supabase server.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // ── Cron route protection ─────────────────────────────────
  // Internal cron routes are protected by a secret header, not session auth
  if (path.startsWith('/api/internal/cron')) {
    const cronSecret = request.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`
    if (!cronSecret || cronSecret !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return supabaseResponse
  }

  // ── Contributor routes (/dashboard/*) ─────────────────────
  if (path.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', path)
    return NextResponse.redirect(url)
  }

  // ── Admin routes (/admin/*) ────────────────────────────────
  if (path.startsWith('/admin')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', path)
      return NextResponse.redirect(url)
    }

    // Check role — also verified in each admin route handler (Layer 2)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      // Authenticated but not admin: redirect to contributor dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ── Auth pages (redirect if already logged in) ─────────────
  if ((path === '/login' || path === '/verify') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = request.nextUrl.clone()
    url.pathname = profile?.role === 'admin' ? '/admin' : '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Static assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
