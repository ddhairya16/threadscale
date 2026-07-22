import { google } from 'googleapis'

/**
 * Shared Google Auth Client for Google APIs (Drive, Sheets)
 */
export function getGoogleAuthClient() {
  const projectId = process.env.GOOGLE_PROJECT_ID
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL
  let privateKey = process.env.GOOGLE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) {
    return null
  }

  // Handle environment variables where newlines are escaped
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n')
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
      project_id: projectId,
    },
    scopes: [
      'https://www.googleapis.com/auth/drive.file', // For Drive upload and folder creation
      'https://www.googleapis.com/auth/spreadsheets', // For Sheets appending
    ],
  })

  return auth
}
