export default function LeadsLoading() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading leads">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-24 animate-pulse rounded bg-[#E5E7EB]" />
          <div className="h-4 w-16 animate-pulse rounded bg-[#E5E7EB]" />
        </div>
        <div className="h-8 w-28 animate-pulse rounded-lg bg-[#E5E7EB]" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-[#E5E7EB]" />
        <div className="h-9 w-48 animate-pulse rounded-lg bg-[#E5E7EB]" />
      </div>
      <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
        <div className="h-10 border-b border-[#F3F4F6] bg-[#F9FAFB]" />
        <div className="divide-y divide-[#F3F4F6]">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3">
              <div className="size-8 animate-pulse rounded-full bg-[#F0FDFA]" />
              <div className="h-4 w-40 animate-pulse rounded bg-[#F3F4F6]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
