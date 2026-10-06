import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"

export default function LeadNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <p className="font-medium">Lead not found</p>
      <p className="text-muted-foreground text-sm">
        It may have been removed, or you may not have access to it.
      </p>
      <Link href="/leads" className={buttonVariants({ variant: "outline" })}>
        Back to leads
      </Link>
    </div>
  )
}
