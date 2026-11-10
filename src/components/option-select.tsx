"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/combobox"
import { cn } from "@/lib/utils"

/** Lists longer than this get a search box. */
export const SEARCH_THRESHOLD = 8

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
  /** Force the search box on (true) or off (false); default: on for long lists. */
  searchable?: boolean
  /** Heading of the phone bottom sheet when searchable. */
  title?: string
}

/**
 * Single-value select over a flat option list; "" means nothing selected.
 * Lists longer than `SEARCH_THRESHOLD` become a searchable select.
 */
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
  searchable,
  title,
}: OptionSelectProps) {
  if (searchable ?? options.length > SEARCH_THRESHOLD) {
    return (
      <SearchableSelect
        id={id}
        value={value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder}
        title={title}
        invalid={invalid}
        disabled={disabled}
        className={className}
        aria-label={ariaLabel}
      />
    )
  }

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
