"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { SessionProvider, useSession } from "next-auth/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { getQueryClient } from "@/lib/query-client"
import { deleteDraftsExceptPrefix, pruneDrafts } from "@/lib/drafts/store"
import { draftUserPrefix } from "@/hooks/use-form-draft"
import { useEffect } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()

  return (
    <ThemeProvider defaultPreference="light">
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <DraftHousekeeping />
          <TooltipProvider>{children}</TooltipProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}

/**
 * Keeps on-device form drafts tidy: drops week-old ones, and once a user is
 * signed in, removes any other user's drafts. Drafts of a session that simply
 * expired are kept until then, so a timed-out user doesn't lose their work.
 */
function DraftHousekeeping() {
  const { data: session, status } = useSession()
  const userId = status === "authenticated" ? session?.user?.id : undefined
  useEffect(() => {
    void pruneDrafts()
  }, [])
  useEffect(() => {
    if (userId) void deleteDraftsExceptPrefix(draftUserPrefix(userId))
  }, [userId])
  return null
}
