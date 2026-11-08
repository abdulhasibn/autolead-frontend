"use client"

import Link from "next/link"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { formatYmd } from "../../logic/dates"
import { PURPOSE_LABELS } from "../../logic/purpose"
import type { FinanceEntry } from "../../types"
import { Money } from "../money"
import { TagChip } from "../tag-chip"

interface EntryListProps {
  entries: FinanceEntry[]
  onEdit: (entry: FinanceEntry) => void
  onDelete: (entry: FinanceEntry) => void
  /** Hide the car column (a car's own Money tab). */
  hideCar?: boolean
}

function SignedAmount({ entry }: { entry: FinanceEntry }) {
  return (
    <Money
      value={entry.kind === "expense" ? -entry.amount : entry.amount}
      signed
      tone
      className="font-semibold"
    />
  )
}

function RowActions({ entry, onEdit, onDelete }: { entry: FinanceEntry } & Pick<EntryListProps, "onEdit" | "onDelete">) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="Entry actions" />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(entry)}>
          <Pencil /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(entry)}>
          <Trash2 /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function EntryList({ entries, onEdit, onDelete, hideCar }: EntryListProps) {
  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Date</TableHead>
              <TableHead>Details</TableHead>
              {!hideCar && <TableHead>Car</TableHead>}
              <TableHead>Purpose</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} className="cursor-pointer" onClick={() => onEdit(entry)}>
                <TableCell className="font-mono-data text-xs whitespace-nowrap text-muted-foreground">
                  {formatYmd(entry.entryDate)}
                </TableCell>
                <TableCell className="max-w-72">
                  <div className="flex flex-wrap gap-1">
                    {entry.tags.map((t) => (
                      <TagChip key={t.id} tag={t} />
                    ))}
                    {entry.tags.length === 0 && <span className="text-xs text-subtle-foreground">Untagged</span>}
                  </div>
                  {(entry.party || entry.note) && (
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {[entry.party, entry.note].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </TableCell>
                {!hideCar && (
                  <TableCell className="max-w-56 truncate text-sm">
                    {entry.vehicle ? (
                      <Link
                        href={`/vehicles/${entry.vehicle.id}?tab=money`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-primary hover:underline"
                      >
                        {entry.vehicle.label}
                      </Link>
                    ) : (
                      <span className="text-subtle-foreground">Business</span>
                    )}
                  </TableCell>
                )}
                <TableCell className="text-xs text-muted-foreground">{PURPOSE_LABELS[entry.purpose]}</TableCell>
                <TableCell className="text-right">
                  <SignedAmount entry={entry} />
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <RowActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="divide-y divide-muted md:hidden">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-start gap-2 px-4 py-3">
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onEdit(entry)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-wrap gap-1">
                  {entry.tags.map((t) => (
                    <TagChip key={t.id} tag={t} />
                  ))}
                  {entry.tags.length === 0 && <span className="text-xs text-subtle-foreground">Untagged</span>}
                </div>
                <SignedAmount entry={entry} />
              </div>
              <p className={cn("mt-1 truncate text-xs text-muted-foreground")}>
                {formatYmd(entry.entryDate)}
                {!hideCar && <> · {entry.vehicle ? entry.vehicle.label : "Business"}</>}
                {entry.vehicle && <> · {PURPOSE_LABELS[entry.purpose]}</>}
              </p>
              {(entry.party || entry.note) && (
                <p className="truncate text-xs text-subtle-foreground">{[entry.party, entry.note].filter(Boolean).join(" · ")}</p>
              )}
            </button>
            <RowActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </>
  )
}
