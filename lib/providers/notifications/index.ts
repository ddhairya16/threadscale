import type { NotificationProvider } from './types'
import { DiscordNotificationProvider } from './discord.provider'

/**
 * Active notification provider.
 * To switch providers, change this single assignment.
 */
export const notificationProvider: NotificationProvider =
  new DiscordNotificationProvider()
