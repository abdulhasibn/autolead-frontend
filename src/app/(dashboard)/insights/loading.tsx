import { Skeleton } from "@/components/ui/skeleton"
import { InsightsTabSkeleton } from "./_components/insights-tab-skeleton"

export default function InsightsLoading() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6" aria-busy="true" aria-label="Loading insights">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32 bg-border rounded-lg" />
            <Skeleton className="h-4 w-56 bg-muted rounded" />
          </div>
          <Skeleton className="h-9 w-64 bg-accent rounded-lg" />
        </div>
        <Skeleton className="h-8 w-60 bg-muted rounded-lg" />
      </div>
      <InsightsTabSkeleton />
    </div>
  )
}
