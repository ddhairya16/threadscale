import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/utils/currency'
import { Clock, CheckSquare, Copy, ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { CopyButton } from '@/components/ui/copy-button'
import { InsightsSection } from '@/components/tasks/insights-section'

export default async function TaskDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { id } = await params
  const supabase = await createClient()

  const { data: assignment, error } = await supabase
    .from('assignments')
    .select(`
      *,
      reddit_accounts (username),
      tasks (
        *,
        projects (name, clients(name))
      ),
      submissions (id, insights (text_content))
    `)
    .eq('id', id)
    .eq('profile_id', session.userId)
    .single()

  if (error || !assignment) {
    redirect('/tasks')
  }

  const t = assignment.tasks
  const isSubmitDisabled = !['assigned', 'in_progress', 'rejected'].includes(assignment.status)
  
  const showInsights = ['submitted', 'under_review', 'approved'].includes(assignment.status)
  const submission = assignment.submissions?.[0]
  const insightsArray = submission?.insights as any
  const existingInsights = insightsArray?.[0]?.text_content 
    ? JSON.parse(insightsArray[0].text_content) 
    : null

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'assigned':
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
      case 'submitted':
      case 'under_review':
        return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20'
      case 'approved':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      case 'rejected':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-10 fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t?.title}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 mt-1">
            <Badge variant="secondary" className="capitalize">{t?.task_type}</Badge>
            <span>•</span>
            <span className="text-foreground font-medium">Assigned to u/{assignment.reddit_accounts?.username}</span>
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="text-2xl font-bold text-foreground">{formatINR(assignment.rate_snapshot_inr)}</div>
          <Badge className={`mt-1 capitalize border-0 ${getStatusColor(assignment.status)}`}>
            {assignment.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{t?.instructions}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Content Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {t?.subreddit && (
                <div className="space-y-1.5">
                  <div className="text-sm font-medium text-muted-foreground flex justify-between">
                    Subreddit
                    <CopyButton text={t.subreddit} />
                  </div>
                  <div className="bg-muted p-3 rounded-md text-sm border border-border/50">
                    r/{t.subreddit}
                  </div>
                </div>
              )}
              
              {t?.post_title && (
                <div className="space-y-1.5">
                  <div className="text-sm font-medium text-muted-foreground flex justify-between">
                    Post Title
                    <CopyButton text={t.post_title} />
                  </div>
                  <div className="bg-muted p-3 rounded-md text-sm border border-border/50">
                    {t.post_title}
                  </div>
                </div>
              )}

              {t?.post_body && (
                <div className="space-y-1.5">
                  <div className="text-sm font-medium text-muted-foreground flex justify-between">
                    Body / Comment
                    <CopyButton text={t.post_body} />
                  </div>
                  <div className="bg-muted p-3 rounded-md text-sm border border-border/50 whitespace-pre-wrap">
                    {t.post_body}
                  </div>
                </div>
              )}

              {t?.thread_url && (
                <div className="space-y-1.5">
                  <div className="text-sm font-medium text-muted-foreground flex justify-between">
                    Target URL
                    <CopyButton text={t.thread_url} />
                  </div>
                  <div className="bg-muted p-3 rounded-md text-sm border border-border/50 break-all">
                    {t.thread_url}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {showInsights && submission && (
            <InsightsSection 
              assignmentId={assignment.id} 
              existingInsights={existingInsights} 
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Deadline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {new Date(assignment.deadline_at).toLocaleDateString()}
                  </span>
                  <span className="text-sm">
                    {new Date(assignment.deadline_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 flex flex-col">
              <Link href={`/tasks/${assignment.id}/submit`} className="w-full pointer-events-auto">
                <Button className="w-full" disabled={isSubmitDisabled}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Proof
                </Button>
              </Link>
              {isSubmitDisabled && (
                <p className="text-xs text-center text-muted-foreground">
                  Submission is locked because the task status is '{assignment.status.replace('_', ' ')}'.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
