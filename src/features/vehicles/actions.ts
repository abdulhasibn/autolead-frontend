"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { env } from "@/lib/env"
import { ApiError } from "@/lib/api-error"
import {
  actionError,
  actionOk,
  validationError,
  type ActionResult,
} from "@/lib/action-result"
import { getModels, getVariants } from "@/features/catalog/api"
import type { ModelReadModel, VariantReadModel } from "@/features/catalog/types"
import { createOwner } from "@/features/owners/api"
import type { OwnerDto } from "@/features/owners/types"
import {
  changeVehicleStatus,
  confirmDocument,
  confirmMedia,
  createVehicle,
  deleteDocument,
  deleteMedia,
  getVehicle,
  requestDocumentUpload,
  requestMediaUpload,
  updateVehicle,
} from "./api"
import {
  changeVehicleStatusSchema,
  confirmDocumentSchema,
  confirmMediaSchema,
  createVehicleSchema,
  documentUploadSchema,
  mediaUploadSchema,
  updateVehicleSchema,
} from "./schemas"
import type {
  ChangeVehicleStatusResult,
  SignedUploadDto,
  VehicleDocumentDto,
  VehicleDto,
  VehicleMediaDto,
} from "./types"

const idSchema = z.guid()

async function requireSession() {
  const session = await auth()
  if (!session?.user) {
    throw new ApiError(401, "AUTHENTICATION_FAILED", "Not signed in")
  }
}

function revalidateVehicles() {
  revalidatePath("/vehicles", "layout")
}

export async function createVehicleAction(
  input: unknown
): Promise<ActionResult<VehicleDto>> {
  try {
    await requireSession()
    const parsed = createVehicleSchema.safeParse(input)
    if (!parsed.success) return validationError()

    // Same home-showroom fallback as leads: only accounts without one need it.
    let vehicle: VehicleDto
    try {
      vehicle = await createVehicle({ ...parsed.data, showroomId: null })
    } catch (err) {
      if (
        ApiError.isApiError(err) &&
        err.code === "SHOWROOM_REQUIRED" &&
        env.DEFAULT_SHOWROOM_ID
      ) {
        vehicle = await createVehicle({ ...parsed.data, showroomId: env.DEFAULT_SHOWROOM_ID })
      } else {
        throw err
      }
    }

    revalidateVehicles()
    return actionOk(vehicle)
  } catch (err) {
    return actionError(err)
  }
}

export async function updateVehicleAction(
  vehicleId: string,
  input: unknown
): Promise<ActionResult<VehicleDto>> {
  try {
    await requireSession()
    const id = idSchema.safeParse(vehicleId)
    const parsed = updateVehicleSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError()

    // PATCH replaces every field. The UI never shows loan status, so send the
    // stored value back unchanged instead of clearing it.
    const current = await getVehicle(id.data)
    const vehicle = await updateVehicle(id.data, {
      ...parsed.data,
      loanStatus: current.loanStatus,
    })
    revalidateVehicles()
    return actionOk(vehicle)
  } catch (err) {
    return actionError(err)
  }
}

export async function changeVehicleStatusAction(
  vehicleId: string,
  input: unknown
): Promise<ActionResult<ChangeVehicleStatusResult>> {
  try {
    await requireSession()
    const id = idSchema.safeParse(vehicleId)
    const parsed = changeVehicleStatusSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError()

    const result = await changeVehicleStatus(id.data, parsed.data)
    revalidateVehicles()
    revalidatePath("/leads", "layout")
    return actionOk(result)
  } catch (err) {
    return actionError(err)
  }
}

// ---------------------------------------------------------------------------
// Photos and documents: ticket → browser PUTs the bytes → confirm
// ---------------------------------------------------------------------------

