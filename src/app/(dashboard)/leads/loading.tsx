import { Skeleton } from "@/components/ui/skeleton"

export default function LeadsLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading leads">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24 rounded bg-border" />
          <Skeleton className="h-4 w-16 rounded bg-border" />
        </div>
        <Skeleton className="h-8 w-28 rounded-lg bg-border" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-64 rounded-lg bg-border" />
        <Skeleton className="h-9 w-48 rounded-lg bg-border" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="h-10 border-b border-[#F3F4F6] bg-[#F9FAFB]" />
        <div className="divide-y divide-[#F3F4F6]">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-8 rounded-full bg-accent" />
              <Skeleton className="h-4 w-40 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
