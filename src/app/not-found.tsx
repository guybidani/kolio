import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0F] p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
          <Search className="h-8 w-8 text-white/30" />
        </div>
        <h1 className="text-6xl font-bold text-white mb-2">404</h1>
        <h2 className="text-xl font-semibold text-white/60 mb-4">הדף לא נמצא</h2>
        <p className="text-white/40 mb-8">
          הדף שחיפשתם לא קיים או הוסר. בדקו את הכתובת או חזרו לדשבורד.
        </p>
        <Link href="/dashboard">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2">
            <Home className="h-4 w-4" />
            חזרה לדשבורד
          </Button>
        </Link>
      </div>
    </div>
  )
}
