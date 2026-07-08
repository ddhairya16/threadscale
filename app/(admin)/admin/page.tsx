import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, ClipboardList, CheckSquare, Building2, ArrowRight } from 'lucide-react'

export default async function AdminOverviewPage() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') redirect('/login')

  const supabase = await createAdminClient()

  const [
    { count: totalContributors },
    { count: pendingReviews },
    { count: openAssignments },
    { count: totalClients },
    { data: recentAssignments },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'contributor'),
    supabase.from('assignments').select('id', { count: 'exact', head: true }).in('status', ['submitted', 'under_review']),
    supabase.from('assignments').select('id', { count: 'exact', head: true }).eq('status', 'assigned'),
    supabase.from('clients').select('id', { count: 'exact', head: true }),
    supabase.from('assignments')
      .select('id, status, assigned_at, tasks(title, task_type), profiles(email)')
      .order('assigned_at', { ascending: false })
      .limit(5),
  ])

  const stats = [
    { label: 'Pending Reviews', value: pendingReviews ?? 0, icon: CheckSquare, href: '/admin/assignments', color: 'text-orange-500 bg-orange-500/10' },
    { label: 'Open Assignments', value: openAssignments ?? 0, icon: ClipboardList, href: '/admin/assignments', color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Contributors', value: totalContributors ?? 0, icon: Users, href: '/admin/contributors', color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Clients', value: totalClients ?? 0, icon: Building2, href: '/admin/clients', color: 'text-emerald-500 bg-emerald-500/10' },
  ]

  const statusColors: Record<string, string> = {
    assigned: 'bg-blue-500/10 text-blue-500',
    in_progress: 'bg-amber-500/10 text-amber-500',
    submitted: 'bg-violet-500/10 text-violet-500',
    approved: 'bg-emerald-500/10 text-emerald-500',
    rejected: 'bg-red-500/10 text-red-500',
    cancelled: 'bg-muted text-muted-foreground',
  }

  return (
    <div className="space-y-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">Platform-wide metrics at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="group flex flex-col gap-3 p-5 rounded-xl border border-border/50 bg-card/50 backdrop-blur hover:border-border hover:bg-card transition-all"
          >
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-3xl font-bold tracking-tight">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform mt-auto" />
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h2 className="font-semibold">Recent Assignments</h2>
          <Link href="/admin/assignments" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        {!recentAssignments?.length ? (
          <div className="px-6 py-8 text-sm text-muted-foreground text-center">No assignments yet.</div>
        ) : (
          <div className="divide-y divide-border/50">
            {recentAssignments.map((a: any) => (
              <div key={a.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.tasks?.title ?? 'Unknown task'}</p>
                  <p className="text-xs text-muted-foreground">{a.profiles?.email}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColors[a.status] ?? ''}`}>
                  {a.status?.replace('_', ' ')}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(a.assigned_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
