import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { FileCheck } from 'lucide-react'
import { SubmissionsClient } from '@/components/admin/submissions-client'

export const metadata = {
  title: 'Submissions Review | Admin',
}

export default async function AdminSubmissionsPage() {
  const supabase = await createAdminClient()

  const { data: submissions, error } = await supabase
    .from('submissions')
    .select(`
      *,
      assignments (
        id,
        status,
        rate_snapshot_inr,
        tasks (
          title,
          task_type,
          projects (
            name,
            clients (name)
          )
        ),
        profiles (
          full_name,
          email
        ),
        reddit_accounts (
          username
        )
      )
    `)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error(error)
  }

  return (
    <div className="flex flex-col gap-8 fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Submissions Review</h1>
          <p className="text-muted-foreground mt-1">Review proofs and approve or reject completed tasks.</p>
        </div>
        <Badge variant="outline" className="px-4 py-1.5 rounded-full border-border/50 bg-card/50">
          <FileCheck className="w-4 h-4 mr-2" />
          {submissions?.filter(s => s.status === 'pending' || s.status === 'under_review').length || 0} Pending
        </Badge>
      </div>

      <SubmissionsClient submissions={submissions || []} />
    </div>
  )
}
