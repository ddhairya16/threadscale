import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { ClientsClient } from '@/components/admin/clients-client'

export default async function ClientsPage() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') redirect('/login')

  const supabase = await createAdminClient()
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, slug, description, is_active, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground mt-1">Manage business clients who commission tasks.</p>
      </div>
      <ClientsClient clients={clients ?? []} />
    </div>
  )
}
