import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, CalendarDays, Coins } from 'lucide-react'

const typeIconMap: Record<string, React.ReactNode> = {
  assigned: <CalendarDays className="h-4 w-4 text-blue-500" />,
  submitted: <Clock className="h-4 w-4 text-orange-500" />,
  approved: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  paid: <Coins className="h-4 w-4 text-amber-500" />,
}

export function RecentActivity({ activities }: { activities: any[] }) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-sm text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-20" />
            <p>No activity yet.</p>
            <p className="text-xs">Your workflow timeline will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, i) => (
              <div key={activity.id || i} className="flex items-start gap-4">
                <div className="mt-0.5 bg-background p-1.5 rounded-full border border-border/50 shadow-sm">
                  {typeIconMap[activity.type] || <CheckCircle2 className="h-4 w-4 text-primary" />}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.date).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
