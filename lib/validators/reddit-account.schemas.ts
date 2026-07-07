import { z } from 'zod'

const USERNAME_REGEX = /^[A-Za-z0-9_-]{3,20}$/

export const createRedditAccountSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(USERNAME_REGEX, 'Invalid Reddit username. Only letters, numbers, hyphens, and underscores are allowed.'),
  karma: z.number().int().min(0).optional().nullable(),
  account_age_days: z.number().int().min(0).optional().nullable(),
  cqs_score: z.number().min(0).max(100).optional().nullable(),
})

export const updateRedditAccountSchema = createRedditAccountSchema.partial()

export const adminUpdateRedditAccountSchema = z.object({
  verification_status: z
    .enum(['unverified', 'pending', 'verified', 'rejected'])
    .optional(),
  admin_notes: z.string().max(2000).optional().nullable(),
  is_active: z.boolean().optional(),
})

export type CreateRedditAccountInput = z.infer<typeof createRedditAccountSchema>
export type UpdateRedditAccountInput = z.infer<typeof updateRedditAccountSchema>
export type AdminUpdateRedditAccountInput = z.infer<typeof adminUpdateRedditAccountSchema>
