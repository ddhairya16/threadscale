import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { ContributorsClient } from '@/components/admin/contributors-client'

export default async function ContributorsPage() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') redirect('/login')

  const supabase = await createAdminClient()

  const { data: contributors } = await supabase
    .from('profiles')
    .select('id, email, full_name, upi_id, status, created_at, reddit_accounts(id, username, is_active)')
    .eq('role', 'contributor')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contributors</h1>
        <p className="text-muted-foreground mt-1">All platform contributors and their accounts.</p>
      </div>
      <ContributorsClient contributors={contributors ?? []} />
    </div>
  )
}
