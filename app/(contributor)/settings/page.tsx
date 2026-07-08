import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/get-session'
import { SettingsClient } from '@/components/settings/settings-client'

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex flex-col gap-8 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences.</p>
      </div>
      <SettingsClient initialEmail={session.profile.email} />
    </div>
  )
}
