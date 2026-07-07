import type { ReportingProvider } from './types'
import { GoogleSheetsReportingProvider } from './google-sheets.provider'

/**
 * Active reporting provider.
 * To switch providers, change this single assignment.
 */
export const reportingProvider: ReportingProvider =
  new GoogleSheetsReportingProvider()
