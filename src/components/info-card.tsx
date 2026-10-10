import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/** Label/value pair inside a `<dl>`. */
export function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-medium tracking-wide text-[#9CA3AF] uppercase">{label}</dt>
      <dd className="text-sm text-[#111827]">{children}</dd>
    </div>
  )
}

/** White card with a teal icon tile and title; `action` sits at the right of the header. */
export function InfoCard({
  title,
  icon: Icon,
  action,
  className,
  children,
}: {
  title: string
  icon: LucideIcon
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-[#E5E7EB] bg-white", className)}>
      <div className="flex items-center gap-2 border-b border-[#F3F4F6] px-4 py-3">
        <span className="flex size-6 items-center justify-center rounded-md bg-[#F0FDFA] text-[#0D9488]">
          <Icon className="size-3.5" />
        </span>
        <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}
