"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutGrid, List, Loader2, Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Toggle } from "@/components/ui/toggle"
import { OptionSelect } from "@/features/leads/components/option-select"
import type { MakeReadModel, ModelReadModel } from "@/features/catalog/types"
import { cn } from "@/lib/utils"
import { getModelsAction } from "../actions"
import { FUEL_TYPES, FUEL_TYPE_LABELS, TRANSMISSIONS, TRANSMISSION_LABELS } from "../constants"
import {
  buildVehiclesHref,
  countActiveFilters,
  type VehiclesSearchParams,
} from "../search-params"
import type { FuelType, Transmission } from "../types"
import { formatKm } from "../utils"

interface VehiclesToolbarProps {
  params: VehiclesSearchParams
  makes: MakeReadModel[]
  /** Models of the selected make, so its chip can show a name. */
  models: ModelReadModel[]
}

type Draft = Pick<
  VehiclesSearchParams,
  "makeId" | "modelId" | "fuel" | "transmission" | "yearMin" | "yearMax" | "kmMin" | "kmMax"
>

const fieldLabel = "text-[11px] font-medium tracking-wide text-subtle-foreground uppercase"

function toDraft(params: VehiclesSearchParams): Draft {
  return {
    makeId: params.makeId,
    modelId: params.modelId,
    fuel: params.fuel,
    transmission: params.transmission,
    yearMin: params.yearMin,
    yearMax: params.yearMax,
    kmMin: params.kmMin,
    kmMax: params.kmMax,
  }
}

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

function parseNumber(value: string): number | undefined {
  const n = Number(value.replace(/[,\s]/g, ""))
  return value.trim() === "" || !Number.isFinite(n) ? undefined : Math.max(0, Math.round(n))
}

function ChoiceChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Toggle variant="chip" size="sm" pressed={selected} onPressedChange={onClick} className="text-xs">
      {children}
    </Toggle>
  )
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-card pr-1 pl-2.5 text-xs font-medium text-foreground ring-1 ring-[#E5E7EB]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="rounded-full p-0.5 text-subtle-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

function rangeLabel(min: number | undefined, max: number | undefined, format: (n: number) => string) {
  if (min !== undefined && max !== undefined) return `${format(min)}–${format(max)}`
  if (min !== undefined) return `${format(min)}+`
  return `Up to ${format(max!)}`
}

export function VehiclesToolbar({ params, makes, models }: VehiclesToolbarProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(params.q ?? "")
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft>(() => toDraft(params))
  const [draftModels, setDraftModels] = useState<ModelReadModel[]>(models)

  function navigate(next: Partial<VehiclesSearchParams>) {
    startTransition(() => {
      router.push(buildVehiclesHref({ ...params, ...next, page: 1 }))
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

  async function chooseMake(makeId: string) {
    setDraft((d) => ({ ...d, makeId: makeId || undefined, modelId: undefined }))
    setDraftModels([])
    if (!makeId) return
    const result = await getModelsAction(makeId)
    if (result.ok) setDraftModels(result.data)
  }

  const activeCount = countActiveFilters(params)
  const makeName = makes.find((m) => m.id === params.makeId)?.name
  const modelName = models.find((m) => m.id === params.modelId)?.name
  const hasAnything = activeCount > 0 || Boolean(params.q)

  const chips: Array<{ key: string; label: string; clear: Partial<VehiclesSearchParams> }> = []
  if (params.makeId) {
    chips.push({
      key: "make",
      label: [makeName ?? "Make", modelName].filter(Boolean).join(" "),
      clear: { makeId: undefined, modelId: undefined },
    })
  }
  if (params.fuel.length) {
    chips.push({
      key: "fuel",
      label: params.fuel.map((f) => FUEL_TYPE_LABELS[f]).join(", "),
      clear: { fuel: [] },
    })
  }
  if (params.transmission.length) {
    chips.push({
      key: "transmission",
      label: params.transmission.map((t) => TRANSMISSION_LABELS[t]).join(", "),
      clear: { transmission: [] },
    })
  }
  if (params.yearMin !== undefined || params.yearMax !== undefined) {
    chips.push({
      key: "year",
      label: rangeLabel(params.yearMin, params.yearMax, String),
      clear: { yearMin: undefined, yearMax: undefined },
    })
  }
  if (params.kmMin !== undefined || params.kmMax !== undefined) {
    chips.push({
      key: "km",
      label: `${rangeLabel(params.kmMin, params.kmMax, formatKm)} km`,
      clear: { kmMin: undefined, kmMax: undefined },
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InputGroup className="h-9 w-full bg-background sm:w-72">
        <InputGroupAddon>
          <Search />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="Search plate, make or model"
          aria-label="Search vehicles"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </InputGroup>

      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) {
            setDraft(toDraft(params))
            setDraftModels(models)
          }
        }}
      >
        <PopoverTrigger
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-lg border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:border-primary",
            activeCount > 0 ? "border-primary/30" : "border-border"
          )}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          )}
        </PopoverTrigger>
        <PopoverContent className="w-[min(340px,calc(100vw-2rem))] space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className={fieldLabel}>Make</span>
              <OptionSelect
                aria-label="Make"
                className="h-9"
                value={draft.makeId ?? ""}
                onValueChange={chooseMake}
                options={[{ value: "", label: "Any make" }, ...makes.map((m) => ({ value: m.id, label: m.name }))]}
                placeholder="Any make"
              />
            </div>
            <div className="space-y-1">
              <span className={fieldLabel}>Model</span>
              <OptionSelect
                aria-label="Model"
                className="h-9"
                value={draft.modelId ?? ""}
                onValueChange={(v) => setDraft((d) => ({ ...d, modelId: v || undefined }))}
                options={[{ value: "", label: "Any model" }, ...draftModels.map((m) => ({ value: m.id, label: m.name }))]}
                placeholder="Any model"
                disabled={!draft.makeId}
              />
            </div>
          </div>

          <fieldset className="space-y-1">
            <legend className={fieldLabel}>Fuel</legend>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {FUEL_TYPES.map((fuel) => (
                <ChoiceChip
                  key={fuel}
                  selected={draft.fuel.includes(fuel)}
                  onClick={() => setDraft((d) => ({ ...d, fuel: toggle<FuelType>(d.fuel, fuel) }))}
                >
                  {FUEL_TYPE_LABELS[fuel]}
                </ChoiceChip>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-1">
            <legend className={fieldLabel}>Transmission</legend>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TRANSMISSIONS.map((t) => (
                <ChoiceChip
                  key={t}
                  selected={draft.transmission.includes(t)}
                  onClick={() =>
                    setDraft((d) => ({ ...d, transmission: toggle<Transmission>(d.transmission, t) }))
                  }
                >
                  {TRANSMISSION_LABELS[t]}
                </ChoiceChip>
              ))}
            </div>
          </fieldset>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className={fieldLabel}>Year</span>
              <div className="flex gap-1">
                <Input aria-label="Year from" inputMode="numeric" placeholder="From" className="font-mono-data h-9 text-xs"
                  defaultValue={draft.yearMin ?? ""} key={`ymin-${open}`}
                  onChange={(e) => setDraft((d) => ({ ...d, yearMin: parseNumber(e.target.value) }))} />
                <Input aria-label="Year to" inputMode="numeric" placeholder="To" className="font-mono-data h-9 text-xs"
                  defaultValue={draft.yearMax ?? ""} key={`ymax-${open}`}
                  onChange={(e) => setDraft((d) => ({ ...d, yearMax: parseNumber(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1">
              <span className={fieldLabel}>Km driven</span>
              <div className="flex gap-1">
                <Input aria-label="Minimum km" inputMode="numeric" placeholder="Min" className="font-mono-data h-9 text-xs"
                  defaultValue={draft.kmMin ?? ""} key={`kmin-${open}`}
                  onChange={(e) => setDraft((d) => ({ ...d, kmMin: parseNumber(e.target.value) }))} />
                <Input aria-label="Maximum km" inputMode="numeric" placeholder="Max" className="font-mono-data h-9 text-xs"
                  defaultValue={draft.kmMax ?? ""} key={`kmax-${open}`}
                  onChange={(e) => setDraft((d) => ({ ...d, kmMax: parseNumber(e.target.value) }))} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-primary"
              onClick={() => {
                setOpen(false)
                navigate({ makeId: undefined, modelId: undefined, fuel: [], transmission: [], yearMin: undefined, yearMax: undefined, kmMin: undefined, kmMax: undefined })
              }}
            >
              Reset
            </button>
            <Button
              size="sm"
              onClick={() => {
                setOpen(false)
                navigate(draft)
              }}
            >
              Apply filters
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {chips.map((chip) => (
        <ActiveChip key={chip.key} label={chip.label} onRemove={() => navigate(chip.clear)} />
      ))}
      {hasAnything && (
        <button
          type="button"
          className="text-xs font-medium text-muted-foreground hover:text-primary"
          onClick={() => {
            setSearch("")
            startTransition(() =>
              router.push(buildVehiclesHref({ status: params.status, layout: params.layout }))
            )
          }}
        >
          Clear all
        </button>
      )}
      {isPending && <Loader2 className="size-4 animate-spin text-primary" aria-label="Loading" />}

      <div className="ml-auto inline-flex rounded-lg border border-border bg-card p-0.5">
        {(["grid", "table"] as const).map((layout) => {
          const Icon = layout === "grid" ? LayoutGrid : List
          const active = params.layout === layout
          return (
            <Link
              key={layout}
              href={buildVehiclesHref({ ...params, layout })}
              aria-label={layout === "grid" ? "Card view" : "Table view"}
              aria-current={active ? "true" : undefined}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                active ? "bg-accent text-primary" : "text-subtle-foreground hover:text-muted-foreground"
              )}
            >
              <Icon className="size-4" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
