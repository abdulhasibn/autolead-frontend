export interface MakeReadModel {
  id: string
  name: string
}

export interface ModelReadModel {
  id: string
  makeId: string
  name: string
}

export interface VariantReadModel {
  id: string
  modelId: string
  name: string
  fuelType: string | null
  transmission: string | null
  exShowroomPrice: number | null
}
