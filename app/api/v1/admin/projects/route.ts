import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/v1/admin/projects — list all projects with client info
export async function GET() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, name, description, is_active, client_id, created_at, clients(name, slug)'
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/v1/admin/projects — create a new project
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { client_id, name, description } = body as {
    client_id?: string
    name?: string
    description?: string
  }

  if (!client_id) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }
  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('projects')
    .insert({
      client_id,
      name: name.trim(),
      description: description ?? null,
    })
    .select(
      'id, name, description, is_active, client_id, created_at, clients(name, slug)'
    )
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
