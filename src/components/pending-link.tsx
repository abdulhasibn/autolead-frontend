"use client"

import { useState } from "react"
import Link, { useLinkStatus } from "next/link"
import { Loader2 } from "lucide-react"
import { useRouteNavigate } from "@/components/route-pending"

type PendingLinkProps = React.ComponentProps<typeof Link> & {
  /** Show a small spinner inside the link while its page loads. */
  spinner?: boolean
}

/**
 * A `next/link` for links that stay on the same page with a new query (tabs,
 * period, paging). A plain click goes through the shared page transition so
 * the page's skeleton appears at once; modified clicks (new tab etc.) behave
 * like a normal link.
 */
export function PendingLink({ children, spinner = true, onClick, href, replace, scroll, ...props }: PendingLinkProps) {
  const { isPending, navigate } = useRouteNavigate()
  const [clicked, setClicked] = useState(false)

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (typeof href !== "string" || props.target === "_blank") return
    e.preventDefault()
    setClicked(true)
    navigate(href, { replace, scroll: scroll ?? true })
  }

  return (
    <Link {...props} href={href} replace={replace} scroll={scroll} onClick={handleClick}>
      {children}
      {spinner && <PendingSpinner show={clicked && isPending} />}
    </Link>
  )
}

function PendingSpinner({ show }: { show: boolean }) {
  const { pending } = useLinkStatus()
  return show || pending ? <Loader2 aria-label="Loading" className="size-3.5 animate-spin text-primary" /> : null
}
