/**
 * Reporting provider interface.
 *
 * Abstracts the external reporting/audit layer.
 * Current implementation: Google Sheets (Phase 9)
 *
 * Google Sheets is a reporting-only layer — never the primary database.
 * Every approved assignment is logged here for non-technical stakeholders.
 */

export interface AssignmentReportRow {
  timestamp: string            // ISO 8601
  assignmentId: string
  contributorEmail: string
  contributorName: string
  redditAccount: string
  taskType: 'comment' | 'post' | 'moderation'
  redditUrl: string
  rewardInr: number
  reviewedBy: string
  reviewedAt: string           // ISO 8601
  screenshotUrl: string
}

export interface ReportingProvider {
  /**
   * Appends an assignment record to the reporting sheet.
   * Returns { logged: false, error } on failure — never throws.
   * Failed logs are retried by the cron job (via sheets_logged flag).
   */
  logAssignment(row: AssignmentReportRow): Promise<{ logged: boolean; error?: string }>
}
