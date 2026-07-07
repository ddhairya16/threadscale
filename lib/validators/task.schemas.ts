import { z } from 'zod'

export const createTaskSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  template_id: z.string().uuid().optional().nullable(),
  task_type: z.enum(['comment', 'post', 'moderation']),
  title: z.string().min(1, 'Title is required').max(200),
  instructions: z.string().min(1, 'Instructions are required').max(10_000),
  subreddit: z.string().max(100).optional().nullable(),
  thread_url: z.string().url('Must be a valid URL').optional().nullable(),
  post_title: z.string().max(300).optional().nullable(),
  post_body: z.string().max(40_000).optional().nullable(),
  base_reward_inr: z
    .number()
    .positive('Reward must be greater than 0'),
  deadline_hours: z
    .number()
    .int()
    .min(1, 'Deadline must be at least 1 hour')
    .max(720, 'Deadline cannot exceed 30 days')
    .default(24),
  max_assignments: z
    .number()
    .int()
    .min(1, 'Must allow at least 1 assignment')
    .max(100)
    .default(1),
  internal_notes: z.string().max(5000).optional().nullable(),
})

export const updateTaskSchema = createTaskSchema
  .omit({ project_id: true, task_type: true })
  .partial()
  .extend({
    status: z.enum(['draft', 'open', 'cancelled']).optional(),
  })

export const assignTaskSchema = z.object({
  profile_id: z.string().uuid('Invalid contributor ID'),
  reddit_account_id: z.string().uuid('Invalid Reddit account ID'),
})

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  task_type: z.enum(['comment', 'post', 'moderation']),
  instructions: z.string().min(1).max(10_000),
  subreddit: z.string().max(100).optional().nullable(),
  post_title: z.string().max(300).optional().nullable(),
  post_body: z.string().max(40_000).optional().nullable(),
  thread_url: z.string().url().optional().nullable(),
  default_reward_inr: z.number().positive().optional().nullable(),
  default_deadline_h: z.number().int().min(1).max(720).optional().nullable(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
export type AssignTaskInput = z.infer<typeof assignTaskSchema>
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
