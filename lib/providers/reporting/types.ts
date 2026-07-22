export interface ApprovedAssignmentData {
  approvalDate: string
  assignmentId: string
  submissionId: string
  contributorEmail: string
  redditUsername: string
  clientName: string
  projectName: string
  taskTitle: string
  rewardInr: number
  paymentStatus: string
  paidDate: string | null
  approvedByEmail: string
}

export interface ReportingProvider {
  logApprovedAssignment(data: ApprovedAssignmentData): Promise<void>
}
