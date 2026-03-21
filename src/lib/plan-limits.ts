import { db } from './db'
import type { Plan } from '@/types'

export const PLAN_LIMITS: Record<Plan, {
  seats: number
  callsPerMonth: number
  features: string[]
}> = {
  TRIAL: { seats: 5, callsPerMonth: 50, features: ['basic'] },
  STARTER: { seats: 5, callsPerMonth: 200, features: ['basic', 'playbook'] },
  PRO: { seats: 20, callsPerMonth: -1, features: ['basic', 'playbook', 'analytics', 'executive', 'gamification'] },
  ENTERPRISE: { seats: -1, callsPerMonth: -1, features: ['all'] },
}

export interface PlanStatus {
  allowed: boolean
  reason?: string
  plan: Plan
  trialDaysLeft?: number
  trialExpired: boolean
  seatsUsed: number
  seatsLimit: number
  callsThisMonth: number
  callsLimit: number
}

export async function checkPlanLimits(orgId: string): Promise<PlanStatus> {
  const org = await db.organization.findUnique({
    where: { id: orgId },
    include: {
      _count: {
        select: { users: true },
      },
    },
  })

  if (!org) {
    return {
      allowed: false,
      reason: 'הארגון לא נמצא',
      plan: 'TRIAL',
      trialExpired: true,
      seatsUsed: 0,
      seatsLimit: 0,
      callsThisMonth: 0,
      callsLimit: 0,
    }
  }

  const plan = org.plan as Plan
  const limits = PLAN_LIMITS[plan]

  // Check trial expiration
  let trialExpired = false
  let trialDaysLeft: number | undefined
  if (plan === 'TRIAL' && org.trialEndsAt) {
    const now = new Date()
    if (now > org.trialEndsAt) {
      trialExpired = true
    } else {
      trialDaysLeft = Math.ceil((org.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }
  }

  // Check plan expiration (for paid plans)
  if (org.planExpiresAt && new Date() > org.planExpiresAt) {
    return {
      allowed: false,
      reason: 'תוקף התוכנית שלך פג',
      plan,
      trialExpired: false,
      seatsUsed: org._count.users,
      seatsLimit: limits.seats,
      callsThisMonth: 0,
      callsLimit: limits.callsPerMonth,
    }
  }

  if (trialExpired) {
    return {
      allowed: false,
      reason: 'תקופת הניסיון הסתיימה',
      plan,
      trialExpired: true,
      trialDaysLeft: 0,
      seatsUsed: org._count.users,
      seatsLimit: limits.seats,
      callsThisMonth: 0,
      callsLimit: limits.callsPerMonth,
    }
  }

  // Count calls this month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const callsThisMonth = await db.call.count({
    where: {
      orgId,
      createdAt: { gte: monthStart },
    },
  })

  const seatsUsed = org._count.users
  const seatsLimit = org.planSeats > 0 ? org.planSeats : limits.seats
  const callsLimit = limits.callsPerMonth

  return {
    allowed: true,
    plan,
    trialExpired: false,
    trialDaysLeft,
    seatsUsed,
    seatsLimit,
    callsThisMonth,
    callsLimit,
  }
}

export function canUploadCall(status: PlanStatus): { allowed: boolean; reason?: string } {
  if (!status.allowed) {
    return { allowed: false, reason: status.reason }
  }
  if (status.callsLimit > 0 && status.callsThisMonth >= status.callsLimit) {
    return { allowed: false, reason: 'הגעת למגבלת השיחות בתוכנית שלך' }
  }
  return { allowed: true }
}

export function canAddUser(status: PlanStatus): { allowed: boolean; reason?: string } {
  if (!status.allowed) {
    return { allowed: false, reason: status.reason }
  }
  if (status.seatsLimit > 0 && status.seatsUsed >= status.seatsLimit) {
    return { allowed: false, reason: 'הגעת למגבלת המשתמשים בתוכנית שלך' }
  }
  return { allowed: true }
}
