import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { LogoutButton } from './client'

export default async function WaitingPage() {
  const session = await getSession()
  
  if (!session) redirect('/login')
  if (session.profile.status === 'approved') {
    redirect(session.profile.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-6">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Waiting for Approval</h1>
        
        <p className="text-muted-foreground text-lg">
          Thanks for joining! Your account is currently under review by our team. 
          We'll notify you once you've been approved to start working on tasks.
        </p>

        <div className="pt-8">
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
