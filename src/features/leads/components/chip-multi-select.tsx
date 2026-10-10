"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
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
  function toggle(option: T) {
    onValueChange(
      value.includes(option)
        ? value.filter((v) => v !== option)
        : // Keep the option order stable regardless of click order.
          options.map((o) => o.value).filter((v) => v === option || value.includes(v))
    )
  }

  return (
    <div id={id} role="group" aria-label={ariaLabel} className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const selected = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled || option.disabled}
            onClick={() => toggle(option.value)}
            className={cn(
              "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#0D9488]/40 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
              selected
                ? "border-[#CCFBF1] bg-[#F0FDFA] text-[#0D9488]"
                : "border-[#E5E7EB] bg-white text-[#374151] hover:border-[#CCFBF1] hover:text-[#0D9488]"
            )}
          >
            {selected && <Check aria-hidden className="size-3" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
