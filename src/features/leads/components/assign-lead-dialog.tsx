"use client"

import { useState, useTransition } from "react"
import { UserRoundCheck } from "lucide-react"
import { toast } from "sonner"
import { OptionSelect } from "@/components/option-select"
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
import { assignLeadAction, getAssignableStaffAction } from "../actions"
import { FormField } from "./form-field"

// Not "": the select treats an empty value as "nothing picked", so it can't be chosen.
const UNASSIGNED = "unassigned"

type Staff = { id: string; fullName: string; roles: string[] }

/**
 * Admin: gives a lead to a staff member, or takes it back (#21). The new
 * assignee gets a notification; a salesperson only sees leads assigned to them.
 */
export function AssignLeadDialog({
  leadId,
  assignedTo,
  assignedToName,
  disabled,
}: {
  leadId: string
  assignedTo: string | null
  assignedToName: string | null
  disabled?: boolean
}) {
  const { handleError } = useApiError()
  const [open, setOpen] = useState(false)
  const [staff, setStaff] = useState<Staff[] | null>(null)
  const [choice, setChoice] = useState(assignedTo ?? UNASSIGNED)
  const [isLoading, startLoading] = useTransition()
  const [isPending, startTransition] = useTransition()

  function load() {
    startLoading(async () => {
      const result = await getAssignableStaffAction()
      if (!result.ok) {
        handleError(result.error, "Could not load the staff list.")
        return
      }
      setStaff(result.data)
    })
  }

  const options = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...(staff ?? []).map((s) => ({
      value: s.id,
      label: s.roles.includes("admin") ? `${s.fullName} · Admin` : s.fullName,
    })),
  ]
  // Keep the current assignee visible while the list loads (or if they left).
  if (assignedTo && !options.some((o) => o.value === assignedTo)) {
    options.push({ value: assignedTo, label: assignedToName ?? "Current assignee" })
  }

  function save() {
    startTransition(async () => {
      const assignee = choice === UNASSIGNED ? null : choice
      const result = await assignLeadAction(leadId, { assignedTo: assignee })
      if (!result.ok) {
        handleError(result.error, "Could not assign the lead.")
        return
      }
      const name = options.find((o) => o.value === choice)?.label.replace(" · Admin", "")
      toast.success(assignee ? `Assigned to ${name}.` : "Lead unassigned.")
      setOpen(false)
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isPending) return
        if (next) {
          setChoice(assignedTo ?? UNASSIGNED)
          // Load once: reloading on every open re-renders the picker mid-click.
          if (staff === null) load()
        }
        setOpen(next)
      }}
    >
      <DialogTrigger
        disabled={disabled || isPending}
        render={
          <Button
            variant="outline"
            className="border-border bg-card text-foreground hover:border-primary/20 hover:bg-accent hover:text-primary max-sm:flex-none!"
          />
        }
      >
        <UserRoundCheck />
        <span className="max-sm:sr-only">{assignedTo ? "Reassign" : "Assign"}</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign lead</DialogTitle>
          <DialogDescription>
            The person you pick is notified. Salespeople only see the leads assigned to them.
          </DialogDescription>
        </DialogHeader>
        <FormField id="assignee" label="Assigned to">
          <OptionSelect
            id="assignee"
            value={choice}
            onValueChange={setChoice}
            options={options}
            disabled={isLoading && staff === null}
            placeholder={isLoading ? "Loading staff…" : "Unassigned"}
          />
        </FormField>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={save} disabled={isPending || choice === (assignedTo ?? UNASSIGNED)}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
