import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { TasksClient } from '@/components/admin/tasks-client'

export default async function TasksPage() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') redirect('/login')

  const supabase = await createAdminClient()

  const [{ data: tasks }, { data: projects }] = await Promise.all([
    supabase
      .from('tasks')
      .select('id, title, task_type, subreddit, status, base_reward_inr, max_assignments, deadline_hours, created_at, projects(id, name, clients(id, name))')
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('id, name, client_id, clients(id, name)')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1">Create and manage Reddit tasks for contributors.</p>
      </div>
      <TasksClient tasks={tasks ?? []} projects={projects ?? []} />
    </div>
  )
}
