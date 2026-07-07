/**
 * Referral code utilities.
 *
 * Codes are 8 characters, uppercase, using an unambiguous alphabet
 * (excludes 0, O, I, 1, L to prevent misreading).
 *
 * The canonical code generator runs in PostgreSQL (trigger).
 * This function is used for display/validation purposes only.
 */

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

/**
 * Generates a random 8-character referral code.
 * Uses crypto.getRandomValues for cryptographic randomness.
 */
export function generateReferralCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => ALPHABET[b % ALPHABET.length])
    .join('')
}

/** Builds the full referral URL from a code */
export function buildReferralUrl(code: string, origin: string): string {
  return `${origin}/join?ref=${code.toUpperCase()}`
}

/** Validates a referral code format (does not check existence in DB) */
export function isValidReferralCode(code: string): boolean {
  return /^[A-Z2-9]{8}$/.test(code.toUpperCase())
}
