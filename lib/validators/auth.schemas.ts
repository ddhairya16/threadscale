import { z } from 'zod'

export const sendOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase(),
})

export const verifyOtpSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .toLowerCase(),
  token: z
    .string()
    .length(6, 'The code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'The code must contain only digits'),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
