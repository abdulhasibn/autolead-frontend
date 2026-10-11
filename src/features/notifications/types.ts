export interface NotificationReadModel {
  id: string
  type: string
  title: string
  body: string | null
  entityType: string | null
  entityId: string | null
  leadId: string | null
  leadContactName: string | null
  leadContactPhone: string | null
  isRead: boolean
  dueAt: string | null
  createdAt: string
}

export interface NotificationPageDto {
  items: NotificationReadModel[]
  total: number
  limit: number
  offset: number
  unreadCount: number
}
