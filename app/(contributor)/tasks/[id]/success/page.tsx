import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, ArrowLeft, Clock } from 'lucide-react'

export default function SubmissionSuccessPage({ params }: { params: { id: string } }) {
  // In a real app, we would fetch the actual submission details from the DB
  const mockSubmission = {
    taskId: params.id,
    taskTitle: 'Share your thoughts on the new React compiler',
    subreddit: 'programming',
    status: 'In Review',
    submittedAt: new Date().toISOString(),
    expectedReviewTime: '24-48 hours'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] fade-in px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 mb-6 ring-8 ring-emerald-500/10">
        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight text-center mb-2">Submission Successful!</h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Your proof has been securely uploaded and is now waiting for admin review.
      </p>

      <Card className="w-full max-w-md bg-card/50 backdrop-blur border-border/50 mb-8">
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between border-b border-border/50 pb-4">
            <span className="text-muted-foreground text-sm">Task</span>
            <span className="font-medium text-sm text-right">{mockSubmission.taskTitle}</span>
          </div>
          
          <div className="flex justify-between border-b border-border/50 pb-4">
            <span className="text-muted-foreground text-sm">Subreddit</span>
            <span className="font-medium text-sm">r/{mockSubmission.subreddit}</span>
          </div>
          
          <div className="flex justify-between border-b border-border/50 pb-4">
            <span className="text-muted-foreground text-sm">Status</span>
            <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-500 transition-colors">
              {mockSubmission.status}
            </span>
          </div>

          <div className="flex justify-between border-b border-border/50 pb-4">
            <span className="text-muted-foreground text-sm">Submitted At</span>
            <span className="font-medium text-sm">
              {new Date(mockSubmission.submittedAt).toLocaleString('en-US', { 
                hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' 
              })}
            </span>
          </div>

          <div className="flex items-start gap-3 text-sm text-amber-500 bg-amber-500/10 p-3 rounded-md">
            <Clock className="h-4 w-4 mt-0.5 shrink-0" />
            <p>Expected review time: <strong>{mockSubmission.expectedReviewTime}</strong>. You will receive a notification when the status changes.</p>
          </div>
        </CardContent>
      </Card>

      <Link href="/dashboard" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Return to Dashboard
      </Link>
    </div>
  )
}
