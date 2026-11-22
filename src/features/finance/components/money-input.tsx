"use client"

import { NumericInput } from "@/components/ui/numeric-input"

interface MoneyInputProps
  extends Omit<React.ComponentProps<typeof NumericInput>, "value" | "onChange" | "prefix" | "allowDecimal"> {
  value: string
  onValueChange: (value: string) => void
}

/**
 * Text field for rupees that groups digits the Indian way while you type
 * ("545000" → "5,45,000"); parse with `parseMoneyInput` when submitting.
 */
export function MoneyInput({ value, onValueChange, placeholder = "e.g. 5,45,000", ...props }: MoneyInputProps) {
  return (
    <NumericInput
      {...props}
      prefix="₹"
      allowDecimal
      placeholder={placeholder}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
    />
  )
}
