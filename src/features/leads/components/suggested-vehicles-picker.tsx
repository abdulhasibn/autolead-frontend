"use client"

import { useEffect, useState } from "react"
import { Car, Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { NumberPlate } from "@/features/vehicles/components/number-plate"
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/features/vehicles/constants"
import { formatKm, variantLabel } from "@/features/vehicles/utils"
import { formatCurrency } from "@/lib/format"
import { cn } from "@/lib/utils"
import { suggestVehiclesAction } from "../actions"
import type { MatchLead } from "../match"
import { hasPreference } from "../preference"
import { leadPreferenceFormSchema, type CreateLeadFormInput, type SuggestVehiclesInput } from "../schemas"
import type { VehicleSuggestions } from "../types"
import { MatchBreakdownChips, MatchScorePill } from "./match-score-pill"

const INITIAL_SHOW = 3

type Draft =
  | { kind: "invalid" }
  | { kind: "empty" }
  | { kind: "ready"; payload: SuggestVehiclesInput; key: string }

/** Turns the form's raw inputs into the suggestions payload. */
function toDraft(values: Partial<CreateLeadFormInput>): Draft {
  const pref = leadPreferenceFormSchema.safeParse({
    preferredMakeId: values.preferredMakeId ?? "",
    preferredModelId: values.preferredModelId ?? "",
    preferredVariantId: values.preferredVariantId ?? "",
    preferredColours: values.preferredColours ?? [],
    preferredFuelTypes: values.preferredFuelTypes ?? [],
    preferredTransmissions: values.preferredTransmissions ?? [],
    preferredBodyTypes: values.preferredBodyTypes ?? [],
    preferredYearMin: values.preferredYearMin ?? "",
    preferredYearMax: values.preferredYearMax ?? "",
    preferredKmMax: values.preferredKmMax ?? "",
    preferredMaxOwners: values.preferredMaxOwners ?? "",
  })
  const rawBudget = (values.budget ?? "").trim()
  const budget = rawBudget === "" ? null : Number(rawBudget)
  if (!pref.success || (budget != null && !(Number.isFinite(budget) && budget >= 0))) {
    return { kind: "invalid" }
  }
  const preferredColours = pref.data.preferredColours
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean)
  const payload: SuggestVehiclesInput = { ...pref.data, preferredColours, budget }
  if (budget == null && !hasPreference(payload)) return { kind: "empty" }
  return { kind: "ready", payload, key: JSON.stringify(payload) }
}

type Result =
  | { key: string; ok: true; data: VehicleSuggestions }
  | { key: string; ok: false }

function Hint({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border/50 py-5 text-center">
      <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-accent">
        <Car className="size-4 text-primary" />
      </div>
      <p className="px-4 text-xs text-subtle-foreground">{children}</p>
      {action}
    </div>
  )
}

/**
 * Cars in stock scored against the budget and preferences entered so far.
 * Picking one fills the "Link a car in stock" field.
 */
