export default function LeadsLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading leads">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="bg-muted h-7 w-24 animate-pulse rounded" />
          <div className="bg-muted h-4 w-16 animate-pulse rounded" />
        </div>
        <div className="bg-muted h-8 w-28 animate-pulse rounded-lg" />
      </div>
      <div className="flex gap-2">
        <div className="bg-muted h-8 w-64 animate-pulse rounded-lg" />
        <div className="bg-muted h-8 w-48 animate-pulse rounded-lg" />
      </div>
      <div className="space-y-px overflow-hidden rounded-lg border">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="bg-muted/50 h-12 animate-pulse" />
        ))}
      </div>
    </div>
  )
}
