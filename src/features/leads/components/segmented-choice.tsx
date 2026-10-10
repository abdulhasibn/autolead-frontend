"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { SelectOption } from "./option-select"

interface SegmentedChoiceProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  "aria-label"?: string
}

// Toggle values must be non-empty; options may use "" (e.g. "Unknown").
const EMPTY = "__empty__"
const encode = (value: string) => (value === "" ? EMPTY : value)
const decode = (value: string) => (value === EMPTY ? "" : value)

/** One-of-few choice shown inline, for short option lists like Yes / No. */
export function SegmentedChoice({
  id,
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
}: SegmentedChoiceProps) {
  return (
    <ToggleGroup
      id={id}
      variant="segment"
      size="sm"
      spacing={0.5}
      aria-label={ariaLabel}
      className="w-full rounded-lg border border-input bg-muted/50 p-0.5"
      value={[encode(value)]}
      onValueChange={(next: string[]) => {
        // A segmented control always has one choice; ignore deselecting it.
        const [selected] = next
        if (selected !== undefined) onValueChange(decode(selected))
      }}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={encode(option.value)} className="text-xs">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
