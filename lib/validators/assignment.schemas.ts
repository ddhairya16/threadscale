import { z } from 'zod'

export const startAssignmentSchema = z.object({
  // No body required — assignment ID comes from URL param
})

export const adminUpdateAssignmentSchema = z.object({
  admin_notes: z.string().max(2000).optional().nullable(),
  status: z
    .enum(['assigned', 'in_progress', 'under_review', 'approved', 'rejected', 'paid'])
    .optional(),
})

export type AdminUpdateAssignmentInput = z.infer<typeof adminUpdateAssignmentSchema>
