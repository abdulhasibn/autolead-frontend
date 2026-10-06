export type VehicleStatus = "open" | "linked" | "dropped" | "sold"

export type FuelType = "petrol" | "diesel" | "cng" | "electric" | "hybrid"
export type Transmission = "manual" | "automatic" | "amt" | "cvt" | "dct"
export type AcquisitionType =
  | "dealership_purchase"
  | "consignment"
  | "intermediary_sale"
export type MediaCategory =
  | "front"
  | "rear"
  | "left"
  | "right"
  | "interior"
  | "dashboard"
  | "engine"
  | "tyres"
  | "other"
export type DocumentType =
  | "rc"
  | "insurance"
  | "service_record"
  | "loan_clearance"
  | "inspection_report"
  | "other"

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
  rcStatus: string | null
  serviceHistory: string | null
  accidentHistory: boolean
  loanStatus: string | null
  location: string | null
  description: string | null
  status: VehicleStatus
  soldLeadId: string | null
  acquisitionType: AcquisitionType
  submittedBy: string
  createdAt: string
  updatedAt: string
}

export interface VehicleMediaDto {
  id: string
  vehicleId: string
  storagePath: string
  category: MediaCategory
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
  docType: DocumentType
  isSensitive: true
  uploadedBy: string
  uploadedAt: string
  url: string
  urlExpiresAt: string
}

export interface SignedUploadDto {
  storagePath: string
  uploadUrl: string
  token: string
  expiresAt: string
}
