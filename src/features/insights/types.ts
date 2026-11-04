// Mirrors the backend insights contract (plan §2.3). The backend zod schemas are the source of truth.
// Units: `*Rate` fields are fractions (0–1, like the dashboard's conversionRate);
// `*Share` fields are whole percentages (0–100).

export type InsightsPeriodKey = "today" | "week" | "month" | "quarter"

export type Channel =
  | "instagram_ads"
  | "instagram_organic"
  | "facebook_ads"
  | "facebook_organic"
  | "google_ads"
  | "google_organic"
  | "whatsapp"
  | "direct"
  | "referral"
  | "other"

export type Signal =
  | "hot"
  | "seen_not_enquired"
  | "low_visibility"
  | "ageing_cooling"
  | "insufficient_data"
  | "normal"

export interface InsightsPeriod {
  from: string
  to: string
}

// ── GET /insights/traffic ────────────────────────────────────────────────

export interface TrafficTotals {
  visitors: number
  sessions: number
  leads: number
  visitorToLeadRate: number | null
}

export interface ChannelRow {
  channel: Channel
  visitors: number
  carViews: number
  testDriveOpens: number
  leads: number
  bookings: number
  sold: number
}

export interface CampaignRow {
  campaign: string
  content: string | null
  visits: number
  leads: number
  leadRate: number | null
  bookings: number
}

export interface TrafficInsights extends TrafficTotals {
  period: InsightsPeriod
  previous: TrafficTotals
  channels: ChannelRow[]
  campaigns: CampaignRow[]
  devices: { mobile: number; desktop: number }
  cities: Array<{ city: string; visitors: number }>
}

// ── GET /insights/vehicles ───────────────────────────────────────────────

export interface VehicleSignal {
  code: Signal
  reason: string
}

export interface VehicleInsightRow {
  vehicleId: string
  title: string
  listedPrice: number | null
  daysInStock: number
  views: number
  uniqueViewers: number
  repeatViewers: number
  testDriveOpens: number
  contactClicks: number
  leads: number
  leadRate: number | null
  topChannel: Channel | null
  signal: VehicleSignal
}

export interface VehicleInsights {
  period: InsightsPeriod
  items: VehicleInsightRow[]
}

// ── GET /insights/vehicles/:id ───────────────────────────────────────────

export interface DailyPoint {
  date: string
  views: number
  leads: number
}

export interface RatePerDay {
  viewsPerDay: number
  leadsPerDay: number
}

export interface PriceChange {
  at: string
  from: number
  to: number
  before: RatePerDay
  after: RatePerDay
}

export interface VehicleInsightDetail extends VehicleInsightRow {
  period: InsightsPeriod
  daily: DailyPoint[]
  priceChanges: PriceChange[]
  channels: Array<{ channel: Channel; views: number }>
  budgetContext: { segment: string; shareBelowPrice: number | null }
}

// ── GET /insights/demand ─────────────────────────────────────────────────

export type BudgetBand = "<4L" | "4-6L" | "6-8L" | "8-12L" | "12L+"

export interface BudgetBandRow {
  band: BudgetBand
  searchShare: number
  stockShare: number
}

export interface SegmentRow {
  label: string
  demandShare: number
  stockShare: number
  gap: "under" | "over" | null
}

export interface DemandInsights {
  period: InsightsPeriod
  budgetBands: BudgetBandRow[]
  segments: SegmentRow[]
  zeroResultSearches: {
    count: number
    top: Array<{ label: string; count: number }>
  }
}

// ── GET /insights/leads/:id ──────────────────────────────────────────────

export type LeadIntent = "high" | "medium" | "low"

export interface LeadJourney {
  channel: Channel | null
  campaign: string | null
  content: string | null
  firstVisitAt: string | null
  visits: number
  viewsOfThisCar: number
  galleryOpens: number
  otherCarsViewed: Array<{
    vehicleId: string
    title: string
    listedPrice: number | null
    views: number
  }>
  intent: LeadIntent | null
}
