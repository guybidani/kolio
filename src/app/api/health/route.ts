import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, string> = { app: 'ok' }

  try {
    await db.$queryRawUnsafe('SELECT 1')
    checks.db = 'ok'
  } catch (e: any) {
    checks.db = `error: ${e.message?.slice(0, 100)}`
  }

  const allOk = Object.values(checks).every(v => v === 'ok')
  return NextResponse.json(checks, { status: allOk ? 200 : 503 })
}
