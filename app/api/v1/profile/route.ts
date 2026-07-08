import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'

// GET /api/v1/profile — Fetch current user profile
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, upi_id, referral_code, role, status')
    .eq('id', session.profile.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/v1/profile — Update profile (full_name, upi_id)
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { full_name, upi_id } = body

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name, upi_id })
    .eq('id', session.profile.id)
    .select('id, email, full_name, upi_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
