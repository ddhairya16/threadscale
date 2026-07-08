'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Loader2, ClipboardList, ChevronDown, ChevronUp } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Project { id: string; name: string; client_id: string; clients: { name: string } | null }
interface Task {
  id: string; title: string; task_type: string; subreddit: string | null
  status: string; base_reward_inr: number; max_assignments: number
  deadline_hours: number; created_at: string
  projects: { name: string; clients: { name: string } | null } | null
}

const TASK_TYPES = ['comment', 'post', 'upvote', 'share', 'dm']
// Editable statuses (what admin can set) → maps to DB enum
const STATUS_OPTIONS = [
  { label: 'Open', value: 'open' },
  { label: 'Paused (Draft)', value: 'draft' },
  { label: 'Cancelled', value: 'cancelled' },
]
const statusColors: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-500',
  fully_assigned: 'bg-amber-500/10 text-amber-500',
  completed: 'bg-blue-500/10 text-blue-500',
  draft: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-500/10 text-red-500',
}

export function TasksClient({ tasks: initial, projects }: { tasks: Task[]; projects: Project[] }) {
  const [tasks, setTasks] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    project_id: projects[0]?.id ?? '',
    task_type: 'comment',
    title: '',
    instructions: '',
    subreddit: '',
    thread_url: '',
    base_reward_inr: '100',
    max_assignments: '1',
    deadline_hours: '24',
  })
  const [isAdding, startAdding] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const setField = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))

  const createTask = () => {
    if (!form.title.trim() || !form.project_id || !form.instructions.trim()) {
      toast.error('Please fill in title, project, and instructions.')
      return
    }
    startAdding(async () => {
      const res = await fetch('/api/v1/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          base_reward_inr: parseFloat(form.base_reward_inr),
          max_assignments: parseInt(form.max_assignments),
          deadline_hours: parseInt(form.deadline_hours),
        }),
      })
      if (res.ok) {
        const t = await res.json()
        setTasks(prev => [t, ...prev])
        setForm(f => ({ ...f, title: '', instructions: '', subreddit: '', thread_url: '' }))
        setShowForm(false)
        toast.success(`Task "${t.title}" created!`)
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to create task.')
      }
    })
  }

  const deleteTask = async (id: string) => {
    setDeletingId(id)
    const res = await fetch(`/api/v1/admin/tasks/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== id))
      toast.success('Task deleted.')
    } else {
      toast.error('Cannot delete a task with active assignments.')
    }
    setDeletingId(null)
  }

  const changeStatus = async (id: string, uiStatus: string) => {
    // uiStatus is already the DB enum value (open/draft/cancelled)
    const res = await fetch(`/api/v1/admin/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: uiStatus }),
    })
    if (res.ok) {
      // The API returns the actual DB status value
      const updated = await res.json()
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: updated.status } : t))
    } else {
      toast.error('Failed to update status.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{tasks.length} tasks</span>
        <Button onClick={() => setShowForm(s => !s)}>
          {showForm ? <ChevronUp className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showForm ? 'Hide Form' : 'Create Task'}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader><CardTitle className="text-base">New Task</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label>Project *</Label>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">Create a project first.</p>
              ) : (
                <select
                  value={form.project_id}
                  onChange={e => setField('project_id', e.target.value)}
                  className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{(p.clients as any)?.name} — {p.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label>Title *</Label>
              <Input placeholder="e.g. Comment on React Compiler post" value={form.title} onChange={e => setField('title', e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label>Instructions *</Label>
              <textarea
                placeholder="Detailed instructions for the contributor..."
                value={form.instructions}
                onChange={e => setField('instructions', e.target.value)}
                rows={3}
                className="w-full flex rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Task Type *</Label>
              <select
                value={form.task_type}
                onChange={e => setField('task_type', e.target.value)}
                className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring capitalize"
              >
                {TASK_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Subreddit</Label>
              <Input placeholder="e.g. programming" value={form.subreddit} onChange={e => setField('subreddit', e.target.value)} />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label>Thread URL</Label>
              <Input placeholder="https://reddit.com/r/..." value={form.thread_url} onChange={e => setField('thread_url', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Reward (INR) *</Label>
              <Input type="number" value={form.base_reward_inr} onChange={e => setField('base_reward_inr', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Max Assignments</Label>
              <Input type="number" min="1" value={form.max_assignments} onChange={e => setField('max_assignments', e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Deadline (hours)</Label>
              <Input type="number" min="1" value={form.deadline_hours} onChange={e => setField('deadline_hours', e.target.value)} />
            </div>

            <div className="sm:col-span-2 flex justify-end">
              <Button onClick={createTask} disabled={isAdding || !form.title.trim()}>
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks table */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        {tasks.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <ClipboardList className="h-8 w-8 text-muted-foreground/40" />
            <p>No tasks yet. Create your first task above.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Task</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Reward</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Slots</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {tasks.map(t => (
                <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-foreground truncate max-w-xs">{t.title}</p>
                      <p className="text-xs text-muted-foreground">{(t.projects as any)?.clients?.name ?? ''} › {(t.projects as any)?.name ?? ''}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell">
                    <span className="capitalize text-muted-foreground">{t.task_type}</span>
                    {t.subreddit && <span className="ml-1 text-xs text-muted-foreground/60">r/{t.subreddit}</span>}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell font-medium">₹{t.base_reward_inr}</td>
                  <td className="px-5 py-3">
                    <select
                      value={t.status}
                      onChange={e => changeStatus(t.id, e.target.value)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 cursor-pointer ${statusColors[t.status] ?? ''}`}
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.value} value={s.value} className="bg-background text-foreground">{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">{t.max_assignments}</td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="ghost" size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => deleteTask(t.id)}
                      disabled={deletingId === t.id}
                    >
                      {deletingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
