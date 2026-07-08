import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface SubmissionInsights {
  whatHappened: string
  unusual: string
  recommendations: string
  futureNotes: string
}

export interface SubmissionDraft {
  taskId: string
  redditUrl: string
  insights: SubmissionInsights
}

interface SubmissionDraftStore {
  drafts: Record<string, SubmissionDraft>
  updateDraft: (taskId: string, data: Partial<SubmissionDraft>) => void
  clearDraft: (taskId: string) => void
}

const DEFAULT_INSIGHTS: SubmissionInsights = {
  whatHappened: '',
  unusual: '',
  recommendations: '',
  futureNotes: '',
}

export const useSubmissionDraft = create<SubmissionDraftStore>()(
  persist(
    (set) => ({
      drafts: {},
      updateDraft: (taskId, data) =>
        set((state) => {
          const current = state.drafts[taskId] ?? {
            taskId,
            redditUrl: '',
            insights: { ...DEFAULT_INSIGHTS },
          }
          return {
            drafts: {
              ...state.drafts,
              [taskId]: {
                ...current,
                ...data,
                insights: data.insights
                  ? { ...current.insights, ...data.insights }
                  : current.insights,
              },
            },
          }
        }),
      clearDraft: (taskId) =>
        set((state) => {
          const next = { ...state.drafts }
          delete next[taskId]
          return { drafts: next }
        }),
    }),
    {
      name: 'submission-draft-storage',
      // Explicit localStorage adapter — prevents "adapterFn is not a function" in
      // Next.js (Zustand v5 no longer infers localStorage automatically in SSR)
      storage: createJSONStorage(() => localStorage),
      // Only run on client — skip hydration on server
      skipHydration: true,
    }
  )
)
