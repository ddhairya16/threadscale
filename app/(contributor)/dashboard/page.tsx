import { getSession } from '@/lib/auth/get-session'

export default async function DashboardPage() {
  const session = await getSession()
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Contributor Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome back, {session?.profile.email}. This page will be built in Phase 4.
      </p>
    </div>
  )
}
