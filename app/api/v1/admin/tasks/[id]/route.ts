import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/v1/admin/tasks/[id] — get single task with all fields
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('*, projects(name, client_id, clients(name, slug))')
    .eq('id', id)
    .single()

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: error.message }, { status })
  }
  return NextResponse.json(data)
}

// PATCH /api/v1/admin/tasks/[id] — update task status
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { status } = body as { status?: string }

  const validStatuses = ['open', 'paused', 'closed'] as const
  if (!status || !validStatuses.includes(status as (typeof validStatuses)[number])) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(', ')}` },
      { status: 400 }
    )
  }

  // Map 'closed' to the DB enum value 'cancelled' or 'completed' as needed.
  // For simplicity we accept open/paused; 'closed' maps to 'cancelled'.
  const dbStatusMap: Record<string, string> = {
    open: 'open',
    paused: 'draft',
    closed: 'cancelled',
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('tasks')
    .update({ status: dbStatusMap[status] as 'open' | 'draft' | 'cancelled' })
    .eq('id', id)
    .select('id, title, status, updated_at')
    .single()

  if (error) {
    const httpStatus = error.code === 'PGRST116' ? 404 : 500
    return NextResponse.json({ error: error.message }, { status: httpStatus })
  }
  return NextResponse.json(data)
}

// DELETE /api/v1/admin/tasks/[id] — delete a task
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createAdminClient()

  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
