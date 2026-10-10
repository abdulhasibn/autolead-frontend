"use client"

import * as React from "react"
import { addDays, format, isValid, parse, startOfDay } from "date-fns"
import { CalendarDays, CalendarClock } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

/** Same string shapes as `<input type="date">` / `type="datetime-local">`. */
const DATE_FORMAT = "yyyy-MM-dd"
const DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm"
const TIME_FORMAT = "HH:mm"

/** Bookable times: every 15 minutes from 06:00 to 22:00. */
const TIME_SLOTS = Array.from({ length: (22 - 6) * 4 + 1 }, (_, i) => {
  const minutes = 6 * 60 + i * 15
  const value = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`
  return { value, label: format(parse(value, TIME_FORMAT, new Date()), "h:mm a") }
})

function parseValue(value: string, pattern: string): Date | undefined {
  if (!value) return undefined
  const date = parse(value, pattern, new Date())
  return isValid(date) ? date : undefined
}

interface TriggerProps extends React.ComponentProps<"button"> {
  icon: React.ElementType
  label: string | null
  placeholder: string
  invalid?: boolean
}

/** Looks like the app's Input so pickers sit naturally in forms. */
function PickerTrigger({ icon: Icon, label, placeholder, invalid, className, ...props }: TriggerProps) {
  return (
    <button
      type="button"
      data-invalid={invalid || undefined}
      className={cn(
        "flex h-8 w-full min-w-0 items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-left text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 data-popup-open:border-ring md:text-sm",
        className
      )}
      {...props}
    >
      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <span className={cn("flex-1 truncate", label === null && "text-muted-foreground")}>
        {label ?? placeholder}
      </span>
    </button>
  )
}

interface DatePickerProps {
  id?: string
  /** `yyyy-MM-dd`, or "" for no date. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  /** Days before this are not selectable. */
  minDate?: Date
  className?: string
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date",
  invalid,
  disabled,
  minDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseValue(value, DATE_FORMAT)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <PickerTrigger
            id={id}
            icon={CalendarDays}
            label={selected ? format(selected, "d MMM yyyy") : null}
            placeholder={placeholder}
            invalid={invalid}
            className={className}
          />
        }
      />
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={minDate ? { before: startOfDay(minDate) } : undefined}
          onSelect={(date) => {
            onChange(date ? format(date, DATE_FORMAT) : "")
            setOpen(false)
          }}
        />
        {value && (
          <div className="border-t border-border p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

interface DateTimePickerProps {
  id?: string
  /** `yyyy-MM-ddTHH:mm` in local time, or "" for none. */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  invalid?: boolean
  disabled?: boolean
  /** Days before this are not selectable; defaults to today. */
  minDate?: Date
  className?: string
}

const DEFAULT_TIME = "10:00"

export function DateTimePicker({
  id,
  value,
  onChange,
  placeholder = "Pick a date and time",
  invalid,
  disabled,
  minDate,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = parseValue(value, DATE_TIME_FORMAT)
  const time = selected ? format(selected, TIME_FORMAT) : DEFAULT_TIME
  // Keep an off-grid time (e.g. 10:07 from older data) selectable.
  const timeSlots = TIME_SLOTS.some((slot) => slot.value === time)
    ? TIME_SLOTS
    : [...TIME_SLOTS, { value: time, label: format(parse(time, TIME_FORMAT, new Date()), "h:mm a") }]

  function emit(day: Date, hhmm: string) {
    onChange(`${format(day, DATE_FORMAT)}T${hhmm}`)
  }

  const today = startOfDay(new Date())
  const presets = [
    { label: "Tomorrow", day: addDays(today, 1) },
    { label: "In 3 days", day: addDays(today, 3) },
    { label: "Next week", day: addDays(today, 7) },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <PickerTrigger
            id={id}
            icon={CalendarClock}
            label={selected ? format(selected, "EEE, d MMM yyyy · h:mm a") : null}
            placeholder={placeholder}
            invalid={invalid}
            className={className}
          />
        }
      />
      <PopoverContent className="w-auto p-0">
        <div className="flex gap-1.5 border-b border-border p-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              type="button"
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => emit(preset.day, time)}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={{ before: startOfDay(minDate ?? today) }}
          onSelect={(date) => date && emit(date, time)}
        />
        <div className="flex items-center gap-2 border-t border-border p-2">
          <span className="text-xs font-medium text-muted-foreground">Time</span>
          <Select
            items={Object.fromEntries(timeSlots.map((slot) => [slot.value, slot.label]))}
            value={time}
            onValueChange={(next) => {
              if (typeof next === "string") emit(selected ?? today, next)
            }}
          >
            <SelectTrigger aria-label="Time" className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((slot) => (
                <SelectItem key={slot.value} value={slot.value}>
                  {slot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" size="sm" onClick={() => setOpen(false)} disabled={!selected}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
