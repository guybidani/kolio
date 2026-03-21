'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const error = searchParams.get('error')
  const token = searchParams.get('token')

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    success ? 'success' : error ? 'error' : token ? 'loading' : 'error'
  )

  useEffect(() => {
    if (token && !success && !error) {
      // Redirect to API to verify
      window.location.href = `/api/auth/verify-email?token=${token}`
    }
  }, [token, success, error])

  if (status === 'loading') {
    return (
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-muted-foreground">מאמת את כתובת האימייל...</p>
      </div>
    )
  }

  if (success || status === 'success') {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">&#10003;</div>
        <h2 className="text-xl font-bold text-foreground">
          האימייל אומת בהצלחה!
        </h2>
        <p className="text-muted-foreground">
          החשבון שלך מאומת. אפשר להמשיך לעבוד.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          למרכז הבקרה
        </Link>
      </div>
    )
  }

  const errorMessages: Record<string, string> = {
    'missing-token': 'הקישור לא תקין.',
    'invalid-token': 'הקישור לא תקין או שפג תוקפו.',
    'expired-token': 'הקישור פג תוקף. שלח קישור חדש.',
    'server-error': 'שגיאה פנימית. נסה שוב מאוחר יותר.',
  }

  return (
    <div className="text-center space-y-4">
      <div className="text-5xl">&#10007;</div>
      <h2 className="text-xl font-bold text-foreground">
        אימות נכשל
      </h2>
      <p className="text-muted-foreground">
        {errorMessages[error || ''] || 'הקישור לא תקין או שפג תוקפו.'}
      </p>
      <div className="flex flex-col gap-2 items-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          למרכז הבקרה
        </Link>
        <p className="text-sm text-muted-foreground">
          ניתן לשלוח קישור חדש ממרכז הבקרה
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo size="lg" />
        </div>
        <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
          <Suspense
            fallback={
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto" />
              </div>
            }
          >
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
