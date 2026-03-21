'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Search, Loader2, Phone, Calendar, Clock, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ScoreBadge } from '@/components/dashboard/score-badge'
import { cn } from '@/lib/utils'

interface SearchResult {
  callId: string
  repName: string | null
  repId: string | null
  prospectName: string | null
  prospectBusiness: string | null
  date: string
  duration: number
  direction: string
  score: number | null
  snippet: string
  matchSource: 'transcript' | 'summary' | 'metadata'
}

interface SearchPagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface TranscriptSearchProps {
  /** Compact mode for command palette overlay */
  compact?: boolean
  /** Callback when a result is clicked */
  onResultClick?: () => void
  /** Auto-focus the input */
  autoFocus?: boolean
}

export function TranscriptSearch({ compact = false, onResultClick, autoFocus = false }: TranscriptSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [pagination, setPagination] = useState<SearchPagination | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = useCallback(async (q: string, page = 1) => {
    if (q.trim().length < 2) {
      setResults([])
      setPagination(null)
      setHasSearched(false)
      return
    }

    setLoading(true)
    setHasSearched(true)

    try {
      const params = new URLSearchParams({ q: q.trim(), page: String(page), limit: '20' })
      const res = await fetch(`/api/calls/search?${params}`)
      if (!res.ok) throw new Error('Search failed')

      const data = await res.json()
      setResults(data.results || [])
      setPagination(data.pagination || null)
    } catch (err) {
      console.error('Search error:', err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      search(query)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const matchSourceLabel: Record<string, string> = {
    transcript: 'תמלול',
    summary: 'סיכום',
    metadata: 'פרטים',
  }

  return (
    <div className={cn('w-full', compact ? '' : 'space-y-4')}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        {loading && (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        <Input
          ref={inputRef}
          type="text"
          placeholder="חפש בכל התמלולים..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            'pr-10 pl-10 bg-muted/50 border-border text-foreground placeholder:text-muted-foreground',
            compact && 'border-0 border-b rounded-none text-base h-12'
          )}
        />
      </div>

      {/* Results Count */}
      {hasSearched && pagination && !loading && (
        <div className="text-xs text-muted-foreground px-1">
          {pagination.total > 0
            ? `${pagination.total} תוצאות נמצאו`
            : null
          }
        </div>
      )}

      {/* Results */}
      <div className={cn('space-y-2', compact && 'max-h-[60vh] overflow-y-auto px-1')}>
        {results.map((result) => (
          <Link
            key={result.callId}
            href={`/dashboard/calls/${result.callId}`}
            onClick={onResultClick}
            className="block rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-muted/50 hover:border-indigo-500/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                {/* Rep name + date */}
                <div className="flex items-center gap-2 text-sm mb-1">
                  {result.repName && (
                    <span className="font-medium text-foreground">{result.repName}</span>
                  )}
                  {result.prospectName && (
                    <>
                      <span className="text-muted-foreground">←</span>
                      <span className="text-muted-foreground">{result.prospectName}</span>
                    </>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(result.date)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(result.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {matchSourceLabel[result.matchSource] || result.matchSource}
                  </span>
                </div>

                {/* Snippet with highlighted keyword */}
                <p
                  className="text-sm text-muted-foreground leading-relaxed [&_mark]:bg-yellow-500/30 [&_mark]:text-foreground [&_mark]:rounded-sm [&_mark]:px-0.5"
                  dir="rtl"
                  dangerouslySetInnerHTML={{ __html: result.snippet }}
                />
              </div>

              {/* Score badge */}
              {result.score != null && (
                <div className="shrink-0">
                  <ScoreBadge score={result.score} size="sm" />
                </div>
              )}
            </div>
          </Link>
        ))}

        {/* Empty state */}
        {hasSearched && !loading && results.length === 0 && (
          <div className="py-8 text-center">
            <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">אין תוצאות</p>
            <p className="text-muted-foreground text-xs mt-1">
              נסו מילות חיפוש אחרות
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <button
              onClick={() => search(query, pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              הקודם
            </button>
            <span className="text-xs text-muted-foreground">
              עמוד {pagination.page} מתוך {pagination.pages}
            </span>
            <button
              onClick={() => search(query, pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
            >
              הבא
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
