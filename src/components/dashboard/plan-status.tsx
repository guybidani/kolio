'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Crown, AlertTriangle, Zap } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface PlanStatusData {
  plan: string
  trialDaysLeft?: number
  trialExpired: boolean
  seatsUsed: number
  seatsLimit: number
  callsThisMonth: number
  callsLimit: number
}

const PLAN_LABELS: Record<string, string> = {
  TRIAL: 'ניסיון',
  STARTER: 'סטארטר',
  PRO: 'פרו',
  ENTERPRISE: 'אנטרפרייז',
}

const PLAN_COLORS: Record<string, string> = {
  TRIAL: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  STARTER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PRO: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  ENTERPRISE: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

export function PlanStatus() {
  const [status, setStatus] = useState<PlanStatusData | null>(null)

  useEffect(() => {
    fetch('/api/plan')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {})
  }, [])

  if (!status) return null

  const callsPercent = status.callsLimit > 0
    ? Math.min(100, (status.callsThisMonth / status.callsLimit) * 100)
    : 0
  const seatsPercent = status.seatsLimit > 0
    ? Math.min(100, (status.seatsUsed / status.seatsLimit) * 100)
    : 0

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-foreground">תוכנית נוכחית</h3>
          </div>
          <Badge className={cn('text-xs border', PLAN_COLORS[status.plan] || PLAN_COLORS.TRIAL)}>
            {PLAN_LABELS[status.plan] || status.plan}
          </Badge>
        </div>

        {/* Trial status */}
        {status.plan === 'TRIAL' && !status.trialExpired && status.trialDaysLeft !== undefined && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">תקופת ניסיון</span>
              <span className={cn(
                'font-medium',
                status.trialDaysLeft <= 3 ? 'text-red-400' : 'text-amber-400'
              )}>
                {status.trialDaysLeft} ימים נותרו
              </span>
            </div>
            <Progress
              value={Math.max(0, ((14 - status.trialDaysLeft) / 14) * 100)}
              className="h-1.5"
            />
          </div>
        )}

        {/* Trial expired */}
        {status.trialExpired && (
          <div className="mb-3 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
              <span className="text-xs font-medium text-red-400">תקופת הניסיון הסתיימה</span>
            </div>
            <Link href="/dashboard/upgrade">
              <Button size="sm" className="w-full mt-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs">
                <Zap className="h-3 w-3 ml-1" />
                שדרג עכשיו
              </Button>
            </Link>
          </div>
        )}

        {/* Usage stats */}
        <div className="space-y-2.5">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">שיחות החודש</span>
              <span className="text-foreground tabular-nums">
                {status.callsThisMonth}/{status.callsLimit === -1 ? 'ללא הגבלה' : status.callsLimit}
              </span>
            </div>
            {status.callsLimit > 0 && (
              <Progress
                value={callsPercent}
                className={cn('h-1.5', callsPercent >= 90 && '[&>div]:bg-red-500')}
              />
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">משתמשים</span>
              <span className="text-foreground tabular-nums">
                {status.seatsUsed}/{status.seatsLimit === -1 ? 'ללא הגבלה' : status.seatsLimit}
              </span>
            </div>
            {status.seatsLimit > 0 && (
              <Progress
                value={seatsPercent}
                className={cn('h-1.5', seatsPercent >= 90 && '[&>div]:bg-red-500')}
              />
            )}
          </div>
        </div>

        {/* Settings link */}
        {!status.trialExpired && (
          <Link
            href="/dashboard/settings"
            className="block text-center text-xs text-muted-foreground hover:text-foreground mt-3 transition-colors"
          >
            ניהול תוכנית
          </Link>
        )}
      </div>
    </div>
  )
}

/** Compact plan badge for sidebar */
export function PlanBadge() {
  const [status, setStatus] = useState<PlanStatusData | null>(null)

  useEffect(() => {
    fetch('/api/plan')
      .then((r) => (r.ok ? r.json() : null))
      .then(setStatus)
      .catch(() => {})
  }, [])

  if (!status) return null

  return (
    <Link href={status.trialExpired ? '/dashboard/upgrade' : '/dashboard/settings'}>
      <div className={cn(
        'rounded-lg px-3 py-2 transition-colors',
        status.trialExpired
          ? 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/15'
          : 'bg-muted/50 border border-border hover:bg-muted'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Crown className={cn('h-3.5 w-3.5', status.trialExpired ? 'text-red-400' : 'text-indigo-400')} />
            <span className="text-xs font-medium text-foreground">
              {PLAN_LABELS[status.plan] || status.plan}
            </span>
          </div>
          {status.plan === 'TRIAL' && !status.trialExpired && status.trialDaysLeft !== undefined && (
            <span className={cn(
              'text-[10px] tabular-nums',
              status.trialDaysLeft <= 3 ? 'text-red-400' : 'text-muted-foreground'
            )}>
              {status.trialDaysLeft} ימים
            </span>
          )}
          {status.trialExpired && (
            <span className="text-[10px] text-red-400 font-medium">שדרג</span>
          )}
        </div>
      </div>
    </Link>
  )
}
