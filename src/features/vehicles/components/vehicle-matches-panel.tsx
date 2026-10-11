import Link from "next/link"
import { ChevronRight, Plus, Sparkles, Users2 } from "lucide-react"
import { LeadStatusBadge } from "@/features/leads/components/lead-status-badge"
import {
  MatchBreakdownChips,
  MatchScorePill,
} from "@/features/leads/components/match-score-pill"
import { formatPreferredCatalog } from "@/features/leads/preference"
import type { LeadWithMatch, MatchableVehicle, VehicleLeadMatches } from "@/features/leads/types"
import { formatCurrency } from "@/lib/format"
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "../constants"
import { formatKm } from "../utils"
import { LinkSuggestedLeadButton } from "./link-suggested-lead-button"

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

function EmptyRow({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-border/50 py-6 text-center">
      <div className="mb-2 flex size-8 items-center justify-center rounded-full bg-accent">
        <Users2 className="size-4 text-primary" />
      </div>
      <p className="text-xs text-subtle-foreground">{message}</p>
    </div>
  )
}

function LeadRow({
  lead,
  vehicle,
  action,
}: {
  lead: LeadWithMatch
  vehicle: MatchableVehicle
  action: React.ReactNode
}) {
  const wants = formatPreferredCatalog(lead) ?? lead.preferredVehicle
  const summary = lead.match
    ? [
        wants && `Wants ${wants}`,
        lead.budget != null && `Budget ${formatCurrency(lead.budget)}`,
      ].filter(Boolean)
    : ["No preference recorded"]

  return (
    <li className="flex flex-wrap items-start gap-3 px-3 py-3 sm:flex-nowrap">
      <MatchScorePill match={lead.match} />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/leads/${lead.id}`}
            className="truncate font-medium text-foreground hover:text-primary hover:underline"
          >
            {lead.contactFullName}
          </Link>
          <LeadStatusBadge status={lead.status} />
        </div>
        {summary.length > 0 && (
          <p className="truncate text-xs text-subtle-foreground">{summary.join(" · ")}</p>
        )}
        {lead.match && <MatchBreakdownChips match={lead.match} lead={lead} vehicle={vehicle} />}
      </div>
      <div className="ml-[68px] sm:ml-0">{action}</div>
    </li>
  )
}

/**
 * Leads linked to this car scored against it, plus open leads worth calling.
 * Scores are computed per request, so the panel is always current.
 */
export function VehicleMatchesPanel({
  matches,
  canLink,
}: {
  matches: VehicleLeadMatches
  /** Only open or linked cars take new leads. */
  canLink: boolean
}) {
  const { vehicle, linked, suggested, truncated } = matches
  const facts = [
    FUEL_TYPE_LABELS[vehicle.fuelType] ?? vehicle.fuelType,
    TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission,
    `${formatKm(vehicle.kmDriven)} km`,
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-card/50 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Scored against</span>
        <span>{facts.join(" · ")}</span>
        <span aria-hidden className="text-subtle-foreground">·</span>
        {vehicle.listedPrice == null ? (
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            Not priced yet: budget can&rsquo;t be checked
          </span>
        ) : (
          <span className="font-mono-data font-semibold text-foreground">
            {formatCurrency(vehicle.listedPrice)}
          </span>
        )}
      </div>

      <section className="space-y-2">
        <SectionHeading count={linked.length}>Linked to this car</SectionHeading>
        {linked.length === 0 ? (
          <EmptyRow message="No leads are linked to this car yet." />
        ) : (
          <ul className="divide-y divide-[#F3F4F6] rounded-lg border border-border/50 text-sm">
            {linked.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                vehicle={vehicle}
                action={
                  lead.match ? (
                    <Link href={`/leads/${lead.id}`} className={actionClass}>
                      Open lead
                      <ChevronRight aria-hidden className="size-3.5" />
                    </Link>
                  ) : (
                    <Link href={`/leads/${lead.id}`} className={actionClass}>
                      <Plus aria-hidden className="size-3.5" />
                      Add preference
                    </Link>
                  )
                }
              />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <SectionHeading count={suggested.length}>
          <Sparkles aria-hidden className="size-3 text-primary" />
          Suggested leads
        </SectionHeading>
        {suggested.length === 0 ? (
          <EmptyRow message="No open leads match this car closely enough yet." />
        ) : (
          <ul className="divide-y divide-[#F3F4F6] rounded-lg border border-border/50 text-sm">
            {suggested.map((lead) => (
              <LeadRow
                key={lead.id}
                lead={lead}
                vehicle={vehicle}
                action={
                  canLink ? (
                    <LinkSuggestedLeadButton
                      leadId={lead.id}
                      leadName={lead.contactFullName}
                      vehicleId={vehicle.id}
                    />
                  ) : (
                    <Link href={`/leads/${lead.id}`} className={actionClass}>
                      Open lead
                      <ChevronRight aria-hidden className="size-3.5" />
                    </Link>
                  )
                }
              />
            ))}
          </ul>
        )}
        {truncated && (
          <p className="text-xs text-subtle-foreground">
            Only the newest 1,000 open leads were checked for suggestions.
          </p>
        )}
      </section>
    </div>
  )
}
