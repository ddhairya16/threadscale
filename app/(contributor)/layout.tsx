import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'

/**
 * Contributor dashboard layout.
 * Phase 4 will replace this with the full sidebar layout.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  
  return <>{children}</>
}
