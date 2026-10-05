"use client"

import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useApiError } from "@/hooks/use-api-error"
import { scheduleFollowUpAction } from "../actions"
import { FOLLOW_UP_TASK_TYPES, FOLLOW_UP_TASK_TYPE_LABELS } from "../constants"
import {
  scheduleFollowUpFormSchema,
  type ScheduleFollowUpFormInput,
  type ScheduleFollowUpInput,
} from "../schemas"
import { FormField } from "./form-field"
import { OptionSelect } from "./option-select"

const TASK_TYPE_OPTIONS = FOLLOW_UP_TASK_TYPES.map((t) => ({
  value: t,
  label: FOLLOW_UP_TASK_TYPE_LABELS[t],
}))

const DEFAULT_VALUES: ScheduleFollowUpFormInput = {
  scheduledAt: "",
  taskType: "call",
  notes: "",
}

export function ScheduleFollowUpDialog({
  leadId,
  disabled,
}: {
  leadId: string
  disabled?: boolean
}) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleFollowUpFormInput, unknown, ScheduleFollowUpInput>({
    resolver: zodResolver(scheduleFollowUpFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  function onSubmit(values: ScheduleFollowUpInput) {
    startTransition(async () => {
      const result = await scheduleFollowUpAction(leadId, values)
      if (!result.ok) {
        handleError(result.error, "Could not schedule the follow-up.")
        return
      }
      toast.success("Follow-up scheduled.")
      reset(DEFAULT_VALUES)
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) reset(DEFAULT_VALUES)
      }}
    >
      <DialogTrigger render={<Button variant="outline" disabled={disabled} />}>
        Schedule follow-up
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule follow-up</DialogTitle>
          <DialogDescription>
            The lead&apos;s assignee is reminded when it&apos;s due.
          </DialogDescription>
        </DialogHeader>
        <form
          id="follow-up-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField id="scheduledAt" label="Date and time" error={errors.scheduledAt?.message}>
            <Input
              id="scheduledAt"
              type="datetime-local"
              aria-invalid={!!errors.scheduledAt}
              {...register("scheduledAt")}
            />
          </FormField>
          <FormField id="taskType" label="Task" error={errors.taskType?.message}>
            <Controller
              control={control}
              name="taskType"
              render={({ field }) => (
                <OptionSelect
                  id="taskType"
                  value={field.value}
                  onValueChange={field.onChange}
                  options={TASK_TYPE_OPTIONS}
                  invalid={!!errors.taskType}
                />
              )}
            />
          </FormField>
          <FormField id="follow-up-notes" label="Notes">
            <Textarea id="follow-up-notes" rows={3} {...register("notes")} />
          </FormField>
        </form>
        <DialogFooter>
          <Button type="submit" form="follow-up-form" disabled={isPending}>
            {isPending ? "Scheduling…" : "Schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
