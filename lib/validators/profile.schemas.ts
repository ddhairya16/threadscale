import { z } from 'zod'

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Name cannot be empty').max(100).optional(),
  discord_id: z.string().max(50).optional().nullable(),
  discord_username: z.string().max(100).optional().nullable(),
  upi_id: z.string().max(100).optional().nullable(),
})

export const updateNotificationsSchema = z.object({
  notify_email: z.boolean(),
  notify_discord: z.boolean(),
})

export const updateOnboardingSchema = z.object({
  step: z.enum(['profile', 'reddit_account', 'referral_seen']),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type UpdateNotificationsInput = z.infer<typeof updateNotificationsSchema>
export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>
