import { serverApiClient } from "@/lib/api-client.server"
import type { Page } from "@/types/api"
import type { MakeReadModel, ModelReadModel, VariantReadModel } from "./types"

export async function getMakes(): Promise<Page<MakeReadModel>> {
  return serverApiClient.get<Page<MakeReadModel>>("/catalog/makes")
}

export async function getModels(makeId: string): Promise<Page<ModelReadModel>> {
  return serverApiClient.get<Page<ModelReadModel>>(
    `/catalog/makes/${makeId}/models`
  )
}

export async function getVariants(
  modelId: string
): Promise<Page<VariantReadModel>> {
  return serverApiClient.get<Page<VariantReadModel>>(
    `/catalog/models/${modelId}/variants`
  )
}
