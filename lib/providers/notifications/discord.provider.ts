import type { NotificationPayload, NotificationProvider } from './types'

/**
 * Discord notification provider.
 *
 * Calls the HTTP webhook server running on the Discord bot (Oracle Cloud).
 * The bot server validates requests using a shared HMAC secret.
 *
 * STUB — Integration implemented in Phase 10.
 *
 * During development (Phases 1–9), all notifications are logged to the
 * console. No Discord credentials are required.
 */
export class DiscordNotificationProvider implements NotificationProvider {
  private readonly botUrl: string
  private readonly secret: string

  constructor() {
    this.botUrl = process.env.DISCORD_BOT_URL ?? ''
    this.secret = process.env.DISCORD_BOT_SECRET ?? ''
  }

  async send(payload: NotificationPayload): Promise<{ sent: boolean; error?: string }> {
    if (!this.botUrl) {
      // Development mode: log instead of sending
      console.log('[Discord DEV] Notification:', JSON.stringify(payload, null, 2))
      return { sent: true }
    }

    try {
      const response = await fetch(`${this.botUrl}/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bot-Secret': this.secret,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000), // 10s timeout
      })

      if (!response.ok) {
        const body = await response.text().catch(() => 'unknown')
        return {
          sent: false,
          error: `Discord bot returned ${response.status}: ${body}`,
        }
      }

      return { sent: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { sent: false, error: message }
    }
  }
}
