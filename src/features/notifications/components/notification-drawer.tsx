"use client"

import { useState, useTransition, useCallback } from "react"
import { Bell, CheckCheck, ChevronDown, User, Phone, ExternalLink } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/format"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { fetchNotificationsAction, markNotificationReadAction } from "../actions"
import type { NotificationReadModel, NotificationPageDto } from "../types"

interface NotificationDrawerProps {
  initialNotifications: NotificationReadModel[]
  initialUnreadCount: number
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

interface NotificationRowProps {
  notification: NotificationReadModel
  expanded: boolean
  onToggle: () => void
}

function NotificationRow({ notification, expanded, onToggle }: NotificationRowProps) {
  const n = notification
  const hasLead = n.leadId !== null

  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full text-left px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:bg-muted/60",
        "border-b border-border last:border-0",
        !n.isRead && "bg-primary/5"
      )}
    >
      {/* Row header */}
      <div className="flex items-start gap-3">
        {/* Unread dot */}
        <span
          className={cn(
            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
            n.isRead ? "bg-transparent" : "bg-primary"
          )}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm leading-snug", !n.isRead && "font-semibold text-foreground", n.isRead && "text-foreground/80")}>
            {n.title}
          </p>

          {/* Contact quick-info */}
          {(n.leadContactName ?? n.leadContactPhone) && (
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {n.leadContactName && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  {n.leadContactName}
                </span>
              )}
              {n.leadContactPhone && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {n.leadContactPhone}
                </span>
              )}
            </div>
          )}

          <p className="mt-1 text-[11px] text-subtle-foreground">
            {n.dueAt ? `Due ${formatDateTime(n.dueAt)}` : timeAgo(n.createdAt)}
          </p>
        </div>

        <ChevronDown
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
            expanded && "rotate-180"
          )}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div
          className="mt-3 ml-5 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {n.body && (
            <p className="text-sm text-muted-foreground whitespace-pre-line">{n.body}</p>
          )}

          <div className="text-xs text-subtle-foreground space-y-0.5">
            <p>Created: {formatDateTime(n.createdAt)}</p>
            {n.dueAt && <p>Due: {formatDateTime(n.dueAt)}</p>}
          </div>

          {hasLead && (
            <Link
              href={`/leads/${n.leadId}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              View lead
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}
    </button>
  )
}

export function NotificationDrawer({
  initialNotifications,
  initialUnreadCount,
}: NotificationDrawerProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationReadModel[]>(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isRefreshing, startRefresh] = useTransition()
  const [, startMarkRead] = useTransition()

  const refresh = useCallback(() => {
    startRefresh(async () => {
      try {
        const page: NotificationPageDto = await fetchNotificationsAction(50)
        setNotifications(page.items)
        setUnreadCount(page.unreadCount)
      } catch {
        // keep stale data
      }
    })
  }, [])

  function handleOpen(next: boolean) {
    setOpen(next)
    if (next) refresh()
  }

  function handleToggle(n: NotificationReadModel) {
    const nextExpanded = expandedId === n.id ? null : n.id
    setExpandedId(nextExpanded)

    if (!n.isRead && nextExpanded === n.id) {
      // optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      )
      setUnreadCount((c) => Math.max(0, c - 1))

      startMarkRead(async () => {
        try {
          await markNotificationReadAction(n.id)
        } catch {
          // revert on failure
          setNotifications((prev) =>
            prev.map((item) => (item.id === n.id ? { ...item, isRead: false } : item))
          )
          setUnreadCount((c) => c + 1)
        }
      })
    }
  }

  function handleMarkAllRead() {
    const unread = notifications.filter((n) => !n.isRead)
    if (unread.length === 0) return

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)

    startMarkRead(async () => {
      try {
        await Promise.all(unread.map((n) => markNotificationReadAction(n.id)))
      } catch {
        refresh()
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      {/* Bell trigger */}
      <button
        onClick={() => handleOpen(true)}
        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : "Notifications"
        }
        className={cn(
          "relative inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
          "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-0.5 text-[10px] font-bold text-primary-foreground leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center justify-between pr-8">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="h-7 px-2 text-xs gap-1.5"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isRefreshing && notifications.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-6">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  expanded={expandedId === n.id}
                  onToggle={() => handleToggle(n)}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
