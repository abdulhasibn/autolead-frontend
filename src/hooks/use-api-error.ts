"use client"

import { useCallback } from "react"
import { toast } from "sonner"
import { ApiError } from "@/lib/api-error"
import { isApiError } from "@/types/api"

const ERROR_CODE_MESSAGES: Record<string, string> = {
  AUTHENTICATION_FAILED: "Your session has expired. Please sign in again.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource was not found.",
  UNIQUE_VIOLATION: "A record with these details already exists.",
  CONFLICT: "This action conflicts with existing data.",
  LAST_ADMIN_PROTECTED: "Cannot remove the last administrator account.",
  VALIDATION_ERROR: "Please check your input and try again.",
  INVALID_LEAD_STATUS_TRANSITION:
    "This status transition is not allowed for leads.",
  LEAD_REQUIRES_VEHICLE:
    "Link a vehicle to this lead before moving it to this status.",
  LEAD_STATUS_SYSTEM_MANAGED: "This status is set automatically.",
  LEAD_CLOSED: "This lead is closed and can no longer be changed.",
  VEHICLE_NOT_LINKABLE: "Only open or linked vehicles can be linked to a lead.",
  SHOWROOM_REQUIRED:
    "Your account has no home showroom. Ask an admin to configure a default showroom.",
  INVALID_VEHICLE_STATUS_TRANSITION:
    "This status transition is not allowed for vehicles.",
  DB_UNAVAILABLE: "Service temporarily unavailable. Please try again.",
  INTERNAL_ERROR: "An unexpected error occurred. Please try again.",
}

export function useApiError() {
  const handleError = useCallback((err: unknown, fallback?: string) => {
    // ApiError instances (thrown) or plain `ActionError`s (returned by Server Actions)
    if (ApiError.isApiError(err) || isApiError(err)) {
      const message =
        ERROR_CODE_MESSAGES[err.code] ??
        err.message ??
        fallback ??
        "Something went wrong."
      toast.error(message)
      return
    }
    toast.error(fallback ?? "Something went wrong.")
  }, [])

  return { handleError }
}
