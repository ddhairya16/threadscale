import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'
import type { Enums } from '@/types/database.types'

type Params = { params: Promise<{ id: string }> }

const VALID_STATUSES: Enums<'assignment_status'>[] = [
  'assigned',
  'in_progress',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'paid',
]

// PATCH /api/v1/admin/assignments/[id] — update assignment status
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { status } = body as { status?: string }

  if (!status || !VALID_STATUSES.includes(status as Enums<'assignment_status'>)) {
    return NextResponse.json(
      { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('assignments')
    .update({ status: status as Enums<'assignment_status'> })
    .eq('id', id)
    .select(
      `id, status, assigned_at, deadline_at, rate_snapshot_inr,
       tasks(title, task_type, subreddit),
       profiles(email),
       reddit_accounts(username)`
    )
    .single()

  if (error) {
    const httpStatus = error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: error.message }, { status: httpStatus })
  }
  return NextResponse.json(data)
}
