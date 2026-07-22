'use client'

import { useState, useTransition, useMemo } from 'react'
import { Plus, Loader2, CheckSquare, ChevronDown, X, Users, ClipboardList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

interface Task { id: string; title: string; task_type: string; subreddit: string | null; base_reward_inr: number; max_assignments: number; status: string }
interface RedditAccount { id: string; username: string; is_active: boolean }
interface Contributor { id: string; email: string; full_name: string | null; reddit_accounts: RedditAccount[] }
interface Assignment {
  id: string; status: string; assigned_at: string; deadline_at: string; rate_snapshot_inr: number
  tasks: { id: string; title: string; task_type: string; subreddit: string | null } | null
  profiles: { id: string; email: string } | null
  reddit_accounts: { id: string; username: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  assigned: 'bg-blue-500/10 text-blue-500',
  in_progress: 'bg-amber-500/10 text-amber-500',
  submitted: 'bg-violet-500/10 text-violet-500',
  under_review: 'bg-indigo-500/10 text-indigo-500',
  approved: 'bg-emerald-500/10 text-emerald-500',
  rejected: 'bg-red-500/10 text-red-500',
}

const ALL_STATUSES = ['assigned', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected']

export function AssignmentsClient({
  assignments: initial,
  openTasks,
  contributors,
}: {
  assignments: Assignment[]
  openTasks: Task[]
  contributors: Contributor[]
}) {
  const [assignments, setAssignments] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [selectedTask, setSelectedTask] = useState(openTasks[0]?.id ?? '')
  const [selectedContributor, setSelectedContributor] = useState(contributors[0]?.id ?? '')
  const [selectedAccount, setSelectedAccount] = useState(() => {
    if (!contributors.length) return ''
    return contributors[0].reddit_accounts?.[0]?.id ?? ''
  })
  const [isAssigning, startAssigning] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [editRate, setEditRate] = useState(0)
  const [editDeadline, setEditDeadline] = useState('')

  // When contributor changes, reset selected account
  const activeAccounts = useMemo(() => {
    const c = contributors.find(c => c.id === selectedContributor)
    return c?.reddit_accounts ?? []
  }, [selectedContributor, contributors])

  const handleContributorChange = (id: string) => {
    setSelectedContributor(id)
    const c = contributors.find(c => c.id === id)
    const accounts = c?.reddit_accounts ?? []
    setSelectedAccount(accounts[0]?.id ?? '')
  }

  const assign = () => {
    if (!selectedTask || !selectedContributor || !selectedAccount) {
      toast.error('Please select a task, contributor, and Reddit account.')
      return
    }
    startAssigning(async () => {
      const res = await fetch('/api/v1/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: selectedTask, profile_id: selectedContributor, reddit_account_id: selectedAccount }),
      })
      if (res.ok) {
        const a = await res.json()
        setAssignments(prev => [a, ...prev])
        setShowForm(false)
        toast.success('Task assigned successfully!')
      } else {
        const err = await res.json()
        toast.error(err.error ?? 'Failed to assign task.')
      }
    })
  }

  const changeStatus = async (id: string, status: string) => {
    setUpdatingId(id)
    const res = await fetch(`/api/v1/admin/assignments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setAssignments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
    } else {
      toast.error('Failed to update status.')
    }
    setUpdatingId(null)
  }

  const handleEditSubmit = async () => {
    if (!editingAssignment) return
    setUpdatingId(editingAssignment.id)
    const res = await fetch(`/api/v1/admin/assignments/${editingAssignment.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        rate_snapshot_inr: editRate, 
        deadline_at: editDeadline ? new Date(editDeadline).toISOString() : null 
      }),
    })
    if (res.ok) {
      setAssignments(prev => prev.map(a => 
        a.id === editingAssignment.id 
          ? { ...a, rate_snapshot_inr: editRate, deadline_at: editDeadline ? new Date(editDeadline).toISOString() : a.deadline_at } 
          : a
      ))
      setEditingAssignment(null)
      toast.success('Assignment updated.')
    } else {
      toast.error('Failed to update assignment.')
    }
    setUpdatingId(null)
  }

  const filtered = statusFilter === 'all' ? assignments : assignments.filter(a => a.status === statusFilter)

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              statusFilter === 'all' 
                ? 'bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20' 
                : 'bg-transparent border-border/60 text-muted-foreground hover:border-muted-foreground/30 hover:bg-muted/30'
            }`}
          >
            All ({assignments.length})
          </button>
          {ALL_STATUSES.map(s => {
            const count = assignments.filter(a => a.status === s).length
            if (count === 0) return null
            const isSelected = statusFilter === s
            
            // Extract the color class suffix, e.g., 'blue-500' from 'bg-blue-500/10'
            const colorMatch = STATUS_COLORS[s]?.match(/text-([a-z]+-\d+)/)
            const colorClass = colorMatch ? colorMatch[1] : 'muted-foreground'
            const borderClass = isSelected ? `border-${colorClass}` : 'border-border/60'
            
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border capitalize ${
                  isSelected 
                    ? `${STATUS_COLORS[s]} border-current shadow-sm` 
                    : `bg-transparent text-muted-foreground hover:bg-muted/30 hover:border-muted-foreground/30`
                }`}
              >
                {s.replace('_', ' ')} ({count})
              </button>
            )
          })}
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <Button onClick={() => setShowForm(s => !s)} className="w-full sm:w-auto shadow-sm">
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? 'Cancel Assignment' : 'Assign Task'}
          </Button>
        </div>
      </div>

      {/* Assignment Form */}
      {showForm && (
        <Card className="bg-card shadow-sm border border-border/60 rounded-xl overflow-hidden animate-slide-up">
          <CardHeader className="bg-muted/10 border-b border-border/40 pb-4">
            <CardTitle className="text-base font-semibold">Assign a Task</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-3 items-start">
              {/* Task selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Task</Label>
                {openTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-dashed border-border/60 bg-muted/20 text-center">
                    <ClipboardList className="h-5 w-5 text-muted-foreground/50 mb-1" />
                    <p className="text-xs text-muted-foreground">No open tasks available</p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedTask}
                      onChange={e => setSelectedTask(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-input bg-input/50 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer"
                    >
                      {openTasks.map(t => (
                        <option key={t.id} value={t.id}>
                          [{t.task_type}] {t.title} {t.subreddit ? `(r/${t.subreddit})` : ''} — ₹{t.base_reward_inr}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Contributor selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contributor</Label>
                {contributors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-dashed border-border/60 bg-muted/20 text-center">
                    <Users className="h-5 w-5 text-muted-foreground/50 mb-1" />
                    <p className="text-xs text-muted-foreground">No contributors found</p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedContributor}
                      onChange={e => handleContributorChange(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-input bg-input/50 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer"
                    >
                      {contributors.map(c => (
                        <option key={c.id} value={c.id}>{c.email}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Reddit account selector */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reddit Account</Label>
                {activeAccounts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 rounded-lg border border-dashed border-border/60 bg-muted/20 text-center">
                    <X className="h-5 w-5 text-muted-foreground/50 mb-1" />
                    <p className="text-xs text-muted-foreground">This contributor has no linked Reddit accounts.</p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={selectedAccount}
                      onChange={e => setSelectedAccount(e.target.value)}
                      className="w-full appearance-none rounded-lg border border-input bg-input/50 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer"
                    >
                      {activeAccounts.map(a => (
                        <option key={a.id} value={a.id}>u/{a.username}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-border/40">
              {(!selectedTask || activeAccounts.length === 0) && (
                <p className="text-xs text-muted-foreground mb-2 sm:mb-0 mr-auto">
                  Please ensure a task, contributor, and Reddit account are selected.
                </p>
              )}
              <Button 
                onClick={assign} 
                disabled={isAssigning || activeAccounts.length === 0 || !selectedTask}
                className="w-full sm:w-auto shadow-sm disabled:opacity-50 transition-opacity"
              >
                {isAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
                Confirm Assignment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments table */}
      <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-16 text-center text-muted-foreground flex flex-col items-center justify-center bg-muted/5">
            <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
              <CheckSquare className="h-6 w-6 text-muted-foreground/60" />
            </div>
            <p className="font-medium text-foreground">No assignments found</p>
            <p className="text-sm mt-1">There are no assignments matching the "{statusFilter}" filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/20">
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Task</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Contributor</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Reddit Account</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Rate</th>
                  <th className="text-left px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Deadline</th>
                  <th className="text-right px-6 py-4 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((a, i) => (
                  <tr key={a.id} className={`hover:bg-muted/10 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-muted/5'}`}>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-foreground truncate max-w-[200px] xl:max-w-xs">{(a.tasks as any)?.title ?? '—'}</p>
                        <p className="text-xs text-muted-foreground capitalize flex items-center gap-1.5">
                          <span className="inline-flex items-center rounded bg-muted px-1.5 py-0.5">{(a.tasks as any)?.task_type}</span>
                          {(a.tasks as any)?.subreddit && <span>r/{(a.tasks as any).subreddit}</span>}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-muted-foreground truncate max-w-[150px]">{(a.profiles as any)?.email ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      {(a.reddit_accounts as any)?.username ? (
                        <span className="inline-flex items-center rounded-md border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-500">
                          u/{(a.reddit_accounts as any).username}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      {updatingId === a.id ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Updating...</span>
                        </div>
                      ) : (
                        <div className="relative inline-block">
                          <select
                            value={a.status}
                            onChange={e => changeStatus(a.id, e.target.value)}
                            className={`appearance-none rounded-md px-3 py-1.5 pr-8 text-xs font-semibold border border-transparent cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${STATUS_COLORS[a.status] ?? 'bg-muted text-foreground'}`}
                          >
                            {ALL_STATUSES.map(s => (
                              <option key={s} value={s} className="bg-background text-foreground capitalize">
                                {s.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-70" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="font-medium text-foreground">₹{a.rate_snapshot_inr}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-muted-foreground text-sm">
                      {a.deadline_at ? new Date(a.deadline_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 border border-transparent hover:border-border/50 bg-background hover:bg-muted/50"
                        onClick={() => {
                          setEditingAssignment(a)
                          setEditRate(a.rate_snapshot_inr)
                          setEditDeadline(a.deadline_at ? new Date(a.deadline_at).toISOString().substring(0, 16) : '')
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
        <DialogContent className="sm:max-w-md bg-card shadow-xl border-border/60">
          <DialogHeader>
            <DialogTitle className="text-lg">Edit Assignment</DialogTitle>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reward (INR)</Label>
              <Input
                type="number"
                value={editRate}
                onChange={e => setEditRate(Number(e.target.value))}
                className="bg-input/50 border-border/60 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deadline</Label>
              <Input
                type="datetime-local"
                value={editDeadline}
                onChange={e => setEditDeadline(e.target.value)}
                className="bg-input/50 border-border/60 shadow-sm"
              />
            </div>
          </div>
          <DialogFooter className="border-t border-border/40 pt-4 mt-2">
            <Button variant="ghost" onClick={() => setEditingAssignment(null)}>Cancel</Button>
            <Button onClick={handleEditSubmit} disabled={updatingId === editingAssignment?.id} className="shadow-sm">
              {updatingId === editingAssignment?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
