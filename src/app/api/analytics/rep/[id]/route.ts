import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

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
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id: repId } = await params

    // Verify rep belongs to user's org (tenant isolation)
    const rep = await db.rep.findFirst({
      where: { id: repId, orgId: user.orgId },
    })
    if (!rep) {
      return NextResponse.json({ error: 'Rep not found' }, { status: 404 })
    }

    // Get all completed calls for this rep
    const calls = await db.call.findMany({
      where: {
        orgId: user.orgId,
        repId,
        status: 'COMPLETE',
        overallScore: { not: null },
      },
      select: {
        id: true,
        overallScore: true,
        scores: true,
        fillerWordCount: true,
        questionCount: true,
        longestMonologue: true,
        silenceGaps: true,
        talkRatioRep: true,
        talkRatioCustomer: true,
        energyScore: true,
        nextStepsScore: true,
        competitorMentions: true,
        pricingDiscussion: true,
        sentimentTrajectory: true,
        duration: true,
        recordedAt: true,
      },
      orderBy: { recordedAt: 'desc' },
      take: 200,
    })

    // Get team averages for comparison
    const teamCalls = await db.call.findMany({
      where: {
        orgId: user.orgId,
        status: 'COMPLETE',
        overallScore: { not: null },
      },
      select: {
        overallScore: true,
        scores: true,
        fillerWordCount: true,
        talkRatioRep: true,
        energyScore: true,
        nextStepsScore: true,
      },
      take: 500,
    })

    const avg = (arr: (number | null | undefined)[]) => {
      const valid = arr.filter((v): v is number => v != null)
      return valid.length > 0 ? valid.reduce((a, b) => a + b, 0) / valid.length : 0
    }

    const round = (n: number) => Math.round(n * 10) / 10

    // Extract score categories from JSON scores
    type ScoreObj = Record<string, number>
    const getScoreField = (scores: unknown, field: string): number | null => {
      if (scores && typeof scores === 'object' && field in (scores as ScoreObj)) {
        return (scores as ScoreObj)[field] ?? null
      }
      return null
    }

    // Rep's radar data (score categories)
    const repRadar = {
      discovery: round(avg(calls.map((c) => getScoreField(c.scores, 'discovery')))),
      objectionHandling: round(avg(calls.map((c) => getScoreField(c.scores, 'objection_handling')))),
      closing: round(avg(calls.map((c) => getScoreField(c.scores, 'closing')))),
      rapport: round(avg(calls.map((c) => getScoreField(c.scores, 'rapport')))),
      valueCommunication: round(avg(calls.map((c) => getScoreField(c.scores, 'value_communication')))),
      energy: round(avg(calls.map((c) => c.energyScore))),
      nextSteps: round(avg(calls.map((c) => c.nextStepsScore))),
    }

    // Team averages for radar comparison
    const teamRadar = {
      discovery: round(avg(teamCalls.map((c) => getScoreField(c.scores, 'discovery')))),
      objectionHandling: round(avg(teamCalls.map((c) => getScoreField(c.scores, 'objection_handling')))),
      closing: round(avg(teamCalls.map((c) => getScoreField(c.scores, 'closing')))),
      rapport: round(avg(teamCalls.map((c) => getScoreField(c.scores, 'rapport')))),
      valueCommunication: round(avg(teamCalls.map((c) => getScoreField(c.scores, 'value_communication')))),
      energy: round(avg(teamCalls.map((c) => c.energyScore))),
      nextSteps: round(avg(teamCalls.map((c) => c.nextStepsScore))),
    }

    // Scores over time (last 50 calls)
    const scoresOverTime = calls.slice(0, 50).reverse().map((c) => ({
      date: c.recordedAt.toISOString().split('T')[0],
      score: c.overallScore,
      energy: c.energyScore,
      nextSteps: c.nextStepsScore,
    }))

    // Improvement trajectory: compare first 10 calls vs last 10
    const recent10 = calls.slice(0, 10)
    const oldest10 = calls.slice(-10)
    const trajectory = {
      recentAvg: round(avg(recent10.map((c) => c.overallScore))),
      olderAvg: round(avg(oldest10.map((c) => c.overallScore))),
      improving: avg(recent10.map((c) => c.overallScore)) > avg(oldest10.map((c) => c.overallScore)),
      delta: round(avg(recent10.map((c) => c.overallScore)) - avg(oldest10.map((c) => c.overallScore))),
    }

    // Strengths and weaknesses
    const categories = Object.entries(repRadar) as [string, number][]
    const sorted = [...categories].sort((a, b) => b[1] - a[1])
    const strengths = sorted.slice(0, 3).map(([key, val]) => ({ category: key, score: val }))
    const weaknesses = sorted.slice(-3).reverse().map(([key, val]) => ({ category: key, score: val }))

    return NextResponse.json({
      rep: { id: rep.id, name: rep.name, avatarUrl: rep.avatarUrl },
      totalCalls: calls.length,
      summary: {
        avgScore: round(avg(calls.map((c) => c.overallScore))),
        avgFillerWords: round(avg(calls.map((c) => c.fillerWordCount))),
        avgTalkRatio: round(avg(calls.map((c) => c.talkRatioRep))),
        avgEnergy: round(avg(calls.map((c) => c.energyScore))),
        avgNextSteps: round(avg(calls.map((c) => c.nextStepsScore))),
        avgQuestions: round(avg(calls.map((c) => c.questionCount))),
        teamAvgScore: round(avg(teamCalls.map((c) => c.overallScore))),
      },
      repRadar,
      teamRadar,
      scoresOverTime,
      trajectory,
      strengths,
      weaknesses,
    })
  } catch (error) {
    console.error('Error fetching rep analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
