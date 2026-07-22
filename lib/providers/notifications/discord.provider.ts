import crypto from 'crypto'
import type { NotificationPayload, NotificationProvider } from './types'

/**
 * Discord notification provider.
 *
 * Calls the HTTP webhook server running on the Discord bot (Oracle Cloud).
 * The bot server validates requests using a shared HMAC secret.
 */
export class DiscordNotificationProvider implements NotificationProvider {
  private readonly webhookUrl: string
  private readonly secret: string

  constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL ?? ''
    this.secret = process.env.DISCORD_WEBHOOK_SECRET ?? ''
  }

  async send(payload: NotificationPayload): Promise<{ sent: boolean; error?: string }> {
    if (!this.webhookUrl || !this.secret) {
      // Development mode: log instead of sending
      console.log('[Discord DEV] Notification:', JSON.stringify(payload, null, 2))
      return { sent: true }
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const bodyString = JSON.stringify(payload)
      
      const message = `${timestamp}.${bodyString}`
      const signature = crypto
        .createHmac('sha256', this.secret)
        .update(message)
        .digest('hex')

      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Timestamp': timestamp,
          'X-Signature': signature,
        },
        body: bodyString,
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
