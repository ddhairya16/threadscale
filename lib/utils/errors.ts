/**
 * Application error classes.
 *
 * HttpError: Thrown in API routes to return a specific HTTP status.
 * AppError:  Generic application error with optional error code.
 * ValidationError: Input validation failure with field-level details.
 * NotFoundError: Resource not found.
 */

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR')
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found.`, 'NOT_FOUND')
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED')
    this.name = 'UnauthorizedError'
  }
}
