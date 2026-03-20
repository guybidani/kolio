import { db } from './db'
import { Prisma } from '@prisma/client'
import type { BadgeType } from '@prisma/client'

interface BadgeDefinition {
  type: BadgeType
  name: string
  description: string
}

const BADGE_DEFINITIONS: Record<BadgeType, Omit<BadgeDefinition, 'type'>> = {
  FIRST_CALL: {
    name: 'שיחה ראשונה',
    description: 'העלית את השיחה הראשונה שלך לניתוח',
  },
  PERFECT_SCORE: {
    name: 'ציון מושלם',
    description: 'קיבלת ציון 90+ בשיחה',
  },
  STREAK_7: {
    name: 'רצף שבועי',
    description: '7 ימים רצופים של שיחות',
  },
  STREAK_30: {
    name: 'רצף חודשי',
    description: '30 ימים רצופים של שיחות',
  },
  OBJECTION_MASTER: {
    name: 'מאסטר התנגדויות',
    description: 'טיפלת ב-10+ התנגדויות בהצלחה',
  },
  DISCOVERY_PRO: {
    name: 'מומחה גילוי צרכים',
    description: 'ציון 90+ בגילוי צרכים 3 פעמים ברצף',
  },
  CLOSER: {
    name: 'סוגר עסקאות',
    description: 'ציון 90+ בסגירה 3 פעמים ברצף',
  },
  MOST_IMPROVED: {
    name: 'השיפור הגדול',
    description: 'השיפור הגדול ביותר בציון השבוע',
  },
  REP_OF_THE_WEEK: {
    name: 'נציג השבוע',
    description: 'הנציג עם הביצועים הטובים ביותר השבוע',
  },
  HUNDRED_CALLS: {
    name: '100 שיחות',
    description: '100 שיחות נותחו',
  },
}

export function getBadgeDefinition(type: BadgeType) {
  return { type, ...BADGE_DEFINITIONS[type] }
}

export function getAllBadgeDefinitions() {
  return Object.entries(BADGE_DEFINITIONS).map(([type, def]) => ({
    type: type as BadgeType,
    ...def,
  }))
}

interface AwardedBadge {
  type: BadgeType
  name: string
  description: string
}

/**
 * Check all badge conditions after a call is analyzed and award new ones.
 * Returns list of newly earned badges.
 */
export async function checkAndAwardBadges(
  callId: string,
  orgId: string,
  repId: string
): Promise<AwardedBadge[]> {
  const awarded: AwardedBadge[] = []

  const call = await db.call.findUnique({
    where: { id: callId },
    select: {
      overallScore: true,
      scores: true,
      objections: true,
    },
  })
  if (!call) return awarded

  const existingBadges = await db.badge.findMany({
    where: { orgId, repId },
    select: { type: true, weekOf: true },
  })
  const existingTypes = new Set(existingBadges.map((b) => b.type))

  // Helper: award a badge if not already earned
  async function award(type: BadgeType, weekOf?: Date) {
    // For weekly badges, check if already earned this week
    if (weekOf) {
      const alreadyThisWeek = existingBadges.some(
        (b) => b.type === type && b.weekOf?.getTime() === weekOf.getTime()
      )
      if (alreadyThisWeek) return
    } else if (existingTypes.has(type)) {
      return
    }

    const def = BADGE_DEFINITIONS[type]
    await db.badge.create({
      data: {
        orgId,
        repId,
        type,
        name: def.name,
        description: def.description,
        weekOf: weekOf || null,
      },
    })
    awarded.push({ type, name: def.name, description: def.description })
  }

  // FIRST_CALL: first call ever for this rep
  if (!existingTypes.has('FIRST_CALL')) {
    const callCount = await db.call.count({
      where: { orgId, repId, status: 'COMPLETE' },
    })
    if (callCount >= 1) {
      await award('FIRST_CALL')
    }
  }

  // HUNDRED_CALLS: 100 completed calls
  if (!existingTypes.has('HUNDRED_CALLS')) {
    const callCount = await db.call.count({
      where: { orgId, repId, status: 'COMPLETE' },
    })
    if (callCount >= 100) {
      await award('HUNDRED_CALLS')
    }
  }

  // PERFECT_SCORE: scored 90+ (9.0+ on 1-10 scale) on a call
  const score = call.overallScore
  if (score && score >= 9.0 && !existingTypes.has('PERFECT_SCORE')) {
    await award('PERFECT_SCORE')
  }

  // OBJECTION_MASTER: handled 10+ objections well across all calls
  if (!existingTypes.has('OBJECTION_MASTER')) {
    const completedCalls = await db.call.findMany({
      where: { orgId, repId, status: 'COMPLETE' },
      select: { objections: true },
    })
    let totalObjections = 0
    for (const c of completedCalls) {
      if (Array.isArray(c.objections)) {
        totalObjections += (c.objections as unknown[]).length
      }
    }
    if (totalObjections >= 10) {
      await award('OBJECTION_MASTER')
    }
  }

  // DISCOVERY_PRO: scored 9.0+ on discovery 3 times in a row
  if (!existingTypes.has('DISCOVERY_PRO')) {
    const recentCalls = await db.call.findMany({
      where: { orgId, repId, status: 'COMPLETE', scores: { not: Prisma.AnyNull } },
      orderBy: { recordedAt: 'desc' },
      take: 3,
      select: { scores: true },
    })
    if (recentCalls.length >= 3) {
      const allHighDiscovery = recentCalls.every((c) => {
        const s = c.scores as Record<string, number> | null
        return s && (s.discovery ?? 0) >= 9.0
      })
      if (allHighDiscovery) {
        await award('DISCOVERY_PRO')
      }
    }
  }

  // CLOSER: scored 9.0+ on closing 3 times in a row
  if (!existingTypes.has('CLOSER')) {
    const recentCalls = await db.call.findMany({
      where: { orgId, repId, status: 'COMPLETE', scores: { not: Prisma.AnyNull } },
      orderBy: { recordedAt: 'desc' },
      take: 3,
      select: { scores: true },
    })
    if (recentCalls.length >= 3) {
      const allHighClosing = recentCalls.every((c) => {
        const s = c.scores as Record<string, number> | null
        return s && (s.closing ?? 0) >= 9.0
      })
      if (allHighClosing) {
        await award('CLOSER')
      }
    }
  }

  // STREAK_7 and STREAK_30: check current daily streak
  const streak = await db.streak.findUnique({
    where: { orgId_repId_type: { orgId, repId, type: 'DAILY_CALLS' } },
  })
  if (streak) {
    if (streak.currentCount >= 7 && !existingTypes.has('STREAK_7')) {
      await award('STREAK_7')
    }
    if (streak.currentCount >= 30 && !existingTypes.has('STREAK_30')) {
      await award('STREAK_30')
    }
  }

  return awarded
}
