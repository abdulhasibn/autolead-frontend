"use client"

import { DatePicker, pastDateYears } from "@/components/ui/date-picker"
import { OptionSelect } from "@/components/option-select"
import { presetRange, RANGE_PRESET_LABELS, type DateRange, type RangePreset } from "../logic/dates"

const PRESETS = Object.keys(RANGE_PRESET_LABELS) as RangePreset[]

/** From/to pickers plus quick presets. `error` shows inline (e.g. DATE_RANGE_TOO_LONG). */
export function DateRangeField({
  value,
  onChange,
  error,
  disabled,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
  error?: string | null
  disabled?: boolean
}) {
  const matched = PRESETS.find((p) => {
    const r = presetRange(p)
    return r.from === value.from && r.to === value.to
  })
  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        <OptionSelect
          aria-label="Date range preset"
          value={matched ?? ""}
          onValueChange={(p) => p && onChange(presetRange(p as RangePreset))}
          placeholder="Custom range"
          className="w-auto min-w-40"
          disabled={disabled}
          options={PRESETS.map((p) => ({ value: p, label: RANGE_PRESET_LABELS[p] }))}
        />
        <div className="flex items-center gap-1.5">
          <DatePicker {...pastDateYears()}
            value={value.from}
            onChange={(from) => from && onChange({ ...value, from })}
            invalid={Boolean(error)}
            disabled={disabled}
            className="w-36"
          />
          <span className="text-xs text-subtle-foreground">to</span>
          <DatePicker {...pastDateYears()}
            value={value.to}
            onChange={(to) => to && onChange({ ...value, to })}
            invalid={Boolean(error)}
            disabled={disabled}
            className="w-36"
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
