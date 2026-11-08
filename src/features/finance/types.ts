/** Mirrors the backend finance DTOs (../autoLeadBackend/docs/api.md › Finance). All amounts are rupees. */

export interface VaultStatus {
  initialized: boolean
  confirmed: boolean
  unlocked: boolean
  /** Idle deadline; null when not unlocked. */
  expiresAt: string | null
}

export interface VaultKeys {
  financeKey: string
  recoveryKey: string
}

export type EntryKind = "income" | "expense"
export type EntryPurpose = "purchase" | "cost" | "sale" | "other" | "general"

export interface FinanceTag {
  id: string
  name: string
  color: string | null
  archived: boolean
  createdAt: string
  updatedAt: string
}

export interface FinanceVehicleRef {
  id: string
  label: string
}

export interface FinanceEntry {
  id: string
  kind: EntryKind
  amount: number
  entryDate: string
  purpose: EntryPurpose
  tags: FinanceTag[]
  vehicle: FinanceVehicleRef | null
  party: string | null
  note: string | null
  showroomId: string
  recordedBy: string
  createdAt: string
  updatedAt: string
}

export interface EntryTotals {
  income: number
  expense: number
  net: number
}

export interface EntryPage {
  items: FinanceEntry[]
  total: number
  limit: number
  offset: number
  truncated: boolean
  totals: EntryTotals
}

export type EntrySort = "date" | "-date" | "amount" | "-amount"

export interface EntryListParams {
  from?: string
  to?: string
  kind?: EntryKind
  vehicleId?: string
  unlinked?: boolean
  showroomId?: string
  /** Comma-separated. */
  tagId?: string
  /** Comma-separated. */
  purpose?: string
  minAmount?: number
  maxAmount?: number
  search?: string
  sort?: EntrySort
  limit?: number
  offset?: number
}

export interface EntryBody {
  kind: EntryKind
  amount: number
  entryDate: string
  tagIds: string[]
  vehicleId: string | null
  purpose: EntryPurpose | null
  party: string | null
  note: string | null
  showroomId: string | null
}

export type EntryPatch = Partial<Omit<EntryBody, "kind">>

export interface DealTerms {
  purchaseRate: number
  purchasedOn: string | null
  ownerExpectedPrice: number | null
  minimumSellingPrice: number | null
  note: string | null
}

export interface VehicleSale {
  finalisedPrice: number
  soldOn: string
  soldBy: string
}

export interface VehicleDealState {
  vehicleId: string
  deal: DealTerms | null
  sale: VehicleSale | null
  listedPrice: number | null
}

export interface VehicleQuote {
  id: string
  vehicleId: string
  amount: number
  quotedOn: string
  leadId: string | null
  lead: { id: string; name: string | null; phone: string | null } | null
  quotedTo: string | null
  note: string | null
  createdAt: string
}

export interface CostGroup {
  tag: { id: string; name: string } | null
  amount: number
  count: number
}

export interface CarMoney extends VehicleDealState {
  vehicle: FinanceVehicleRef
  quotes: VehicleQuote[]
  currentQuote: VehicleQuote | null
  landingCost: number
  costs: number
  costBreakdown: CostGroup[]
  paidToSeller: number
  receivedFromBuyer: number
  profit: number | null
  owedToSeller: number | null
  owedByBuyer: number | null
  flags: { purchaseRateMissing: boolean; saleRecorded: boolean }
}

export interface VehicleMoneySummary {
  vehicleId: string
  purchaseRate: number | null
  landingCost: number
  currentQuote: number | null
  finalisedPrice: number | null
  profit: number | null
  owedToSeller: number | null
  owedByBuyer: number | null
}

export interface AwaitingSalePrice {
  vehicleId: string
  label: string
  soldLeadId: string | null
}

export type ReportPeriod = "day" | "week" | "month" | "year"

export interface ReportBucket {
  start: string
  end: string
  label: string
}

export interface PnlLine {
  sales: number
  costOfSales: number
  grossProfit: number
  laterCarCosts: number
  otherIncome: number
  businessExpenses: number
  netProfit: number
  carsSold: number
  carsMissingPurchaseRate: number
  uncountedSales: number
}

export interface PnlReport {
  period: ReportPeriod
  from: string
  to: string
  buckets: Array<ReportBucket & PnlLine>
  totals: PnlLine
  truncated: boolean
}

export interface CashFlowLine {
  in: number
  out: number
  net: number
  inFromBuyers: number
  inOther: number
  outToSellers: number
  outCarCosts: number
  outBusiness: number
}

export interface CashFlowReport {
  period: ReportPeriod
  from: string
  to: string
  buckets: Array<ReportBucket & CashFlowLine & { cumulative: number }>
  totals: CashFlowLine
  truncated: boolean
}

export type VehicleProfitSort = "profit" | "-profit" | "date" | "-date"

export interface VehicleProfitRow {
  vehicle: FinanceVehicleRef
  soldOn: string
  purchaseRate: number | null
  costs: number
  landingCost: number
  finalisedPrice: number
  profit: number | null
}

export interface VehicleProfitReport {
  from: string
  to: string
  items: VehicleProfitRow[]
  totals: {
    cars: number
    sales: number
    landingCost: number
    profit: number
    carsMissingPurchaseRate: number
    uncountedSales: number
  }
  truncated: boolean
}

export interface DuesRow {
  vehicle: FinanceVehicleRef
  purchaseRate: number | null
  paidToSeller: number
  owedToSeller: number | null
  finalisedPrice: number | null
  receivedFromBuyer: number
  owedByBuyer: number | null
}

export interface DuesReport {
  items: DuesRow[]
  totals: { owedToSellers: number; owedByBuyers: number }
  truncated: boolean
}

export interface StockRow {
  vehicle: FinanceVehicleRef
  status: string
  purchaseRate: number | null
  costs: number
  landingCost: number
  currentQuote: number | null
  listedPrice: number | null
}

export interface StockReport {
  items: StockRow[]
  totals: { cars: number; moneyInStock: number }
  truncated: boolean
}

export interface SummaryWindow {
  from: string
  to: string
  sales: number
  netProfit: number
  businessExpenses: number
  cashIn: number
  cashOut: number
  carsMissingPurchaseRate: number
  uncountedSales: number
}

export interface FinanceSummary {
  thisMonth: SummaryWindow
  lastMonth: SummaryWindow
  moneyInStock: number
  owedToSellers: number
  owedByBuyers: number
  awaitingSalePrice: number
  truncated: boolean
}

export interface ShowroomOption {
  id: string
  name: string
}

/** Picker rows returned by the search actions. */
export interface VehicleOption {
  id: string
  label: string
}

export interface LeadOption {
  id: string
  name: string
  phone: string
}
