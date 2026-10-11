"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { ApiError } from "@/lib/api-error"
import {
  actionError,
  actionOk,
  validationError,
  type ActionResult,
} from "@/lib/action-result"
import { createOwner, deleteOwner, updateOwner } from "./api"
import { createOwnerSchema } from "./schemas"
import type { OwnerDto } from "./types"

const ownerIdSchema = z.guid()

async function requireSession() {
  const session = await auth()
  if (!session?.user) {
    throw new ApiError(401, "AUTHENTICATION_FAILED", "Not signed in")
  }
}

function revalidateOwners() {
  revalidatePath("/owners", "layout")
}

export async function createOwnerAction(
  input: unknown
): Promise<ActionResult<OwnerDto>> {
  try {
    await requireSession()
    const parsed = createOwnerSchema.safeParse(input)
    if (!parsed.success) return validationError()
    const owner = await createOwner(parsed.data)
    revalidateOwners()
    return actionOk(owner)
  } catch (err) {
    return actionError(err)
  }
}

export async function updateOwnerAction(
  ownerId: string,
  input: unknown
): Promise<ActionResult<OwnerDto>> {
  try {
    await requireSession()
    const id = ownerIdSchema.safeParse(ownerId)
    const parsed = createOwnerSchema.safeParse(input)
    if (!id.success || !parsed.success) return validationError()
    const owner = await updateOwner(id.data, parsed.data)
    revalidateOwners()
    return actionOk(owner)
  } catch (err) {
    return actionError(err)
  }
}

export async function deactivateOwnerAction(
  ownerId: string
): Promise<ActionResult> {
  try {
    await requireSession()
    const id = ownerIdSchema.safeParse(ownerId)
    if (!id.success) return validationError()
    await deleteOwner(id.data)
    revalidateOwners()
    return actionOk(undefined)
  } catch (err) {
    return actionError(err)
  }
}
