import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'

// GET /api/v1/admin/contributors — list all contributor profiles with reddit account count
export async function GET() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'id, email, full_name, upi_id, status, created_at, reddit_accounts(id)'
    )
    .eq('role', 'contributor')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = data.map((p) => ({
    id: p.id,
    email: p.email,
    full_name: p.full_name,
    upi_id: p.upi_id,
    status: p.status,
    created_at: p.created_at,
    reddit_account_count: Array.isArray(p.reddit_accounts)
      ? p.reddit_accounts.length
      : 0,
  }))

  return NextResponse.json(result)
}
