/**
 * Browser-side API client.
 * Wraps fetch with typed request/response handling.
 * All API routes return { data, error } — this client enforces that.
 */

import type { ApiResponse } from '@/types/api.types'

const API_BASE = '/api/v1'

/** Thrown when an API call returns an error response */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly fields?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  const json: ApiResponse<T> = await response.json()

  if (json.error !== null) {
    throw new ApiClientError(
      json.error.message,
      response.status,
      json.error.code,
      json.error.fields
    )
  }

  return json.data as T
}

export const apiClient = {
  get:    <T>(path: string)                    => request<T>(path),
  post:   <T>(path: string, body?: unknown)    => request<T>(path, { method: 'POST',   body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch:  <T>(path: string, body?: unknown)    => request<T>(path, { method: 'PATCH',  body: body !== undefined ? JSON.stringify(body) : undefined }),
  put:    <T>(path: string, body?: unknown)    => request<T>(path, { method: 'PUT',    body: body !== undefined ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                    => request<T>(path, { method: 'DELETE' }),
}
