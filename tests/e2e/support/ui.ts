/** Small UI helpers for the CRM's base-ui widgets (no app code changes). */
import { expect, type Locator, type Page } from "@playwright/test"

/** base-ui Select: open the combobox, click the option. */
export async function pick(scope: Page | Locator, combobox: string | RegExp, option: string | RegExp) {
  const page = "page" in scope ? scope.page() : scope
  await scope.getByRole("combobox", { name: combobox }).click()
  await page.getByRole("option", { name: option, exact: typeof option === "string" }).click()
}

/** Sonner toast with the given text. */
export function toast(page: Page, text: string | RegExp): Locator {
  return page.getByRole("region", { name: /Notifications/ }).getByText(text)
}

export function dialog(page: Page, name: string | RegExp): Locator {
  return page.getByRole("dialog", { name })
}

/** Fails if the page scrolls horizontally (mobile layout check). */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  )
  expect(overflow, "page should not scroll horizontally").toBeLessThanOrEqual(1)
}

/** Today + n days at hh:mm local, as `YYYY-MM-DDTHH:mm` for datetime-local inputs. */
export function localDateTime(daysFromNow: number, hh: number, mm = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hh, mm, 0, 0)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(hh)}:${p(mm)}`
}
