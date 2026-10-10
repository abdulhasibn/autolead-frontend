"use client"

import { useState, useTransition } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Check } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { useApiError } from "@/hooks/use-api-error"
import { cn } from "@/lib/utils"
import { completeFollowUpAction } from "../actions"
import { FOLLOW_UP_OUTCOMES, FOLLOW_UP_OUTCOME_LABELS } from "../constants"
import {
  completeFollowUpFormSchema,
  type CompleteFollowUpFormInput,
  type CompleteFollowUpInput,
} from "../schemas"
import { FollowUpFields } from "./follow-up-fields"
import { FormField } from "./form-field"
import { OptionSelect } from "./option-select"

const OUTCOME_OPTIONS = FOLLOW_UP_OUTCOMES.map((o) => ({
  value: o,
  label: FOLLOW_UP_OUTCOME_LABELS[o],
}))

const DEFAULT_VALUES: CompleteFollowUpFormInput = {
  outcome: "reached",
  notes: "",
  scheduleNext: false,
  next: { scheduledAt: "", taskType: "call", notes: "" },
}

/** Outcomes that usually mean another follow-up is needed. */
const SUGGESTS_NEXT = new Set(["no_answer", "rescheduled"])

export function CompleteFollowUpDialog({
  leadId,
  followUpId,
  compact = false,
}: {
  leadId: string
  followUpId: string
  /** Icon-only trigger, for tight list rows. */
  compact?: boolean
}) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CompleteFollowUpFormInput, unknown, CompleteFollowUpInput>({
    resolver: zodResolver(completeFollowUpFormSchema),
    defaultValues: DEFAULT_VALUES,
  })
  const scheduleNext = useWatch({ control, name: "scheduleNext" })

  function onSubmit(values: CompleteFollowUpInput) {
    startTransition(async () => {
      const result = await completeFollowUpAction(leadId, followUpId, values)
      if (!result.ok) {
        handleError(result.error, "Could not complete the follow-up.")
        return
      }
      toast.success(
        result.data.next ? "Follow-up done. Next one scheduled." : "Follow-up done."
      )
      reset(DEFAULT_VALUES)
      setOpen(false)
    })
  }

  const formId = `complete-follow-up-${followUpId}`

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset(DEFAULT_VALUES)
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            aria-label={compact ? "Mark follow-up done" : undefined}
            title={compact ? "Mark done" : undefined}
            className={cn(
              "h-7 border-[#CCFBF1] bg-[#F0FDFA] text-xs text-[#0D9488] hover:bg-[#CCFBF1] hover:text-[#0F766E]",
              compact ? "w-7 px-0" : "px-2"
            )}
          />
        }
      >
        <Check />
        {!compact && "Done"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Complete follow-up</DialogTitle>
          <DialogDescription>
            Record how it went. Its reminder is cleared.
          </DialogDescription>
        </DialogHeader>
        <form
          id={formId}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField id={`${formId}-outcome`} label="Outcome" error={errors.outcome?.message}>
            <Controller
              control={control}
              name="outcome"
              render={({ field }) => (
                <OptionSelect
                  id={`${formId}-outcome`}
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value)
                    if (SUGGESTS_NEXT.has(value)) setValue("scheduleNext", true)
                  }}
                  options={OUTCOME_OPTIONS}
                  invalid={!!errors.outcome}
                />
              )}
            />
          </FormField>
          <FormField id={`${formId}-notes`} label="Notes">
            <Textarea id={`${formId}-notes`} rows={3} {...register("notes")} />
          </FormField>

          <Controller
            control={control}
            name="scheduleNext"
            render={({ field }) => (
              <Field orientation="horizontal">
                <Checkbox
                  id={`${formId}-schedule-next`}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <FieldLabel htmlFor={`${formId}-schedule-next`} className="font-medium">
                  Schedule the next follow-up
                </FieldLabel>
              </Field>
            )}
          />

          {scheduleNext && (
            <div className="space-y-4 rounded-lg border border-[#F3F4F6] bg-[#F9FAFB] p-3">
              <Controller
                control={control}
                name="next.scheduledAt"
                render={({ field: scheduledAt }) => (
                  <Controller
                    control={control}
                    name="next.taskType"
                    render={({ field: taskType }) => (
                      <FollowUpFields
                        idPrefix={`${formId}-next`}
                        scheduledAt={{ value: scheduledAt.value, onChange: scheduledAt.onChange }}
                        notes={register("next.notes")}
                        taskType={taskType.value}
                        onTaskTypeChange={taskType.onChange}
                        errors={{
                          scheduledAt: errors.next?.scheduledAt?.message,
                          taskType: errors.next?.taskType?.message,
                        }}
                      />
                    )}
                  />
                )}
              />
            </div>
          )}
        </form>
        <DialogFooter>
          <Button type="submit" form={formId} disabled={isPending}>
            {isPending ? "Saving…" : "Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
