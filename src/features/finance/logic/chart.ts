/** True when at least one value is a real, non-zero number worth drawing. */
export function hasChartData(values: number[]): boolean {
  return values.some((v) => Number.isFinite(v) && v !== 0)
}
