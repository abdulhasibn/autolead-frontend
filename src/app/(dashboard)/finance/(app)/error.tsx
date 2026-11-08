"use client"

import { Button } from "@/components/ui/button"

export default function FinanceError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <p className="text-sm font-semibold text-foreground">Couldn’t load finance</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {error.digest ? "Something went wrong on the server." : error.message || "Please try again."}
      </p>
      <Button variant="outline" className="mt-4" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
