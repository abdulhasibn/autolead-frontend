import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/empty-state"
import { formatCount, formatRate } from "@/features/insights/format"
import type { CampaignRow } from "@/features/insights/types"

/** Top ads by visits, named from the UTM campaign and content of the ad link. */
export function CampaignTable({ campaigns }: { campaigns: CampaignRow[] }) {
  if (campaigns.length === 0) {
    return <EmptyState message="No tagged ad visits yet. Use UTM links in your Instagram ads." />
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-4">Ad</TableHead>
          <TableHead className="text-right">Visits</TableHead>
          <TableHead className="text-right">Leads</TableHead>
          <TableHead className="text-right max-sm:hidden">Lead rate</TableHead>
          <TableHead className="pr-4 text-right">Booked</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="font-mono-data">
        {campaigns.map((row) => (
          <TableRow key={`${row.campaign}·${row.content ?? ""}`}>
            <TableCell className="max-w-[14rem] pl-4 font-sans whitespace-normal">
              <span className="font-medium text-foreground">{row.campaign}</span>
              {row.content && <span className="text-muted-foreground"> · {row.content}</span>}
            </TableCell>
            <TableCell className="text-right">{formatCount(row.visits)}</TableCell>
            <TableCell className="text-right font-semibold">{formatCount(row.leads)}</TableCell>
            <TableCell className="text-right text-muted-foreground max-sm:hidden">
              {formatRate(row.leadRate)}
            </TableCell>
            <TableCell className="pr-4 text-right">{formatCount(row.bookings)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
