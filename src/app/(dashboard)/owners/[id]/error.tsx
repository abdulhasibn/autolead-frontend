"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function OwnerDetailError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <p className="font-medium">Couldn&apos;t load owner</p>
      <p className="text-muted-foreground text-sm">
        The service may be temporarily unavailable.
      </p>
      <Button variant="outline" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  )
}
