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
  cancelFollowUp,
  changeLeadStatus,
  reopenLead,
  completeFollowUp,
  createLead,
  getLead,
  getLeads,
  scheduleFollowUp,
  suggestVehicles,
  updateLeadPreference,
} from "./api"
import {
  associateVehicleSchema,
  changeLeadStatusSchema,
  completeFollowUpSchema,
  createLeadSchema,
  leadPreferenceSchema,
  scheduleFollowUpSchema,
  suggestVehiclesSchema,
} from "./schemas"
import { isLeadClosed } from "./constants"
import type {
  CompleteFollowUpResult,
  FollowUpDto,
  LeadPreference,
  LeadReadModel,
  VehicleSuggestions,
} from "./types"

const leadIdSchema = z.guid()

async function requireSession() {
  const session = await auth()
  if (!session?.user) {
    throw new ApiError(401, "AUTHENTICATION_FAILED", "Not signed in")
  }
}

function revalidateLeads() {
  revalidatePath("/leads", "layout")
  // The dashboard lists overdue / today's follow-ups and leads without one.
  revalidatePath("/dashboard")
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

/** Admin: undo a mistaken conversion. The car goes back to linked. */
export async function reopenLeadAction(leadId: string): Promise<ActionResult<{ status: string }>> {
  try {
    await requireSession()
    const id = leadIdSchema.safeParse(leadId)
    if (!id.success) return validationError()

    const result = await reopenLead(id.data)
    revalidateLeads()
    return actionOk(result)
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

export async function completeFollowUpAction(
  leadId: string,
  followUpId: string,
  input: unknown
): Promise<ActionResult<CompleteFollowUpResult>> {
  try {
    await requireSession()
    const lead = leadIdSchema.safeParse(leadId)
    const followUp = leadIdSchema.safeParse(followUpId)
    const parsed = completeFollowUpSchema.safeParse(input)
    if (!lead.success || !followUp.success || !parsed.success) return validationError()

    const result = await completeFollowUp(lead.data, followUp.data, parsed.data)
    revalidateLeads()
    return actionOk(result)
  } catch (err) {
    return actionError(err)
  }
}

export async function cancelFollowUpAction(
  leadId: string,
  followUpId: string
): Promise<ActionResult<FollowUpDto>> {
  try {
    await requireSession()
    const lead = leadIdSchema.safeParse(leadId)
    const followUp = leadIdSchema.safeParse(followUpId)
    if (!lead.success || !followUp.success) return validationError()

    const result = await cancelFollowUp(lead.data, followUp.data)
    revalidateLeads()
    return actionOk(result)
  } catch (err) {
    return actionError(err)
  }
}

/** Read-only: suggested cars for the new-lead form, before the lead exists. */
export async function suggestVehiclesAction(
  input: unknown
): Promise<ActionResult<VehicleSuggestions>> {
  try {
    await requireSession()
    const parsed = suggestVehiclesSchema.safeParse(input)
    if (!parsed.success) return validationError()

    // Same showroom fallback as createLeadAction, so suggestions come from
    // the showroom the lead will be filed under.
    try {
      return actionOk(await suggestVehicles({ ...parsed.data, showroomId: null }))
    } catch (err) {
      if (
        ApiError.isApiError(err) &&
        err.code === "SHOWROOM_REQUIRED" &&
        env.DEFAULT_SHOWROOM_ID
      ) {
        return actionOk(
          await suggestVehicles({ ...parsed.data, showroomId: env.DEFAULT_SHOWROOM_ID })
        )
      }
      throw err
    }
  } catch (err) {
    return actionError(err)
  }
}

/**
 * Open leads that could buy a car, for the car page's "Mark as sold" picker.
 * Read-only. The API caps a page at 100 and salespeople only get their own
 * leads, so this is the same view the leads list gives them.
 */
export async function getSaleCandidateLeadsAction(): Promise<ActionResult<LeadReadModel[]>> {
  try {
    await requireSession()
    const page = await getLeads({ limit: 100 })
    return actionOk(page.items.filter((lead) => !isLeadClosed(lead.status)))
  } catch (err) {
    return actionError(err)
  }
}

const markVehicleSoldSchema = z.object({
  vehicleId: z.guid(),
  leadId: z.guid(),
  notes: z.string().trim().max(2000).nullable().optional(),
})

/**
 * Sells a car from the car page by converting the buying lead, which is what
 * marks the car sold. Walks the lead through the same steps the lead page
 * would: link it to this car (if it isn't), confirm the booking (if it isn't),
 * then convert. A failure part-way leaves the earlier steps in place; the
 * error names the step so the user can finish from the lead page.
 */
export async function markVehicleSoldAction(
  input: unknown
): Promise<ActionResult<LeadReadModel>> {
  try {
    await requireSession()
    const parsed = markVehicleSoldSchema.safeParse(input)
    if (!parsed.success) return validationError()
    const { vehicleId, leadId } = parsed.data
    const notes = parsed.data.notes || null

    let lead = await getLead(leadId)
    if (isLeadClosed(lead.status)) {
      throw new ApiError(422, "LEAD_CLOSED", "This lead is already closed.")
    }
    try {
      if (lead.vehicleId !== vehicleId) {
        lead = await associateVehicle(leadId, vehicleId)
      }
      if (lead.status !== "booking_confirmed") {
        lead = await changeLeadStatus(leadId, { status: "booking_confirmed", notes })
      }
      lead = await changeLeadStatus(leadId, { status: "converted", notes })
    } finally {
      // Earlier steps may have landed even if a later one failed.
      revalidateLeads()
    }
    return actionOk(lead)
  } catch (err) {
    return actionError(err)
  }
}
