import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IndianRupee, Clock, CheckCircle2, ListTodo } from 'lucide-react'
import { formatINR } from '@/lib/utils/currency'

interface EarningsStats {
  activeTasks: number
  pendingReviews: number
  pendingEarnings: number
  lifetimeEarnings: number
  lastPaymentDate?: string | null
}

export function EarningsOverview({ stats }: { stats: EarningsStats }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
          <ListTodo className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.activeTasks}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Tasks currently assigned to you
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reviews</CardTitle>
          <Clock className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.pendingReviews}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Submissions awaiting admin review
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pending Payments</CardTitle>
          <IndianRupee className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatINR(stats.pendingEarnings)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Approved tasks waiting to be paid
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm transition-all hover:shadow-md hover:bg-card/80">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Lifetime Earned</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatINR(stats.lifetimeEarnings)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.lastPaymentDate ? `Last paid: ${new Date(stats.lastPaymentDate).toLocaleDateString()}` : 'Total paid to your account'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
