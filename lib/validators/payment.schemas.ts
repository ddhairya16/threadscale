import { z } from 'zod'

export const approvePaymentsSchema = z.object({
  payment_ids: z
    .array(z.string().uuid())
    .min(1, 'Select at least one payment to approve')
    .max(100, 'Cannot approve more than 100 payments at once'),
})

export const markPaidSchema = z.object({
  payment_method: z
    .string()
    .min(1, 'Payment method is required')
    .max(100),
  transaction_ref: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
})

export type ApprovePaymentsInput = z.infer<typeof approvePaymentsSchema>
export type MarkPaidInput = z.infer<typeof markPaidSchema>
