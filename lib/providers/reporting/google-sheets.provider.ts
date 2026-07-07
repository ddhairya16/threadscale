import type { AssignmentReportRow, ReportingProvider } from './types'

/**
 * Google Sheets reporting provider.
 *
 * Appends approved assignment data to the configured spreadsheet.
 *
 * STUB — Integration implemented in Phase 9.
 *
 * During development (Phases 1–8), all log attempts are printed to the
 * console. No Google credentials are required.
 */
export class GoogleSheetsReportingProvider implements ReportingProvider {
  async logAssignment(
    row: AssignmentReportRow
  ): Promise<{ logged: boolean; error?: string }> {
    const sheetsConfigured = !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID

    if (!sheetsConfigured) {
      // Development mode: log to console
      console.log('[Sheets DEV] Would log row:', JSON.stringify(row, null, 2))
      return { logged: true }
    }

    // TODO: Phase 9 — Implement Google Sheets API append
    return {
      logged: false,
      error: 'GoogleSheetsReportingProvider: Phase 9 implementation pending.',
    }
  }
}
