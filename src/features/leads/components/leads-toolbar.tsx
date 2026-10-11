"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup className="h-9 w-full bg-background sm:w-64">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="Search name, phone or email"
          aria-label="Search leads"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>
      <OptionSelect
        aria-label="Filter by status"
        className="h-9 border-border bg-card sm:w-48"
        value={params.status ?? ALL}
        options={STATUS_OPTIONS}
        onValueChange={(value) =>
          navigate({ status: value === ALL ? undefined : (value as LeadsSearchParams["status"]) })
        }
      />
      <OptionSelect
        aria-label="Filter by vehicle"
        className="h-9 border-border bg-card sm:w-64"
        value={params.vehicleId ?? ALL}
        options={vehicleOptions}
        onValueChange={(value) =>
          navigate({ vehicleId: value === ALL ? undefined : value })
        }
      />
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-primary"
          onClick={() => {
            setSearch("")
            startTransition(() => router.push("/leads"))
          }}
        >
          <X />
          Clear
        </Button>
      )}
      {isPending && (
        <Loader2 className="size-4 text-primary animate-spin" aria-label="Loading" />
      )}
    </div>
  )
}
