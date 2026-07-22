import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { SubmissionForm } from '@/components/submissions/submission-form'

export default async function SubmitTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const supabase = await createClient()

  // Fetch the assignment to ensure it exists, belongs to the user, and is open for submission
  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(`
      id,
      status,
      tasks (
        title,
        subreddit
      )
    `)
    .eq('id', id)
    .eq('profile_id', session.userId)
    .single()

  if (error || !assignment) {
    redirect('/tasks')
  }

  // Only allow submission if status is assigned, in_progress, or rejected
  if (!['assigned', 'in_progress', 'rejected'].includes(assignment.status)) {
    redirect(`/tasks/${id}`)
  }

  const taskTitle = (assignment.tasks as any)?.title || 'Task'
  const taskSubreddit = (assignment.tasks as any)?.subreddit || ''

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Submit Proof</h1>
        <p className="text-muted-foreground mt-1">
          Submitting proof for: <span className="font-medium text-foreground">{taskTitle}</span> {taskSubreddit && `(r/${taskSubreddit})`}
        </p>
      </div>

      <SubmissionForm taskId={id} />
    </div>
  )
}
