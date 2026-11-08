import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/empty-state"
import {
  channelLabel,
  formatCount,
  formatRate,
  formatShare,
  isInstagramChannel,
  shareOf,
} from "@/features/insights/format"
import type { ChannelRow } from "@/features/insights/types"
import { cn } from "@/lib/utils"

/** Every traffic source with its funnel; Instagram rows are marked so ads stand out against the rest. */
export function ChannelTable({ channels }: { channels: ChannelRow[] }) {
  if (channels.length === 0) {
    return <EmptyState message="No website visits in this period." />
  }

  const totalVisitors = channels.reduce((sum, c) => sum + c.visitors, 0)
  const rows = [...channels].sort((a, b) => b.visitors - a.visitors)

  return (
    <>
      <Table className="max-md:hidden">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Source</TableHead>
            <TableHead className="text-right">Visitors</TableHead>
            <TableHead className="text-right">Share</TableHead>
            <TableHead className="text-right">Car views</TableHead>
            <TableHead className="text-right">Test-drive opens</TableHead>
            <TableHead className="text-right">Leads</TableHead>
            <TableHead className="text-right">Lead rate</TableHead>
            <TableHead className="text-right">Bookings</TableHead>
            <TableHead className="pr-4 text-right">Sold</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="font-mono-data">
          {rows.map((row) => (
            <TableRow key={row.channel}>
              <TableCell className="pl-4 font-sans">
                <ChannelName channel={row.channel} />
              </TableCell>
              <TableCell className="text-right">{formatCount(row.visitors)}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatShare(shareOf(row.visitors, totalVisitors))}
              </TableCell>
              <TableCell className="text-right">{formatCount(row.carViews)}</TableCell>
              <TableCell className="text-right">{formatCount(row.testDriveOpens)}</TableCell>
              <TableCell className="text-right font-semibold">{formatCount(row.leads)}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatRate(row.visitors > 0 ? row.leads / row.visitors : null)}
              </TableCell>
              <TableCell className="text-right">{formatCount(row.bookings)}</TableCell>
              <TableCell className="pr-4 text-right">{formatCount(row.sold)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <ul className="divide-y divide-muted md:hidden">
        {rows.map((row) => (
          <li key={row.channel} className="space-y-2 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <ChannelName channel={row.channel} />
              <span className="font-mono-data text-xs text-muted-foreground">
                {formatShare(shareOf(row.visitors, totalVisitors))} of visitors
              </span>
            </div>
            <dl className="font-mono-data grid grid-cols-4 gap-2 text-center">
              <MobileStat label="Visitors" value={formatCount(row.visitors)} />
              <MobileStat label="Leads" value={formatCount(row.leads)} strong />
              <MobileStat label="Booked" value={formatCount(row.bookings)} />
              <MobileStat label="Sold" value={formatCount(row.sold)} />
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}

function ChannelName({ channel }: { channel: ChannelRow["channel"] }) {
  const instagram = isInstagramChannel(channel)
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
      <span
        aria-hidden
        className={cn("size-2 shrink-0 rounded-full", instagram ? "bg-primary" : "bg-border")}
      />
      {channelLabel(channel)}
    </span>
  )
}

function MobileStat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/50 px-1 py-1.5">
      <dt className="font-sans text-[10px] font-medium tracking-wide text-subtle-foreground uppercase">{label}</dt>
      <dd className={cn("text-sm text-foreground", strong && "font-semibold")}>{value}</dd>
    </div>
  )
}
