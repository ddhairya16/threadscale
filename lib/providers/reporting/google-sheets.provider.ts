import { google } from 'googleapis'
import { getGoogleAuthClient } from '@/lib/google/client'
import type { ReportingProvider, ApprovedAssignmentData } from './types'

export class GoogleSheetsReportingProvider implements ReportingProvider {
  private sheets
  private spreadsheetId: string | undefined

  constructor() {
    const auth = getGoogleAuthClient()
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID
    this.sheets = auth ? google.sheets({ version: 'v4', auth }) : null
  }

  async logApprovedAssignment(data: ApprovedAssignmentData): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) {
      console.log('[Reporting DEV] Would log to Google Sheets:', data)
      return
    }

    try {
      // Data in order of the columns suggested:
      // Approval Date, Assignment ID, Submission ID, Contributor, Reddit Username, Client, Project, Task, Reward (INR), Payment Status, Paid Date, Approved By
      const row = [
        data.approvalDate,
        data.assignmentId,
        data.submissionId,
        data.contributorEmail,
        data.redditUsername || 'N/A',
        data.clientName || 'N/A',
        data.projectName || 'N/A',
        data.taskTitle,
        data.rewardInr,
        data.paymentStatus,
        data.paidDate || 'N/A',
        data.approvedByEmail,
      ]

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Sheet1!A:L', // Assumes first sheet is named Sheet1 and columns A to L are used
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: [row],
        },
      })
    } catch (error) {
      // Do not throw the error up to the caller to prevent blocking the platform on reporting failures.
      console.error('[Google Sheets Reporting Error] Failed to append row:', error)
    }
  }
}
