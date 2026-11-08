"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Minus, Plus } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Button } from "@/components/ui/button"
import { deleteEntryAction } from "../../actions"
import { financeErrorMessage } from "../../logic/errors"
import { formatMoney } from "../../logic/money"
import type { EntryKind, FinanceEntry, FinanceTag, FinanceVehicleRef, ShowroomOption } from "../../types"
import { EntrySheet } from "../entry-sheet"
import { EntryList } from "./entry-list"

interface EntriesPanelProps {
  entries: FinanceEntry[]
  tags: FinanceTag[]
  showrooms: ShowroomOption[]
  /** Fixed car (a car's Money tab): prefilled on new entries, picker hidden. */
  vehicle?: FinanceVehicleRef
  /** Render the add buttons here (car tab) instead of via `AddEntryButtons`. */
  showAddButtons?: boolean
  emptyMessage: string
  footer?: React.ReactNode
}

/** Entries list plus the add/edit sheet and delete confirmation. */
export function EntriesPanel({ entries, tags, showrooms, vehicle, showAddButtons, emptyMessage, footer }: EntriesPanelProps) {
  const router = useRouter()
  const [sheet, setSheet] = useState<{ open: boolean; entry: FinanceEntry | null; kind: EntryKind }>({
    open: false,
    entry: null,
    kind: "expense",
  })
  const [deleting, setDeleting] = useState<FinanceEntry | null>(null)
  const [isPending, startTransition] = useTransition()

  function confirmDelete() {
    if (!deleting) return
    const target = deleting
    startTransition(async () => {
      const result = await deleteEntryAction(target.id, target.vehicle?.id ?? null)
      if (!result.ok) {
        toast.error(financeErrorMessage(result.error))
        return
      }
      toast.success(`Deleted ${target.kind} of ${formatMoney(target.amount)}.`)
      setDeleting(null)
      router.refresh()
    })
  }

  return (
    <>
      {showAddButtons && (
        <div className="flex flex-wrap gap-2 px-4 pt-4 sm:px-0 sm:pt-0">
          <Button variant="outline" onClick={() => setSheet({ open: true, entry: null, kind: "expense" })}>
            <Minus /> Add expense
          </Button>
          <Button variant="outline" onClick={() => setSheet({ open: true, entry: null, kind: "income" })}>
            <Plus /> Add income
          </Button>
        </div>
      )}
      {entries.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-subtle-foreground">{emptyMessage}</p>
      ) : (
        <EntryList
          entries={entries}
          hideCar={Boolean(vehicle)}
          onEdit={(entry) => setSheet({ open: true, entry, kind: entry.kind })}
          onDelete={setDeleting}
        />
      )}
      {footer}
      <EntrySheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        entry={sheet.entry}
        defaultKind={sheet.kind}
        defaultVehicle={vehicle ?? null}
        lockVehicle={Boolean(vehicle) && !sheet.entry}
        tags={tags}
        showrooms={showrooms}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && !isPending && setDeleting(null)}
        title="Delete this entry?"
        description={
          deleting
            ? `${deleting.kind === "income" ? "Income" : "Expense"} of ${formatMoney(deleting.amount)}${deleting.vehicle ? ` on ${deleting.vehicle.label}` : ""}. It leaves every total and report.`
            : ""
        }
        confirmLabel="Delete"
        pending={isPending}
        onConfirm={confirmDelete}
      />
    </>
  )
}

/** Header buttons that open a fresh entry sheet (ledger, finance home). */
export function AddEntryButtons({ tags, showrooms }: { tags: FinanceTag[]; showrooms: ShowroomOption[] }) {
  const [sheet, setSheet] = useState<{ open: boolean; kind: EntryKind }>({ open: false, kind: "expense" })
  return (
    <>
      <Button variant="outline" onClick={() => setSheet({ open: true, kind: "expense" })}>
        <Minus /> <span className="max-sm:hidden">Add</span> expense
      </Button>
      <Button onClick={() => setSheet({ open: true, kind: "income" })}>
        <Plus /> <span className="max-sm:hidden">Add</span> income
      </Button>
      <EntrySheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        defaultKind={sheet.kind}
        tags={tags}
        showrooms={showrooms}
      />
    </>
  )
}
