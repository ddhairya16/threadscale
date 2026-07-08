'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatINR } from '@/lib/utils/currency'
import { Clock, User, CheckSquare } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/dashboard/empty-state'

export interface TaskAssignment {
  id: string
  task_id: string
  status: string
  rate_snapshot_inr: number
  deadline_at: string
  reddit_accounts?: { username: string }
  tasks?: {
    title: string
    task_type: string
    subreddit: string | null
  }
}

export function TasksListClient({ initialAssignments }: { initialAssignments: TaskAssignment[] }) {
  const [filter, setFilter] = useState<string>('all')

  const filtered = useMemo(() => {
    let list = [...initialAssignments]
    if (filter !== 'all') {
      if (filter === 'under_review') {
        list = list.filter(a => ['submitted', 'under_review'].includes(a.status))
      } else {
        list = list.filter(a => a.status === filter)
      }
    }
    
    // Sort logic: Nearest deadline, newest assignment, highest reward
    // For simplicity: mostly sorting by deadline
    return list.sort((a, b) => new Date(a.deadline_at).getTime() - new Date(b.deadline_at).getTime())
  }, [initialAssignments, filter])

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Under Review', value: 'under_review' },
    { label: 'Completed', value: 'approved' },
  ]

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'assigned':
      case 'in_progress': return 'text-blue-500'
      case 'submitted':
      case 'under_review': return 'text-orange-500'
      case 'approved': return 'text-green-500'
      case 'paid': return 'text-amber-500'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map(f => (
          <Button 
            key={f.value} 
            variant={filter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f.value)}
            className="rounded-full"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description={filter === 'all' 
            ? "You don't have any assignments yet. Admins will assign tasks to you." 
            : `You have no tasks matching the '${filter.replace('_', ' ')}' status.`}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(a => (
            <Card key={a.id} className="flex flex-col overflow-hidden bg-card/50 backdrop-blur border-border/50 transition-all hover:shadow-md hover:bg-card/80">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="secondary" className="capitalize">
                    {a.tasks?.task_type}
                  </Badge>
                  <span className="font-semibold text-foreground text-sm">
                    {formatINR(a.rate_snapshot_inr)}
                  </span>
                </div>
                
                <h3 className="font-medium text-foreground mb-1 line-clamp-1">
                  {a.tasks?.title}
                </h3>
                
                <div className="flex flex-col gap-1.5 mb-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    <span>Due {new Date(a.deadline_at).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', month: 'short', day: 'numeric' })}</span>
                  </div>
                  {a.reddit_accounts?.username && (
                    <div className="flex items-center gap-2">
                      <User className="h-3 w-3" />
                      <span>Assigned to u/{a.reddit_accounts.username}</span>
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
                  <div className={`text-xs font-medium capitalize ${getStatusColor(a.status)}`}>
                    {a.status.replace('_', ' ')}
                  </div>
                  <Link href={`/tasks/${a.id}`}>
                    <Button size="sm" variant="default" className="h-8">
                      Open Task
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
