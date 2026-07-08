import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Fetch user profile to route correctly
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, status, referred_by_id')
          .eq('id', user.id)
          .single()
          
        if (profile) {
          // Auto-approve if they were referred
          let currentStatus = profile.status
          if (currentStatus === 'pending' && profile.referred_by_id) {
            const adminClient = await createAdminClient()
            await adminClient
              .from('profiles')
              .update({ status: 'approved' })
              .eq('id', user.id)
            currentStatus = 'approved'
          }

          if (profile.role === 'admin') {
            return NextResponse.redirect(`${requestUrl.origin}/admin`)
          }
          if (currentStatus === 'pending') {
            return NextResponse.redirect(`${requestUrl.origin}/dashboard/waiting`)
          }
        }
      }
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // If there's no code, or if the code was invalid, redirect to login with an error
  return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid+or+expired+magic+link`)
}
