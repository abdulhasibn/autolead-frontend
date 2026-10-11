import { SlidersHorizontal } from "lucide-react"
import { Detail, InfoCard } from "@/components/info-card"
import type { MakeReadModel } from "@/features/catalog/types"
import { FUEL_TYPE_LABELS, TRANSMISSION_LABELS } from "@/features/vehicles/constants"
import { formatKm } from "@/features/vehicles/utils"
import { formatCurrency } from "@/lib/format"
import { BODY_TYPE_LABELS } from "../constants"
import {
  capitalize,
  formatMaxOwners,
  formatPreferredCatalog,
  formatYearWindow,
  hasPreference,
} from "../preference"
import type { LeadPreference, LeadReadModel } from "../types"
import { EditPreferenceDialog } from "./edit-preference-dialog"

const ANY = <span className="text-subtle-foreground">Any</span>

function Chips({ values }: { values: string[] }) {
  if (values.length === 0) return ANY
  return (
    <span className="flex flex-wrap gap-1">
      {values.map((value) => (
        <span
          key={value}
          className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-primary"
        >
          {value}
        </span>
      ))}
    </span>
  )
}

function preferenceOf(lead: LeadReadModel): LeadPreference {
  return {
    preferredMakeId: lead.preferredMakeId,
    preferredModelId: lead.preferredModelId,
    preferredVariantId: lead.preferredVariantId,
    preferredColours: lead.preferredColours ?? [],
    preferredFuelTypes: lead.preferredFuelTypes ?? [],
    preferredTransmissions: lead.preferredTransmissions ?? [],
    preferredBodyTypes: lead.preferredBodyTypes ?? [],
    preferredYearMin: lead.preferredYearMin ?? null,
    preferredYearMax: lead.preferredYearMax ?? null,
    preferredKmMax: lead.preferredKmMax ?? null,
    preferredMaxOwners: lead.preferredMaxOwners ?? null,
  }
}

/** The lead's structured buyer preference, with an edit dialog. */
export function LeadPreferenceCard({
  lead,
  makes,
  closed,
  className,
}: {
  lead: LeadReadModel
  makes: MakeReadModel[]
  closed: boolean
  className?: string
}) {
  const preference = preferenceOf(lead)
  const empty = !hasPreference(preference)
  const catalog = formatPreferredCatalog(lead)
  const years = formatYearWindow(preference.preferredYearMin, preference.preferredYearMax)
  const owners = formatMaxOwners(preference.preferredMaxOwners)

  return (
    <InfoCard
      title="Buyer preference"
      icon={SlidersHorizontal}
      className={className}
      action={
        <EditPreferenceDialog
          leadId={lead.id}
          preference={preference}
          selectedNames={{ model: lead.preferredModelName, variant: lead.preferredVariantName }}
          makes={makes}
          isEmpty={empty}
          disabled={closed}
        />
      }
    >
      {empty && (
        <p className="mb-4 rounded-lg bg-card/50 px-3 py-2 text-xs text-muted-foreground">
          No preference recorded yet. Add one so cars can be scored against what this buyer
          wants.
        </p>
      )}
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Make / model">{catalog ?? ANY}</Detail>
        <Detail label="Max budget">
          {lead.budget == null ? (
            ANY
          ) : (
            <span className="font-mono-data font-semibold">{formatCurrency(lead.budget)}</span>
          )}
        </Detail>
        <Detail label="Year">{years ?? ANY}</Detail>
        <Detail label="Max km driven">
          {preference.preferredKmMax == null ? (
            ANY
          ) : (
            <span className="font-mono-data">≤ {formatKm(preference.preferredKmMax)} km</span>
          )}
        </Detail>
        <Detail label="Fuel">
          <Chips values={preference.preferredFuelTypes.map((v) => FUEL_TYPE_LABELS[v] ?? v)} />
        </Detail>
        <Detail label="Transmission">
          <Chips values={preference.preferredTransmissions.map((v) => TRANSMISSION_LABELS[v] ?? v)} />
        </Detail>
        <Detail label="Body type">
          <Chips values={preference.preferredBodyTypes.map((v) => BODY_TYPE_LABELS[v] ?? v)} />
        </Detail>
        <Detail label="Colours">
          <Chips values={preference.preferredColours.map(capitalize)} />
        </Detail>
        <Detail label="Previous owners">{owners ?? ANY}</Detail>
      </dl>
    </InfoCard>
  )
}
