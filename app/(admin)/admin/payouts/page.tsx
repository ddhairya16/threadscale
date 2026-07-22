import { createAdminClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { IndianRupee } from 'lucide-react'
import { PayoutsClient } from '@/components/admin/payouts-client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Payouts | Admin',
}

export default async function AdminPayoutsPage() {
  const supabase = await createAdminClient()

  // Fetch all assignments with their related profiles and tasks
  // We need to calculate pending and paid balances per contributor
  const { data: assignments, error } = await supabase
    .from('assignments')
    .select(`
      id,
      status,
      rate_snapshot_inr,
      completed_at,
      profiles (
        id,
        full_name,
        email,
        upi_id,
        payment_method,
        account_holder_name,
        payment_qr_ref
      ),
      tasks (
        title
      )
    `)
    .order('completed_at', { ascending: false })

  if (error) {
    console.error(error)
  }

  // Also fetch payments to know which assignments are paid
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('assignment_id, status')
    
  if (paymentsError) {
    console.error(paymentsError)
  }

  const paidAssignmentIds = new Set(
    payments?.filter(p => p.status === 'paid').map(p => p.assignment_id) || []
  )

  // Group by contributor
  const contributorStats: Record<string, any> = {}

  assignments?.forEach((a: any) => {
    if (!a.profiles) return
    const pid = a.profiles.id
    if (!contributorStats[pid]) {
      contributorStats[pid] = {
        profile: a.profiles,
        pendingBalance: 0,
        totalPaid: 0,
        pendingTasks: [],
        approvedTasks: [],
      }
    }

    const isPaid = paidAssignmentIds.has(a.id)

    if (a.status === 'approved' && !isPaid) {
      contributorStats[pid].pendingBalance += (a.rate_snapshot_inr || 0)
      contributorStats[pid].pendingTasks.push(a)
    } else if (isPaid) {
      contributorStats[pid].totalPaid += (a.rate_snapshot_inr || 0)
      contributorStats[pid].approvedTasks.push(a)
    }
  })

  // Convert to array and sort by pending balance
  const payoutsData = Object.values(contributorStats)
    .filter(stat => stat.pendingTasks.length > 0 || stat.totalPaid > 0)
    .sort((a, b) => b.pendingBalance - a.pendingBalance)

  return (
    <div className="flex flex-col gap-8 fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Payouts Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage contributor balances and clear payments.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-border/50 bg-card/50">
          <IndianRupee className="w-4 h-4 mr-2" />
          {payoutsData.filter(d => d.pendingBalance > 0).length} Pending Payouts
        </Badge>
      </div>

      <PayoutsClient data={payoutsData} />
    </div>
  )
}
