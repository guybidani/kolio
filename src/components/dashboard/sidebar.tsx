'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, OrganizationSwitcher } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Phone,
  Users,
  BookOpen,
  Settings,
  Upload,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Logo } from '@/components/ui/logo'
import { useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'סקירה כללית', icon: LayoutDashboard },
  { href: '/dashboard/calls', label: 'שיחות', icon: Phone },
  { href: '/dashboard/reps', label: 'נציגים', icon: Users },
  { href: '/dashboard/playbook', label: 'Playbook', icon: BookOpen },
  { href: '/dashboard/upload', label: 'העלאת שיחה', icon: Upload },
  { href: '/dashboard/settings', label: 'הגדרות', icon: Settings },
]

function NavContent() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <Link href="/dashboard">
          <Logo size="md" />
        </Link>
      </div>

      <div className="px-4 mb-4">
        <OrganizationSwitcher
          appearance={{
            elements: {
              rootBox: 'w-full',
              organizationSwitcherTrigger: 'w-full justify-start',
            },
          }}
        />
      </div>

      <Separator className="bg-white/10" />

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
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
        <UserButton
          appearance={{
            elements: {
              rootBox: 'w-full',
              userButtonTrigger: 'w-full justify-start',
            },
          }}
          showName
        />
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
