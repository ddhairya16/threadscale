import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { HttpError } from './errors'

/**
 * Typed API response helpers.
 * Every API route returns { data, error } — never raw values.
 * This makes client-side error handling consistent and predictable.
 */

export type ApiSuccess<T> = { data: T; error: null }
export type ApiError = {
  data: null
  error: { message: string; code?: string; fields?: Record<string, string[]> }
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError

/** Returns a 2xx JSON response with typed data */
export function success<T>(
  data: T,
  status = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data, error: null }, { status })
}

/** Returns an error JSON response */
export function error(
  message: string,
  status = 500,
  code?: string,
  fields?: Record<string, string[]>
): NextResponse<ApiError> {
  return NextResponse.json(
    { data: null, error: { message, code, fields } },
    { status }
  )
}

/**
 * Central error handler for all API routes.
 * Converts known error types to typed HTTP responses.
 * Unknown errors return 500 and are logged server-side.
 *
 * Usage:
 *   try { ... } catch (err) { return handleRouteError(err) }
 */
export function handleRouteError(err: unknown): NextResponse<ApiError> {
  if (err instanceof HttpError) {
    return error(err.message, err.statusCode)
  }

  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {}
    err.issues.forEach((issue) => {
      const field = issue.path.join('.') || 'root'
      if (!fields[field]) fields[field] = []
      fields[field].push(issue.message)
    })
    return error('Validation failed. Please check your input.', 400, 'VALIDATION_ERROR', fields)
  }

  // Unknown error — log server-side, return generic message
  console.error('[API Route Error]', err)
  return error('An unexpected error occurred. Please try again.', 500)
}
