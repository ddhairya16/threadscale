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

export interface RedditMetadata {
  type: RedditUrlType
  subreddit: string | null
  postId: string | null
  commentId: string | null
  permalink: string
}

/**
 * Extracts all relevant metadata from a Reddit URL.
 */
export function extractRedditMetadata(url: string): RedditMetadata {
  const normalized = normalizeRedditUrl(url)
  const type = classifyRedditUrl(normalized)
  const subreddit = extractSubreddit(normalized)
  
  let postId: string | null = null
  let commentId: string | null = null
  
  // Extract Post ID
  const postMatch = normalized.match(/\/comments\/([a-z0-9]+)/i)
  if (postMatch) {
    postId = postMatch[1]
  }
  
  // Extract Comment ID (if it's a comment)
  if (type === 'comment') {
    // Usually the last segment in the path is the comment ID if it follows the slug
    // e.g. /comments/1d4abc/my_post_slug/k2m3nop
    const segments = normalized.split('/')
    const possibleCommentId = segments[segments.length - 1]
    // If it's a valid alphanumeric comment id
    if (/^[a-z0-9]+$/i.test(possibleCommentId) && possibleCommentId !== postId) {
      commentId = possibleCommentId
    }
  }

  return {
    type,
    subreddit,
    postId,
    commentId,
    permalink: normalized
  }
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

