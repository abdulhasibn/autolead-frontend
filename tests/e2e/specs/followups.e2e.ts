/** Follow-ups on a lead: schedule, complete (with or without a next one), cancel. */
import type { Locator, Page } from "@playwright/test"
import { test, expect } from "../fixtures"
import { dialog, pick, toast } from "../support/ui"

// The business runs on IST; dates on screen and in the DB must agree.
test.use({ timezoneId: "Asia/Kolkata" })

const DAY = 86_400_000
const OPEN = "completed_at=is.null&deleted_at=is.null"

/** Calendar day in IST, `daysFromNow` days from today, at hh:mm IST, as a UTC instant. */
function istInstant(daysFromNow: number, hh: number, mm = 0): Date {
  const ist = new Date(Date.now() + 5.5 * 3_600_000 + daysFromNow * DAY)
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), hh, mm) - 5.5 * 3_600_000)
}

/** Opens the date-time picker in `scope`, picks a preset day and a time slot. */
async function pickDateTime(page: Page, scope: Locator, preset: "Tomorrow" | "In 3 days" | "Next week", time: string) {
  await scope.getByLabel("Date and time").click()
  await page.getByRole("button", { name: preset }).click()
  await pick(page, "Time", time)
  await page.getByRole("button", { name: "Done", exact: true }).click()
}

