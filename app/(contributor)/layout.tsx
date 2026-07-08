import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { Sidebar } from '@/components/layout/sidebar'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.profile.role === 'admin') redirect('/admin')
  if (session.profile.status === 'pending') redirect('/waiting')
  
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      {/* Mobile Header (Hidden on Desktop) */}
      <MobileNav userEmail={session.profile.email} role={session.profile.role} />
      
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <Sidebar userEmail={session.profile.email} role={session.profile.role} />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
