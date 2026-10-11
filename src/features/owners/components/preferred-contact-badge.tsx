import type { PreferredContactMethod } from "../types"

const LABELS: Record<PreferredContactMethod, string> = {
  phone: "Phone",
  email: "Email",
  whatsapp: "WhatsApp",
}

export function PreferredContactBadge({
  method,
}: {
  method: PreferredContactMethod | null
}) {
  if (!method) return <span className="text-subtle-foreground">—</span>
  return (
    <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
      {LABELS[method]}
    </span>
  )
}
