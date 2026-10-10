import { cn } from "@/lib/utils"
import { MATCH_OUTCOME_CLASSES, matchScoreOutcome } from "../constants"
import { matchChip } from "../match"
import type { LeadMatch, LeadReadModel, MatchableVehicle } from "../types"

/** Match % in the lead-status palette; "No pref." when the lead has none. */
export function MatchScorePill({ match, className }: { match: LeadMatch | null; className?: string }) {
  if (!match) {
    return (
      <span
        className={cn(
          "flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold",
          MATCH_OUTCOME_CLASSES.unknown,
          className
        )}
        title="No preference recorded"
      >
        No pref.
      </span>
    )
  }
  return (
    <span
      className={cn(
        "font-mono-data flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-base font-bold",
        MATCH_OUTCOME_CLASSES[matchScoreOutcome(match.score)],
        className
      )}
      title={`Scored on ${match.evaluatedCriteria} ${match.evaluatedCriteria === 1 ? "criterion" : "criteria"}`}
    >
      {match.score}%
    </span>
  )
}

/** One pill per scored criterion; hover shows "wanted vs has". */
export function MatchBreakdownChips({
  match,
  lead,
  vehicle,
}: {
  match: LeadMatch
  lead: LeadReadModel
  vehicle: MatchableVehicle
}) {
  if (match.breakdown.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Match breakdown">
      {match.breakdown.map((entry) => {
        const chip = matchChip(entry, lead, vehicle)
        return (
          <li
            key={entry.criterion}
            title={chip.detail ?? undefined}
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
              MATCH_OUTCOME_CLASSES[entry.outcome] ?? MATCH_OUTCOME_CLASSES.unknown
            )}
          >
            {chip.label}
          </li>
        )
      })}
    </ul>
  )
}
