"use client"

import { useCallback } from "react"
import { searchLeadsAction, searchVehiclesAction } from "../actions"
import { SearchPicker, type PickerOption } from "./search-picker"

type PickerProps = Omit<React.ComponentProps<typeof SearchPicker>, "search" | "placeholder"> & { placeholder?: string }

export function VehiclePicker({ placeholder = "Search cars by name or registration", ...props }: PickerProps) {
  const search = useCallback(async (q: string) => {
    const r = await searchVehiclesAction(q)
    return r.ok ? { ok: true as const, data: r.data.map((v): PickerOption => ({ id: v.id, label: v.label })) } : r
  }, [])
  return <SearchPicker {...props} search={search} placeholder={placeholder} emptyLabel="No cars found" />
}

export function LeadPicker({ placeholder = "Search leads by name or phone", ...props }: PickerProps) {
  const search = useCallback(async (q: string) => {
    const r = await searchLeadsAction(q)
    return r.ok
      ? { ok: true as const, data: r.data.map((l): PickerOption => ({ id: l.id, label: l.name, detail: l.phone })) }
      : r
  }, [])
  return <SearchPicker {...props} search={search} placeholder={placeholder} emptyLabel="No leads found" clearable={false} />
}
