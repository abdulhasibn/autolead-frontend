import { z } from "zod"

const registrationRegex = /^[A-Z0-9]{1,16}$/

export const createVehicleSchema = z.object({
  showroomId: z.string().uuid(),
  ownerId: z.string().uuid(),
  variantId: z.string().uuid(),
  year: z.number().int().min(1900).max(2100),
  registrationNumber: z
    .string()
    .regex(registrationRegex, "Registration must be uppercase alphanumeric, max 16 chars"),
  fuelType: z.enum(["petrol", "diesel", "cng", "electric", "hybrid"]),
  transmission: z.enum(["manual", "automatic", "amt", "cvt", "dct"]),
  kmDriven: z.number().int().min(0),
  numPreviousOwners: z.number().int().min(0).max(32767),
  colour: z.string().min(1),
  insuranceValidUntil: z.string().nullable().optional(),
  rcStatus: z.enum(["clear", "hypothecation", "under_transfer"]).nullable().optional(),
  serviceHistory: z.enum(["full", "partial", "none", "unknown"]).nullable().optional(),
  accidentHistory: z.boolean().default(false),
  loanStatus: z.enum(["clear", "active"]).nullable().optional(),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  acquisitionType: z.enum(["dealership_purchase", "consignment", "intermediary_sale"]),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