test.describe("follow-ups", () => {
  test("@smoke FU-01 schedule a call for tomorrow 10:00 IST; stored and shown at that time", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: /Schedule follow-up|^Follow-up$/ }).first().click()
    const d = dialog(page, "Schedule follow-up")
    await pickDateTime(page, d, "Tomorrow", "10:00 AM")
    await pick(d, "Task", "Call")
    await d.getByLabel("Notes").fill(`FU-01 ${e2e.prefix}`)
    await d.getByRole("button", { name: "Schedule" }).click()
    await expect(toast(page, "Follow-up scheduled.")).toBeVisible()

    const rows = await db.select("follow_ups", `lead_id=eq.${lead.id}&${OPEN}`, "scheduled_at,task_type")
    expect(rows).toHaveLength(1)
    expect(new Date(rows[0].scheduled_at).toISOString()).toBe(istInstant(1, 10).toISOString())
    expect(rows[0].task_type).toBe("call")
    await expect(page.getByText(/10:00\s?(AM|am)/).first()).toBeVisible()
  })

  test("@regression FU-02 past days can't be picked", async ({ page, api, e2e }) => {
    const now = new Date(Date.now() + 5.5 * 3_600_000)
    test.skip(now.getUTCDate() === 1, "yesterday is in last month's calendar page")
    const lead = await api.createLead(e2e.prefix)
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: /Schedule follow-up|^Follow-up$/ }).first().click()
    const d = dialog(page, "Schedule follow-up")
    await d.getByLabel("Date and time").click()
    const grid = page.getByRole("grid")
    const day = (n: number) => grid.getByRole("button", { name: new RegExp(`\\b${n}(st|nd|rd|th)?,`) }).first()
    await expect(day(now.getUTCDate() - 1)).toBeDisabled()
    await expect(day(now.getUTCDate())).toBeEnabled()
  })

  test("@smoke FU-03 complete with an outcome and schedule the next one", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    const first = await api.scheduleFollowUp(lead.id, istInstant(0, 21))
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: /^Done$|Mark follow-up done/ }).first().click()
    const d = dialog(page, "Complete follow-up")
    await pick(d, "Outcome", "No answer")
    // "No answer" ticks "Schedule the next follow-up" by itself.
    await expect(d.getByRole("checkbox", { name: "Schedule the next follow-up" })).toBeChecked()
    await pickDateTime(page, d, "In 3 days", "11:00 AM")
    await d.getByRole("button", { name: "Complete" }).click()
    await expect(toast(page, "Follow-up done. Next one scheduled.")).toBeVisible()

    const old = await db.one("follow_ups", `id=eq.${first.id}`, "completed_at,outcome")
    expect(old.completed_at).not.toBeNull()
    expect(old.outcome).toBe("no_answer")
    const open = await db.select("follow_ups", `lead_id=eq.${lead.id}&${OPEN}`, "scheduled_at")
    expect(open).toHaveLength(1)
    expect(new Date(open[0].scheduled_at).toISOString()).toBe(istInstant(3, 11).toISOString())
  })

  test("@regression FU-04 complete without a next one leaves nothing scheduled", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    await api.scheduleFollowUp(lead.id, istInstant(1, 12))
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: /^Done$|Mark follow-up done/ }).first().click()
    const d = dialog(page, "Complete follow-up")
    await pick(d, "Outcome", "Reached")
    await expect(d.getByRole("checkbox", { name: "Schedule the next follow-up" })).not.toBeChecked()
    await d.getByRole("button", { name: "Complete" }).click()
    await expect(toast(page, /^Follow-up done\.$/)).toBeVisible()
    await expect(page.getByText("Nothing scheduled.")).toBeVisible()
    expect(await db.select("follow_ups", `lead_id=eq.${lead.id}&${OPEN}`, "id")).toHaveLength(0)
  })

  test("@regression FU-05 cancel a follow-up", async ({ page, api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    await api.scheduleFollowUp(lead.id, istInstant(2, 15))
    await page.goto(`/leads/${lead.id}`)
    await page.getByRole("button", { name: "Cancel", exact: true }).first().click()
    await page.getByRole("alertdialog").or(page.getByRole("dialog")).last().getByRole("button", { name: /Cancel follow-up|Yes|Confirm/ }).click()
    await expect(toast(page, "Follow-up cancelled.")).toBeVisible()
    await expect(page.getByText("Nothing scheduled.")).toBeVisible()
    expect(await db.select("follow_ups", `lead_id=eq.${lead.id}&${OPEN}`, "id")).toHaveLength(0)
  })

  test("@regression FU-06 completing an already completed follow-up is refused, no duplicate", async ({ api, e2e, db }) => {
    const lead = await api.createLead(e2e.prefix)
    const fu = await api.scheduleFollowUp(lead.id, istInstant(1, 9))
    const path = `/leads/${lead.id}/follow-ups/${fu.id}/complete`
    const first = await api.call("POST", path, { outcome: "reached" })
    expect(first.status).toBeLessThan(300)
    const again = await api.call("POST", path, { outcome: "reached" })
    expect(again.status).toBeGreaterThanOrEqual(400)
    expect(again.status).toBeLessThan(500)
    expect(await db.select("follow_ups", `lead_id=eq.${lead.id}`, "id")).toHaveLength(1)
  })

  test("@regression FU-07 a follow-up at 23:30 IST stays on its IST date", async ({ page, api, e2e }) => {
    const lead = await api.createLead(e2e.prefix)
    const at = istInstant(1, 23, 30) // 18:00 UTC the same day
    await api.scheduleFollowUp(lead.id, at)
    await page.goto(`/leads/${lead.id}`)
    const label = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" }).format(at)
    const [dayNum, mon] = label.split(" ")
    await expect(page.getByText(new RegExp(`${dayNum}\\s+${mon}.*11:30\\s?(PM|pm)`)).first()).toBeVisible()
  })

  test("@regression FU-08 open follow-ups are listed earliest first", async ({ page, api, e2e }) => {
    const lead = await api.createLead(e2e.prefix)
    await api.scheduleFollowUp(lead.id, istInstant(5, 10), { taskType: "meeting" })
    await api.scheduleFollowUp(lead.id, istInstant(1, 10), { taskType: "whatsapp" })
    await page.goto(`/leads/${lead.id}`)
    const whatsapp = page.locator(':text-is("WhatsApp"):visible').first()
    const meeting = page.locator(':text-is("Meeting"):visible').first()
    await expect(whatsapp).toBeVisible()
    const [w, m] = await Promise.all([whatsapp.boundingBox(), meeting.boundingBox()])
    expect(w!.y).toBeLessThan(m!.y)
  })
})
