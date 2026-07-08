import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/v1/admin/assignments — list all assignments with joins
export async function GET() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('assignments')
    .select(
      `id, status, assigned_at, deadline_at, rate_snapshot_inr,
       tasks(title, task_type, subreddit),
       profiles(email),
       reddit_accounts(username)`
    )
    .order('assigned_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/v1/admin/assignments — assign a task to a contributor
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { task_id, profile_id, reddit_account_id } = body as {
    task_id?: string
    profile_id?: string
    reddit_account_id?: string
  }

  if (!task_id) {
    return NextResponse.json({ error: 'task_id is required' }, { status: 400 })
  }
  if (!profile_id) {
    return NextResponse.json({ error: 'profile_id is required' }, { status: 400 })
  }
  if (!reddit_account_id) {
    return NextResponse.json(
      { error: 'reddit_account_id is required' },
      { status: 400 }
    )
  }

  // Use admin client — DB triggers will populate rate_snapshot_inr and deadline_at
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('assignments')
    .insert({ task_id, profile_id, reddit_account_id })
    .select(
      `id, status, assigned_at, deadline_at, rate_snapshot_inr,
       tasks(title, task_type, subreddit),
       profiles(email),
       reddit_accounts(username)`
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
