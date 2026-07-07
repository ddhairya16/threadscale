import { requireAuth } from '@/lib/auth/require-auth'
import { success, handleRouteError } from '@/lib/utils/api-response'
import type { ProfileDto } from '@/types/api.types'

export async function GET() {
  try {
    const { profile } = await requireAuth()

    const dto: ProfileDto = {
      id:               profile.id,
      email:            profile.email,
      full_name:        profile.full_name,
      discord_username: profile.discord_username,
      referral_code:    profile.referral_code,
      role:             profile.role,
      status:           profile.status,
      onboarding_steps: profile.onboarding_steps,
      notify_email:     profile.notify_email,
      notify_discord:   profile.notify_discord,
      upi_id:           profile.upi_id,
      created_at:       profile.created_at,
      last_login_at:    profile.last_login_at,
    }

    return success(dto)
  } catch (err) {
    return handleRouteError(err)
  }
}
