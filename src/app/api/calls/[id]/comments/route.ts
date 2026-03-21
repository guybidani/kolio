import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { can, canAccessCall } from '@/lib/permissions'
import type { Prisma } from '@prisma/client'

export interface CallComment {
  id: string
  authorId: string
  authorName: string
  authorRole: string
  text: string
  transcriptTime: number | null
  createdAt: string
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
      include: { repProfile: { select: { id: true } } },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    const call = await db.call.findFirst({
      where: { id, orgId: user.orgId },
      select: { id: true, orgId: true, repId: true, comments: true },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const rbacUser = {
      id: user.id,
      role: user.role,
      orgId: user.orgId,
      isAdmin: user.isAdmin,
      repProfileId: user.repProfile?.id ?? null,
    }
    if (!canAccessCall(rbacUser, call)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const comments = (call.comments as CallComment[] | null) || []

    return NextResponse.json({ comments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only MANAGER and ADMIN can add comments
    const allowedRoles = ['MANAGER', 'ADMIN', 'CEO']
    if (!session.isAdmin && !allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden - only managers and admins can add comments' }, { status: 403 })
    }

    const user = await db.user.findUnique({
      where: { id: session.id },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await req.json()

    const text = typeof body.text === 'string' ? body.text.trim() : ''
    if (!text || text.length > 2000) {
      return NextResponse.json({ error: 'Comment text is required (max 2000 chars)' }, { status: 400 })
    }

    const transcriptTime = typeof body.transcriptTime === 'number' && body.transcriptTime >= 0
      ? body.transcriptTime
      : null

    const call = await db.call.findFirst({
      where: { id, orgId: user.orgId },
      select: { id: true, orgId: true, comments: true },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const existingComments = (call.comments as CallComment[] | null) || []

    const newComment: CallComment = {
      id: crypto.randomUUID(),
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      text,
      transcriptTime,
      createdAt: new Date().toISOString(),
    }

    const updatedComments = [...existingComments, newComment]

    await db.call.update({
      where: { id },
      data: { comments: updatedComments as unknown as Prisma.InputJsonValue },
    })

    return NextResponse.json({ comment: newComment }, { status: 201 })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
