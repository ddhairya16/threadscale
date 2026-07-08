import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { TasksListClient } from '@/components/tasks/tasks-list-client'

export default async function TasksPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createClient()

  const { data: assignments, error } = await supabase
    .from('assignments')
    .select(`
      id,
      task_id,
      status, 
      rate_snapshot_inr, 
      deadline_at,
      reddit_accounts (username),
      tasks (
        title,
        task_type,
        subreddit
      )
    `)
    .eq('profile_id', session.userId)
    .order('deadline_at', { ascending: true })

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Available Tasks</h1>
        <p className="text-muted-foreground mt-1">
          Your current assignments and their statuses.
        </p>
      </div>

      <TasksListClient initialAssignments={assignments || []} />
    </div>
  )
}
