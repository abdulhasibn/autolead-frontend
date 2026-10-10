import { z } from "zod"
import {
  ACQUISITION_TYPES,
  DOCUMENT_TYPES,
  FUEL_TYPES,
  MEDIA_CATEGORIES,
  RC_STATUSES,
  SERVICE_HISTORIES,
  TRANSMISSIONS,
} from "./constants"

// Matches the backend RegistrationNumber value object once spaces are stripped.
const registrationRegex = /^[A-Z0-9-]{1,16}$/
const registrationMessage = "Use letters, digits and dashes only (max 16)"
const currentYear = new Date().getFullYear()

// ---------------------------------------------------------------------------
// API payloads — validated again inside Server Actions before hitting the API
// ---------------------------------------------------------------------------

const vehicleDetailsSchema = z.object({
  year: z.number().int().min(1900).max(2100),
  registrationNumber: z.string().regex(registrationRegex, registrationMessage),
  fuelType: z.enum(FUEL_TYPES),
  transmission: z.enum(TRANSMISSIONS),
  kmDriven: z.number().int().min(0),
  numPreviousOwners: z.number().int().min(0).max(32767),
  colour: z.string().trim().min(1),
  insuranceValidUntil: z.iso.date().nullable(),
  rcStatus: z.enum(RC_STATUSES).nullable(),
  serviceHistory: z.enum(SERVICE_HISTORIES).nullable(),
  accidentHistory: z.boolean(),
  location: z.string().nullable(),
  description: z.string().nullable(),
})

export const updateVehicleSchema = vehicleDetailsSchema
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>

export const createVehicleSchema = vehicleDetailsSchema.extend({
  ownerId: z.guid(),
  variantId: z.guid(),
  acquisitionType: z.enum(ACQUISITION_TYPES),
})
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>

export const changeVehicleStatusSchema = z.object({
  status: z.enum(["open", "dropped"]),
  reason: z
    .string()
    .trim()
    .nullable()
    .transform((v) => (v ? v : null)),
  confirmUnlinkLeads: z.boolean(),
})
export type ChangeVehicleStatusInput = z.infer<typeof changeVehicleStatusSchema>

export const mediaUploadSchema = z.object({
  category: z.enum(MEDIA_CATEGORIES),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
})

export const confirmMediaSchema = z.object({
  storagePath: z.string().min(1),
  category: z.enum(MEDIA_CATEGORIES),
  sortOrder: z.number().int().min(0).max(32767),
})

export const documentUploadSchema = z.object({
  docType: z.enum(DOCUMENT_TYPES),
  contentType: z.enum(["application/pdf", "image/jpeg", "image/png"]),
})

export const confirmDocumentSchema = z.object({
  storagePath: z.string().min(1),
  docType: z.enum(DOCUMENT_TYPES),
  fileName: z.string().trim().max(255).nullable(),
})

// ---------------------------------------------------------------------------
// Form schema — raw string inputs in, API payloads out
// ---------------------------------------------------------------------------

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))

function optionalEnum<const T extends readonly [string, ...string[]]>(values: T) {
  return z
    .union([z.literal(""), z.enum(values)])
    .transform((value) => (value === "" ? null : (value as T[number])))
}

function intField(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .transform((value) => value.replace(/[,\s]/g, ""))
    .refine((value) => value !== "", `${label} is required`)
    .refine((value) => {
      const n = Number(value)
      return Number.isInteger(n) && n >= min && n <= max
    }, `Enter a whole number between ${min.toLocaleString("en-IN")} and ${max.toLocaleString("en-IN")}`)
    .transform(Number)
}

export const vehicleFormSchema = z.object({
  // Step 1 — vehicle
  makeId: z.string(),
  modelId: z.string(),
  variantId: z.string(),
  year: intField("Year", 1900, currentYear + 1),
  registrationNumber: z
    .string()
    .transform((value) => value.toUpperCase().replace(/\s+/g, ""))
    .refine((value) => value !== "", "Registration number is required")
    .refine((value) => registrationRegex.test(value), registrationMessage),
  fuelType: z.enum(FUEL_TYPES, { error: "Select a fuel type" }),
  transmission: z.enum(TRANSMISSIONS, { error: "Select a transmission" }),
  kmDriven: intField("Km driven", 0, 2_000_000),
  numPreviousOwners: intField("Previous owners", 0, 99),
  colour: z.string().trim().min(1, "Colour is required"),
  // Step 2 — condition and paperwork
  insuranceValidUntil: optionalText.pipe(z.iso.date().nullable()),
  rcStatus: optionalEnum(RC_STATUSES),
  serviceHistory: optionalEnum(SERVICE_HISTORIES),
  accidentHistory: z.enum(["no", "yes"]).transform((value) => value === "yes"),
  location: optionalText,
  description: optionalText,
  // Step 3 — owner (create only)
  ownerId: z.string(),
  acquisitionType: z.union([z.literal(""), z.enum(ACQUISITION_TYPES)]),
})

export type VehicleFormInput = z.input<typeof vehicleFormSchema>
export type VehicleFormOutput = z.output<typeof vehicleFormSchema>

/** Create also needs the catalog variant, the owner and the acquisition type. */
export const createVehicleFormSchema = vehicleFormSchema.extend({
  makeId: z.string().min(1, "Select a make"),
  modelId: z.string().min(1, "Select a model"),
  variantId: z.string().min(1, "Select a variant"),
  ownerId: z.string().min(1, "Select the owner"),
  acquisitionType: z.enum(ACQUISITION_TYPES, { error: "Select how the car was acquired" }),
})

export function toVehicleDetails(values: VehicleFormOutput): UpdateVehicleInput {
  return {
    year: values.year,
    registrationNumber: values.registrationNumber,
    fuelType: values.fuelType,
    transmission: values.transmission,
    kmDriven: values.kmDriven,
    numPreviousOwners: values.numPreviousOwners,
    colour: values.colour,
    insuranceValidUntil: values.insuranceValidUntil,
    rcStatus: values.rcStatus,
    serviceHistory: values.serviceHistory,
    accidentHistory: values.accidentHistory,
    location: values.location,
    description: values.description,
  }
}
