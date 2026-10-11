"use client"

import { useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface VehicleTab {
  id: string
  label: string
  count?: number
  /** Count badge in the "needs attention" style (e.g. active leads). */
  highlight?: boolean
  content: React.ReactNode
}

/**
 * Tabs whose selection lives in `?tab=`, so a tab can be linked to and the
 * back button works. Switching only replaces the URL; nothing refetches.
 */
export function VehicleTabs({ tabs }: { tabs: VehicleTab[] }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fromUrl = searchParams.get("tab")
  const [active, setActive] = useState(
    tabs.some((t) => t.id === fromUrl) ? fromUrl! : (tabs[0]?.id ?? "")
  )

  // Follow links like "Add photos" that point at ?tab=photos.
  const [lastUrlTab, setLastUrlTab] = useState(fromUrl)
  if (fromUrl !== lastUrlTab) {
    setLastUrlTab(fromUrl)
    if (fromUrl && tabs.some((t) => t.id === fromUrl)) setActive(fromUrl)
  }

  function select(id: string) {
    setActive(id)
    const params = new URLSearchParams(searchParams.toString())
    if (id === tabs[0]?.id) params.delete("tab")
    else params.set("tab", id)
    const qs = params.toString()
    window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <Tabs
      id="vehicle-tabs"
      value={active}
      onValueChange={(value) => select(String(value))}
      className="scroll-mt-20 gap-0 rounded-xl border border-border bg-card"
    >
      <TabsList
        variant="line"
        aria-label="Vehicle sections"
        className="h-auto w-full justify-start gap-5 rounded-none border-b border-muted p-0 px-4"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="h-auto flex-none rounded-none px-0 py-3 text-muted-foreground after:hidden hover:text-foreground"
          >
            {tab.label}
            {tab.count !== undefined &&
              (tab.highlight && tab.count > 0 ? (
                <span className="rounded-full bg-[#EFF6FF] px-1.5 text-[11px] font-semibold text-[#2563EB]">
                  {tab.count}
                </span>
              ) : (
                <span className="font-mono-data text-xs text-subtle-foreground">{tab.count}</span>
              ))}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        // Panels stay mounted so in-progress uploads and form state survive switching.
        <TabsContent key={tab.id} value={tab.id} keepMounted className="p-5">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
