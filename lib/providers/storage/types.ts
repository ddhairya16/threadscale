/**
 * Storage provider interface.
 *
 * Abstracts the underlying file storage service.
 * Current implementation: Google Drive (Phase 8)
 * Future alternatives: Supabase Storage, Cloudflare R2
 *
 * To swap providers, change only lib/providers/storage/index.ts.
 * No other application code changes required.
 */

export interface UploadResult {
  /** Provider-specific unique file identifier */
  fileId: string
  /** Publicly accessible URL for the file */
  webUrl: string
  /** UUID-based filename used for the upload (not the original filename) */
  filename: string
  /** Final file size in bytes after compression */
  sizeBytes: number
}

export interface StorageProvider {
  /**
   * Uploads a file buffer to storage.
   *
   * @param params.buffer    - The file content (already compressed)
   * @param params.filename  - UUID-based filename (e.g. 'screenshot-abc123.webp')
   * @param params.mimeType  - MIME type of the file
   * @param params.folderPath - Virtual path (e.g. 'task_proofs/2026/July/user_abc')
   */
  upload(params: {
    buffer: Buffer
    filename: string
    mimeType: string
    folderPath: string
  }): Promise<UploadResult>

  /**
   * Ensures a folder path exists, creating intermediate folders if needed.
   * Returns the provider-specific ID of the leaf folder.
   */
  ensureFolderPath(path: string): Promise<string>
}
