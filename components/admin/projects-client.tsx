'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2, FolderKanban } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Client { id: string; name: string; slug: string }
interface Project {
  id: string; name: string; description: string | null
  is_active: boolean; client_id: string; created_at: string
  clients: { id: string; name: string; slug: string } | null
}

export function ProjectsClient({ projects: initial, clients }: { projects: Project[]; clients: Client[] }) {
  const [projects, setProjects] = useState(initial)
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isAdding, startAdding] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const addProject = () => {
    if (!name.trim() || !clientId) return
    startAdding(async () => {
      const res = await fetch('/api/v1/admin/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, name: name.trim(), description: description.trim() }),
      })
      if (res.ok) {
        const p = await res.json()
        setProjects(prev => [p, ...prev])
        setName('')
        setDescription('')
        toast.success(`Project "${p.name}" created!`)
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to create project.')
      }
    })
  }

  const deleteProject = async (id: string) => {
    setDeletingId(id)
    const res = await fetch(`/api/v1/admin/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Project deleted.')
    } else {
      toast.error('Cannot delete a project that has tasks.')
    }
    setDeletingId(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <Card className="bg-card/50 backdrop-blur border-border/50 h-fit">
        <CardHeader><CardTitle className="text-base">Add New Project</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Create a client first before adding projects.</p>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="proj-client">Client *</Label>
                <select
                  id="proj-client"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-name">Project Name *</Label>
                <Input
                  id="proj-name"
                  placeholder="e.g. Q3 Reddit Awareness"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-desc">Description</Label>
                <Input
                  id="proj-desc"
                  placeholder="Optional"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <Button onClick={addProject} disabled={isAdding || !name.trim()} className="w-full">
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Project
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50 bg-muted/30">
          <span className="text-sm font-medium text-muted-foreground">{projects.length} projects</span>
        </div>
        {projects.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <FolderKanban className="h-8 w-8 text-muted-foreground/40" />
            <p>No projects yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {projects.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {(p.clients as any)?.name ?? 'Unknown Client'}
                    </span>
                    <p className="font-medium text-foreground">{p.name}</p>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>}
                </div>
                <Button
                  variant="ghost" size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                  onClick={() => deleteProject(p.id)}
                  disabled={deletingId === p.id}
                >
                  {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
