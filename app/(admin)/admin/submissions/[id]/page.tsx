import Link from 'next/link'
import Image from 'next/image'
import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ExternalLink, Check, X, AlertCircle } from 'lucide-react'

export default async function AdminSubmissionReviewPage({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') redirect('/login')

  // In a real app, fetch from Supabase joining profiles, assignments, and tasks
  const mockSubmission = {
    id: params.id,
    contributor: {
      email: 'contributor@example.com',
      redditAccount: 'u/sample_user',
    },
    task: {
      title: 'Share your thoughts on the new React compiler',
      client: 'Vercel',
      project: 'React Compiler Launch',
    },
    reddit: {
      type: 'comment',
      subreddit: 'programming',
      postId: '1d4xyz',
      commentId: 'l9mnop',
      permalink: 'https://reddit.com/r/programming/comments/1d4xyz/react/l9mnop/',
    },
    insights: {
      whatHappened: 'I posted the comment and got a few upvotes immediately.',
      unusual: 'A moderator replied asking for more technical details, which I provided in a follow-up.',
      recommendations: 'We should include technical architecture details in the initial brief.',
      futureNotes: 'Be prepared to defend the position with docs.',
    },
    screenshots: [
      'https://via.placeholder.com/800x600.png?text=Screenshot+1',
      'https://via.placeholder.com/800x600.png?text=Screenshot+2',
    ],
    status: 'In Review',
    submittedAt: new Date().toISOString(),
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 fade-in pb-20">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Submission</h1>
          <p className="text-muted-foreground mt-1">Submission ID: {mockSubmission.id}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Badge variant="secondary" className="text-blue-500 bg-blue-500/10 hover:bg-blue-500/20">{mockSubmission.status}</Badge>
          <span className="text-sm text-muted-foreground">
            Submitted {new Date(mockSubmission.submittedAt).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Metadata & Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-xs text-muted-foreground">Contributor</span>
                <p className="font-medium">{mockSubmission.contributor.email}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Reddit Account</span>
                <p className="font-medium text-primary">{mockSubmission.contributor.redditAccount}</p>
              </div>
              <div className="pt-4 border-t">
                <span className="text-xs text-muted-foreground">Client / Project</span>
                <p className="font-medium">{mockSubmission.task.client} / {mockSubmission.task.project}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Task Title</span>
                <p className="font-medium">{mockSubmission.task.title}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reddit Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Type</span>
                  <p className="font-medium capitalize">{mockSubmission.reddit.type}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Subreddit</span>
                  <p className="font-medium">r/{mockSubmission.reddit.subreddit}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Post ID</span>
                  <p className="font-medium">{mockSubmission.reddit.postId}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Comment ID</span>
                  <p className="font-medium">{mockSubmission.reddit.commentId || 'N/A'}</p>
                </div>
              </div>
              <div className="pt-2">
                <a 
                  href={mockSubmission.reddit.permalink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-500 hover:underline"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View on Reddit
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Screenshots & Insights */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Proof Screenshots</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {mockSubmission.screenshots.map((url, i) => (
                  <div key={i} className="relative w-full overflow-hidden rounded-md border bg-black/5 aspect-video flex items-center justify-center">
                    <img src={url} alt={`Screenshot ${i + 1}`} className="object-contain w-full h-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contributor Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-md bg-muted/50 border">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1 block">What happened?</span>
                <p className="text-sm">{mockSubmission.insights.whatHappened}</p>
              </div>
              <div className="p-4 rounded-md bg-muted/50 border">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1 block">Anything unusual?</span>
                <p className="text-sm">{mockSubmission.insights.unusual}</p>
              </div>
              <div className="p-4 rounded-md bg-muted/50 border">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1 block">Recommendations</span>
                <p className="text-sm">{mockSubmission.insights.recommendations}</p>
              </div>
              <div className="p-4 rounded-md bg-muted/50 border">
                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1 block">Future Notes</span>
                <p className="text-sm">{mockSubmission.insights.futureNotes}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t flex items-center justify-center gap-4 z-50">
        <div className="w-full max-w-6xl flex justify-end gap-3">
          <Button variant="outline" className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 border-amber-500/20">
            <AlertCircle className="h-4 w-4 mr-2" />
            Request Changes
          </Button>
          <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20">
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
            <Check className="h-4 w-4 mr-2" />
            Approve Submission
          </Button>
        </div>
      </div>
    </div>
  )
}
