/**
 * Reddit URL utilities.
 *
 * Reddit URL structure:
 *   Post:    https://reddit.com/r/{sub}/comments/{postId}/{slug}/
 *   Comment: https://reddit.com/r/{sub}/comments/{postId}/{slug}/{commentId}/
 *
 * The difference is whether a comment ID segment follows the post slug.
 */

export type RedditUrlType = 'post' | 'comment' | 'unknown'

const REDDIT_DOMAIN = /^https?:\/\/(www\.|old\.|new\.)?reddit\.com/i

// Comment: 6 path segments after the domain (r, sub, comments, postId, slug, commentId)
const REDDIT_COMMENT =
  /^https?:\/\/(www\.|old\.|new\.)?reddit\.com\/r\/[^/]+\/comments\/[a-z0-9]+\/[^/]*\/[a-z0-9]+\/?/i

// Post: 5 path segments (r, sub, comments, postId, slug — no comment ID)
const REDDIT_POST =
  /^https?:\/\/(www\.|old\.|new\.)?reddit\.com\/r\/[^/]+\/comments\/[a-z0-9]+\/?/i

/** Returns true if the URL is any Reddit URL */
export function isRedditUrl(url: string): boolean {
  try {
    return REDDIT_DOMAIN.test(url)
  } catch {
    return false
  }
}

/**
 * Classifies a Reddit URL as 'post', 'comment', or 'unknown'.
 * Used to auto-detect submission type during task submission.
 */
export function classifyRedditUrl(url: string): RedditUrlType {
  if (!isRedditUrl(url)) return 'unknown'
  // Test comment first (more specific pattern)
  if (REDDIT_COMMENT.test(url)) return 'comment'
  if (REDDIT_POST.test(url)) return 'post'
  return 'unknown'
}

/** Extracts subreddit name from a Reddit URL */
export function extractSubreddit(url: string): string | null {
  const match = url.match(/reddit\.com\/r\/([^/?#]+)/i)
  return match ? match[1] : null
}

/** Normalizes a Reddit URL (removes query params, trailing slashes) */
export function normalizeRedditUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString().replace(/\/$/, '')
  } catch {
    return url
  }
}
