import Link from "next/link"
import { Globe } from "lucide-react"
import { Detail, InfoCard } from "@/components/info-card"
import { formatDateTime } from "@/lib/format"
import { cn } from "@/lib/utils"
import { channelLabel, formatCount, formatLakh, hasAttribution, INTENT_PILLS } from "../format"
import type { LeadJourney } from "../types"

/**
 * How this buyer found and browsed the website, for the salesperson going into a negotiation.
 * Renders nothing for leads the website never saw (walk-ins, phone).
 */
export function WebsiteJourneyCard({ journey, className }: { journey: LeadJourney | null; className?: string }) {
  if (!hasAttribution(journey)) return null

  const intent = journey.intent ? INTENT_PILLS[journey.intent] : null
  const ad = journey.campaign ? [journey.campaign, journey.content].filter(Boolean).join(" · ") : null

  return (
    <InfoCard
      title="Website journey"
      icon={Globe}
      className={className}
      action={
        intent && (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
              intent.className
            )}
          >
            {intent.label}
          </span>
        )
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Detail label="Came from">{channelLabel(journey.channel)}</Detail>
          <Detail label="Ad">{ad ?? <span className="text-subtle-foreground">—</span>}</Detail>
          <Detail label="First visit">{formatDateTime(journey.firstVisitAt)}</Detail>
          <Detail label="Visits">
            <span className="font-mono-data">{formatCount(journey.visits)}</span>
          </Detail>
          <Detail label="Views of this car">
            <span className="font-mono-data">{formatCount(journey.viewsOfThisCar)}</span>
          </Detail>
          <Detail label="Gallery opens">
            <span className="font-mono-data">{formatCount(journey.galleryOpens)}</span>
          </Detail>
        </dl>

        <div className="space-y-1.5">
          <p className="text-[11px] font-medium tracking-wide text-subtle-foreground uppercase">Also looked at</p>
          {journey.otherCarsViewed.length > 0 ? (
            <ul className="divide-y divide-muted rounded-lg border border-border">
              {journey.otherCarsViewed.map((car) => (
                <li key={car.vehicleId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <Link
                    href={`/vehicles/${car.vehicleId}`}
                    className="min-w-0 truncate text-primary hover:text-primary/80 hover:underline"
                  >
                    {car.title}
                  </Link>
                  <span className="font-mono-data shrink-0 text-xs text-muted-foreground">
                    {formatLakh(car.listedPrice)} · {car.views}×
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-subtle-foreground">Only this car.</p>
          )}
        </div>
      </div>
    </InfoCard>
  )
}
