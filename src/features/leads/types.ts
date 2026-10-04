export type LeadSource =
  | "marketplace"
  | "mobile_app"
  | "website"
  | "phone"
  | "walkin"
  | "whatsapp"
  | "instagram"
  | "facebook"
  | "referral"
  | "other"

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "follow_up"
  | "test_drive"
  | "negotiation"
  | "booking_confirmed"
  | "sold"
  | "lost"
  | "not_interested"
  | "no_response"

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

export interface FollowUpTaskType {
  type: "call" | "whatsapp" | "meeting" | "test_drive" | "send_quotation" | "other"
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
