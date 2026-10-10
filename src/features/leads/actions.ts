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
import {
  associateVehicle,
  changeLeadStatus,
  createLead,
  scheduleFollowUp,
  updateLeadPreference,
} from "./api"
import {
  associateVehicleSchema,
  changeLeadStatusSchema,
  createLeadSchema,
  leadPreferenceSchema,
  scheduleFollowUpSchema,
} from "./schemas"
import type { FollowUpDto, LeadPreference, LeadReadModel } from "./types"

const leadIdSchema = z.guid()

async function requireSession() {
  const session = await auth()
  if (!session?.user) {
    throw new ApiError(401, "AUTHENTICATION_FAILED", "Not signed in")
  }
}

function revalidateLeads() {
  revalidatePath("/leads", "layout")
  // Car pages show linked and suggested leads with match scores.
  revalidatePath("/vehicles", "layout")
}

export async function createLeadAction(
  input: unknown
): Promise<ActionResult<LeadReadModel>> {
  try {
    await requireSession()
    const parsed = createLeadSchema.safeParse(input)
    if (!parsed.success) return validationError()

    // The backend files the lead under the caller's home showroom. Only
    // accounts without one need an explicit id, so fall back to the default.
    let lead: LeadReadModel
    try {
      lead = await createLead({ ...parsed.data, showroomId: null })
    } catch (err) {
      if (
        ApiError.isApiError(err) &&
        err.code === "SHOWROOM_REQUIRED" &&
        env.DEFAULT_SHOWROOM_ID
      ) {
        lead = await createLead({
          ...parsed.data,
          showroomId: env.DEFAULT_SHOWROOM_ID,
        })
      } else {
        throw err
      }
    }

    revalidateLeads()
    return actionOk(lead)
  } catch (err) {
    return actionError(err)
  }
}

export async function changeLeadStatusAction(
  leadId: string,
  input: unknown
): Promise<ActionResult<LeadReadModel>> {
  try {
    await requireSession()
    const id = leadIdSchema.safeParse(leadId)
    const parsed = changeLeadStatusSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError()

    const lead = await changeLeadStatus(id.data, parsed.data)
    revalidateLeads()
    return actionOk(lead)
  } catch (err) {
    return actionError(err)
  }
}

export async function scheduleFollowUpAction(
  leadId: string,
  input: unknown
): Promise<ActionResult<FollowUpDto>> {
  try {
    await requireSession()
    const id = leadIdSchema.safeParse(leadId)
    const parsed = scheduleFollowUpSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError()

    const followUp = await scheduleFollowUp(id.data, parsed.data)
    revalidateLeads()
    return actionOk(followUp)
  } catch (err) {
    return actionError(err)
  }
}

export async function associateVehicleAction(
  leadId: string,
  input: unknown
): Promise<ActionResult<LeadReadModel>> {
  try {
    await requireSession()
    const id = leadIdSchema.safeParse(leadId)
    const parsed = associateVehicleSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError()

    const lead = await associateVehicle(id.data, parsed.data.vehicleId)
    revalidateLeads()
    return actionOk(lead)
  } catch (err) {
    return actionError(err)
  }
}

export async function updateLeadPreferenceAction(
  leadId: string,
  input: unknown
): Promise<ActionResult<LeadPreference>> {
  try {
    await requireSession()
    const id = leadIdSchema.safeParse(leadId)
    const parsed = leadPreferenceSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError()

    const preference = await updateLeadPreference(id.data, parsed.data)
    revalidateLeads()
    return actionOk(preference)
  } catch (err) {
    return actionError(err)
  }
}
