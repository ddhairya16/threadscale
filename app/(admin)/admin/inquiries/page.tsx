import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'

export default async function InquiriesPage() {
  const supabase = await createAdminClient()
  
  const { data: inquiries, error } = await supabase
    .from('business_inquiries')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/10 text-blue-500'
      case 'contacted': return 'bg-amber-500/10 text-amber-500'
      case 'qualified': return 'bg-emerald-500/10 text-emerald-500'
      case 'closed': return 'bg-muted text-muted-foreground'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Business Inquiries</h1>
        <p className="text-muted-foreground mt-1">Manage leads from the landing page contact form.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Recent Inquiries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Received</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No inquiries found.
                  </TableCell>
                </TableRow>
              ) : inquiries?.map((inquiry) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">
                    {inquiry.company_name}
                    {inquiry.website && (
                      <a href={inquiry.website} target="_blank" rel="noreferrer" className="block text-xs text-primary hover:underline">
                        Website
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{inquiry.contact_name}</div>
                    <a href={`mailto:${inquiry.email}`} className="text-xs text-muted-foreground hover:text-foreground">
                      {inquiry.email}
                    </a>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate" title={inquiry.project_description}>
                    {inquiry.project_description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`capitalize ${getStatusColor(inquiry.status)}`}>
                      {inquiry.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(inquiry.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
