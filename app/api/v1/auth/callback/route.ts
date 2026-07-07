import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
          .select('role')
          .eq('id', user.id)
          .single()
          
        if (profile?.role === 'admin') {
          return NextResponse.redirect(`${requestUrl.origin}/admin`)
        }
      }
      return NextResponse.redirect(`${requestUrl.origin}${next}`)
    }
  }

  // If there's no code, or if the code was invalid, redirect to login with an error
  return NextResponse.redirect(`${requestUrl.origin}/login?error=Invalid+or+expired+magic+link`)
}
