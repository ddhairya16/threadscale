import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckSquare, UserPlus, Link as LinkIcon, User } from 'lucide-react'

const actions = [
  {
    title: 'Browse Tasks',
    href: '/tasks',
    icon: <CheckSquare className="h-5 w-5 text-primary" />,
    description: 'Find new available tasks'
  },
  {
    title: 'Add Reddit Account',
    href: '/settings#reddit',
    icon: <LinkIcon className="h-5 w-5 text-primary" />,
    description: 'Link a new account to earn'
  },
  {
    title: 'Referral Dashboard',
    href: '/referrals',
    icon: <UserPlus className="h-5 w-5 text-primary" />,
    description: 'Invite friends, earn ₹25'
  },
  {
    title: 'Edit Profile',
    href: '/settings',
    icon: <User className="h-5 w-5 text-primary" />,
    description: 'Update UPI and details'
  }
]

export function QuickActions() {
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="flex flex-col gap-2 p-4 rounded-xl bg-background/50 border border-border/50 hover:bg-secondary/50 hover:border-border transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  {action.icon}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
