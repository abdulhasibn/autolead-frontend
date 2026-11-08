"use client"

import { Input } from "@/components/ui/input"
import { formatMoneyInput, parseMoneyInput } from "../logic/money"

interface MoneyInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: string
  onValueChange: (value: string) => void
}

/**
 * Text field for rupees that accepts Indian formatting ("5,45,000"). Keeps the
 * raw text while typing and tidies the grouping on blur; parse with
 * `parseMoneyInput` when submitting.
 */
export function MoneyInput({ value, onValueChange, onBlur, placeholder = "e.g. 5,45,000", ...props }: MoneyInputProps) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-subtle-foreground">
        ₹
      </span>
      <Input
        {...props}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={placeholder}
        className="pl-7 font-mono-data"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={(e) => {
          const n = parseMoneyInput(value)
          if (n !== null) onValueChange(formatMoneyInput(n))
          onBlur?.(e)
        }}
      />
    </div>
  )
}
