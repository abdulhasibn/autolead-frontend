"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  COLOUR_SUGGESTIONS,
  PREFERRED_COLOUR_MAX_LENGTH,
  PREFERRED_COLOURS_MAX,
} from "../constants"
import { capitalize } from "../preference"

interface ColourTagsInputProps {
  id?: string
  value: string[]
  onValueChange: (value: string[]) => void
  invalid?: boolean
}

/**
 * Free-text colour tags. Stored lower-cased like the API does, so "Pearl
 * White" and "pearl white" are the same tag.
 */
export function ColourTagsInput({ id, value, onValueChange, invalid }: ColourTagsInputProps) {
  const [draft, setDraft] = useState("")
  const full = value.length >= PREFERRED_COLOURS_MAX

  function add(raw: string) {
    const colour = raw.trim().toLowerCase().slice(0, PREFERRED_COLOUR_MAX_LENGTH)
    if (!colour || full || value.includes(colour)) return
    onValueChange([...value, colour])
  }

  function commitDraft() {
    for (const part of draft.split(",")) add(part)
    setDraft("")
  }

  const suggestions = COLOUR_SUGGESTIONS.filter((c) => !value.includes(c))

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Preferred colours">
          {value.map((colour) => (
            <li
              key={colour}
              className="inline-flex h-7 items-center gap-1 rounded-full border border-[#CCFBF1] bg-[#F0FDFA] pr-1 pl-2.5 text-xs font-medium text-[#0D9488]"
            >
              {capitalize(colour)}
              <button
                type="button"
                onClick={() => onValueChange(value.filter((c) => c !== colour))}
                aria-label={`Remove ${colour}`}
                className="flex size-5 items-center justify-center rounded-full hover:bg-[#CCFBF1]"
              >
                <X aria-hidden className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        value={draft}
        maxLength={PREFERRED_COLOUR_MAX_LENGTH * 2}
        placeholder={full ? `Up to ${PREFERRED_COLOURS_MAX} colours` : "Type a colour and press Enter"}
        disabled={full}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          const next = e.target.value
          if (next.includes(",")) {
            const parts = next.split(",")
            parts.slice(0, -1).forEach(add)
            setDraft(parts.at(-1) ?? "")
          } else {
            setDraft(next)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commitDraft()
          } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
            onValueChange(value.slice(0, -1))
          }
        }}
        onBlur={commitDraft}
      />
      {suggestions.length > 0 && !full && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((colour) => (
            <button
              key={colour}
              type="button"
              onClick={() => add(colour)}
              className="inline-flex h-6 items-center gap-0.5 rounded-full border border-dashed border-[#E5E7EB] px-2 text-[11px] font-medium text-[#6B7280] transition-colors hover:border-[#CCFBF1] hover:bg-[#F0FDFA] hover:text-[#0D9488]"
            >
              <Plus aria-hidden className="size-3" />
              {capitalize(colour)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
