import { z } from 'zod'

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(1000).optional().nullable(),
})

export const updateClientSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
})

export const createProjectSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  name: z.string().min(1, 'Project name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
})

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  is_active: z.boolean().optional(),
})

export const setRateSchema = z.object({
  profile_id: z.string().uuid().optional().nullable(),
  task_type: z.enum(['comment', 'post', 'moderation']),
  rate_inr: z.number().positive('Rate must be greater than ₹0'),
})

export const updateContributorSchema = z.object({
  status: z.enum(['active', 'suspended', 'blacklisted']).optional(),
  full_name: z.string().min(1).max(100).optional(),
  discord_id: z.string().max(50).optional().nullable(),
  discord_username: z.string().max(100).optional().nullable(),
})

export const revokeReferralSchema = z.object({
  reason: z
    .string()
    .min(1, 'A reason is required to revoke a referral')
    .max(500),
})

export const recordRevenueSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  project_id: z.string().uuid().optional().nullable(),
  period_month: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format'),
  revenue_inr: z.number().positive('Revenue must be greater than ₹0'),
  notes: z.string().max(1000).optional().nullable(),
})

export const analyticsQuerySchema = z.object({
  period: z.enum(['7d', '30d', '90d', '365d']).default('30d'),
})

export const auditLogQuerySchema = z.object({
  actor_id: z.string().uuid().optional(),
  action: z.string().optional(),
  target_type: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
export type SetRateInput = z.infer<typeof setRateSchema>
export type UpdateContributorInput = z.infer<typeof updateContributorSchema>
export type RevokeReferralInput = z.infer<typeof revokeReferralSchema>
export type RecordRevenueInput = z.infer<typeof recordRevenueSchema>
