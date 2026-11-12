"use client"

import { useState } from "react"
import { ArrowUpDown, Loader2, Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FilterSheet } from "@/components/filter-sheet"
import { ChipMultiSelect } from "@/features/leads/components/chip-multi-select"
import { OptionSelect } from "@/components/option-select"
import { SegmentedChoice } from "@/features/leads/components/segmented-choice"
import { parseMoneyInput } from "../../logic/money"
import { PURPOSE_LABELS } from "../../logic/purpose"
import { countActiveEntryFilters, type EntryFilters } from "../../search-params"
import type { EntryPurpose, FinanceTag, ShowroomOption } from "../../types"
import { DateRangeField } from "../date-range-field"
import { MoneyInput } from "../money-input"
import { VehiclePicker } from "../pickers"
import type { PickerOption } from "../search-picker"
import { useQueryState } from "../use-query-state"

const SORT_OPTIONS = [
  { value: "date", label: "Newest first" },
  { value: "-date", label: "Oldest first" },
  { value: "amount", label: "Largest amount" },
  { value: "-amount", label: "Smallest amount" },
]

const PURPOSES: EntryPurpose[] = ["purchase", "cost", "sale", "other", "general"]

export function LedgerToolbar({
  filters,
  tags,
  showrooms,
}: {
  filters: EntryFilters
  tags: FinanceTag[]
  showrooms: ShowroomOption[]
}) {
  const { update, isPending } = useQueryState()
  const [q, setQ] = useState(filters.q ?? "")
  const [open, setOpen] = useState(false)
  const active = countActiveEntryFilters(filters)

  // Draft state for the filter panel; applied together.
  const [kind, setKind] = useState<string>(filters.kind ?? "")
  const [tagIds, setTagIds] = useState(filters.tagIds)
  const [purposes, setPurposes] = useState(filters.purposes)
  const [car, setCar] = useState<PickerOption | null>(
    filters.vehicleId ? { id: filters.vehicleId, label: filters.vehicleLabel ?? "Selected car" } : null
  )
  const [unlinked, setUnlinked] = useState(filters.unlinked)
  const [minAmount, setMinAmount] = useState(filters.minAmount?.toString() ?? "")
  const [maxAmount, setMaxAmount] = useState(filters.maxAmount?.toString() ?? "")
  const [showroomId, setShowroomId] = useState(filters.showroomId ?? "")

  function apply() {
    update({
      kind: kind || undefined,
      tagId: tagIds.join(",") || undefined,
      purpose: purposes.join(",") || undefined,
      vehicleId: car?.id,
      vehicleLabel: car?.label,
      unlinked: !car && unlinked ? "true" : undefined,
      minAmount: parseMoneyInput(minAmount) ?? undefined,
      maxAmount: parseMoneyInput(maxAmount) ?? undefined,
      showroomId: showroomId || undefined,
    })
    setOpen(false)
  }

  function reset() {
    setKind("")
    setTagIds([])
    setPurposes([])
    setCar(null)
    setUnlinked(false)
    setMinAmount("")
    setMaxAmount("")
    setShowroomId("")
    update({
      kind: undefined,
      tagId: undefined,
      purpose: undefined,
      vehicleId: undefined,
      vehicleLabel: undefined,
      unlinked: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      showroomId: undefined,
    })
    setOpen(false)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        {filters.vehicleId ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">Car:</span>
            <span className="font-medium">{filters.vehicleLabel ?? "Selected car"}</span>
            <span className="text-xs text-subtle-foreground">(all dates)</span>
            <button
              type="button"
              aria-label="Clear car"
              className="text-subtle-foreground hover:text-foreground"
              onClick={() => update({ vehicleId: undefined, vehicleLabel: undefined })}
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <DateRangeField
            value={{ from: filters.from, to: filters.to }}
            onChange={(r) => update({ from: r.from, to: r.to })}
            error={filters.rangeError}
          />
        )}
        {isPending && <Loader2 className="size-4 self-center animate-spin text-primary" aria-label="Loading" />}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="relative min-w-0 flex-1 basis-56"
          onSubmit={(e) => {
            e.preventDefault()
            update({ q: q.trim() || undefined })
          }}
        >
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle-foreground" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => q.trim() !== (filters.q ?? "") && update({ q: q.trim() || undefined })}
            placeholder="Search party, note or tag"
            aria-label="Search entries"
            className="pl-8"
            maxLength={100}
          />
        </form>
        <FilterSheet
          open={open}
          onOpenChange={setOpen}
          triggerClassName="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-medium hover:border-primary pointer-coarse:h-11"
          trigger={
            <>
              <SlidersHorizontal className="size-4" /> Filters
              {active > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-[11px] font-semibold text-primary">{active}</span>
              )}
            </>
          }
          popoverClassName="w-[24rem]"
          footer={
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={reset}>
                Reset
              </Button>
              <Button className="flex-1" onClick={apply}>
                Apply
              </Button>
            </div>
          }
        >
          <div className="space-y-1.5">
            <Label>Kind</Label>
            <SegmentedChoice
              value={kind}
              onValueChange={setKind}
              options={[
                { value: "", label: "All" },
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
              ]}
            />
          </div>
          {tags.length > 0 && (
            <div className="space-y-1.5">
              <Label>Tags (any)</Label>
              <ChipMultiSelect
                value={tagIds}
                onValueChange={setTagIds}
                options={tags.map((t) => ({ value: t.id, label: t.archived ? `${t.name} (archived)` : t.name }))}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Purpose</Label>
            <ChipMultiSelect
              value={purposes}
              onValueChange={setPurposes}
              options={PURPOSES.map((p) => ({ value: p, label: PURPOSE_LABELS[p] }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="filter-car">Car</Label>
            <VehiclePicker id="filter-car" value={car} onChange={(o) => {
              setCar(o)
              if (o) setUnlinked(false)
            }} />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Checkbox checked={unlinked} disabled={Boolean(car)} onCheckedChange={(v) => setUnlinked(v === true)} />
              Business only (no car)
            </label>
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <div className="grid grid-cols-2 gap-2">
              <MoneyInput aria-label="Minimum amount" placeholder="Min" value={minAmount} onValueChange={setMinAmount} />
              <MoneyInput aria-label="Maximum amount" placeholder="Max" value={maxAmount} onValueChange={setMaxAmount} />
            </div>
          </div>
          {showrooms.length > 1 && (
            <div className="space-y-1.5">
              <Label>Showroom</Label>
              <OptionSelect
                value={showroomId}
                onValueChange={setShowroomId}
                options={[{ value: "", label: "All showrooms" }, ...showrooms.map((s) => ({ value: s.id, label: s.name }))]}
              />
            </div>
          )}
        </FilterSheet>
        <div className="flex items-center gap-1.5">
          <ArrowUpDown aria-hidden className="size-4 text-subtle-foreground" />
          <OptionSelect
            aria-label="Sort"
            value={filters.sort}
            onValueChange={(sort) => update({ sort: sort === "date" ? undefined : sort })}
            options={SORT_OPTIONS}
            className="w-40"
          />
        </div>
      </div>
    </div>
  )
}
