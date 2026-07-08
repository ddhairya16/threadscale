import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'

// GET /api/v1/reddit-accounts — list all accounts for the current user
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('reddit_accounts')
    .select('id, username, karma, account_age_days, verification_status, is_active, created_at')
    .eq('profile_id', session.profile.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/v1/reddit-accounts — add a new reddit account
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const username = (body.username as string)?.replace(/^u\//, '').trim()

  if (!username) return NextResponse.json({ error: 'Username is required' }, { status: 400 })

  const supabase = await createClient()

  // Check for duplicates
  const { data: existing } = await supabase
    .from('reddit_accounts')
    .select('id')
    .eq('profile_id', session.profile.id)
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'This Reddit account is already added.' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('reddit_accounts')
    .insert({ profile_id: session.profile.id, username })
    .select('id, username, karma, account_age_days, verification_status, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
