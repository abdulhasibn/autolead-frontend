import type { FuelType, Transmission } from "@/features/vehicles/types"
import type {
  BODY_TYPES,
  FOLLOW_UP_OUTCOMES,
  FOLLOW_UP_TASK_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  MATCH_CRITERIA,
} from "./constants"

export type LeadSource = (typeof LEAD_SOURCES)[number]

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export type FollowUpTaskType = (typeof FOLLOW_UP_TASK_TYPES)[number]

export type FollowUpOutcome = (typeof FOLLOW_UP_OUTCOMES)[number]

export type FollowUpStatus = "open" | "completed" | "cancelled"

export type BodyType = (typeof BODY_TYPES)[number]

export type MatchCriterion = (typeof MATCH_CRITERIA)[number]

/** Body of PUT /leads/:id/preference, and the fields on every lead read. */
export interface LeadPreference {
  preferredMakeId: string | null
  preferredModelId: string | null
  preferredVariantId: string | null
  preferredColours: string[]
  preferredFuelTypes: FuelType[]
  preferredTransmissions: Transmission[]
  preferredBodyTypes: BodyType[]
  preferredYearMin: number | null
  preferredYearMax: number | null
  preferredKmMax: number | null
  preferredMaxOwners: number | null
}

export interface NextFollowUp {
  id: string
  taskType: string
  scheduledAt: string
  notes: string | null
}

export interface LeadReadModel extends LeadPreference {
  id: string
  showroomId: string
  vehicleId: string | null
  assignedTo: string | null
  contactId: string
  contactFullName: string
  contactPhone: string
  contactEmail: string | null
  source: LeadSource
  status: LeadStatus
  budget: number | null
  preferredVehicle: string | null
  purchaseTimeline: string | null
  financeRequired: boolean | null
  currentVehicle: string | null
  tradeInRequired: boolean | null
  notes: string | null
  nextFollowUp: NextFollowUp | null
  preferredMakeName: string | null
  preferredModelName: string | null
  preferredVariantName: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface FollowUpDto {
  id: string
  leadId: string
  assignedTo: string
  taskType: string
  scheduledAt: string
  notes: string | null
  /** null for a stored follow-up that has no due reminder. */
  notificationId: string | null
  dueAt: string | null
  status: FollowUpStatus
  outcome: FollowUpOutcome | null
  completionNotes: string | null
  completedAt: string | null
  cancelledAt: string | null
}

export interface CompleteFollowUpResult {
  followUp: FollowUpDto
  /** The next follow-up, when one was scheduled with the completion. */
  next: FollowUpDto | null
}

/** Item of GET /leads/:id/follow-ups. */
export interface FollowUpReadModel {
  id: string
  leadId: string
  taskType: string
  scheduledAt: string
  notes: string | null
  status: FollowUpStatus
  outcome: FollowUpOutcome | null
  completionNotes: string | null
  completedAt: string | null
  completedBy: string | null
  completedByName: string | null
  cancelledAt: string | null
  cancelledBy: string | null
  cancelledByName: string | null
  assignedTo: string
  assignedToName: string | null
  createdBy: string
  createdByName: string | null
  createdAt: string
}

/** Item of GET /leads/:id/status-history; `fromStatus` is null on create. */
export interface LeadStatusHistoryItem {
  id: string
  leadId: string
  fromStatus: LeadStatus | null
  toStatus: LeadStatus
  changedBy: string
  changedByName: string | null
  notes: string | null
  changedAt: string
}

export type MatchOutcome = "match" | "partial" | "miss" | "unknown"

export interface MatchBreakdownEntry {
  criterion: MatchCriterion
  weight: number
  /** 0..weight, may be fractional. */
  earned: number
  outcome: MatchOutcome
}

export interface LeadMatch {
  /** 0–100 over the criteria the API could evaluate. */
  score: number
  evaluatedCriteria: number
  breakdown: MatchBreakdownEntry[]
}

/** A car's attributes as the match score sees them. */
export interface MatchableVehicle {
  id: string
  showroomId: string
  status: string
  makeId: string | null
  makeName: string | null
  modelId: string | null
  modelName: string | null
  variantId: string
  variantName: string | null
  year: number
  registrationNumber: string
  kmDriven: number
  colour: string
  fuelType: FuelType
  transmission: Transmission
  bodyTypes: BodyType[]
  numPreviousOwners: number
  /** Null until the car is priced. */
  listedPrice: number | null
}

/** `match` is null when the lead has no preference recorded. */
export type LeadWithMatch = LeadReadModel & { match: LeadMatch | null }

export interface VehicleLeadMatches {
  vehicle: MatchableVehicle
  linked: LeadWithMatch[]
  suggested: LeadWithMatch[]
  /** Only the newest 1,000 open leads were scored. */
  truncated: boolean
}

/** A car with its match score against the current lead. `match` is null when the lead has no preference and no budget. */
export interface VehicleWithMatch {
  vehicle: MatchableVehicle
  match: LeadMatch | null
}

export interface LeadVehicleMatches {
  /** The car linked to this lead with its score, or null if the lead has no car. */
  linked: VehicleWithMatch | null
  /** Live cars in this showroom that scored ≥ minScore on ≥ 2 criteria, best first. */
  suggested: VehicleWithMatch[]
  /** True when only the newest 1,000 cars were scored. */
  truncated: boolean
}
