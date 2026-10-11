import type {
  AcquisitionType,
  DocumentType,
  FuelType,
  MediaCategory,
  RcStatus,
  ServiceHistory,
  Transmission,
  VehicleStatus,
} from "./types"

export const VEHICLE_STATUSES = ["open", "linked", "sold", "dropped"] as const
export const FUEL_TYPES = ["petrol", "diesel", "cng", "electric", "hybrid"] as const
export const TRANSMISSIONS = ["manual", "automatic", "amt", "cvt", "dct"] as const
export const ACQUISITION_TYPES = [
  "dealership_purchase",
  "consignment",
  "intermediary_sale",
] as const
export const RC_STATUSES = ["clear", "hypothecation", "under_transfer"] as const
export const SERVICE_HISTORIES = ["full", "partial", "none", "unknown"] as const
export const MEDIA_CATEGORIES = [
  "front",
  "rear",
  "left",
  "right",
  "interior",
  "dashboard",
  "engine",
  "tyres",
  "other",
] as const
/** The 8 angles every listing should cover; `other` holds extra shots. */
export const STANDARD_ANGLES = MEDIA_CATEGORIES.filter(
  (c): c is Exclude<MediaCategory, "other"> => c !== "other"
)
export const DOCUMENT_TYPES = [
  "rc",
  "insurance",
  "service_record",
  "inspection_report",
  "other",
] as const

/** Divides evenly into 2-, 3- and 4-column grids. */
export const VEHICLES_PAGE_SIZE = 24
/** Cars in stock this long are flagged as aging. */
export const AGING_DAYS = 60

export const MEDIA_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const MEDIA_MAX_BYTES = 10 * 1024 * 1024
export const DOCUMENT_CONTENT_TYPES = ["application/pdf", "image/jpeg", "image/png"]
export const DOCUMENT_MAX_BYTES = 15 * 1024 * 1024

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  open: "Open",
  linked: "Linked",
  sold: "Sold",
  dropped: "Dropped",
}

/** Text colour and dot colour per status; pills sit on photos and on cards. */
export const VEHICLE_STATUS_STYLES: Record<VehicleStatus, { text: string; dot: string; soft: string }> = {
  open: { text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", soft: "bg-emerald-50 dark:bg-emerald-900/20" },
  linked: { text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500", soft: "bg-blue-50 dark:bg-blue-900/20" },
  sold: { text: "text-violet-700 dark:text-violet-400", dot: "bg-violet-500", soft: "bg-violet-50 dark:bg-violet-900/20" },
  dropped: { text: "text-muted-foreground", dot: "bg-subtle-foreground", soft: "bg-muted" },
}

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  cng: "CNG",
  electric: "Electric",
  hybrid: "Hybrid",
}

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  manual: "Manual",
  automatic: "Automatic",
  amt: "AMT",
  cvt: "CVT",
  dct: "DCT",
}

export const ACQUISITION_TYPE_LABELS: Record<AcquisitionType, string> = {
  dealership_purchase: "Dealership purchase",
  consignment: "Consignment",
  intermediary_sale: "Intermediary sale",
}

export const RC_STATUS_LABELS: Record<RcStatus, string> = {
  clear: "Clear",
  hypothecation: "Hypothecation",
  under_transfer: "Under transfer",
}

export const SERVICE_HISTORY_LABELS: Record<ServiceHistory, string> = {
  full: "Full",
  partial: "Partial",
  none: "None",
  unknown: "Unknown",
}

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  front: "Front",
  rear: "Rear",
  left: "Left side",
  right: "Right side",
  interior: "Interior",
  dashboard: "Dashboard",
  engine: "Engine",
  tyres: "Tyres",
  other: "Other",
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  rc: "RC",
  insurance: "Insurance",
  service_record: "Service record",
  inspection_report: "Inspection report",
  other: "Other",
}

/** Label for a stored document type; types the UI doesn't offer read as "Document". */
export function documentTypeLabel(docType: string | null): string {
  return (DOCUMENT_TYPE_LABELS as Record<string, string>)[docType ?? "other"] ?? "Document"
}

export function isVehicleStatus(value: unknown): value is VehicleStatus {
  return VEHICLE_STATUSES.includes(value as VehicleStatus)
}

export function isFuelType(value: unknown): value is FuelType {
  return FUEL_TYPES.includes(value as FuelType)
}

export function isTransmission(value: unknown): value is Transmission {
  return TRANSMISSIONS.includes(value as Transmission)
}
