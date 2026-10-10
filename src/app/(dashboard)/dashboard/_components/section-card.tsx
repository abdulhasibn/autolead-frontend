import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
    <Card className={cn("gap-0 py-0", className)}>
      <CardHeader
        className={cn(
          "flex items-center justify-between border-b border-muted px-4 py-3",
          accent === "red" && "border-b-[#FEE2E2]"
        )}
      >
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
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
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}
