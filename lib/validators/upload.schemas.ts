import { z } from 'zod'

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  // 15MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export const uploadQuerySchema = z.object({
  assignment_id: z.string().uuid('Invalid assignment ID').optional(),
})

export const UPLOAD_CONSTRAINTS = {
  maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
  allowedMimeTypes: ALLOWED_MIME_TYPES,
} as const
