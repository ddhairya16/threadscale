'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, Lightbulb, Save, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api/client'

interface InsightsSectionProps {
  assignmentId: string
  existingInsights?: any
}

export function InsightsSection({ assignmentId, existingInsights }: InsightsSectionProps) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(!!existingInsights)
  const [insights, setInsights] = useState({
    whatHappened: existingInsights?.whatHappened || '',
    unusual: existingInsights?.unusual || '',
    recommendations: existingInsights?.recommendations || '',
    futureNotes: existingInsights?.futureNotes || ''
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      await apiClient.post('/insights', { assignmentId, textContent: JSON.stringify(insights) })
      setSaved(true)
      toast.success('Insights saved successfully!')
    } catch (err) {
      toast.error('Failed to save insights.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50 border-t-4 border-t-primary/60">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Task Insights</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Share your experience to help us improve future tasks. This does not affect your payment.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {([
          { key: 'whatHappened', label: 'What happened?', placeholder: 'Briefly describe how the interaction went...' },
          { key: 'unusual', label: 'Anything unusual?', placeholder: 'Mod removals? Hostile replies?' },
          { key: 'recommendations', label: 'Any recommendations?', placeholder: 'How could we improve this task type?' },
          { key: 'futureNotes', label: 'Anything future contributors should know?', placeholder: 'Tips for the next person...' },
        ] as const).map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-2">
            <Label>{label}</Label>
            <Textarea
              placeholder={placeholder}
              value={insights[key as keyof typeof insights]}
              onChange={e => {
                setInsights({ ...insights, [key]: e.target.value })
                setSaved(false)
              }}
              className="bg-background resize-none h-20"
            />
          </div>
        ))}
        
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/50">
          {saved && (
            <div className="flex items-center text-sm text-emerald-500">
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Saved
            </div>
          )}
          <Button onClick={handleSave} disabled={loading || saved} className="min-w-[120px]">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {saved ? 'Saved' : 'Save Insights'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
