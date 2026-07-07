import { getSession } from '@/lib/auth/get-session'

export default async function AdminPage() {
  const session = await getSession()
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome, Administrator {session?.profile.email}. This page will be built in Phase 6.
      </p>
    </div>
  )
}
