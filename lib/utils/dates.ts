/**
 * Date and time utilities.
 * All timestamps are stored in UTC (TIMESTAMPTZ) in the database.
 * Display formatting uses the user's local timezone via Intl.
 */

/** e.g. "7 Jul 2026" */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** e.g. "7 Jul 2026, 02:30 AM" */
export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** e.g. "in 2h", "3d ago", "just now" */
export function formatRelativeTime(date: Date | string): string {
  const now = Date.now()
  const target = new Date(date).getTime()
  const diffMs = target - now
  const absMs = Math.abs(diffMs)
  const future = diffMs > 0

  if (absMs < 60_000) return 'just now'
  if (absMs < 3_600_000) {
    const m = Math.round(absMs / 60_000)
    return future ? `in ${m}m` : `${m}m ago`
  }
  if (absMs < 86_400_000) {
    const h = Math.round(absMs / 3_600_000)
    return future ? `in ${h}h` : `${h}h ago`
  }
  const d = Math.round(absMs / 86_400_000)
  return future ? `in ${d}d` : `${d}d ago`
}

/** Returns true if the deadline has passed */
export function isOverdue(deadline: Date | string): boolean {
  return new Date(deadline).getTime() < Date.now()
}

/**
 * Returns what percentage of the deadline window has elapsed (0–100).
 * Used to show deadline progress bars.
 */
export function getDeadlineProgress(
  assignedAt: Date | string,
  deadlineAt: Date | string
): number {
  const start = new Date(assignedAt).getTime()
  const end = new Date(deadlineAt).getTime()
  const now = Date.now()
  const total = end - start
  if (total <= 0) return 100
  const elapsed = now - start
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

/** "July 2026" */
export function formatMonthYear(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  })
}

/** Returns first day of given month as a Date string (YYYY-MM-DD) */
export function firstDayOfMonth(year: number, month: number): string {
  return new Date(year, month - 1, 1).toISOString().split('T')[0]
}
