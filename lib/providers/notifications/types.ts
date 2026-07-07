/**
 * Notification provider interface.
 *
 * Abstracts how contributors are notified outside the web app.
 * Current implementation: Discord DM via Python bot (Phase 10)
 * Future alternatives: Email, SMS, Push notifications
 */

export type NotificationType =
  | 'new_assignment'
  | 'deadline_reminder'
  | 'payment_approved'
  | 'payment_paid'
  | 'submission_rejected'
  | 'referral_bonus_awarded'

export interface NotificationPayload {
  /** Discord user ID of the recipient */
  discordUserId: string
  /** Notification type (maps to different Discord embed styles) */
  type: NotificationType
  /** Short heading for the notification */
  title: string
  /** Full message body */
  body: string
  /** Optional deep link to the relevant page on the platform */
  actionUrl?: string
  /** Additional data for the Discord bot to use */
  metadata?: Record<string, unknown>
}

export interface NotificationProvider {
  /**
   * Sends a notification to a contributor.
   * Returns { sent: false, error } on failure — never throws.
   * Failed notifications are retried by the cron job.
   */
  send(payload: NotificationPayload): Promise<{ sent: boolean; error?: string }>
}
