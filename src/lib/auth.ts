import { auth, currentUser } from '@clerk/nextjs/server'
import { db } from './db'

export async function getOrg() {
  const { orgId } = await auth()
  if (!orgId) return null

  const org = await db.organization.findFirst({
    where: {
      users: {
        some: {
          org: { id: orgId },
        },
      },
    },
  })
  return org
}

export async function requireAuth() {
  const { userId, orgId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  return { userId, orgId }
}

export async function requireOrg() {
  const { userId, orgId } = await auth()
  if (!userId || !orgId) throw new Error('Unauthorized - no organization')
  return { userId, orgId }
}

export async function getCurrentUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const user = await db.user.findUnique({
    where: { clerkUserId: clerkUser.id },
    include: { org: true },
  })

  return user
}

export async function getUserWithOrg() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      org: {
        include: {
          _count: {
            select: { calls: true, reps: true, users: true },
          },
        },
      },
    },
  })

  return user
}
