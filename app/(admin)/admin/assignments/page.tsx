import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { AssignmentsClient } from '@/components/admin/assignments-client'

export const dynamic = 'force-dynamic'

export default async function AssignmentsPage() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') redirect('/login')

  const supabase = await createAdminClient()

  const [
    { data: assignments },
    { data: openTasks },
    { data: contributors },
  ] = await Promise.all([
    supabase
      .from('assignments')
      .select('id, status, assigned_at, deadline_at, rate_snapshot_inr, tasks(id, title, task_type, subreddit), profiles(id, email), reddit_accounts(id, username)')
      .order('assigned_at', { ascending: false }),
    supabase
      .from('tasks')
      .select('id, title, task_type, subreddit, base_reward_inr, max_assignments, status')
      .in('status', ['open', 'draft'])
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, email, full_name, reddit_accounts(id, username, is_active)')
      .eq('role', 'contributor')
      .eq('status', 'active')
      .order('email'),
  ])

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1">Assign tasks to contributors and track progress.</p>
      </div>
      <AssignmentsClient
        assignments={assignments ?? []}
        openTasks={openTasks ?? []}
        contributors={contributors ?? []}
      />
    </div>
  )
}
