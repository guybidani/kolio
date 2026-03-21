'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function VerifyEmailBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  if (dismissed) return null

  async function handleResend() {
    setSending(true)
    setMessage('')
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
      })
      const data = await res.json()
      if (res.ok) {
        setMessage('קישור אימות נשלח!')
      } else {
        setMessage(data.error || 'שגיאה בשליחה')
      }
    } catch {
      setMessage('שגיאה בשליחה')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="relative flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200"
      dir="rtl"
    >
      <div className="flex-1">
        <span>האימייל שלך עדיין לא אומת. בדוק את תיבת הדואר שלך או </span>
        <button
          onClick={handleResend}
          disabled={sending}
          className="font-medium underline underline-offset-2 hover:text-amber-700 dark:hover:text-amber-100 disabled:opacity-50"
        >
          {sending ? 'שולח...' : 'שלח שוב'}
        </button>
        {message && (
          <span className="mr-2 font-medium">{message}</span>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors"
        aria-label="סגור"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
