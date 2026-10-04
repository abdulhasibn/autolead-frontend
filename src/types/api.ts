export interface Page<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface ApiError {
  status: number
  code: string
  message: string
}

export interface PaginationParams {
  limit?: number
  offset?: number
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "message" in value
  )
}
