import Link from "next/link"
import { MapPin } from "lucide-react"
import { ContactActions } from "@/components/contact-actions"
import type { OwnerDto } from "../types"
import { PreferredContactBadge } from "./preferred-contact-badge"

/** Phone layout of the owners table: one tappable card per owner with a call shortcut. */
export function OwnersCardList({ owners }: { owners: OwnerDto[] }) {
  return (
    <ul className="space-y-2">
      {owners.map((owner) => (
        <li
          key={owner.id}
          className="relative flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-colors active:bg-muted/60"
        >
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent text-sm font-semibold text-primary"
          >
            {owner.fullName.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            {/* Stretched link: the whole card opens the owner. */}
            <Link
              href={`/owners/${owner.id}`}
              className="block truncate text-[15px] font-semibold text-foreground after:absolute after:inset-0 after:rounded-xl"
            >
              {owner.fullName}
            </Link>
            <p className="truncate text-xs text-subtle-foreground">{owner.phone}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {owner.city && (
                <span className="flex min-w-0 items-center gap-1">
                  <MapPin aria-hidden className="size-3.5 shrink-0 text-subtle-foreground" />
                  <span className="truncate">{owner.city}</span>
                </span>
              )}
              {owner.preferredContactMethod && (
                <PreferredContactBadge method={owner.preferredContactMethod} />
              )}
            </div>
          </div>
          <ContactActions compact phone={owner.phone} name={owner.fullName} />
        </li>
      ))}
    </ul>
  )
}
