'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ScoreBadge } from './score-badge'
import { Phone, PhoneIncoming, PhoneOutgoing, Clock } from 'lucide-react'

interface CallCardProps {
  id: string
  prospectName: string | null
  prospectBusiness: string | null
  repName: string | null
  overallScore: number | null
  status: string
  direction: string
  duration: number
  recordedAt: string
  summary: string | null
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; className: string }> = {
    UPLOADED: { label: 'ממתינה', className: 'bg-muted text-muted-foreground border-border' },
    TRANSCRIBING: { label: 'מתמללת', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    TRANSCRIBED: { label: 'תומללה', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    ANALYZING: { label: 'מנתחת', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    COMPLETE: { label: 'הושלמה', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    FAILED: { label: 'נכשלה', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
    TOO_SHORT: { label: 'קצרה מדי', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  }
  const info = map[status] || { label: status, className: 'bg-muted text-muted-foreground border-border' }
  return <Badge variant="outline" className={info.className}>{info.label}</Badge>
}

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === 'INBOUND') return <PhoneIncoming className="h-4 w-4 text-blue-400" />
  if (direction === 'OUTBOUND') return <PhoneOutgoing className="h-4 w-4 text-emerald-400" />
  return <Phone className="h-4 w-4 text-muted-foreground" />
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function CallCard({
  id,
  prospectName,
  prospectBusiness,
  repName,
  overallScore,
  status,
  direction,
  duration,
  recordedAt,
  summary,
}: CallCardProps) {
  return (
    <Link href={`/dashboard/calls/${id}`}>
      <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border p-4 transition-all duration-200 hover:bg-muted/80 hover:border-border cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <DirectionIcon direction={direction} />
              <h3 className="font-semibold text-foreground truncate">
                {prospectName || 'ליד לא מזוהה'}
              </h3>
              {getStatusBadge(status)}
            </div>
            {prospectBusiness && (
              <p className="text-sm text-muted-foreground mb-1">{prospectBusiness}</p>
            )}
            {summary && (
              <p className="text-sm text-muted-foreground line-clamp-2">{summary}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              {repName && <span>{repName}</span>}
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(duration)}
              </span>
              <span>{new Date(recordedAt).toLocaleDateString('he-IL')}</span>
            </div>
          </div>
          {overallScore !== null && (
            <ScoreBadge score={overallScore} size="lg" />
          )}
        </div>
      </div>
    </Link>
  )
}

/** Loading skeleton for call cards */
export function CallCardSkeleton() {
  return (
    <div className="rounded-xl bg-muted/50 border border-border p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="skeleton h-4 w-4 rounded" />
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton h-3 w-48 rounded" />
      <div className="skeleton h-3 w-64 rounded" />
      <div className="flex gap-4">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-3 w-12 rounded" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
    </div>
  )
}
