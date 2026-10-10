"use client"

import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarPlus } from "lucide-react"
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
import { useApiError } from "@/hooks/use-api-error"
import { scheduleFollowUpAction } from "../actions"
import {
  scheduleFollowUpFormSchema,
  type ScheduleFollowUpFormInput,
  type ScheduleFollowUpInput,
} from "../schemas"
import { FollowUpFields } from "./follow-up-fields"

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
      <DialogTrigger
        render={<Button variant="outline" disabled={disabled} className="border-[#E5E7EB] bg-white text-[#374151] hover:border-[#CCFBF1] hover:bg-[#F0FDFA] hover:text-[#0D9488]" />}
      >
        <CalendarPlus />
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
          <Controller
            control={control}
            name="scheduledAt"
            render={({ field: scheduledAt }) => (
              <Controller
                control={control}
                name="taskType"
                render={({ field: taskType }) => (
                  <FollowUpFields
                    idPrefix="schedule"
                    scheduledAt={{ value: scheduledAt.value, onChange: scheduledAt.onChange }}
                    notes={register("notes")}
                    taskType={taskType.value}
                    onTaskTypeChange={taskType.onChange}
                    errors={{
                      scheduledAt: errors.scheduledAt?.message,
                      taskType: errors.taskType?.message,
                    }}
                  />
                )}
              />
            )}
          />
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
