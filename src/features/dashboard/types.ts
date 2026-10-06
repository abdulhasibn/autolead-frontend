export type DashboardPeriodKey = "today" | "week" | "month" | "quarter"

export interface TrendKpi<T> {
  value: T
  previous: T
}

export interface FollowUpCard {
  followUpId: string
  leadId: string
  taskType: string
  scheduledAt: string
  contactName: string
  contactPhone: string | null
  vehicleLabel: string | null
}

export interface LeadCard {
  leadId: string
  status: string
  source: string
  contactName: string
  contactPhone: string | null
  vehicleLabel: string | null
  createdAt: string
}

export interface VehicleCard {
  vehicleId: string
  vehicleLabel: string
  status: string
  daysListed: number
  activeLeads: number
}

export interface CardList<T> {
  total: number
  items: T[]
}

export interface DashboardSummary {
  generatedAt: string
  period: {
    key: DashboardPeriodKey
    from: string
    to: string
    timezone: string
  }
  kpis: {
    carsSold: TrendKpi<number>
    newLeads: TrendKpi<number>
    conversionRate: TrendKpi<number | null>
    inStock: { value: number }
  }
  attention: {
    overdueFollowUps: CardList<FollowUpCard>
    leadsWithoutFollowUp: CardList<LeadCard>
    agedStock: CardList<VehicleCard>
  }
  today: CardList<FollowUpCard>
  pipeline: {
    new: number
    not_now: number
    booking_confirmed: number
  }
  inventory: {
    open: number
    linked: number
  }
}
