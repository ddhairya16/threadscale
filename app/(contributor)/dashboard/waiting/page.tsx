import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApi } from '@/lib/api/auth'
import { SignOutButton } from './signout-button'

export const metadata = {
  title: 'Waiting for Approval | Community Growth',
}

export default async function WaitingPage() {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }

  // If approved or admin, go to dashboard/admin
  if (session.profile.status === 'approved') {
    if (session.profile.role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background styling similar to auth layout */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, oklch(0.65 0.22 265 / 0.12), transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(oklch(1 0 0) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      </div>

      <div className="relative z-10 w-full max-w-md fade-in">
        <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto bg-amber-500/10 text-amber-500 h-16 w-16 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
              <Clock className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold">Application Pending</CardTitle>
            <CardDescription className="text-sm mt-2">
              Your account is currently under review by our moderation team.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="p-4 rounded-xl bg-secondary/30 text-sm text-muted-foreground text-left leading-relaxed">
              <p className="mb-2">We manually review all new applications to ensure a high-quality community.</p>
              <p>This process typically takes 24-48 hours. You will receive an email notification once your account has been approved.</p>
            </div>
            
            <div className="pt-2">
              <SignOutButton />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
