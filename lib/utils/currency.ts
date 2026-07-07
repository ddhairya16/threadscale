/**
 * Currency formatting for INR (₹).
 * All monetary amounts in this application are in Indian Rupees.
 * Values are stored as NUMERIC(12,2) in the database.
 */

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/** Formats a number as ₹1,000 */
export function formatINR(amount: number): string {
  return INR.format(amount)
}

/** Compact format: ₹1.2K, ₹1.5L */
export function formatINRCompact(amount: number): string {
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`
  return `₹${amount.toFixed(0)}`
}

/** Safely parses a monetary value, returning 0 on invalid input */
export function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0
  const num = typeof value === 'string' ? parseFloat(value) : value
  if (!isFinite(num) || isNaN(num)) return 0
  return Math.round(num * 100) / 100
}
