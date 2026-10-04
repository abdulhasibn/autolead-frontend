export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
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
      error?: { code?: string; message?: string }
    }
    const code = body.error?.code ?? "UNKNOWN_ERROR"
    const message = body.error?.message ?? res.statusText
    return new ApiError(res.status, code, message)
  } catch {
    return new ApiError(res.status, "UNKNOWN_ERROR", res.statusText)
  }
}

export { parseErrorResponse }
