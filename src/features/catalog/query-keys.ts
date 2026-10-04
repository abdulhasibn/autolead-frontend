export const catalogQueryKeys = {
  all: ["catalog"] as const,
  makes: () => [...catalogQueryKeys.all, "makes"] as const,
  models: (makeId: string) =>
    [...catalogQueryKeys.all, "models", makeId] as const,
  variants: (modelId: string) =>
    [...catalogQueryKeys.all, "variants", modelId] as const,
}
