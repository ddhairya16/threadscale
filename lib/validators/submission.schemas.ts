import { z } from 'zod'
import { isRedditUrl } from '@/lib/utils/reddit'

const screenshotRefSchema = z.object({
  drive_id: z.string().min(1),
  web_url: z.string().url(),
  filename: z.string().min(1),
  size_bytes: z.number().int().positive(),
})

export const createSubmissionSchema = z.object({
  assignment_id: z.string().uuid('Invalid assignment ID'),
  reddit_url: z
    .string()
    .url('Must be a valid URL')
    .refine(isRedditUrl, 'Must be a Reddit URL (reddit.com)'),
  insight_text: z.string().max(5000).optional().nullable(),
  contributor_notes: z.string().max(1000).optional().nullable(),
  screenshot_refs: z.array(screenshotRefSchema).default([]),
})

export const approveSubmissionSchema = z.object({
  notes: z.string().max(2000).optional().nullable(),
})

export const rejectSubmissionSchema = z.object({
  notes: z
    .string()
    .min(1, 'You must provide a reason for rejection')
    .max(2000),
})

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>
export type ApproveSubmissionInput = z.infer<typeof approveSubmissionSchema>
export type RejectSubmissionInput = z.infer<typeof rejectSubmissionSchema>
