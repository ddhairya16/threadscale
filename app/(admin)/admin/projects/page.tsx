import { getSession } from '@/lib/auth/get-session'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { ProjectsClient } from '@/components/admin/projects-client'

export default async function ProjectsPage() {
  const session = await getSession()
  if (!session || session.profile.role !== 'admin') redirect('/login')

  const supabase = await createAdminClient()

  const [{ data: projects }, { data: clients }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, description, is_active, client_id, created_at, clients(id, name, slug)')
      .order('created_at', { ascending: false }),
    supabase
      .from('clients')
      .select('id, name, slug')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
        <p className="text-muted-foreground mt-1">Projects group tasks per client.</p>
      </div>
      <ProjectsClient projects={projects ?? []} clients={clients ?? []} />
    </div>
  )
}
