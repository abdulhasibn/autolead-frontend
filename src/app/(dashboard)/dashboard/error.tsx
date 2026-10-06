"use client"

import { useEffect } from "react"
import { ApiError } from "@/lib/api-error"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[Dashboard]", error)
  }, [error])

  const message =
    ApiError.isApiError(error)
      ? error.message
      : "Something went wrong loading the dashboard."

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center mb-4">
        <svg
          className="w-6 h-6 text-[#DC2626]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-[#111827] mb-1">
        Failed to load dashboard
      </h2>
      <p className="text-sm text-[#6B7280] max-w-sm mb-5">{message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white text-sm font-medium rounded-lg transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
