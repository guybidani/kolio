'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/ui/logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, orgName }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'ההרשמה נכשלה')
        setLoading(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('משהו השתבש. נסה שוב.')
      setLoading(false)
    }
  }

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
            <h1 className="text-xl font-bold text-foreground">צור חשבון חדש</h1>
            <p className="text-sm text-muted-foreground mt-1">התחל לנתח שיחות מכירה עם AI</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="orgName" className="text-sm font-medium text-foreground/70 mb-1.5 block">
                שם העסק
              </label>
              <Input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="החברה שלי"
                required
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-indigo-500/50 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="name" className="text-sm font-medium text-foreground/70 mb-1.5 block">
                שם מלא
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ישראל ישראלי"
                required
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-indigo-500/50 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground/70 mb-1.5 block">
                אימייל
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="bg-muted/50 border-border text-foreground placeholder:text-muted-foreground focus:border-indigo-500/50 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground/70 mb-1.5 block">
                סיסמה
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
              {loading ? 'יוצר חשבון...' : 'צור חשבון בחינם'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          כבר יש לך חשבון?{' '}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            התחבר
          </Link>
        </p>
      </div>
    </div>
  )
}
