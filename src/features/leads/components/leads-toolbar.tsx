"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, SlidersHorizontal, X } from "lucide-react"
import { FilterSheet } from "@/components/filter-sheet"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "../constants"
import { buildLeadsHref, type LeadsSearchParams } from "../search-params"
import { OptionSelect } from "./option-select"
import type { VehicleOption } from "./types"

const ALL = "all"

const STATUS_OPTIONS = [
  { value: ALL, label: "All statuses" },
  ...LEAD_STATUSES.map((s) => ({ value: s, label: LEAD_STATUS_LABELS[s] })),
]

interface LeadsToolbarProps {
  params: LeadsSearchParams
  vehicles: VehicleOption[]
}

export function LeadsToolbar({ params, vehicles }: LeadsToolbarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(params.q ?? "")
  const [filtersOpen, setFiltersOpen] = useState(false)

  function navigate(next: Partial<LeadsSearchParams>) {
    startTransition(() => {
      router.push(buildLeadsHref({ ...params, ...next, page: 1 }))
    })
  }

  // Debounce typing into the URL; the page re-renders on the server.
  useEffect(() => {
    const q = search.trim() || undefined
    if (q === params.q) return
    const timer = setTimeout(() => navigate({ q }), 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const vehicleOptions = [
    { value: ALL, label: "All vehicles" },
    ...vehicles.map((v) => ({ value: v.id, label: v.label })),
  ]

  const hasFilters = Boolean(params.q || params.status || params.vehicleId)
  const activeCount = (params.status ? 1 : 0) + (params.vehicleId ? 1 : 0)

  const statusSelect = (className: string) => (
    <OptionSelect
      aria-label="Filter by status"
      className={className}
      value={params.status ?? ALL}
      options={STATUS_OPTIONS}
      onValueChange={(value) =>
        navigate({ status: value === ALL ? undefined : (value as LeadsSearchParams["status"]) })
      }
    />
  )
  const vehicleSelect = (className: string) => (
    <OptionSelect
      aria-label="Filter by vehicle"
      className={className}
      value={params.vehicleId ?? ALL}
      options={vehicleOptions}
      onValueChange={(value) =>
        navigate({ vehicleId: value === ALL ? undefined : value })
      }
    />
  )

  function clearAll() {
    setSearch("")
    startTransition(() => router.push("/leads"))
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <InputGroup className="h-9 pointer-coarse:h-10 min-w-0 flex-1 bg-background md:w-64 md:flex-none">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            enterKeyHint="search"
            placeholder="Search name, phone or email"
            aria-label="Search leads"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>

        {/* Phones: status and vehicle live in a bottom sheet. */}
        <div className="md:hidden">
          <FilterSheet
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            title="Filter leads"
            triggerClassName={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium text-foreground",
              activeCount > 0 ? "border-primary/30" : "border-border"
            )}
            trigger={
              <>
                <SlidersHorizontal className="size-4" />
                <span className="sr-only sm:not-sr-only">Filters</span>
                {activeCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
                    {activeCount}
                  </span>
                )}
              </>
            }
            footer={
              <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => { setFiltersOpen(false); clearAll() }}>
                  Reset
                </Button>
                <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                  Done
                </Button>
              </div>
            }
          >
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Status</span>
              {statusSelect("h-10 border-border bg-card")}
            </div>
            <div className="space-y-1.5">
              <span className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Vehicle</span>
              {vehicleSelect("h-10 border-border bg-card")}
            </div>
          </FilterSheet>
        </div>

        <div className="hidden md:contents">
          {statusSelect("h-9 border-border bg-card md:w-48")}
          {vehicleSelect("h-9 border-border bg-card md:w-64")}
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="hidden text-muted-foreground hover:text-primary md:inline-flex"
            onClick={clearAll}
          >
            <X />
            Clear
          </Button>
        )}
        {isPending && (
          <Loader2 className="size-4 text-primary animate-spin" aria-label="Loading" />
        )}
      </div>

      {/* Phones: one-tap status shortcuts. */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-none md:hidden" role="group" aria-label="Quick status filter">
        {STATUS_OPTIONS.map((option) => {
          const value = option.value === ALL ? undefined : (option.value as LeadsSearchParams["status"])
          return (
            <Toggle
              key={option.value}
              variant="chip"
              size="sm"
              pressed={params.status === value}
              onPressedChange={() => navigate({ status: value })}
              className="h-8 shrink-0 text-xs"
            >
              {option.value === ALL ? "All" : option.label}
            </Toggle>
          )
        })}
      </div>
    </div>
  )
}
