export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    /** Extra facts the server sends with the error, e.g. `attemptsLeft` on a wrong finance key. */
    public readonly details?: Readonly<Record<string, string | number | string[]>>
  ) {
    super(message)
    this.name = "ApiError"
  }

  static isApiError(err: unknown): err is ApiError {
    return err instanceof ApiError
  }

  /** Error codes the server sends that map to "session expired" */
  isAuthError() {
    return this.status === 401
  }

  isForbidden() {
    return this.status === 403
  }

  isNotFound() {
    return this.status === 404
  }

  isConflict() {
    return this.status === 409
  }

  isValidation() {
    return this.status === 422
  }
}

async function parseErrorResponse(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as {
      error?: { code?: string; message?: string; details?: Record<string, string | number | string[]> }
    }
    const code = body.error?.code ?? "UNKNOWN_ERROR"
    const message = body.error?.message ?? res.statusText
    return new ApiError(res.status, code, message, body.error?.details)
  } catch {
    return new ApiError(res.status, "UNKNOWN_ERROR", res.statusText)
  }
}

export { parseErrorResponse }
