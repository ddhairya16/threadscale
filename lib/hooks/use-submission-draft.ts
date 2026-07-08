'use client'

import { useState, useEffect, useCallback } from 'react'

export interface SubmissionInsights {
  whatHappened: string
  unusual: string
  recommendations: string
  futureNotes: string
}

export interface SubmissionDraft {
  redditUrl: string
  insights: SubmissionInsights
}

const EMPTY_INSIGHTS: SubmissionInsights = {
  whatHappened: '',
  unusual: '',
  recommendations: '',
  futureNotes: '',
}

const EMPTY_DRAFT: SubmissionDraft = {
  redditUrl: '',
  insights: { ...EMPTY_INSIGHTS },
}

function getDraftKey(taskId: string) {
  return `submission_draft_${taskId}`
}

export function useSubmissionDraft(taskId: string) {
  const [draft, setDraftState] = useState<SubmissionDraft>(EMPTY_DRAFT)
  const [hydrated, setHydrated] = useState(false)

  // Load from localStorage once on mount (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(getDraftKey(taskId))
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SubmissionDraft>
        setDraftState({
          redditUrl: parsed.redditUrl ?? '',
          insights: { ...EMPTY_INSIGHTS, ...(parsed.insights ?? {}) },
        })
      }
    } catch {
      // ignore parse errors
    }
    setHydrated(true)
  }, [taskId])

  const updateDraft = useCallback((updates: Partial<SubmissionDraft>) => {
    setDraftState(prev => {
      const next: SubmissionDraft = {
        redditUrl: updates.redditUrl ?? prev.redditUrl,
        insights: updates.insights
          ? { ...prev.insights, ...updates.insights }
          : prev.insights,
      }
      try {
        localStorage.setItem(getDraftKey(taskId), JSON.stringify(next))
      } catch {
        // quota exceeded or similar — silently skip
      }
      return next
    })
  }, [taskId])

  const clearDraft = useCallback(() => {
    setDraftState(EMPTY_DRAFT)
    try {
      localStorage.removeItem(getDraftKey(taskId))
    } catch {}
  }, [taskId])

  return { draft, updateDraft, clearDraft, hydrated }
}
