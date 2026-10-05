export default function LeadLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading lead">
      <div className="bg-muted h-4 w-20 animate-pulse rounded" />
      <div className="space-y-2">
        <div className="bg-muted h-7 w-56 animate-pulse rounded" />
        <div className="bg-muted h-4 w-40 animate-pulse rounded" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="bg-muted/50 h-40 animate-pulse rounded-xl" />
        ))}
        <div className="bg-muted/50 h-32 animate-pulse rounded-xl lg:col-span-3" />
      </div>
    </div>
  )
}
