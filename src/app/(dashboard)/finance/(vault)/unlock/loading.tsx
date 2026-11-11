import { Skeleton } from "@/components/ui/skeleton"

export default function FinanceUnlockLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading">
      <Skeleton className="size-10 rounded-full bg-accent" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48 rounded bg-border" />
        <Skeleton className="h-4 w-full rounded bg-muted" />
        <Skeleton className="h-4 w-3/4 rounded bg-muted" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-24 rounded bg-muted" />
        <Skeleton className="h-10 w-full rounded-lg bg-border" />
      </div>
      <Skeleton className="h-9 w-32 rounded-lg bg-border" />
    </div>
  )
}
