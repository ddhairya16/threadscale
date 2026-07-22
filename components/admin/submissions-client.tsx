'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ExternalLink, Check, X, Loader2, MessageSquare, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export function SubmissionsClient({ submissions: initial }: { submissions: any[] }) {
  const [submissions, setSubmissions] = useState(initial)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({})

  const formatINR = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount)

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id)
    const notes = reviewNotes[id] || ''

    try {
      const res = await fetch(`/api/v1/admin/submissions/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes })
      })

      if (res.ok) {
        const { submission: updatedSub, assignment } = await res.json()
        setSubmissions(prev => prev.map(s => 
          s.id === id 
            ? { ...s, status: updatedSub.status, review_notes: updatedSub.review_notes, assignments: { ...s.assignments, status: assignment.status } } 
            : s
        ))
        toast.success(`Submission ${action === 'approve' ? 'approved' : 'rejected'}!`)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Failed to review submission')
      }
    } catch (err) {
      toast.error('An error occurred while reviewing')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'under_review':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">{status}</Badge>
      case 'approved':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Approved</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      {submissions.length === 0 ? (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileCheck className="w-12 h-12 mb-4 opacity-50" />
            <p>No submissions to review.</p>
          </CardContent>
        </Card>
      ) : (
        submissions.map(sub => (
          <Card key={sub.id} className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                
                {/* Info Column */}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(sub.status)}
                      <span className="text-xs text-muted-foreground">Attempt {sub.attempt_number}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleString()}</span>
                    </div>
                    <h3 className="font-semibold text-lg">{sub.assignments?.tasks?.title}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {sub.assignments?.tasks?.projects?.clients?.name} › {sub.assignments?.tasks?.projects?.name} ({sub.assignments?.tasks?.task_type})
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Contributor</p>
                      <p className="text-sm font-medium">{sub.assignments?.profiles?.full_name || sub.assignments?.profiles?.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reddit Account</p>
                      <p className="text-sm font-medium">u/{sub.assignments?.reddit_accounts?.username}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Reward</p>
                      <p className="text-sm font-medium">{formatINR(sub.assignments?.rate_snapshot_inr || 0)}</p>
                    </div>
                  </div>
                </div>

                {/* Evidence Column */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Submitted Evidence</h4>
                  
                  <a 
                    href={sub.reddit_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Reddit Post/Comment
                  </a>

                  {sub.screenshot_refs && Array.isArray(sub.screenshot_refs) && sub.screenshot_refs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Screenshots ({sub.screenshot_refs.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {sub.screenshot_refs.map((ref: any, idx: number) => (
                          <a 
                            key={idx}
                            href={ref.webUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50 hover:bg-muted text-xs border border-border/50 transition-colors"
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            Proof {idx + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {sub.insight_text && (
                    <div className="bg-muted/30 p-3 rounded-md text-sm border border-border/50">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Performance Insight</p>
                      <p className="text-muted-foreground break-words">{sub.insight_text}</p>
                    </div>
                  )}
                </div>

                {/* Action Column */}
                <div className="flex flex-col gap-3 justify-end md:border-l md:border-border/50 md:pl-6">
                  {(sub.status === 'pending' || sub.status === 'under_review') ? (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Admin Notes (Optional)</Label>
                        <Input 
                          placeholder="Reason for rejection..." 
                          className="h-8 text-sm"
                          value={reviewNotes[sub.id] || ''}
                          onChange={(e) => setReviewNotes(prev => ({ ...prev, [sub.id]: e.target.value }))}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={processingId === sub.id}
                          onClick={() => handleReview(sub.id, 'approve')}
                        >
                          {processingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />}
                          Approve
                        </Button>
                        <Button 
                          variant="destructive"
                          className="flex-1"
                          disabled={processingId === sub.id}
                          onClick={() => handleReview(sub.id, 'reject')}
                        >
                          {processingId === sub.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1.5" />}
                          Reject
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2 h-full flex flex-col justify-center items-center text-center">
                      <p className="text-sm text-muted-foreground">Reviewed on {new Date(sub.reviewed_at).toLocaleDateString()}</p>
                      {sub.review_notes && (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                          <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                          <span className="text-left">"{sub.review_notes}"</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function FileCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  )
}
