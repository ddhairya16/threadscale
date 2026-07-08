import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/v1/admin/clients — list all clients
export async function GET() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, slug, description, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/v1/admin/clients — create a new client
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, description } = body as { name?: string; description?: string }

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const slug = name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('clients')
    .insert({ name: name.trim(), slug, description: description ?? null })
    .select('id, name, slug, description, is_active, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
