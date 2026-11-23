import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { NotificationPageDto, NotificationReadModel } from "../types"

const fetchPage = vi.fn<() => Promise<NotificationPageDto>>()
const markRead = vi.fn<(id: string) => Promise<void>>()
vi.mock("../actions", () => ({
  fetchNotificationsAction: () => fetchPage(),
  markNotificationReadAction: (id: string) => markRead(id),
}))

import { NotificationDrawer } from "../components/notification-drawer"

function note(id: string, isRead = false): NotificationReadModel {
  return {
    id,
    type: "lead_assigned",
    title: `Lead ${id} assigned to you`,
    body: null,
    entityType: "lead",
    entityId: id,
    leadId: id,
    leadContactName: null,
    leadContactPhone: null,
    isRead,
    dueAt: null,
    createdAt: "2026-11-23T08:00:00.000Z",
  }
}

function page(items: NotificationReadModel[]): NotificationPageDto {
  return { items, total: items.length, limit: 50, offset: 0, unreadCount: items.filter((n) => !n.isRead).length }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

describe("NotificationDrawer", () => {
  beforeEach(() => {
    fetchPage.mockReset()
    markRead.mockReset()
  })

  it("Mark all read stays done when the opening refresh returns late", async () => {
    const unread = [note("a"), note("b")]
    // The refresh started by opening the drawer answers only after the click,
    // with the read state from before it.
    const stale = deferred<NotificationPageDto>()
    fetchPage.mockReturnValueOnce(stale.promise)
    fetchPage.mockResolvedValue(page(unread.map((n) => ({ ...n, isRead: true }))))
    markRead.mockResolvedValue(undefined)

    const user = userEvent.setup()
    render(<NotificationDrawer initialNotifications={unread} initialUnreadCount={2} />)
    await user.click(screen.getByRole("button", { name: /unread notifications/ }))
    await user.click(await screen.findByRole("button", { name: "Mark all read" }))
    await act(async () => stale.resolve(page(unread)))

    await waitFor(() => expect(markRead).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2))
    expect(screen.queryByRole("button", { name: "Mark all read" })).toBeNull()
  })

  it("shows what the server kept when marking fails", async () => {
    const unread = [note("a")]
    fetchPage.mockResolvedValueOnce(page(unread))
    fetchPage.mockResolvedValue(page(unread))
    markRead.mockRejectedValue(new Error("offline"))

    const user = userEvent.setup()
    render(<NotificationDrawer initialNotifications={unread} initialUnreadCount={1} />)
    await user.click(screen.getByRole("button", { name: /unread notifications/ }))
    await user.click(await screen.findByRole("button", { name: "Mark all read" }))

    expect(await screen.findByRole("button", { name: "Mark all read" })).toBeVisible()
  })
})
