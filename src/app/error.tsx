'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-8 w-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">משהו השתבש</h2>
        <p className="text-muted-foreground mb-6">
          אירעה שגיאה בלתי צפויה. נסו לרענן את הדף או לחזור למסך הראשי.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            נסו שוב
          </Button>
          <Button
            variant="outline"
            className="border-border text-muted-foreground hover:bg-muted/50"
            onClick={() => window.location.href = '/dashboard'}
          >
            חזרה לדשבורד
          </Button>
        </div>
      </div>
    </div>
  )
}
