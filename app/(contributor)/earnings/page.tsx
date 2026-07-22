import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { createClient } from '@/lib/supabase/server'
import { IndianRupee, CheckCircle2, Clock } from 'lucide-react'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatINR } from '@/lib/utils/currency'
import { Badge } from '@/components/ui/badge'

export default async function EarningsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = await createClient()

  // 1. Fetch Assignments to calculate Pending Earnings and Today's Earnings
  const { data: assignments } = await supabase
    .from('assignments')
    .select(`
      id, 
      status, 
      rate_snapshot_inr, 
      completed_at,
      tasks (title)
    `)
    .eq('profile_id', session.userId)
    .in('status', ['submitted', 'under_review', 'approved'])

  // 2. Fetch Payments to calculate Lifetime Earnings and Last Payment
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('profile_id', session.userId)
    .order('created_at', { ascending: false })

  const paidAssignmentIds = new Set((payments || []).filter(p => p.status === 'paid').map(p => p.assignment_id))

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  // Calculations
  const todayEarnings = (assignments || [])
    .filter(a => a.completed_at && new Date(a.completed_at) >= todayStart && (a.status === 'approved' || paidAssignmentIds.has(a.id)))
    .reduce((acc, a) => acc + (a.rate_snapshot_inr || 0), 0)

  const pendingEarnings = (assignments || [])
    .filter(a => a.status === 'approved' && !paidAssignmentIds.has(a.id))
    .reduce((acc, a) => acc + (a.rate_snapshot_inr || 0), 0)

  const lifetimeEarnings = (payments || [])
    .filter(p => p.status === 'paid')
    .reduce((acc, p) => acc + (p.amount_inr || 0), 0)

  const lastPayment = (payments || []).find(p => p.status === 'paid')

  return (
    <div className="flex flex-col gap-6 fade-in pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Earnings</h1>
        <p className="text-muted-foreground mt-1">
          Track your completed tasks and payment history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatINR(todayEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks approved today</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatINR(pendingEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatINR(lifetimeEarnings)}</div>
            <p className="text-xs text-muted-foreground mt-1">Total amount paid out</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {lastPayment ? formatINR(lastPayment.amount_inr) : '₹0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {lastPayment?.paid_at ? new Date(lastPayment.paid_at).toLocaleDateString() : 'No payments yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-semibold mt-4">Payment History</h2>
      {(!payments || payments.length === 0) ? (
        <EmptyState
          icon={IndianRupee}
          title="No earnings yet"
          description="Complete tasks to start earning. Payments are automatically processed to your UPI ID every Friday."
          actionLabel="Browse Tasks"
          actionHref="/tasks"
        />
      ) : (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {payments.map(payment => (
                <div key={payment.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${payment.status === 'paid' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                      {payment.status === 'paid' ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium capitalize text-foreground">{payment.payment_type.replace('_', ' ')} Payment</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="font-semibold text-foreground">{formatINR(payment.amount_inr)}</span>
                    <Badge variant="outline" className={`capitalize ${payment.status === 'paid' ? 'border-green-500/50 text-green-500' : 'border-orange-500/50 text-orange-500'}`}>
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
