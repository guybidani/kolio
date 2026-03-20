'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Phone,
  Users,
  BookOpen,
  Settings,
  Upload,
  Menu,
  LogOut,
  Shield,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Logo } from '@/components/ui/logo'
import { useState, useEffect } from 'react'

const navItems = [
  { href: '/dashboard', label: 'סקירה כללית', icon: LayoutDashboard },
  { href: '/dashboard/calls', label: 'שיחות', icon: Phone },
  { href: '/dashboard/reps', label: 'נציגים', icon: Users },
  { href: '/dashboard/playbook', label: 'Playbook', icon: BookOpen },
  { href: '/dashboard/upload', label: 'העלאת שיחה', icon: Upload },
  { href: '/dashboard/settings', label: 'הגדרות', icon: Settings },
]

interface UserInfo {
  name: string
  email: string
  isAdmin: boolean
  org: { name: string }
}

function NavContent() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .catch(() => {})
  }, [])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const allNavItems = user?.isAdmin
    ? [...navItems, { href: '/dashboard/admin', label: 'Admin', icon: Shield }]
    : navItems

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Link href="/dashboard">
          <Logo size="md" />
        </Link>
      </div>

      {user && (
        <div className="px-4 mb-4">
          <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2">
            <p className="text-sm font-medium text-white truncate">{user.org.name}</p>
          </div>
        </div>
      )}

      <Separator className="bg-white/10" />

      <nav className="flex-1 space-y-1 p-4">
        {allNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20'
                  : 'text-white/50 hover:bg-white/5 hover:text-white/80'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-white/10" />

      <div className="p-4">
        {user && (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.name}</p>
              <p className="text-xs text-white/30 truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/40 hover:text-white/80 hover:bg-white/5 shrink-0"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden lg:flex w-64 flex-col border-l border-white/10 bg-[#0D0D15] h-screen sticky top-0">
      <NavContent />
    </aside>
  )
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-64 p-0 bg-[#0D0D15] border-white/10">
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
