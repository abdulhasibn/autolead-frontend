import Link from "next/link"
import { cn } from "@/lib/utils"

interface SectionCardProps {
  title: string
  total?: number
  seeAllHref?: string
  seeAllLabel?: string
  accent?: "default" | "red" | "amber"
  children: React.ReactNode
  className?: string
}

export function SectionCard({
  title,
  total,
  seeAllHref,
  seeAllLabel = "See all",
  accent = "default",
  children,
  className,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E5E7EB] overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-[#F3F4F6]",
          accent === "red" && "border-b-[#FEE2E2]"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#111827]">{title}</span>
          {total !== undefined && (
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold",
                accent === "red"
                  ? "bg-[#FEE2E2] text-[#DC2626]"
                  : accent === "amber"
                    ? "bg-[#FEF3C7] text-[#D97706]"
                    : "bg-[#F0FDFA] text-[#0D9488]"
              )}
            >
              {total}
            </span>
          )}
        </div>
        {seeAllHref && total !== undefined && total > 0 && (
          <Link
            href={seeAllHref}
            className="text-xs font-medium text-[#0D9488] hover:text-[#0F766E] hover:underline transition-colors"
          >
            {seeAllLabel} →
          </Link>
        )}
      </div>

      {/* Content */}
      <div className="p-0">{children}</div>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <div className="w-8 h-8 rounded-full bg-[#F0FDFA] flex items-center justify-center mb-2">
        <svg
          className="w-4 h-4 text-[#0D9488]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <p className="text-xs text-[#9CA3AF]">{message}</p>
    </div>
  )
}
