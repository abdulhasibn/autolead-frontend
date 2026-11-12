"use client"

import Link, { useLinkStatus } from "next/link"
import { Loader2 } from "lucide-react"

/**
 * A `next/link` that shows a small spinner inside itself while the page it
 * points to is loading. For links that stay on the same page with a new query
 * (paging), where the page's loading skeleton doesn't appear.
 */
export function PendingLink({ children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <PendingSpinner />
    </Link>
  )
}

function PendingSpinner() {
  const { pending } = useLinkStatus()
  return pending ? <Loader2 aria-label="Loading" className="size-3.5 animate-spin text-primary" /> : null
}
