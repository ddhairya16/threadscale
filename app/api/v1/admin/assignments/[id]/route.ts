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
]

// PATCH /api/v1/admin/assignments/[id] — update assignment status
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { status, rate_snapshot_inr, deadline_at } = body as { status?: string, rate_snapshot_inr?: number, deadline_at?: string }

  const updatePayload: any = {}

  if (status) {
    if (!VALID_STATUSES.includes(status as Enums<'assignment_status'>)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }
    updatePayload.status = status
  }

  if (rate_snapshot_inr !== undefined) {
    updatePayload.rate_snapshot_inr = rate_snapshot_inr
  }

  if (deadline_at !== undefined) {
    updatePayload.deadline_at = deadline_at
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('assignments')
    .update(updatePayload)
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
