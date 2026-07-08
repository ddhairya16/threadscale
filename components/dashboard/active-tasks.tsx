import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/utils/currency'
import { Clock, MessageSquare, ExternalLink, User, CheckSquare } from 'lucide-react'
import { EmptyState } from './empty-state'

export interface ActiveTask {
  id: string
  assignmentId: string
  type: string
  subreddit: string
  reward: number
  deadlineAt: string
  status: string
  redditAccount?: string
}

export function ActiveTasks({ tasks }: { tasks: ActiveTask[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="No active tasks"
        description="You don't have any tasks in progress. Browse available tasks to start earning."
        actionLabel="Browse Tasks"
        actionHref="/tasks"
      />
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <Card key={task.assignmentId} className="flex flex-col overflow-hidden bg-card/50 backdrop-blur border-border/50 transition-all hover:shadow-md hover:bg-card/80">
          <CardContent className="p-5 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
              <Badge variant="secondary" className="capitalize">
                {task.type}
              </Badge>
              <span className="font-semibold text-foreground text-sm">
                {formatINR(task.reward)}
              </span>
            </div>
            
            <h3 className="font-medium text-foreground mb-1 line-clamp-1">
              r/{task.subreddit}
            </h3>
            
            <div className="flex flex-col gap-1.5 mb-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>Due {new Date(task.deadlineAt).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              {task.redditAccount && (
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span>Assigned to u/{task.redditAccount}</span>
                </div>
              )}
            </div>
            
            <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
              <div className="text-xs font-medium text-amber-500 capitalize">
                {task.status.replace('_', ' ')}
              </div>
              <Link href={`/tasks/${task.assignmentId}`}>
                <Button size="sm" variant="default" className="h-8">
                  Open Task
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
