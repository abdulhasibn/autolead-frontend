"use client"

import { cn } from "@/lib/utils"
import type { SelectOption } from "./option-select"

interface SegmentedChoiceProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  "aria-label"?: string
}

/** One-of-few choice shown inline, for short option lists like Yes / No. */
export function SegmentedChoice({
  id,
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel,
}: SegmentedChoiceProps) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex w-full rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-0.5"
    >
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "h-7 flex-1 rounded-md px-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#0D9488]/40 focus-visible:outline-none",
              selected
                ? "bg-white text-[#0D9488] shadow-sm ring-1 ring-[#CCFBF1]"
                : "text-[#6B7280] hover:text-[#111827]"
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
