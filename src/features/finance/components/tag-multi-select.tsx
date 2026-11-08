"use client"

import { ChipMultiSelect } from "@/features/leads/components/chip-multi-select"
import type { FinanceTag } from "../types"

/** Tag picker: archived tags are hidden unless already on the entry; max 10. */
export function TagMultiSelect({
  id,
  tags,
  value,
  onValueChange,
  max = 10,
}: {
  id?: string
  tags: FinanceTag[]
  value: string[]
  onValueChange: (value: string[]) => void
  max?: number
}) {
  const visible = tags.filter((t) => !t.archived || value.includes(t.id))
  const full = value.length >= max
  return (
    <ChipMultiSelect
      id={id}
      aria-label="Tags"
      value={value}
      onValueChange={onValueChange}
      options={visible.map((t) => ({
        value: t.id,
        label: t.archived ? `${t.name} (archived)` : t.name,
        disabled: (full && !value.includes(t.id)) || (t.archived && !value.includes(t.id)),
      }))}
    />
  )
}
