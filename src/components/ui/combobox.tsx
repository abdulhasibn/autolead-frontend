"use client"

import * as React from "react"
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox"
import { cn } from "cn"
import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react"

import { popupFrame } from "@/components/ui/popup-frame"
import { selectItemClassName, selectTriggerClassName } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-media-query"

export interface SearchableOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SearchableSelectProps {
  id?: string
  /** "" for nothing selected. */
  value: string
  onValueChange: (value: string) => void
  options: readonly SearchableOption[]
  placeholder?: string
  /** Heading of the phone bottom sheet; falls back to the placeholder. */
  title?: string
  invalid?: boolean
  disabled?: boolean
  className?: string
  "aria-label"?: string
}

/** Case- and accent-insensitive "contains" match. */
export function matchesQuery(label: string, query: string): boolean {
  const normalise = (text: string) =>
    text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim()
  return normalise(label).includes(normalise(query))
}

/**
 * A select with a search box, for long option lists (makes, models, cars).
 * Desktop: a popup under the field. Phones: a bottom sheet with the search on top.
 */
export function SearchableSelect(props: SearchableSelectProps) {
  const isMobile = useIsMobile()
  return isMobile ? <SheetSelect {...props} /> : <PopupSelect {...props} />
}

function TriggerContent({ label, placeholder }: { label: string | undefined; placeholder: string }) {
  return (
    <>
      <span data-slot="select-value" className={cn("flex-1 truncate text-left", !label && "text-muted-foreground")}>
        {label ?? placeholder}
      </span>
      <ChevronDownIcon aria-hidden className="pointer-events-none size-4 text-muted-foreground" />
    </>
  )
}

function PopupSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  invalid,
  disabled,
  className,
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const selected = options.find((o) => o.value === value) ?? null

  return (
    <ComboboxPrimitive.Root<SearchableOption>
      items={options as SearchableOption[]}
      value={selected}
      onValueChange={(next) => onValueChange(next?.value ?? "")}
      itemToStringLabel={(o) => o.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
      filter={(o, query) => matchesQuery(o.label, query)}
      autoHighlight
      disabled={disabled}
    >
      <ComboboxPrimitive.Trigger
        id={id}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        className={cn(selectTriggerClassName, "h-8 w-full pointer-coarse:h-10", className)}
      >
        <TriggerContent label={selected?.label} placeholder={placeholder} />
      </ComboboxPrimitive.Trigger>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner align="start" sideOffset={4} className="isolate z-50">
          <ComboboxPrimitive.Popup
            aria-label={ariaLabel ?? placeholder}
            className={cn(
              popupFrame,
              "flex max-h-[min(22rem,var(--available-height))] w-(--anchor-width) min-w-36 origin-(--transform-origin) flex-col overflow-hidden duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
          >
            <div className="relative border-b border-border p-1.5">
              <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <ComboboxPrimitive.Input
                placeholder="Search…"
                className="h-8 w-full rounded-md bg-transparent pr-2 pl-8 text-base outline-none placeholder:text-muted-foreground md:text-sm"
              />
            </div>
            <ComboboxPrimitive.Empty className="px-3 py-4 text-sm text-muted-foreground empty:hidden">
              No matches
            </ComboboxPrimitive.Empty>
            <ComboboxPrimitive.List className="flex-1 overflow-y-auto overscroll-contain p-1 empty:hidden">
              {(option: SearchableOption) => (
                <ComboboxPrimitive.Item
                  key={option.value}
                  value={option}
                  disabled={option.disabled}
                  className={selectItemClassName}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  <ComboboxPrimitive.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon />
                  </ComboboxPrimitive.ItemIndicator>
                </ComboboxPrimitive.Item>
              )}
            </ComboboxPrimitive.List>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  )
}

function SheetSelect({
  id,
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  title,
  invalid,
  disabled,
  className,
  "aria-label": ariaLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const selected = options.find((o) => o.value === value)
  const visible = query ? options.filter((o) => matchesQuery(o.label, query)) : options

  function choose(option: SearchableOption) {
    onValueChange(option.value)
    setOpen(false)
  }

  return (
    <>
      <button
        id={id}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          selectTriggerClassName,
          "h-8 w-full pointer-coarse:h-10",
          invalid && "border-destructive ring-3 ring-destructive/20",
          className
        )}
      >
        <TriggerContent label={selected?.label} placeholder={placeholder} />
      </button>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery("")
        }}
      >
        <SheetContent side="bottom" className="h-[80dvh] gap-0 p-0">
          <SheetHeader className="border-b border-border/50 px-4 py-3">
            <SheetTitle className="text-base font-semibold">{title ?? ariaLabel ?? placeholder}</SheetTitle>
          </SheetHeader>
          <div className="relative border-b border-border/50 p-3">
            <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-6 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              aria-label="Search"
              enterKeyHint="search"
              className="h-10 w-full rounded-lg border border-input bg-transparent pr-3 pl-9 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
          <ul role="listbox" aria-label={title ?? ariaLabel ?? placeholder} className="flex-1 overflow-y-auto overscroll-contain p-2">
            {visible.length === 0 && <li className="px-3 py-4 text-sm text-muted-foreground">No matches</li>}
            {visible.map((option) => {
              const isSelected = option.value === value
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    onClick={() => choose(option)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-base hover:bg-muted active:bg-muted disabled:opacity-50",
                      isSelected && "font-medium text-primary"
                    )}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    {isSelected && <CheckIcon aria-hidden className="size-4 shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </SheetContent>
      </Sheet>
    </>
  )
}
