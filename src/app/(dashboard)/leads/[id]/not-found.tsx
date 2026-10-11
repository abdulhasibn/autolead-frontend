import Link from "next/link"
import { SearchX } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"

export default function LeadNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card py-16 text-center">
      <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-accent">
        <SearchX className="size-5 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">Lead not found</p>
      <p className="text-xs text-subtle-foreground">
        It may have been removed, or you may not have access to it.
      </p>
      <Link href="/leads" className={buttonVariants({ className: "mt-2" })}>
        Back to leads
      </Link>
    </div>
  )
}
