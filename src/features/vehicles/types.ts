import type {
  ACQUISITION_TYPES,
  DOCUMENT_TYPES,
  FUEL_TYPES,
  MEDIA_CATEGORIES,
  RC_STATUSES,
  SERVICE_HISTORIES,
  TRANSMISSIONS,
  VEHICLE_STATUSES,
} from "./constants"

export type VehicleStatus = (typeof VEHICLE_STATUSES)[number]
export type FuelType = (typeof FUEL_TYPES)[number]
export type Transmission = (typeof TRANSMISSIONS)[number]
export type AcquisitionType = (typeof ACQUISITION_TYPES)[number]
export type MediaCategory = (typeof MEDIA_CATEGORIES)[number]
export type RcStatus = (typeof RC_STATUSES)[number]
export type ServiceHistory = (typeof SERVICE_HISTORIES)[number]
/** Document types the UI offers; the API also knows `loan_clearance`. */
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export interface VehicleDto {
  id: string
  showroomId: string
  ownerId: string
  variantId: string
  makeName: string | null
  modelName: string | null
  variantName: string | null
  year: number
  registrationNumber: string
  fuelType: FuelType
  transmission: Transmission
  kmDriven: number
  numPreviousOwners: number
  colour: string
  insuranceValidUntil: string | null
  rcStatus: RcStatus | null
  serviceHistory: ServiceHistory | null
  accidentHistory: boolean
  /** Never shown in the UI; only carried through so edits don't wipe it. */
  loanStatus: string | null
  location: string | null
  description: string | null
  status: VehicleStatus
  soldLeadId: string | null
  acquisitionType: AcquisitionType
  submittedBy: string
  createdAt: string
  updatedAt: string
  /** Signed URL of the cover (`front`) photo, valid for ~10 minutes. */
  frontImageUrl: string | null
  frontImageUrlExpiresAt: string | null
  /** Active leads (new / not_now / booking_confirmed) on this vehicle. */
  linkedLeadCount: number
}

export interface VehicleMediaDto {
  id: string
  vehicleId: string
  storagePath: string
  category: MediaCategory | null
  sortOrder: number
  uploadedBy: string
  uploadedAt: string
  url: string
  urlExpiresAt: string
}

export interface VehicleDocumentDto {
  id: string
  vehicleId: string
  storagePath: string
  docType: string | null
  fileName: string | null
  isSensitive: boolean
  uploadedBy: string
  uploadedAt: string
  url: string
  urlExpiresAt: string
}

export interface VehicleStatusHistoryItem {
  id: string
  vehicleId: string
  fromStatus: VehicleStatus | null
  toStatus: VehicleStatus
  changedBy: string
  changedByName: string | null
  reason: string | null
  changedAt: string
}

export interface SignedUploadDto {
  storagePath: string
  uploadUrl: string
  token: string
  expiresAt: string
}

export interface ChangeVehicleStatusResult {
  status: VehicleStatus
  unlinkedLeadCount: number
}
