"use client"

import { Check } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { SelectOption } from "./option-select"

interface ChipMultiSelectProps<T extends string> {
  id?: string
  value: readonly T[]
  onValueChange: (value: T[]) => void
  options: readonly (SelectOption & { value: T })[]
  disabled?: boolean
  "aria-label"?: string
}

/** Toggle chips over a fixed option list; none selected means "any". */
export function ChipMultiSelect<T extends string>({
  id,
  value,
  onValueChange,
  options,
  disabled,
  "aria-label": ariaLabel,
}: ChipMultiSelectProps<T>) {
  return (
    <ToggleGroup
      id={id}
      multiple
      variant="chip"
      size="sm"
      spacing={1.5}
      aria-label={ariaLabel}
      disabled={disabled}
      className="w-full flex-wrap"
      value={[...value]}
      onValueChange={(next: string[]) =>
        // Keep the option order stable regardless of click order.
        onValueChange(options.map((o) => o.value).filter((v) => next.includes(v)))
      }
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          className="text-xs"
        >
          {value.includes(option.value) && <Check aria-hidden className="size-3" />}
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
