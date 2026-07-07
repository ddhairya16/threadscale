import { apiClient } from './client'
import type { ProfileDto } from '@/types/api.types'

export interface SendOtpPayload {
  email: string
  referral_code?: string
}

export interface VerifyOtpPayload {
  email: string
  token: string
}

export interface VerifyOtpResult {
  role: 'contributor' | 'admin' | 'client'
  redirect: string
}

export const authApi = {
  sendOtp:   (payload: SendOtpPayload)   => apiClient.post<{ sent: boolean }>('/auth/otp/send', payload),
  verifyOtp: (payload: VerifyOtpPayload) => apiClient.post<VerifyOtpResult>('/auth/otp/verify', payload),
  logout:    ()                           => apiClient.post<{ logged_out: boolean }>('/auth/logout'),
  me:        ()                           => apiClient.get<ProfileDto>('/auth/me'),
}
