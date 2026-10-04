import { auth } from "@/lib/auth"
import { ApiError, parseErrorResponse } from "@/lib/api-error"
import { env } from "@/lib/env"

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  /** Override the default Next.js fetch cache behavior */
  revalidate?: number | false
  tags?: string[]
}

async function request<T>(
  endpoint: string,
  { body, revalidate, tags, ...init }: RequestOptions = {}
): Promise<T> {
  const session = await auth()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  }

  if (session?.accessToken) {
    headers["Authorization"] = `Bearer ${session.accessToken}`
  }

  const nextOptions: RequestInit["next"] = {}
  if (revalidate !== undefined) nextOptions.revalidate = revalidate
  if (tags?.length) nextOptions.tags = tags

  const res = await fetch(`${env.API_BASE_URL}${endpoint}`, {
    ...init,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    next: Object.keys(nextOptions).length > 0 ? nextOptions : undefined,
  })

  if (!res.ok) {
    throw await parseErrorResponse(res)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export const serverApiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: "GET", ...options }),

  post: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: "POST", body, ...options }),

  patch: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: "PATCH", body, ...options }),

  put: <T>(endpoint: string, body: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: "PUT", body, ...options }),

  del: <T = void>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: "DELETE", ...options }),
}

export { ApiError }
