'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Clock, Send, Loader2, Link2 } from 'lucide-react'

interface Comment {
  id: string
  authorId: string
  authorName: string
  authorRole: string
  text: string
  transcriptTime: number | null
  createdAt: string
}

interface CallCommentsProps {
  callId: string
  userRole: string
  onSeekToTime?: (time: number) => void
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'מנהל מערכת',
  CEO: 'מנכ"ל',
  MANAGER: 'מנהל',
  REP: 'נציג',
  VIEWER: 'צופה',
}

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'border-purple-500/20 text-purple-400 bg-purple-500/10',
  CEO: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
  MANAGER: 'border-indigo-500/20 text-indigo-400 bg-indigo-500/10',
  REP: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
  VIEWER: 'border-muted text-muted-foreground bg-muted/50',
}

export function CallComments({ callId, userRole, onSeekToTime }: CallCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [text, setText] = useState('')
  const [linkToTranscript, setLinkToTranscript] = useState(false)
  const [transcriptMinutes, setTranscriptMinutes] = useState('')
  const [transcriptSeconds, setTranscriptSeconds] = useState('')

  const canComment = ['ADMIN', 'CEO', 'MANAGER'].includes(userRole)

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/calls/${callId}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (err) {
      console.error('Error fetching comments:', err)
    } finally {
      setLoading(false)
    }
  }, [callId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || submitting) return

    setSubmitting(true)
    try {
      const mins = parseInt(transcriptMinutes) || 0
      const secs = parseInt(transcriptSeconds) || 0
      const transcriptTime = linkToTranscript && (mins > 0 || secs > 0) ? mins * 60 + secs : undefined

      const res = await fetch(`/api/calls/${callId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, transcriptTime }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments((prev) => [...prev, data.comment])
        setText('')
        setLinkToTranscript(false)
        setTranscriptMinutes('')
        setTranscriptSeconds('')
      }
    } catch (err) {
      console.error('Error adding comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl bg-muted/50 backdrop-blur-xl border border-border overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-400" />
          הערות מנהל
          {comments.length > 0 && (
            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
              {comments.length}
            </Badge>
          )}
        </h3>
      </div>
      <div className="px-5 pb-5 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {canComment ? 'אין הערות עדיין. הוסף הערה ראשונה.' : 'אין הערות לשיחה זו.'}
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg bg-background/50 border border-border p-3"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {comment.authorName}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${ROLE_COLORS[comment.authorRole] || ROLE_COLORS.VIEWER}`}
                    >
                      {ROLE_LABELS[comment.authorRole] || comment.authorRole}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {comment.text}
                </p>
                {comment.transcriptTime != null && (
                  <button
                    type="button"
                    onClick={() => onSeekToTime?.(comment.transcriptTime!)}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    <Clock className="h-3 w-3" />
                    {formatTime(comment.transcriptTime)}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add comment form - only for MANAGER/ADMIN/CEO */}
        {canComment && (
          <form onSubmit={handleSubmit} className="space-y-2 border-t border-border pt-3">
            <div className="flex gap-2">
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="הוסף הערה..."
                className="flex-1 bg-background/50 border-border text-sm"
                maxLength={2000}
                disabled={submitting}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!text.trim() || submitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shrink-0"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkToTranscript}
                  onChange={(e) => setLinkToTranscript(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  קשר לרגע בשיחה
                </span>
              </label>
              {linkToTranscript && (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={999}
                    value={transcriptMinutes}
                    onChange={(e) => setTranscriptMinutes(e.target.value)}
                    placeholder="דק'"
                    className="w-16 h-7 text-xs bg-background/50 border-border text-center"
                  />
                  <span className="text-xs text-muted-foreground">:</span>
                  <Input
                    type="number"
                    min={0}
                    max={59}
                    value={transcriptSeconds}
                    onChange={(e) => setTranscriptSeconds(e.target.value)}
                    placeholder="שנ'"
                    className="w-16 h-7 text-xs bg-background/50 border-border text-center"
                  />
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
