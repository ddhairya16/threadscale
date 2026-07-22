'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check, Users, Gift, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDistanceToNow } from 'date-fns'

interface Referral {
  id: string
  bonus_amount_inr: number
  bonus_status: string
  created_at: string
  profiles?: {
    full_name: string | null
    email: string
  } | null
}

interface ReferralClientProps {
  referralCode: string
  referrals: Referral[]
}

export function ReferralClient({ referralCode, referrals }: ReferralClientProps) {
  const [copied, setCopied] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://example.com'
  const referralLink = `${baseUrl}/login?ref=${referralCode}`

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pendingCount = referrals.filter(r => r.bonus_status === 'pending').length
  const awardedCount = referrals.filter(r => r.bonus_status === 'awarded').length
  const totalEarned = referrals.filter(r => r.bonus_status === 'awarded').reduce((acc, r) => acc + r.bonus_amount_inr, 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 flex flex-col gap-6">
        <Card className="bg-card/50 backdrop-blur border-border/50 shadow-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-xl">Your Referral Link</CardTitle>
            <CardDescription>Share this link to invite friends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="bg-background/50 border-border/60 text-muted-foreground font-mono text-xs" 
              />
              <Button size="icon" variant="outline" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                How it works
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 pl-6 list-disc">
                <li>Share your unique link with friends</li>
                <li>They sign up and get approved</li>
                <li>They complete their first task</li>
                <li>You both earn a ₹25 bonus!</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{referrals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Invites</p>
            </CardContent>
          </Card>
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                <Gift className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">₹{totalEarned}</p>
              <p className="text-xs text-muted-foreground mt-1">Bonus Earned</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="md:col-span-2">
        <Card className="bg-card/50 backdrop-blur border-border/50 h-full">
          <CardHeader>
            <CardTitle>Referral History</CardTitle>
            <CardDescription>Track the status of your invites</CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <div className="text-center py-12">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary/50 mb-4">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No referrals yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
                  Share your link with friends to start earning bonus rewards when they complete tasks.
                </p>
                <Button onClick={handleCopy}>
                  Copy Link <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="rounded-md border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Bonus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referrals.map((referral) => (
                      <TableRow key={referral.id}>
                        <TableCell>
                          <div className="font-medium">
                            {referral.profiles?.full_name || 'Anonymous User'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {referral.profiles?.email}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            Joined {new Date(referral.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {referral.bonus_status === 'pending' && (
                            <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">Pending Task</Badge>
                          )}
                          {referral.bonus_status === 'awarded' && (
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">Awarded</Badge>
                          )}
                          {referral.bonus_status === 'revoked' && (
                            <Badge variant="secondary" className="bg-red-500/10 text-red-500 hover:bg-red-500/20">Revoked</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{referral.bonus_amount_inr}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
