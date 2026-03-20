import { db } from './db'
import type { StreakType } from '@prisma/client'

export interface StreakStatus {
  type: StreakType
  currentCount: number
  bestCount: number
  isAtRisk: boolean // true if streak might break (no activity today)
}

/**
 * Update streaks after a call is completed.
 * Returns current streak statuses.
 */
export async function updateStreaks(
  repId: string,
  orgId: string,
  callScore: number | null
): Promise<StreakStatus[]> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const results: StreakStatus[] = []

  // DAILY_CALLS streak: at least 1 call per day
  results.push(await updateStreak(orgId, repId, 'DAILY_CALLS', today, true))

  // HIGH_SCORE streak: scored 7.0+ on consecutive calls
  if (callScore !== null) {
    const qualifies = callScore >= 7.0
    results.push(await updateStreak(orgId, repId, 'HIGH_SCORE', today, qualifies))
  }

  return results
}

async function updateStreak(
  orgId: string,
  repId: string,
  type: StreakType,
  today: Date,
  qualifies: boolean
): Promise<StreakStatus> {
  const existing = await db.streak.findUnique({
    where: { orgId_repId_type: { orgId, repId, type } },
  })

  if (!existing) {
    // Create new streak
    const streak = await db.streak.create({
      data: {
        orgId,
        repId,
        type,
        currentCount: qualifies ? 1 : 0,
        bestCount: qualifies ? 1 : 0,
        lastDate: today,
      },
    })
    return {
      type,
      currentCount: streak.currentCount,
      bestCount: streak.bestCount,
      isAtRisk: false,
    }
  }

  const lastDate = new Date(existing.lastDate)
  const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())
  const daysDiff = Math.floor((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24))

  let newCount = existing.currentCount

  if (daysDiff === 0) {
    // Same day - don't increment for daily, but for HIGH_SCORE it updates per call
    if (type === 'HIGH_SCORE') {
      newCount = qualifies ? existing.currentCount + 1 : 0
    }
    // For DAILY_CALLS on same day, keep current count
  } else if (daysDiff === 1) {
    // Consecutive day
    newCount = qualifies ? existing.currentCount + 1 : 0
  } else {
    // Gap - streak broken, start fresh
    newCount = qualifies ? 1 : 0
  }

  const newBest = Math.max(existing.bestCount, newCount)

  const streak = await db.streak.update({
    where: { orgId_repId_type: { orgId, repId, type } },
    data: {
      currentCount: newCount,
      bestCount: newBest,
      lastDate: today,
    },
  })

  return {
    type,
    currentCount: streak.currentCount,
    bestCount: streak.bestCount,
    isAtRisk: false,
  }
}

/**
 * Get all streaks for a rep.
 */
export async function getRepStreaks(
  repId: string,
  orgId: string
): Promise<StreakStatus[]> {
  const streaks = await db.streak.findMany({
    where: { orgId, repId },
  })

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return streaks.map((s) => {
    const lastDay = new Date(s.lastDate)
    const lastDayStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate())
    const daysDiff = Math.floor(
      (todayStart.getTime() - lastDayStart.getTime()) / (1000 * 60 * 60 * 24)
    )

    // At risk if last activity was yesterday and no activity today yet
    const isAtRisk = daysDiff === 1 && s.currentCount > 0

    // Already broken if more than 1 day gap
    const currentCount = daysDiff > 1 ? 0 : s.currentCount

    return {
      type: s.type,
      currentCount,
      bestCount: s.bestCount,
      isAtRisk,
    }
  })
}
