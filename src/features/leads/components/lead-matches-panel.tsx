import Link from "next/link"
import { Car, ChevronRight, Sparkles } from "lucide-react"
import { NumberPlate } from "@/features/vehicles/components/number-plate"
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/features/vehicles/constants"
import { formatKm } from "@/features/vehicles/utils"
import { formatCurrency } from "@/lib/format"
import { hasPreference } from "../preference"
import type { LeadReadModel, LeadVehicleMatches, VehicleWithMatch } from "../types"
import { LinkSuggestedVehicleButton } from "./link-suggested-vehicle-button"
import {
  MatchBreakdownChips,
  MatchScorePill,
} from "./match-score-pill"

const actionClass =
  "inline-flex h-7 shrink-0 items-center gap-1 rounded-md border border-border bg-card px-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:border-primary/20 hover:bg-accent hover:text-primary"

function SectionHeading({ children, count }: { children: React.ReactNode; count: number }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">
      {children}
      <span className="font-mono-data text-xs normal-case">{count}</span>
    </h3>
  )
}

function EmptyRow({ message, hint }: { message: string; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border/50 py-6 text-center">
      <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-accent">
        <Car className="size-4 text-primary" />
      </div>
      <p className="text-xs text-subtle-foreground">{message}</p>
      {hint && <p className="mt-1 text-xs text-subtle-foreground">{hint}</p>}
    </div>
  )
}

function VehicleRow({
  entry,
  lead,
  action,
}: {
  entry: VehicleWithMatch
  lead: LeadReadModel
  action: React.ReactNode
}) {
  const { vehicle, match } = entry
  const title = [vehicle.makeName, vehicle.modelName, vehicle.variantName]
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

  return (
    <li className="flex flex-wrap items-start gap-3 px-3 py-3 sm:flex-nowrap">
      <MatchScorePill match={match} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/vehicles/${vehicle.id}`}
            className="truncate font-medium text-foreground hover:text-primary hover:underline"
          >
            {title} ({vehicle.year})
          </Link>
          <NumberPlate registration={vehicle.registrationNumber} />
        </div>
        {summary && <p className="truncate text-xs text-subtle-foreground">{summary}</p>}
        {match && <MatchBreakdownChips match={match} lead={lead} vehicle={vehicle} />}
      </div>
      <div className="ml-[68px] sm:ml-0">{action}</div>
    </li>
  )
}

/**
 * Cars from this showroom scored against the lead's preferences, plus the lead's linked car.
 * Scores are computed per request, so the panel is always current.
 */
export function LeadMatchesPanel({
  lead,
  matches,
  canLink,
}: {
  lead: LeadReadModel
  matches: LeadVehicleMatches
  /** Only show Link action when the lead is open and has no car yet. */
  canLink: boolean
}) {
  const { linked, suggested, truncated } = matches
  const noPref = !hasPreference(lead)

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <SectionHeading count={linked ? 1 : 0}>Linked car</SectionHeading>
        {linked ? (
          <ul className="divide-y divide-[#F3F4F6] rounded-lg border border-border/50 text-sm">
            <VehicleRow
              entry={linked}
              lead={lead}
              action={
                <Link href={`/vehicles/${linked.vehicle.id}`} className={actionClass}>
                  Open car
                  <ChevronRight aria-hidden className="size-3.5" />
                </Link>
              }
            />
          </ul>
        ) : (
          <EmptyRow message="No car is linked to this lead yet." />
        )}
      </section>

      <section className="space-y-2">
        <SectionHeading count={suggested.length}>
          <Sparkles aria-hidden className="size-3 text-primary" />
          Suggested cars
        </SectionHeading>
        {suggested.length === 0 ? (
          noPref ? (
            <EmptyRow
              message="Add buyer preferences to see matching cars."
              hint="Edit the buyer preference above to enable suggestions."
            />
          ) : (
            <EmptyRow message="No cars in this showroom match closely enough yet." />
          )
        ) : (
          <ul className="divide-y divide-[#F3F4F6] rounded-lg border border-border/50 text-sm">
            {suggested.map((entry) => {
              const vehicleName =
                [entry.vehicle.makeName, entry.vehicle.modelName].filter(Boolean).join(" ") ||
                "This car"
              return (
                <VehicleRow
                  key={entry.vehicle.id}
                  entry={entry}
                  lead={lead}
                  action={
                    canLink ? (
                      <LinkSuggestedVehicleButton
                        leadId={lead.id}
                        vehicleId={entry.vehicle.id}
                        vehicleName={vehicleName}
                      />
                    ) : (
                      <Link href={`/vehicles/${entry.vehicle.id}`} className={actionClass}>
                        Open car
                        <ChevronRight aria-hidden className="size-3.5" />
                      </Link>
                    )
                  }
                />
              )
            })}
          </ul>
        )}
        {truncated && (
          <p className="text-xs text-subtle-foreground">
            Only the newest 1,000 cars in this showroom were checked for suggestions.
          </p>
        )}
      </section>
    </div>
  )
}
