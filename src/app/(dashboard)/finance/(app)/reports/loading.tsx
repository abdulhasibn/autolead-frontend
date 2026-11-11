import { Skeleton } from "@/components/ui/skeleton"

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading report">
      <div className="space-y-3">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-lg bg-border" />
          ))}
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <Skeleton className="h-9 w-64 max-w-full rounded-lg bg-border" />
          <Skeleton className="h-9 w-48 rounded-lg bg-border" />
        </div>
      </div>
      <Skeleton className="h-72 rounded-xl border border-border bg-card" />
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="h-10 border-b border-border/50 bg-card/50" />
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-4 py-3">
              <Skeleton className="h-4 w-40 rounded bg-muted" />
              <Skeleton className="h-4 w-20 rounded bg-border" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
