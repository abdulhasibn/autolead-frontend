import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import type { OwnerDto } from "../types"
import { PreferredContactBadge } from "./preferred-contact-badge"

interface OwnersTableProps {
  owners: OwnerDto[]
}

const HEAD =
  "h-10 px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
const CELL = "px-4 py-3"
const EMPTY = <span className="text-subtle-foreground">—</span>

export function OwnersTable({ owners }: OwnersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader className="bg-card/50">
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className={HEAD}>Name</TableHead>
            <TableHead className={HEAD}>Phone</TableHead>
            <TableHead className={HEAD}>Email</TableHead>
            <TableHead className={HEAD}>City</TableHead>
            <TableHead className={HEAD}>Preferred contact</TableHead>
            <TableHead className={HEAD}>Added</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {owners.map((owner) => (
            <TableRow
              key={owner.id}
              className="border-border/50 hover:bg-card/50"
            >
              <TableCell className={CELL}>
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-accent text-xs font-semibold text-primary"
                  >
                    {owner.fullName.charAt(0).toUpperCase()}
                  </span>
                  <Link
                    href={`/owners/${owner.id}`}
                    className="text-sm font-medium text-foreground hover:text-primary"
                  >
                    {owner.fullName}
                  </Link>
                </div>
              </TableCell>
              <TableCell className={CELL}>
                <a
                  href={`tel:${owner.phone}`}
                  className="text-sm text-primary hover:underline"
                >
                  {owner.phone}
                </a>
              </TableCell>
              <TableCell className={CELL}>
                {owner.email ? (
                  <a
                    href={`mailto:${owner.email}`}
                    className="text-sm text-primary hover:underline"
                  >
                    {owner.email}
                  </a>
                ) : (
                  EMPTY
                )}
              </TableCell>
              <TableCell className={`${CELL} text-sm`}>
                {owner.city ?? EMPTY}
              </TableCell>
              <TableCell className={CELL}>
                <PreferredContactBadge method={owner.preferredContactMethod} />
              </TableCell>
              <TableCell className={`${CELL} text-sm text-muted-foreground`}>
                {formatDate(owner.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
