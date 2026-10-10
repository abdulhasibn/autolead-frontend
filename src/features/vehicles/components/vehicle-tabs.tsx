"use client"

import { useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"

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

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
    if (!delta) return
    e.preventDefault()
    const next = tabs[(index + delta + tabs.length) % tabs.length]
    if (!next) return
    select(next.id)
    document.getElementById(`vehicle-tab-${next.id}`)?.focus()
  }

  return (
    <div id="vehicle-tabs" className="scroll-mt-20 rounded-xl border border-[#E5E7EB] bg-white">
      <div
        role="tablist"
        aria-label="Vehicle sections"
        className="flex gap-5 overflow-x-auto border-b border-[#F3F4F6] px-4 text-sm font-medium text-[#6B7280]"
      >
        {tabs.map((tab, i) => {
          const selected = tab.id === active
          return (
            <button
              key={tab.id}
              id={`vehicle-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`vehicle-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(tab.id)}
              onKeyDown={(e) => onKeyDown(e, i)}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 py-3 whitespace-nowrap transition-colors",
                selected
                  ? "border-[#0D9488] text-[#0D9488]"
                  : "border-transparent hover:text-[#111827]"
              )}
            >
              {tab.label}
              {tab.count !== undefined &&
                (tab.highlight && tab.count > 0 ? (
                  <span className="rounded-full bg-[#EFF6FF] px-1.5 text-[11px] font-semibold text-[#2563EB]">
                    {tab.count}
                  </span>
                ) : (
                  <span className="font-mono-data text-xs text-[#9CA3AF]">{tab.count}</span>
                ))}
            </button>
          )
        })}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`vehicle-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`vehicle-tab-${tab.id}`}
          hidden={tab.id !== active}
          className="p-5"
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
