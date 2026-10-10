"use client"

import type { UseFormRegisterReturn } from "react-hook-form"
import { DateTimePicker } from "@/components/ui/date-picker"
import { Textarea } from "@/components/ui/textarea"
import { FOLLOW_UP_TASK_TYPES, FOLLOW_UP_TASK_TYPE_LABELS } from "../constants"
import type { FollowUpTaskType } from "../types"
import { FormField } from "./form-field"
import { OptionSelect } from "./option-select"

const TASK_TYPE_OPTIONS = FOLLOW_UP_TASK_TYPES.map((t) => ({
  value: t,
  label: FOLLOW_UP_TASK_TYPE_LABELS[t],
}))

interface FollowUpFieldsProps {
  /** Keeps ids unique when two sets of fields share a page. */
  idPrefix: string
  /** `yyyy-MM-ddTHH:mm` local time, as `<input type="datetime-local">` gives. */
  scheduledAt: { value: string; onChange: (value: string) => void }
  notes: UseFormRegisterReturn
  taskType: FollowUpTaskType
  onTaskTypeChange: (value: FollowUpTaskType) => void
  errors: {
    scheduledAt?: string
    taskType?: string
  }
}

/** When, what and notes for a follow-up; shared by schedule and complete. */
export function FollowUpFields({
  idPrefix,
  scheduledAt,
  notes,
  taskType,
  onTaskTypeChange,
  errors,
}: FollowUpFieldsProps) {
  return (
    <>
      <FormField id={`${idPrefix}-scheduledAt`} label="Date and time" error={errors.scheduledAt}>
        <DateTimePicker
          id={`${idPrefix}-scheduledAt`}
          value={scheduledAt.value}
          onChange={scheduledAt.onChange}
          invalid={!!errors.scheduledAt}
        />
      </FormField>
      <FormField id={`${idPrefix}-taskType`} label="Task" error={errors.taskType}>
        <OptionSelect
          id={`${idPrefix}-taskType`}
          value={taskType}
          onValueChange={(value) => onTaskTypeChange(value as FollowUpTaskType)}
          options={TASK_TYPE_OPTIONS}
          invalid={!!errors.taskType}
        />
      </FormField>
      <FormField id={`${idPrefix}-notes`} label="Notes">
        <Textarea id={`${idPrefix}-notes`} rows={3} {...notes} />
      </FormField>
    </>
  )
}
