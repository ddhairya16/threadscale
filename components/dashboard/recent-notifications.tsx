import { Bell, CheckCircle2, AlertCircle, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface Notification {
  id: string
  title: string
  description: string
  type: 'success' | 'warning' | 'info' | 'reward'
  time: string
}

const icons = {
  success: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  warning: <AlertCircle className="h-4 w-4 text-amber-500" />,
  info: <Bell className="h-4 w-4 text-blue-500" />,
  reward: <Gift className="h-4 w-4 text-purple-500" />,
}

export function RecentNotifications({ notifications }: { notifications: Notification[] }) {
  if (notifications.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
        <CardHeader>
          <CardTitle className="text-lg">Notifications</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Bell className="h-8 w-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">You're all caught up!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
      <CardHeader>
        <CardTitle className="text-lg">Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div key={notif.id} className="flex gap-3">
              <div className="mt-0.5 shrink-0">
                {icons[notif.type]}
              </div>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground leading-none">{notif.title}</p>
                <p className="text-xs text-muted-foreground">{notif.description}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{notif.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
