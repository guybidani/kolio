import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { can } from '@/lib/permissions'

/**
 * GET /api/calls/search - Search across all call transcripts
 * Searches in: transcriptText, summary, prospectName, prospectBusiness
 * Returns matching calls with highlighted snippets
 */
export async function GET(req: Request) {
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

    const rbacUser = { id: user.id, role: user.role, orgId: user.orgId, isAdmin: user.isAdmin }

    if (!can(rbacUser, 'calls:read') && !can(rbacUser, 'calls:read:own')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(req.url)
    const query = url.searchParams.get('q')?.trim()
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1)
    const limit = Math.min(Math.max(1, parseInt(url.searchParams.get('limit') || '20') || 20), 50)

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], pagination: { page, limit, total: 0, pages: 0 } })
    }

    // Build where clause
    const where: Record<string, unknown> = {
      orgId: user.orgId,
      status: 'COMPLETE',
      OR: [
        { transcriptText: { contains: query, mode: 'insensitive' } },
        { summary: { contains: query, mode: 'insensitive' } },
        { prospectName: { contains: query, mode: 'insensitive' } },
        { prospectBusiness: { contains: query, mode: 'insensitive' } },
      ],
    }

    // REP can only search their own calls
    if (!can(rbacUser, 'calls:read')) {
      if (user.repProfile) {
        where.repId = user.repProfile.id
      } else {
        return NextResponse.json({
          results: [],
          pagination: { page, limit, total: 0, pages: 0 },
        })
      }
    }

    const [calls, total] = await Promise.all([
      db.call.findMany({
        where,
        orderBy: { recordedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          transcriptText: true,
          summary: true,
          prospectName: true,
          prospectBusiness: true,
          overallScore: true,
          recordedAt: true,
          duration: true,
          direction: true,
          status: true,
          rep: { select: { id: true, name: true } },
        },
      }),
      db.call.count({ where }),
    ])

    // Generate snippets with highlighted matches
    const results = calls.map((call) => {
      const snippet = extractSnippet(call.transcriptText || call.summary || '', query)
      return {
        callId: call.id,
        repName: call.rep?.name || null,
        repId: call.rep?.id || null,
        prospectName: call.prospectName,
        prospectBusiness: call.prospectBusiness,
        date: call.recordedAt,
        duration: call.duration,
        direction: call.direction,
        score: call.overallScore,
        snippet,
        matchSource: call.transcriptText?.toLowerCase().includes(query.toLowerCase())
          ? 'transcript'
          : call.summary?.toLowerCase().includes(query.toLowerCase())
            ? 'summary'
            : 'metadata',
      }
    })

    return NextResponse.json({
      results,
      query,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error searching calls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Extract a snippet around the first match of the query in the text.
 * Returns text with the keyword wrapped in <mark> tags.
 */
function extractSnippet(text: string, query: string): string {
  if (!text) return ''

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const matchIndex = lowerText.indexOf(lowerQuery)

  if (matchIndex === -1) return text.slice(0, 150) + (text.length > 150 ? '...' : '')

  // Get context around the match (80 chars before, 80 after)
  const contextBefore = 80
  const contextAfter = 80
  const start = Math.max(0, matchIndex - contextBefore)
  const end = Math.min(text.length, matchIndex + query.length + contextAfter)

  let snippet = ''
  if (start > 0) snippet += '...'

  const rawSnippet = text.slice(start, end)

  // Highlight all occurrences of the query in the snippet
  const regex = new RegExp(escapeRegex(query), 'gi')
  snippet += rawSnippet.replace(regex, (match) => `<mark>${match}</mark>`)

  if (end < text.length) snippet += '...'

  return snippet
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