export function SuggestedVehiclesPicker({
  values,
  selectedId,
  linkableIds,
  onSelect,
  onEditRequirements,
}: {
  values: Partial<CreateLeadFormInput>
  selectedId: string
  linkableIds: ReadonlySet<string>
  onSelect: (vehicleId: string) => void
  onEditRequirements: () => void
}) {
  const draft = toDraft(values)
  const key = draft.kind === "ready" ? draft.key : null
  const [result, setResult] = useState<Result | null>(null)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    if (draft.kind !== "ready") return
    let cancelled = false
    const requestKey = draft.key
    void suggestVehiclesAction(draft.payload).then((res) => {
      if (cancelled) return
      setResult(res.ok ? { key: requestKey, ok: true, data: res.data } : { key: requestKey, ok: false })
    })
    return () => {
      cancelled = true
    }
    // `key` captures the payload; `draft` is rebuilt every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const editLink = (
    <button
      type="button"
      onClick={onEditRequirements}
      className="mt-2 text-xs font-medium text-primary hover:underline"
    >
      Edit requirements
    </button>
  )

  let body: React.ReactNode
  let count: number | null = null

  if (draft.kind === "empty") {
    body = (
      <Hint action={editLink}>Add a budget or preferences to see matching cars.</Hint>
    )
  } else if (draft.kind === "invalid") {
    body = <Hint action={editLink}>Fix the requirements to see matching cars.</Hint>
  } else if (!result || result.key !== draft.key) {
    body = (
      <ul
        className="divide-y divide-border rounded-lg border border-border/50"
        aria-busy="true"
        aria-label="Finding matching cars"
      >
        {Array.from({ length: 3 }, (_, i) => (
          <li key={i} className="flex items-start gap-3 px-3 py-3">
            <Skeleton className="h-6 w-14 shrink-0 rounded-full bg-accent" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-48 max-w-full rounded bg-border" />
              <Skeleton className="h-3 w-56 max-w-full rounded bg-muted" />
            </div>
            <Skeleton className="h-7 w-16 shrink-0 rounded-md bg-muted max-sm:hidden" />
          </li>
        ))}
      </ul>
    )
  } else if (!result.ok) {
    body = <Hint>Could not load suggestions. You can still pick a car below.</Hint>
  } else if (result.data.suggestions.length === 0) {
    count = 0
    body = <Hint action={editLink}>No cars in stock match closely enough.</Hint>
  } else {
    const { suggestions, truncated } = result.data
    count = suggestions.length
    const visible = showAll ? suggestions : suggestions.slice(0, INITIAL_SHOW)
    const hiddenCount = suggestions.length - INITIAL_SHOW
    const lead: MatchLead = {
      ...draft.payload,
      // The form only holds ids; chips fall back to labels without names.
      preferredMakeName: null,
      preferredModelName: null,
      preferredVariantName: null,
    }

    body = (
      <>
        <ul className="divide-y divide-border rounded-lg border border-border/50 text-sm">
          {visible.map(({ vehicle, match }) => {
            const title = [vehicle.makeName, vehicle.modelName, variantLabel(vehicle.variantName)]
              .filter(Boolean)
              .join(" ")
            const summary = [
              FUEL_TYPE_LABELS[vehicle.fuelType] ?? vehicle.fuelType,
              TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission,
              `${formatKm(vehicle.kmDriven)} km`,
              vehicle.listedPrice != null ? formatCurrency(vehicle.listedPrice) : null,
            ]
              .filter(Boolean)
              .join(" · ")
            const selected = selectedId === vehicle.id
            const linkable = linkableIds.has(vehicle.id)

            return (
              <li
                key={vehicle.id}
                className={cn(
                  "flex flex-wrap items-start gap-3 px-3 py-3 sm:flex-nowrap",
                  selected && "bg-accent/60"
                )}
              >
                <MatchScorePill match={match} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-foreground">
                      {title} ({vehicle.year})
                    </span>
                    <NumberPlate registration={vehicle.registrationNumber} />
                  </div>
                  {summary && <p className="truncate text-xs text-subtle-foreground">{summary}</p>}
                  {match && <MatchBreakdownChips match={match} lead={lead} vehicle={vehicle} />}
                </div>
                <div className="ml-[68px] sm:ml-0">
                  <button
                    type="button"
                    disabled={!linkable}
                    title={linkable ? undefined : "This car can't be linked right now"}
                    aria-pressed={selected}
                    onClick={() => onSelect(selected ? "" : vehicle.id)}
                    className={cn(
                      "inline-flex h-7 shrink-0 items-center gap-1 rounded-md border px-2.5 text-[0.8rem] font-medium transition-colors pointer-coarse:h-9 disabled:cursor-not-allowed disabled:opacity-50",
                      selected
                        ? "border-primary bg-primary text-white hover:bg-primary/90"
                        : "border-border bg-card text-foreground hover:border-primary/20 hover:bg-accent hover:text-primary"
                    )}
                  >
                    {selected && <Check aria-hidden className="size-3.5" />}
                    {selected ? "Selected" : "Select"}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border/50 py-2 text-xs font-medium text-subtle-foreground transition-colors hover:border-border hover:text-foreground"
          >
            {showAll ? (
              <>
                <ChevronUp className="size-3.5" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="size-3.5" />
                Show {hiddenCount} more
              </>
            )}
          </button>
        )}
        {truncated && (
          <p className="text-xs text-subtle-foreground">
            Only the newest 1,000 cars were checked for suggestions.
          </p>
        )}
      </>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Sparkles aria-hidden className="size-3 text-primary" />
        Suggested cars
        {count != null && <span className="font-mono-data text-xs text-subtle-foreground">{count}</span>}
      </h4>
      {body}
    </div>
  )
}
