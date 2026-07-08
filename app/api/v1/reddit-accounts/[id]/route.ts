import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/v1/reddit-accounts/[id]
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  // Only delete if this account belongs to the current user (RLS also enforces this)
  const { error } = await supabase
    .from('reddit_accounts')
    .delete()
    .eq('id', id)
    .eq('profile_id', session.profile.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
