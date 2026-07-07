import type { StorageProvider } from './types'
import { GoogleDriveStorageProvider } from './google-drive.provider'

/**
 * Active storage provider.
 *
 * To switch providers, change this single assignment.
 * No other application code needs to change.
 *
 * Current: Google Drive (v1)
 * Future:  Supabase Storage | Cloudflare R2
 */
export const storageProvider: StorageProvider = new GoogleDriveStorageProvider()
