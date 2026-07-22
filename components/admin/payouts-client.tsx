'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QrCode, CheckCircle2, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function PayoutsClient({ data: initialData }: { data: any[] }) {
  const [data, setData] = useState(initialData)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedQR, setSelectedQR] = useState<any | null>(null)

  const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

  const handleMarkPaid = async (profileId: string, assignmentIds: string[], amount: number) => {
    if (!confirm(`Are you sure you want to mark ${formatINR(amount)} as paid?`)) return
    
    setProcessingId(profileId)
    try {
      const res = await fetch(`/api/v1/admin/payouts/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, assignmentIds, amount })
      })

      if (res.ok) {
        toast.success(`Successfully marked ${formatINR(amount)} as paid!`)
        // Update local state to move pending tasks to approved/paid
        setData(prev => prev.map(d => {
          if (d.profile.id === profileId) {
            return {
              ...d,
              totalPaid: d.totalPaid + d.pendingBalance,
              pendingBalance: 0,
              approvedTasks: [...d.approvedTasks, ...d.pendingTasks],
              pendingTasks: []
            }
          }
          return d
        }))
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to mark as paid')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {data.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mb-4 opacity-50 text-emerald-500" />
            <p>All payouts are cleared.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(stat => (
            <Card key={stat.profile.id} className="bg-card/50 backdrop-blur border-border/50 overflow-hidden flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{stat.profile.full_name || 'Anonymous'}</h3>
                    <p className="text-sm text-muted-foreground">{stat.profile.email}</p>
                  </div>
                  {stat.pendingBalance > 0 && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                      Pending
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50 mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pending Balance</p>
                    <p className="text-2xl font-bold text-foreground">{formatINR(stat.pendingBalance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                    <p className="text-lg font-medium text-muted-foreground">{formatINR(stat.totalPaid)}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment Method</p>
                    <p className="text-sm font-medium uppercase">{stat.profile.payment_method || 'UPI'}</p>
                  </div>
                  {stat.profile.upi_id && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">UPI ID</p>
                      <p className="text-sm font-medium">{stat.profile.upi_id}</p>
                    </div>
                  )}
                  {stat.profile.account_holder_name && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Account Holder Name</p>
                      <p className="text-sm font-medium">{stat.profile.account_holder_name}</p>
                    </div>
                  )}
                  {stat.profile.payment_qr_ref && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 bg-muted/50"
                      onClick={() => setSelectedQR(stat.profile.payment_qr_ref)}
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      View QR Code
                    </Button>
                  )}
                </div>

                {stat.pendingBalance > 0 && (
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={processingId === stat.profile.id}
                    onClick={() => handleMarkPaid(stat.profile.id, stat.pendingTasks.map((t: any) => t.id), stat.pendingBalance)}
                  >
                    {processingId === stat.profile.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Mark {stat.pendingTasks.length} Tasks as Paid
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedQR} onOpenChange={(open) => !open && setSelectedQR(null)}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur border-border/50 text-foreground">
          <DialogHeader>
            <DialogTitle>Payment QR Code</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-6 space-y-4">
            {selectedQR && (
              <>
                <div className="bg-white p-4 rounded-xl">
                  <img src={selectedQR.webUrl} alt="QR Code" className="w-64 h-64 object-contain" />
                </div>
                <a 
                  href={selectedQR.webUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Open in new tab <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
