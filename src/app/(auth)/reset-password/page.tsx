'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('הסיסמה חייבת להכיל לפחות 8 תווים')
      return
    }

    if (password !== confirmPassword) {
      setError('הסיסמאות לא תואמות')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'משהו השתבש. נסה שוב.')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch {
      setError('משהו השתבש. נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-3">
          הקישור לא תקין או שפג תוקפו
        </div>
        <Link
          href="/forgot-password"
          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
        >
          בקש קישור חדש
        </Link>
      </div>
    )
  }

  if (success) {
    return (
      <div className="text-center space-y-4">
        <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-3">
          הסיסמה שונתה בהצלחה
        </div>
        <Link
          href="/login"
          className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
        >
          התחבר עכשיו
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="text-sm font-medium text-foreground/70 mb-1.5 block">
          סיסמה חדשה
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="מינימום 8 תווים"
          required
          minLength={8}
          autoComplete="new-password"
          className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-indigo-500/50 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground/70 mb-1.5 block">
          אימות סיסמה
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="הזן שוב את הסיסמה"
          required
          minLength={8}
          autoComplete="new-password"
          className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-indigo-500/50 focus:ring-indigo-500/20"
        />
      </div>

      {error && (
        <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_14px_rgba(99,102,241,0.3)] disabled:opacity-50"
        size="lg"
      >
        {loading ? 'מעדכן...' : 'עדכן סיסמה'}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {/* Glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-indigo-500/8 blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        {/* Glass card */}
        <div className="rounded-2xl bg-muted/50 backdrop-blur-xl border border-border shadow-2xl shadow-black/20 p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-foreground">איפוס סיסמה</h1>
            <p className="text-sm text-muted-foreground mt-1">הזן סיסמה חדשה</p>
          </div>

          <Suspense fallback={<div className="h-48" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            חזור להתחברות
          </Link>
        </p>
      </div>
    </div>
  )
}
