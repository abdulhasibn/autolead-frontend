import { Skeleton } from "@/components/ui/skeleton"

export default function FinanceLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading finance overview">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-20 rounded bg-muted" />
            <Skeleton className="h-7 w-24 rounded bg-border" />
            <Skeleton className="h-3 w-28 rounded bg-muted" />
          </div>
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl border border-border bg-card" />
    </div>
  )
}
