import { ApiError } from "@/lib/api-error"

export interface ActionError {
  status: number
  code: string
  message: string
}

/**
 * Server Actions can't throw `ApiError` across the network boundary (only the
 * message survives in production), so they return this instead.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError }

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data }
}

export function actionError(err: unknown): { ok: false; error: ActionError } {
  if (ApiError.isApiError(err)) {
    return {
      ok: false,
      error: { status: err.status, code: err.code, message: err.message },
    }
  }
  return {
    ok: false,
    error: {
      status: 500,
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred. Please try again.",
    },
  }
}

export function validationError(message = "Please check your input and try again.") {
  return {
    ok: false as const,
    error: { status: 422, code: "VALIDATION_ERROR", message },
  }
}
