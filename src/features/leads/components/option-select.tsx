"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface OptionSelectProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: readonly SelectOption[]
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

/** Single-value select over a flat option list; "" means nothing selected. */
export function OptionSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  invalid,
  disabled,
  className,
  "aria-label": ariaLabel,
}: OptionSelectProps) {
  const items = Object.fromEntries(options.map((o) => [o.value, o.label]))

  return (
    <Select
      id={id}
      items={items}
      value={value === "" ? null : value}
      onValueChange={(next) => onValueChange(typeof next === "string" ? next : "")}
      disabled={disabled}
    >
      <SelectTrigger
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        className={cn("w-full", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
