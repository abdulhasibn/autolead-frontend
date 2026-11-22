"use client"

import { History, Save } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { formatDraftAge, type DraftControls } from "@/hooks/use-form-draft"

/** "Draft from 12 min ago restored · Discard" — shown when a form reopens with saved input. */
export function DraftBanner({ draft, className }: { draft: DraftControls; className?: string }) {
  if (draft.restoredAt == null) return null
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-primary/25 bg-accent/60 px-3 py-2 text-xs text-foreground",
        className
      )}
    >
      <History aria-hidden className="size-3.5 shrink-0 text-primary" />
      <span className="flex-1">Draft from {formatDraftAge(draft.restoredAt)} restored</span>
      <button
        type="button"
        onClick={draft.discard}
        className="min-h-8 rounded-md px-2 font-medium text-primary underline-offset-2 hover:underline"
      >
        Discard
      </button>
    </div>
  )
}

/** Footer button: keeps what's typed and closes the form. */
export function SaveDraftButton({
  draft,
  onSaved,
  className,
  disabled,
}: {
  draft: DraftControls
  onSaved: () => void
  className?: string
  disabled?: boolean
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      className={cn("gap-1.5", className)}
      onClick={async () => {
        await draft.saveNow()
        toast.success("Draft saved. Pick up where you left off any time.")
        onSaved()
      }}
    >
      <Save aria-hidden className="size-4" />
      <span className="max-sm:sr-only">Save draft</span>
    </Button>
  )
}

/** Small dot on an "Add …" button when a draft is waiting. */
export function DraftDot({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span
      aria-label="Draft saved"
      title="Draft saved"
      className="ml-0.5 inline-block size-2 rounded-full bg-amber-400 ring-2 ring-background"
    />
  )
}
