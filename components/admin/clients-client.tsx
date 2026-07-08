'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2, Building2, ChevronDown, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Client {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
}

export function ClientsClient({ clients: initial }: { clients: Client[] }) {
  const [clients, setClients] = useState(initial)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isAdding, startAdding] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const addClient = () => {
    if (!name.trim()) return
    startAdding(async () => {
      const res = await fetch('/api/v1/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      })
      if (res.ok) {
        const c = await res.json()
        setClients(prev => [c, ...prev])
        setName('')
        setDescription('')
        toast.success(`Client "${c.name}" created!`)
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to create client.')
      }
    })
  }

  const deleteClient = async (id: string) => {
    setDeletingId(id)
    const res = await fetch(`/api/v1/admin/clients/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClients(prev => prev.filter(c => c.id !== id))
      toast.success('Client deleted.')
    } else {
      toast.error('Failed to delete client. (Clients with projects cannot be deleted.)')
    }
    setDeletingId(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      {/* Add Client Form */}
      <Card className="bg-card/50 backdrop-blur border-border/50 h-fit">
        <CardHeader>
          <CardTitle className="text-base">Add New Client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">Client Name *</Label>
            <Input
              id="client-name"
              placeholder="e.g. Acme Corp"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addClient()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-desc">Description</Label>
            <Input
              id="client-desc"
              placeholder="Optional notes about this client"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <Button onClick={addClient} disabled={isAdding || !name.trim()} className="w-full">
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create Client
          </Button>
        </CardContent>
      </Card>

      {/* Client List */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 bg-muted/30">
          <span className="text-sm font-medium text-muted-foreground">{clients.length} clients</span>
        </div>
        {clients.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <Building2 className="h-8 w-8 text-muted-foreground/40" />
            <p>No clients yet. Add your first client.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {clients.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{c.name}</p>
                    <span className="text-xs text-muted-foreground">/{c.slug}</span>
                    {c.is_active ? (
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Inactive</span>
                    )}
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => deleteClient(c.id)}
                  disabled={deletingId === c.id}
                >
                  {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
