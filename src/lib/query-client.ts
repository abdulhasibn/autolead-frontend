import { QueryClient } from "@tanstack/react-query"
import { cache } from "react"

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

/** Returns per-request QueryClient on the server, singleton on the client. */
export const getQueryClient = cache(function getQueryClientImpl() {
  if (typeof window === "undefined") {
    // Server: always create a new client
    return makeQueryClient()
  }
  // Browser: reuse singleton to preserve cache across re-renders
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
})
