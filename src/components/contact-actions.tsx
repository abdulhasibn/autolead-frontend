import { Mail, MessageCircle, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

const PILL =
  "inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-accent px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/15"

/** wa.me wants the number in international format with digits only. */
function whatsappHref(phone: string) {
  return `https://wa.me/${phone.replace(/\D/g, "")}`
}

/**
 * One-tap Call / WhatsApp / Email for a contact. `compact` is a single call
 * icon for list rows; it sits above a row's stretched link (`relative z-10`).
 */
export function ContactActions({
  phone,
  email,
  name,
  compact,
  className,
}: {
  phone: string
  email?: string | null
  name: string
  compact?: boolean
  className?: string
}) {
  if (compact) {
    return (
      <a
        href={`tel:${phone}`}
        aria-label={`Call ${name}`}
        className={cn(
          "relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent text-primary transition-colors hover:bg-primary/15",
          className
        )}
      >
        <Phone className="size-4" />
      </a>
    )
  }

  return (
    <div className={cn("grid grid-cols-3 gap-2", !email && "grid-cols-2", className)}>
      <a href={`tel:${phone}`} aria-label={`Call ${name}`} className={PILL}>
        <Phone className="size-4" />
        Call
      </a>
      <a
        href={whatsappHref(phone)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`WhatsApp ${name}`}
        className={PILL}
      >
        <MessageCircle className="size-4" />
        WhatsApp
      </a>
      {email && (
        <a href={`mailto:${email}`} aria-label={`Email ${name}`} className={PILL}>
          <Mail className="size-4" />
          Email
        </a>
      )}
    </div>
  )
}
