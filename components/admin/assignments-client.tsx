'use client'

import { useState, useTransition, useMemo } from 'react'
import { Plus, Loader2, CheckSquare, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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
  paid: 'bg-teal-500/10 text-teal-500',
}

const ALL_STATUSES = ['assigned', 'in_progress', 'submitted', 'under_review', 'approved', 'rejected', 'paid']

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
  const [selectedAccount, setSelectedAccount] = useState('')
  const [isAssigning, startAssigning] = useTransition()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')

  // When contributor changes, reset selected account
  const activeAccounts = useMemo(() => {
    const c = contributors.find(c => c.id === selectedContributor)
    return c?.reddit_accounts?.filter(a => a.is_active) ?? []
  }, [selectedContributor, contributors])

  const handleContributorChange = (id: string) => {
    setSelectedContributor(id)
    const c = contributors.find(c => c.id === id)
    const accounts = c?.reddit_accounts?.filter(a => a.is_active) ?? []
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

  const filtered = statusFilter === 'all' ? assignments : assignments.filter(a => a.status === statusFilter)

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
          >
            All ({assignments.length})
          </button>
          {ALL_STATUSES.map(s => {
            const count = assignments.filter(a => a.status === s).length
            if (count === 0) return null
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'bg-primary text-primary-foreground' : STATUS_COLORS[s] ?? 'bg-muted text-muted-foreground'}`}
              >
                {s.replace('_', ' ')} ({count})
              </button>
            )
          })}
        </div>
        <div className="sm:ml-auto">
          <Button onClick={() => setShowForm(s => !s)}>
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? 'Cancel' : 'Assign Task'}
          </Button>
        </div>
      </div>

      {/* Assignment Form */}
      {showForm && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader><CardTitle className="text-base">Assign a Task</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            {/* Task selector */}
            <div className="space-y-2">
              <Label>Task *</Label>
              {openTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No open tasks available.</p>
              ) : (
                <select
                  value={selectedTask}
                  onChange={e => setSelectedTask(e.target.value)}
                  className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {openTasks.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.task_type}] {t.title} {t.subreddit ? `(r/${t.subreddit})` : ''} — ₹{t.base_reward_inr}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Contributor selector */}
            <div className="space-y-2">
              <Label>Contributor *</Label>
              {contributors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active contributors.</p>
              ) : (
                <select
                  value={selectedContributor}
                  onChange={e => handleContributorChange(e.target.value)}
                  className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {contributors.map(c => (
                    <option key={c.id} value={c.id}>{c.email}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Reddit account selector */}
            <div className="space-y-2">
              <Label>Reddit Account *</Label>
              {activeAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-amber-500">
                  This contributor has no active Reddit accounts.
                </p>
              ) : (
                <select
                  value={selectedAccount}
                  onChange={e => setSelectedAccount(e.target.value)}
                  className="w-full flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {activeAccounts.map(a => (
                    <option key={a.id} value={a.id}>u/{a.username}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="sm:col-span-3 flex justify-end border-t border-border/50 pt-4 mt-2">
              <Button onClick={assign} disabled={isAssigning || activeAccounts.length === 0 || !selectedTask}>
                {isAssigning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Confirm Assignment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assignments table */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur overflow-hidden">
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <CheckSquare className="h-8 w-8 text-muted-foreground/40" />
            <p>No assignments {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'yet'}.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Task</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Contributor</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Reddit Account</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">Rate</th>
                <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3">
                    <div>
                      <p className="font-medium text-foreground truncate max-w-xs">{(a.tasks as any)?.title ?? '—'}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {(a.tasks as any)?.task_type} {(a.tasks as any)?.subreddit ? `· r/${(a.tasks as any).subreddit}` : ''}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell text-muted-foreground">
                    {(a.profiles as any)?.email ?? '—'}
                  </td>
                  <td className="px-5 py-3 hidden lg:table-cell">
                    {(a.reddit_accounts as any)?.username ? (
                      <span className="inline-flex items-center rounded-full border border-[#FF4500]/20 bg-[#FF4500]/10 px-2 py-0.5 text-xs font-medium text-[#FF4500]">
                        u/{(a.reddit_accounts as any).username}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    {updatingId === a.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <select
                        value={a.status}
                        onChange={e => changeStatus(a.id, e.target.value)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[a.status] ?? ''}`}
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s} value={s} className="bg-background text-foreground capitalize">{s.replace('_', ' ')}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-3 hidden md:table-cell font-medium">₹{a.rate_snapshot_inr}</td>
                  <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground">
                    {a.deadline_at ? new Date(a.deadline_at).toLocaleDateString() : '—'}
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
