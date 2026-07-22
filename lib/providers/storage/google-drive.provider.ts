import { Readable } from 'stream'
import { google } from 'googleapis'
import { getGoogleAuthClient } from '@/lib/google/client'
import type { StorageProvider, UploadResult } from './types'

export class GoogleDriveStorageProvider implements StorageProvider {
  private drive
  private rootFolderId: string | undefined

  constructor() {
    const auth = getGoogleAuthClient()
    this.rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID
    this.drive = auth ? google.drive({ version: 'v3', auth }) : null
  }

  async upload(params: {
    buffer: Buffer
    filename: string
    mimeType: string
    folderPath: string
  }): Promise<UploadResult> {
    if (!this.drive || !this.rootFolderId) {
      console.log(`[Storage DEV] Would upload ${params.filename} (${params.buffer.length} bytes) to ${params.folderPath}`)
      return {
        fileId: `dev-file-${Date.now()}`,
        webUrl: `https://placeholder.dev/files/${params.filename}`,
        filename: params.filename,
        sizeBytes: params.buffer.length,
      }
    }

    const folderId = await this.ensureFolderPath(params.folderPath)

    const stream = new Readable()
    stream.push(params.buffer)
    stream.push(null)

    const response = await this.drive.files.create({
      requestBody: {
        name: params.filename,
        parents: [folderId],
      },
      media: {
        mimeType: params.mimeType,
        body: stream,
      },
      fields: 'id, name, webViewLink, size, mimeType',
    })

    const file = response.data
    return {
      fileId: file.id!,
      webUrl: file.webViewLink || '',
      filename: file.name!,
      sizeBytes: file.size ? parseInt(file.size, 10) : params.buffer.length,
    }
  }

  async ensureFolderPath(path: string): Promise<string> {
    if (!this.drive || !this.rootFolderId) {
      console.log(`[Storage DEV] Would ensure folder path: ${path}`)
      return `dev-folder-${path.replace(/\\//g, '-')}`
    }

    const folders = path.split('/').filter(Boolean)
    let currentParentId = this.rootFolderId

    for (const folderName of folders) {
      // Check if folder exists
      const response = await this.drive.files.list({
        q: `'${currentParentId}' in parents and name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id)',
        spaces: 'drive',
      })

      if (response.data.files && response.data.files.length > 0) {
        currentParentId = response.data.files[0].id!
      } else {
        // Create folder
        const createResponse = await this.drive.files.create({
          requestBody: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [currentParentId],
          },
          fields: 'id',
        })
        currentParentId = createResponse.data.id!
      }
    }

    return currentParentId
  }
}
