import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { createAdminClient } from '@/lib/supabase/server'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') redirect('/login')

  return (
    <div className="min-h-screen bg-background">
      <AdminNav email={session.profile.email} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
