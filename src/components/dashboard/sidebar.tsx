'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart3,
  Phone,
  Users,
  BookOpen,
  Settings,
  Upload,
  Menu,
  LogOut,
  Shield,
  Crown,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Logo } from '@/components/ui/logo'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect, useMemo } from 'react'
import { getVisibleNavItems, type NavSection } from '@/lib/permissions'
import { ThemeToggle } from '@/components/theme-toggle'
import type { UserRole } from '@/types'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  section: NavSection
}

const allNavItems: NavItem[] = [
  { href: '/dashboard', label: 'סקירה כללית', icon: LayoutDashboard, section: 'dashboard' },
  { href: '/dashboard/analytics', label: 'אנליטיקס', icon: BarChart3, section: 'analytics' },
  { href: '/dashboard/executive', label: 'דשבורד מנהלים', icon: Crown, section: 'dashboard' },
  { href: '/dashboard/calls', label: 'שיחות', icon: Phone, section: 'calls' },
  { href: '/dashboard/reps', label: 'נציגים', icon: Users, section: 'reps' },
  { href: '/dashboard/playbook', label: 'תסריט מכירה', icon: BookOpen, section: 'playbook' },
  { href: '/dashboard/upload', label: 'העלאת שיחה', icon: Upload, section: 'upload' },
  { href: '/dashboard/settings', label: 'הגדרות', icon: Settings, section: 'settings' },
  { href: '/dashboard/admin', label: 'ניהול מערכת', icon: Shield, section: 'admin' },
]

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-500/10 text-red-400 border-red-500/20',
  CEO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MANAGER: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  REP: 'bg-green-500/10 text-green-400 border-green-500/20',
  VIEWER: 'bg-muted/50 text-muted-foreground border-border',
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'מנהל',
  CEO: 'מנכ"ל',
  MANAGER: 'מנהל צוות',
  REP: 'נציג',
  VIEWER: 'צופה',
}

interface UserInfo {
  name: string
  email: string
  role: string
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

  const visibleItems = useMemo(() => {
    if (!user) return []
    const visibleSections = getVisibleNavItems(user.role as UserRole, user.isAdmin)
    return allNavItems.filter((item) => visibleSections.includes(item.section))
  }, [user])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Link href="/dashboard">
          <Logo size="md" />
        </Link>
      </div>

      {user && (
        <div className="px-4 mb-4">
          <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
            <p className="text-sm font-medium text-foreground truncate">{user.org.name}</p>
          </div>
        </div>
      )}

      <Separator className="bg-border" />

      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => {
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
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-2">
        <ThemeToggle />
      </div>

      <Separator className="bg-border" />

      <div className="p-4">
        {user && (
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                <Badge
                  className={cn(
                    'text-[10px] px-1.5 py-0 border shrink-0',
                    ROLE_COLORS[user.role] || ROLE_COLORS.VIEWER
                  )}
                >
                  {ROLE_LABELS[user.role] || user.role}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
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
    <aside className="hidden lg:flex w-64 flex-col border-l border-border bg-sidebar h-screen sticky top-0">
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
        <SheetContent side="right" className="w-64 p-0 bg-sidebar border-border">
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  )
}
