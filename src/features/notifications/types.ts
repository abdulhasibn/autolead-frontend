export interface NotificationReadModel {
  id: string
  type: "follow_up_due"
  title: string
  body: string | null
  entityType: "lead" | null
  entityId: string | null
  isRead: boolean
  dueAt: string | null
  createdAt: string
}