export async function requestMediaUploadAction(
  vehicleId: string,
  input: unknown
): Promise<ActionResult<SignedUploadDto>> {
  try {
    await requireSession()
    const id = idSchema.safeParse(vehicleId)
    const parsed = mediaUploadSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError("Use a JPEG, PNG or WebP image.")

    return actionOk(
      await requestMediaUpload(id.data, parsed.data.category, parsed.data.contentType)
    )
  } catch (err) {
    return actionError(err)
  }
}

export async function confirmMediaAction(
  vehicleId: string,
  input: unknown
): Promise<ActionResult<VehicleMediaDto>> {
  try {
    await requireSession()
    const id = idSchema.safeParse(vehicleId)
    const parsed = confirmMediaSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError()

    const media = await confirmMedia(id.data, parsed.data)
    revalidateVehicles()
    return actionOk(media)
  } catch (err) {
    return actionError(err)
  }
}

export async function deleteMediaAction(
  vehicleId: string,
  mediaId: string
): Promise<ActionResult> {
  try {
    await requireSession()
    const id = idSchema.safeParse(vehicleId)
    const media = idSchema.safeParse(mediaId)
    if (!id.success || !media.success) return validationError()

    await deleteMedia(id.data, media.data)
    revalidateVehicles()
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}

export async function requestDocumentUploadAction(
  vehicleId: string,
  input: unknown
): Promise<ActionResult<SignedUploadDto>> {
  try {
    await requireSession()
    const id = idSchema.safeParse(vehicleId)
    const parsed = documentUploadSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError("Use a PDF, JPEG or PNG file.")

    return actionOk(
      await requestDocumentUpload(id.data, parsed.data.docType, parsed.data.contentType)
    )
  } catch (err) {
    return actionError(err)
  }
}

export async function confirmDocumentAction(
  vehicleId: string,
  input: unknown
): Promise<ActionResult<VehicleDocumentDto>> {
  try {
    await requireSession()
    const id = idSchema.safeParse(vehicleId)
    const parsed = confirmDocumentSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError()

    const document = await confirmDocument(id.data, parsed.data)
    revalidateVehicles()
    return actionOk(document)
  } catch (err) {
    return actionError(err)
  }
}

export async function deleteDocumentAction(
  vehicleId: string,
  documentId: string
): Promise<ActionResult> {
  try {
    await requireSession()
    const id = idSchema.safeParse(vehicleId)
    const document = idSchema.safeParse(documentId)
    if (!id.success || !document.success) return validationError()

    await deleteDocument(id.data, document.data)
    revalidateVehicles()
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}

// ---------------------------------------------------------------------------
// Lookups for the add-vehicle sheet
// ---------------------------------------------------------------------------

export async function getModelsAction(
  makeId: string
): Promise<ActionResult<ModelReadModel[]>> {
  try {
    await requireSession()
    const id = idSchema.safeParse(makeId)
    if (!id.success) return validationError()
    return actionOk((await getModels(id.data)).items)
  } catch (err) {
    return actionError(err)
  }
}

export async function getVariantsAction(
  modelId: string
): Promise<ActionResult<VariantReadModel[]>> {
  try {
    await requireSession()
    const id = idSchema.safeParse(modelId)
    if (!id.success) return validationError()
    return actionOk((await getVariants(id.data)).items)
  } catch (err) {
    return actionError(err)
  }
}

const quickOwnerSchema = z.object({
  fullName: z.string().trim().min(1),
  phone: z.string().trim().regex(/^\+[1-9]\d{6,14}$/),
  city: z
    .string()
    .trim()
    .transform((v) => (v ? v : null)),
})

/** Minimal owner record created from inside the add-vehicle flow. */
export async function createOwnerQuickAction(
  input: unknown
): Promise<ActionResult<OwnerDto>> {
  try {
    await requireSession()
    const parsed = quickOwnerSchema.safeParse(input)
    if (!parsed.success) return validationError()
    const owner = await createOwner(parsed.data)
    revalidatePath("/owners", "layout")
    return actionOk(owner)
  } catch (err) {
    return actionError(err)
  }
}
