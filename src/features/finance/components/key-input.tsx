"use client"

import { Input } from "@/components/ui/input"

/**
 * A key field. Not a password input (people paste and compare these), but
 * nothing the browser could remember or suggest: no autocomplete, spellcheck
 * or autocapitalise. Its value only ever lives in component state.
 */
export function KeyInput(props: Omit<React.ComponentProps<typeof Input>, "type">) {
  return (
    <Input
      {...props}
      type="text"
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="characters"
      spellCheck={false}
      data-1p-ignore
      data-lpignore="true"
      data-form-type="other"
      className="font-mono-data tracking-wide uppercase placeholder:normal-case placeholder:tracking-normal"
    />
  )
}
