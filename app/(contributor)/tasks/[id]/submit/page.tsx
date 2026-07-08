import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { SubmissionForm } from '@/components/submissions/submission-form'

export default async function SubmitTaskPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  // In a real app, we would fetch the task from Supabase here to ensure it exists
  // and belongs to this user. For Phase 5 UI, we'll mock the task details for now.
  const mockTask = {
    id: params.id,
    type: 'Comment',
    subreddit: 'programming',
    title: 'Share your thoughts on the new React compiler',
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full fade-in pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Submit Proof</h1>
        <p className="text-muted-foreground mt-1">
          Submitting proof for: <span className="font-medium text-foreground">{mockTask.title}</span> (r/{mockTask.subreddit})
        </p>
      </div>

      <SubmissionForm taskId={params.id} />
    </div>
  )
}
