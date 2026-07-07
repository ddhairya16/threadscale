import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'

/**
 * Admin dashboard layout.
 * Phase 6 will replace this with the full sidebar layout.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') {
    redirect('/dashboard')
  }

  return <>{children}</>
}
