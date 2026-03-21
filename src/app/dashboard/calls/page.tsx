'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { CallCard } from '@/components/dashboard/call-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Upload, Phone, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'

interface CallData {
  id: string
  prospectName: string | null
  prospectBusiness: string | null
  rep?: { id: string; name: string } | null
  repName?: string | null
  overallScore: number | null
  status: string
  direction: string
  duration: number
  recordedAt: string
  summary: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

const STATUS_FILTERS = [
  { value: 'all', label: 'הכל' },
  { value: 'COMPLETE', label: 'הושלמו' },
  { value: 'ANALYZING', label: 'בניתוח' },
  { value: 'TRANSCRIBING', label: 'בתמלול' },
  { value: 'UPLOADED', label: 'ממתינות' },
  { value: 'FAILED', label: 'נכשלו' },
]

export default function CallsPage() {
  const [calls, setCalls] = useState<CallData[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalls = useCallback(async (page: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/calls?${params}`)
      if (!res.ok) throw new Error('Failed to fetch calls')

      const data = await res.json()
      setCalls(data.calls || [])
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 0 })
    } catch (err) {
      console.error('Error fetching calls:', err)
      setError('שגיאה בטעינת שיחות')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    fetchCalls(1)
  }, [fetchCalls])

  const hasNoCalls = !loading && calls.length === 0 && !search && statusFilter === 'all'
  const hasNoResults = !loading && calls.length === 0 && (search || statusFilter !== 'all')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">שיחות</h1>
          <p className="text-muted-foreground">כל שיחות הצוות במקום אחד</p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white">
          <Link href="/dashboard/upload">
            <Upload className="h-4 w-4 ml-2" />
            העלה שיחה
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="חיפוש לפי שם ליד, עסק או נציג..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchCalls(1) }}
            className="pr-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <Badge
              key={f.value}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                statusFilter === f.value
                  ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20'
                  : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
              }`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </Badge>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-500/5 border border-red-500/20 py-8 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => fetchCalls(pagination.page)}>
            נסה שוב
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          {calls.map((call) => (
            <CallCard
              key={call.id}
              id={call.id}
              prospectName={call.prospectName}
              prospectBusiness={call.prospectBusiness}
              repName={call.rep?.name || call.repName || null}
              overallScore={call.overallScore}
              status={call.status}
              direction={call.direction}
              duration={call.duration}
              recordedAt={call.recordedAt}
              summary={call.summary}
            />
          ))}

          {hasNoCalls && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <Phone className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">עדיין אין שיחות מנותחות</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                העלו קבצי אודיו של שיחות מכירה ו-Kolio ינתח אותם עבורכם
              </p>
              <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Link href="/dashboard/upload">
                  <Upload className="h-4 w-4 ml-2" />
                  העלה שיחה ראשונה
                </Link>
              </Button>
            </div>
          )}

          {hasNoResults && (
            <div className="rounded-xl bg-muted/50 border border-border py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">לא נמצאו שיחות</p>
              <p className="text-sm text-muted-foreground mt-1">נסו לשנות את מילות החיפוש או הסינון</p>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchCalls(pagination.page - 1)}
                className="border-border text-muted-foreground hover:bg-muted/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                עמוד {pagination.page} מתוך {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchCalls(pagination.page + 1)}
                className="border-border text-muted-foreground hover:bg-muted/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
