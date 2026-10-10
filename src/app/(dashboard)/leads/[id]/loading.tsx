export default function LeadLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading lead">
      <div className="h-4 w-20 animate-pulse rounded bg-[#E5E7EB]" />
      <div className="flex items-center gap-4">
        <div className="size-12 animate-pulse rounded-full bg-[#F0FDFA]" />
        <div className="space-y-2">
          <div className="h-7 w-56 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-4 w-40 animate-pulse rounded bg-[#E5E7EB]" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-[#E5E7EB] bg-white" />
        ))}
        <div className="h-32 animate-pulse rounded-xl border border-[#E5E7EB] bg-white lg:col-span-3" />
      </div>
    </div>
  )
}
