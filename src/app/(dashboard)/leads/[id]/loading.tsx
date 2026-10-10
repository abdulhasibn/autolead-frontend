import { Skeleton } from "@/components/ui/skeleton"

export default function LeadLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading lead">
      <Skeleton className="h-4 w-20 rounded bg-border" />
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full bg-accent" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 rounded bg-border" />
          <Skeleton className="h-4 w-40 rounded bg-border" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl border border-border bg-card" />
        ))}
        <Skeleton className="h-32 rounded-xl border border-border bg-card lg:col-span-3" />
      </div>
    </div>
  )
}
