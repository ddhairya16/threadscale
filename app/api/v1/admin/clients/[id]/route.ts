import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// DELETE /api/v1/admin/clients/[id] — delete a client
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = await createAdminClient()

  const { error } = await supabase.from('clients').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}

// PATCH /api/v1/admin/clients/[id] — update name, description, or is_active
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const { name, description, is_active } = body as {
    name?: string
    description?: string
    is_active?: boolean
  }

  const updates: {
    name?: string
    slug?: string
    description?: string | null
    is_active?: boolean
  } = {}
  if (name !== undefined) {
    updates.name = name.trim()
    updates.slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }
  if (description !== undefined) updates.description = description
  if (is_active !== undefined) updates.is_active = is_active

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select('id, name, slug, description, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
