'use client'

import { useState, useEffect, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface RedditAccount {
  id: string
  username: string
  karma: number | null
  account_age_days: number | null
  verification_status: string
  is_active: boolean
  created_at: string
}

interface ProfileData {
  email: string
  full_name: string | null
  upi_id: string | null
}

export function SettingsClient({ initialEmail }: { initialEmail: string }) {
  const [profile, setProfile] = useState<ProfileData>({ email: initialEmail, full_name: '', upi_id: '' })
  const [accounts, setAccounts] = useState<RedditAccount[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [isSavingProfile, startSavingProfile] = useTransition()
  const [isAddingAccount, startAddingAccount] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, accountsRes] = await Promise.all([
          fetch('/api/v1/profile'),
          fetch('/api/v1/reddit-accounts'),
        ])
        if (profileRes.ok) {
          const p = await profileRes.json()
          setProfile(p)
        }
        if (accountsRes.ok) {
          const a = await accountsRes.json()
          setAccounts(a)
        }
      } catch {
        toast.error('Failed to load settings. Please refresh.')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const saveProfile = () => {
    startSavingProfile(async () => {
      const res = await fetch('/api/v1/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: profile.full_name, upi_id: profile.upi_id }),
      })
      if (res.ok) {
        toast.success('Profile saved!')
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to save profile.')
      }
    })
  }

  const addAccount = () => {
    const trimmed = newUsername.trim()
    if (!trimmed) return
    startAddingAccount(async () => {
      const res = await fetch('/api/v1/reddit-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      })
      if (res.ok) {
        const newAcc = await res.json()
        setAccounts(prev => [...prev, newAcc])
        setNewUsername('')
        toast.success(`u/${newAcc.username} added!`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to add account.')
      }
    })
  }

  const removeAccount = async (id: string) => {
    setDeletingId(id)
    const res = await fetch(`/api/v1/reddit-accounts/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setAccounts(prev => prev.filter(a => a.id !== id))
      toast.success('Account removed.')
    } else {
      toast.error('Failed to remove account.')
    }
    setDeletingId(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading settings...
      </div>
    )
  }

  return (
    <div className="grid gap-8 max-w-4xl">
      {/* Profile Card */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>Update your name and payment details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" value={profile.email} disabled className="max-w-md bg-muted" />
            <p className="text-xs text-muted-foreground">Your email cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              placeholder="e.g. Dhairya Shah"
              value={profile.full_name ?? ''}
              onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
              className="max-w-md"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upi">UPI ID</Label>
            <Input
              id="upi"
              placeholder="e.g. username@okhdfcbank"
              value={profile.upi_id ?? ''}
              onChange={e => setProfile(p => ({ ...p, upi_id: e.target.value }))}
              className="max-w-md"
            />
            <p className="text-xs text-muted-foreground">Required to process your payouts.</p>
          </div>

          <Button onClick={saveProfile} disabled={isSavingProfile}>
            {isSavingProfile ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reddit Accounts Card */}
      <Card className="bg-card/50 backdrop-blur border-border/50" id="reddit">
        <CardHeader>
          <CardTitle>Reddit Accounts</CardTitle>
          <CardDescription>Add multiple accounts to receive more task assignments.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add form */}
          <div className="flex gap-3">
            <Input
              placeholder="u/reddit_username"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addAccount()}
              className="max-w-sm"
            />
            <Button onClick={addAccount} disabled={isAddingAccount || !newUsername.trim()} variant="secondary">
              {isAddingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Add
            </Button>
          </div>

          {/* Account list */}
          <div className="space-y-2">
            {accounts.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <AlertCircle className="h-4 w-4" />
                No Reddit accounts added yet.
              </div>
            ) : (
              accounts.map(acc => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-[#FF4500]/10 rounded-full flex items-center justify-center shrink-0">
                      <svg className="h-4 w-4 text-[#FF4500]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">u/{acc.username}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {acc.is_active ? 'Active' : 'Inactive'}
                        {acc.karma !== null && ` · ${acc.karma.toLocaleString()} karma`}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => removeAccount(acc.id)}
                    disabled={deletingId === acc.id}
                  >
                    {deletingId === acc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
