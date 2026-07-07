import type { StorageProvider, UploadResult } from './types'

/**
 * Google Drive storage provider implementation.
 *
 * STUB — Not yet implemented. Will be implemented in Phase 8.
 *
 * Requirements (added in Phase 8):
 *   GOOGLE_SERVICE_ACCOUNT_JSON  - Stringified service account credentials JSON
 *   GOOGLE_DRIVE_ROOT_FOLDER_ID  - ID of the root folder in Google Drive
 *
 * During development (Phases 1–7), this provider logs upload attempts
 * to the console instead of uploading to Drive. This allows the rest
 * of the application to function without Google credentials.
 */
export class GoogleDriveStorageProvider implements StorageProvider {
  async upload(params: {
    buffer: Buffer
    filename: string
    mimeType: string
    folderPath: string
  }): Promise<UploadResult> {
    const driveConfigured = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON

    if (!driveConfigured) {
      // Development mode: simulate a successful upload
      console.log(
        `[Storage DEV] Would upload ${params.filename} (${params.buffer.length} bytes) to ${params.folderPath}`
      )
      return {
        fileId: `dev-file-${Date.now()}`,
        webUrl: `https://placeholder.dev/files/${params.filename}`,
        filename: params.filename,
        sizeBytes: params.buffer.length,
      }
    }

    // TODO: Phase 8 — Implement Google Drive upload
    throw new Error('GoogleDriveStorageProvider: Phase 8 implementation pending.')
  }

  async ensureFolderPath(path: string): Promise<string> {
    const driveConfigured = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON

    if (!driveConfigured) {
      console.log(`[Storage DEV] Would ensure folder path: ${path}`)
      return `dev-folder-${path.replace(/\//g, '-')}`
    }

    // TODO: Phase 8 — Implement folder creation/resolution
    throw new Error('GoogleDriveStorageProvider: Phase 8 implementation pending.')
  }
}
