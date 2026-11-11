"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { COLOUR_SUGGESTIONS } from "@/features/leads/constants"
import { capitalize } from "@/features/leads/preference"

const MAX_LENGTH = 40

interface ColourPickerProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  invalid?: boolean
}

/**
 * A vehicle's single colour, picked the same way a lead's preferred colours
 * are: one tap on a common colour, or type any other and press Enter.
 */
export function ColourPicker({ id, value, onValueChange, onBlur, invalid }: ColourPickerProps) {
  const [draft, setDraft] = useState("")

  function commit(raw: string) {
    const colour = raw.trim().replace(/\s+/g, " ").slice(0, MAX_LENGTH)
    if (colour) onValueChange(capitalize(colour))
    setDraft("")
  }

  if (value) {
    return (
      <div className="flex min-h-9 items-center">
        <span className="inline-flex h-7 items-center gap-1 rounded-full border border-primary/20 bg-accent pr-1 pl-2.5 text-xs font-medium text-primary">
          {value}
          <button
            type="button"
            onClick={() => onValueChange("")}
            aria-label={`Change colour from ${value}`}
            className="flex size-5 items-center justify-center rounded-full hover:bg-accent"
          >
            <X aria-hidden className="size-3" />
          </button>
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Input
        id={id}
        value={draft}
        maxLength={MAX_LENGTH}
        placeholder="Type a colour and press Enter"
        enterKeyHint="done"
        aria-invalid={invalid || undefined}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commit(draft)
          }
        }}
        onBlur={() => {
          commit(draft)
          onBlur?.()
        }}
      />
      <div className="flex flex-wrap gap-1.5">
        {COLOUR_SUGGESTIONS.map((colour) => (
          <button
            key={colour}
            type="button"
            onClick={() => commit(colour)}
            className="inline-flex h-6 items-center gap-0.5 rounded-full border border-dashed border-border px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/20 hover:bg-accent hover:text-primary pointer-coarse:h-8 pointer-coarse:px-3 pointer-coarse:text-xs"
          >
            <Plus aria-hidden className="size-3" />
            {capitalize(colour)}
          </button>
        ))}
      </div>
    </div>
  )
}
