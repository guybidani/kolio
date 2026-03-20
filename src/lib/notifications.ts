import { db } from './db'
import { Prisma } from '@prisma/client'
import type { NotificationType } from '@prisma/client'

/**
 * Create a new notification for a user.
 */
export async function createNotification(
  userId: string,
  orgId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, unknown>
) {
  return db.notification.create({
    data: {
      orgId,
      userId,
      type,
      title,
      body,
      data: data ? (JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue) : undefined,
    },
  })
}

/**
 * Get notifications for a user.
 */
export async function getNotifications(
  userId: string,
  orgId: string,
  options?: { unreadOnly?: boolean; limit?: number; offset?: number }
) {
  const { unreadOnly = false, limit = 20, offset = 0 } = options ?? {}

  const where: Record<string, unknown> = { userId, orgId }
  if (unreadOnly) where.read = false

  const [notifications, total] = await Promise.all([
    db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    db.notification.count({ where }),
  ])

  return { notifications, total }
}

/**
 * Get unread notification count for a user.
 */
export async function getUnreadCount(userId: string, orgId: string): Promise<number> {
  return db.notification.count({
    where: { userId, orgId, read: false },
  })
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string, userId: string, orgId: string) {
  return db.notification.update({
    where: { id: notificationId, userId, orgId },
    data: { read: true },
  })
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllRead(userId: string, orgId: string) {
  return db.notification.updateMany({
    where: { userId, orgId, read: false },
    data: { read: true },
  })
}

/**
 * Notify relevant users about a call event (e.g., after analysis).
 * Finds the user linked to the rep, plus the rep's manager if any.
 */
export async function notifyCallEvent(
  callId: string,
  orgId: string,
  repId: string,
  score: number | null,
  badges: Array<{ type: string; name: string }>
) {
  // Find the rep and their linked user + manager
  const rep = await db.rep.findUnique({
    where: { id: repId },
    select: {
      name: true,
      userId: true,
      managerId: true,
    },
  })
  if (!rep) return

  const userIds: string[] = []
  if (rep.userId) userIds.push(rep.userId)
  if (rep.managerId) userIds.push(rep.managerId)
  if (userIds.length === 0) return

  const notifications: Array<{
    userId: string
    type: NotificationType
    title: string
    body: string
    data: Record<string, unknown>
  }> = []

  // High score notification
  if (score !== null && score >= 9.0) {
    for (const uid of userIds) {
      notifications.push({
        userId: uid,
        type: 'HIGH_SCORE',
        title: 'ציון גבוה!',
        body: `${rep.name} קיבל/ה ציון ${score.toFixed(1)} בשיחה`,
        data: { callId, repId, score },
      })
    }
  }

  // Low score notification (only to the rep's manager)
  if (score !== null && score < 4.0 && rep.managerId) {
    notifications.push({
      userId: rep.managerId,
      type: 'LOW_SCORE',
      title: 'ציון נמוך - דרוש תשומת לב',
      body: `${rep.name} קיבל/ה ציון ${score.toFixed(1)} בשיחה`,
      data: { callId, repId, score },
    })
  }

  // Badge earned notifications
  for (const badge of badges) {
    for (const uid of userIds) {
      notifications.push({
        userId: uid,
        type: 'BADGE_EARNED',
        title: 'תג חדש!',
        body: `${rep.name} הרוויח/ה את התג "${badge.name}"`,
        data: { callId, repId, badgeType: badge.type },
      })
    }
  }

  // Create all notifications
  if (notifications.length > 0) {
    await db.notification.createMany({
      data: notifications.map((n) => ({
        orgId,
        userId: n.userId,
        type: n.type,
        title: n.title,
        body: n.body,
        data: JSON.parse(JSON.stringify(n.data)) as Prisma.InputJsonValue,
      })),
    })
  }
}
