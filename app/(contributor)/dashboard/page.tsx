import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { WelcomeHeader } from '@/components/dashboard/welcome-header'
import { EarningsOverview } from '@/components/dashboard/earnings-overview'
import { ActiveTasks } from '@/components/dashboard/active-tasks'
import { RecentNotifications } from '@/components/dashboard/recent-notifications'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function ContributorDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createClient()

  // 1. Fetch Assignments for the contributor
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select(`
      id, 
      status, 
      rate_snapshot_inr, 
      deadline_at,
      assigned_at,
      completed_at,
      tasks (
        id,
        title,
        task_type,
        subreddit,
        projects (name, clients(name))
      )
    `)
    .eq('profile_id', session.userId)
    .order('deadline_at', { ascending: true })

  // Active tasks = assigned or in_progress
  const activeTasks = (assignments || [])
    .filter(a => ['assigned', 'in_progress'].includes(a.status))
    .map(a => ({
      id: a.tasks?.id as string,
      assignmentId: a.id,
      type: a.tasks?.task_type as string,
      subreddit: (a.tasks?.subreddit || '') as string,
      reward: a.rate_snapshot_inr,
      deadlineAt: a.deadline_at,
      status: a.status
    }))
  
  // Pending reviews = submitted or under_review
  const pendingReviews = (assignments || []).filter(a => ['submitted', 'under_review'].includes(a.status))

  // Get payments to determine which are paid
  const { data: payments } = await supabase
    .from('payments')
    .select('paid_at, amount_inr, status, assignment_id')
    .eq('profile_id', session.userId)

  const paidAssignmentIds = new Set((payments || []).filter(p => p.status === 'paid').map(p => p.assignment_id))

  // Approved (waiting to be paid)
  const pendingPayments = (assignments || []).filter(a => a.status === 'approved' && !paidAssignmentIds.has(a.id))

  const lastPayment = (payments || []).filter(p => p.status === 'paid').sort((a, b) => new Date(b.paid_at || 0).getTime() - new Date(a.paid_at || 0).getTime())[0]

  const stats = {
    activeTasks: activeTasks.length,
    pendingReviews: pendingReviews.length,
    pendingEarnings: pendingPayments.reduce((acc, task) => acc + (task.rate_snapshot_inr || 0), 0),
    lifetimeEarnings: (payments || []).filter(p => p.status === 'paid').reduce((acc, p) => acc + (p.amount_inr || 0), 0),
    lastPaymentDate: lastPayment?.paid_at || null
  }

  // Convert for the Timeline (Recent Activity)
  const activities = (assignments || [])
    .map(a => {
      let date = a.assigned_at
      let title = `Assigned task: ${a.tasks?.title}`
      let type = 'assigned'
      
      if (paidAssignmentIds.has(a.id) && a.completed_at) {
        date = a.completed_at
        title = `Payment recorded for ${a.tasks?.title}`
        type = 'paid'
      } else if (a.status === 'approved' && a.completed_at) {
        date = a.completed_at
        title = `Submission approved for ${a.tasks?.title}`
        type = 'approved'
      } else if (['submitted', 'under_review'].includes(a.status) && a.completed_at) {
        date = a.completed_at
        title = `Submission sent for ${a.tasks?.title}`
        type = 'submitted'
      }
      return { id: a.id, date, title, type }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-8 pb-10 fade-in">
      {/* 1. Welcome Header */}
      <WelcomeHeader userEmail={session.profile.email} />

      {/* 2. Top Summary */}
      <section>
        <EarningsOverview stats={stats} />
      </section>

      {/* 3. Active Tasks */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">Active Tasks</h2>
            <p className="text-sm text-muted-foreground mt-1">Assignments you are currently working on.</p>
          </div>
          <Link href="/tasks" className="hidden sm:block">
            <Button variant="outline" size="sm">
              View All Tasks <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <ActiveTasks tasks={activeTasks} />
        
        <Link href="/tasks" className="sm:hidden mt-2 w-full">
          <Button variant="outline" size="sm" className="w-full">
            View All Tasks <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </section>

      {/* 4. Bottom Grid (Notifications, Quick Actions, Timeline) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <RecentNotifications notifications={[]} />
        <QuickActions />
        <RecentActivity activities={activities} />
      </section>
    </div>
  )
}
