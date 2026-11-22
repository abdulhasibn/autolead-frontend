"use client"

import * as React from "react"
import { cn } from "cn"

import { Input } from "@/components/ui/input"
import { formatIndianNumberText, reformatWithCaret } from "@/lib/indian-number"

interface NumericInputProps extends Omit<React.ComponentProps<"input">, "type" | "prefix"> {
  /** Allow one decimal point (money with paise). Default: whole numbers only. */
  allowDecimal?: boolean
  /** Shown inside the field on the left, e.g. "₹". */
  prefix?: React.ReactNode
}

/**
 * Number field that groups digits the Indian way while you type
 * ("650000" → "6,50,000"), keeping the caret where it was.
 *
 * Works both controlled (`value` + `onChange`) and with react-hook-form's
 * `register()`: the formatted text is written to the input before `onChange`
 * fires, so the form value is the grouped text. Strip commas when parsing
 * (`stripGrouping`, or the schemas' own `[,\s]` replace).
 */
export const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(function NumericInput(
  { allowDecimal = false, prefix, className, onChange, value, defaultValue, ...props },
  forwardedRef
) {
  const options = React.useMemo(() => ({ allowDecimal }), [allowDecimal])
  const innerRef = React.useRef<HTMLInputElement | null>(null)

  const setRef = React.useCallback(
    (el: HTMLInputElement | null) => {
      innerRef.current = el
      if (typeof forwardedRef === "function") forwardedRef(el)
      else if (forwardedRef) forwardedRef.current = el
    },
    [forwardedRef]
  )

  // Uncontrolled (register): defaultValues arrive as raw digits; group them for
  // display on mount. The schema strips commas either way.
  React.useEffect(() => {
    const el = innerRef.current
    if (!el || value !== undefined) return
    const next = formatIndianNumberText(el.value, options)
    if (next !== el.value) el.value = next
  }, [value, options])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target
    const { value: next, caret } = reformatWithCaret(el.value, el.selectionStart ?? el.value.length, options)
    if (next !== el.value) {
      el.value = next
      // Re-place the caret after React commits (controlled) or right away (uncontrolled).
      el.setSelectionRange(caret, caret)
      requestAnimationFrame(() => {
        if (document.activeElement === el) el.setSelectionRange(caret, caret)
      })
    }
    onChange?.(e)
  }

  const input = (
    <Input
      {...props}
      ref={setRef}
      type="text"
      inputMode={allowDecimal ? "decimal" : "numeric"}
      autoComplete="off"
      value={value === undefined ? undefined : formatIndianNumberText(String(value ?? ""), options)}
      defaultValue={
        defaultValue === undefined ? undefined : formatIndianNumberText(String(defaultValue), options)
      }
      onChange={handleChange}
      className={cn("font-mono-data", prefix != null && "pl-7", className)}
    />
  )

  if (prefix == null) return input
  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-subtle-foreground"
      >
        {prefix}
      </span>
      {input}
    </div>
  )
})
