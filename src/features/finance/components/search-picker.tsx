"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { ActionResult } from "@/lib/action-result"
import { cn } from "@/lib/utils"

export interface PickerOption {
  id: string
  label: string
  detail?: string
}

interface SearchPickerProps {
  id?: string
  value: PickerOption | null
  onChange: (option: PickerOption | null) => void
  search: (query: string) => Promise<ActionResult<PickerOption[]>>
  placeholder: string
  emptyLabel?: string
  invalid?: boolean
  disabled?: boolean
  clearable?: boolean
}

/** Debounced server-side search in a popover; used for the car and lead pickers. */
export function SearchPicker({
  id,
  value,
  onChange,
  search,
  placeholder,
  emptyLabel = "No matches",
  invalid,
  disabled,
  clearable = true,
}: SearchPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [options, setOptions] = useState<PickerOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    if (!open) return
    const current = ++requestId.current
    const timer = setTimeout(async () => {
      setLoading(true)
      const result = await search(query)
      if (current !== requestId.current) return
      setLoading(false)
      if (result.ok) {
        setOptions(result.data)
        setError(null)
      } else {
        setOptions([])
        setError(result.error.message)
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [open, query, search])

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled}
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              aria-invalid={invalid || undefined}
              className={cn(
                "h-9 min-w-0 flex-1 justify-between border-border bg-card font-normal",
                !value && "text-subtle-foreground"
              )}
            />
          }
        >
          <span className="truncate">{value ? value.label : placeholder}</span>
          <ChevronsUpDown aria-hidden className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] p-2">
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-subtle-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="pl-8"
              aria-label="Search"
            />
          </div>
          <ul role="listbox" className="mt-2 max-h-64 overflow-y-auto">
            {loading && (
              <li className="flex items-center gap-2 px-2 py-3 text-xs text-subtle-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Searching…
              </li>
            )}
            {!loading && error && <li className="px-2 py-3 text-xs text-destructive">{error}</li>}
            {!loading && !error && options.length === 0 && (
              <li className="px-2 py-3 text-xs text-subtle-foreground">{emptyLabel}</li>
            )}
            {!loading &&
              options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value?.id === option.id}
                    onClick={() => {
                      onChange(option)
                      setOpen(false)
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted pointer-coarse:min-h-11"
                  >
                    <Check aria-hidden className={cn("size-4 shrink-0 text-primary", value?.id !== option.id && "invisible")} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{option.label}</span>
                      {option.detail && <span className="block truncate text-xs text-subtle-foreground">{option.detail}</span>}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled && (
        <Button type="button" variant="ghost" size="icon" aria-label="Clear" onClick={() => onChange(null)}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  )
}
