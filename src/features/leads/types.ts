import type {
  FOLLOW_UP_TASK_TYPES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "./constants"

export type LeadSource = (typeof LEAD_SOURCES)[number]

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export type FollowUpTaskType = (typeof FOLLOW_UP_TASK_TYPES)[number]

export interface NextFollowUp {
  id: string
  taskType: string
  scheduledAt: string
  notes: string | null
}

export interface LeadReadModel {
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
  notificationId: string
  dueAt: string
}
