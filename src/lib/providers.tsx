"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { SessionProvider } from "next-auth/react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "@/components/theme-provider"
import { getQueryClient } from "@/lib/query-client"
import { pruneDrafts } from "@/lib/drafts/store"
import { useEffect } from "react"

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  // Week-old unsent form drafts are dropped once per app load.
  useEffect(() => {
    void pruneDrafts()
  }, [])

  return (
    <ThemeProvider defaultPreference="light">
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>{children}</TooltipProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  )
}
