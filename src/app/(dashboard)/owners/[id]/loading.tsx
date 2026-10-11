import { Skeleton } from "@/components/ui/skeleton"

export default function OwnerDetailLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading owner">
      <Skeleton className="h-4 w-24 rounded bg-border" />

      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full bg-accent" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48 rounded bg-border" />
          <Skeleton className="h-4 w-32 rounded bg-border" />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-4">
            <Skeleton className="h-4 w-24 rounded bg-muted" />
            <div className="space-y-3">
              {[0, 1, 2].map((j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-3 w-16 rounded bg-border" />
                  <Skeleton className="h-4 w-32 rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
